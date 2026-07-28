import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Brain,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Dumbbell,
  FileText,
  ListChecks,
  MapPinned,
  RotateCcw,
  Sparkles,
  Table2,
  TimerReset,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { GeniusType, GENIUS_INFO, geniusInfo, loadGeniusType } from '@/lib/genius-type';
import {
  loadWeeklyTrainingInput as loadRemoteWeeklyTrainingInput,
  upsertWeeklyTrainingInput,
  upsertWeeklyTrainingPlan,
} from '@/lib/learning-gym-supabase';
import {
  getGeniusIdentityTraining,
  getRecommendedGymTasks,
  getTalentTrainingProfile,
  LEARNING_GYM_ABILITY_LABELS,
  LEARNING_GYM_TASKS,
  LearningGymAbility,
  LearningGymTalentGroupId,
  LearningGymTask,
} from '@/lib/learning-gym';
import { toast } from 'sonner';

type ScheduleIntensity = 'daily' | 'threeTimes' | 'twice' | 'weekly';

interface TaskSchedule {
  taskId: string;
  intensity: ScheduleIntensity;
  bestTime: string;
  spacedDays: number[];
  dailyMinutes: number;
  checklist: string[];
}

interface TrainingMethod {
  id: string;
  title: string;
  subtitle: string;
  icon: typeof Dumbbell;
  steps: string[];
  schedule: string;
  output: string;
}

const PLAN_STORAGE_KEY = 'learning_gym_plan_checklist_v1';
const WEEKLY_INPUT_KEY = 'learning_gym_weekly_input_v1';
const MANUAL_GENIUS_KEY = 'learning_gym_manual_genius_v1';

interface WeeklyTrainingInput {
  subject: string;
  rawMaterial: string;
  numbers: string;
  concepts: string;
  mistakes: string;
}

interface WeeklyTheme {
  title: string;
  focus: string;
  materialPrompt: string;
  deliverable: string;
}

const DEFAULT_WEEKLY_INPUT: WeeklyTrainingInput = {
  subject: '英文單字 + 學科概念',
  rawMaterial: '',
  numbers: '',
  concepts: '',
  mistakes: '',
};

const WEEKLY_THEMES: Record<LearningGymTalentGroupId, WeeklyTheme[]> = {
  visual_dominant: [
    { title: '高彩度圖像錨點週', focus: '把本週概念變成圖像、顏色與位置', materialPrompt: '貼上 8-10 個難背詞、公式或流程，系統會分配到圖像變形與記憶宮殿。', deliverable: '10 個視覺物件 + 1 條空間路線' },
    { title: '螢光符號筆記週', focus: '用 3 色規則整理課文與考點', materialPrompt: '貼上一段課文或考試範圍，先切定義、因果、常考。', deliverable: '一張 3 色符號筆記 + 3 句摘要' },
    { title: '空間定位複習週', focus: '把舊知識放進固定 10 點房間路線', materialPrompt: '貼上這週最容易忘的 10 個點。', deliverable: '10 點記憶宮殿 + 閉眼回想紀錄' },
  ],
  auditory_dominant: [
    { title: '節奏跟讀週', focus: '把知識變成節拍、口訣與聲音回路', materialPrompt: '貼上長單字、片語、定義或公式名稱，系統會分配成 Rap / shadowing。', deliverable: '5 組節奏拆音 + 1 段 60 秒說書稿' },
    { title: 'Podcast 說書週', focus: '用口說費曼法講清楚一個主題', materialPrompt: '貼上本週主題和 4-6 個關鍵字。', deliverable: '一段 60 秒口說稿 + 關鍵字檢核' },
    { title: '諧音迷因週', focus: '把年份與流程變成順口溜', materialPrompt: '貼上需要背的年份、清單或流程。', deliverable: '一組口訣 + 反向測驗' },
  ],
  kinesthetic_dominant: [
    { title: '情境劇本週', focus: '把知識放進角色、任務與動作', materialPrompt: '貼上 5 個核心詞或歷史/學科關鍵字，系統會變成角色任務。', deliverable: '1 個角色劇本 + 5 個核心詞觸發點' },
    { title: '身體錨定週', focus: '每個抽象概念配一個微動作', materialPrompt: '貼上抽象概念、易混淆詞或公式符號。', deliverable: '5 個動作錨點 + 卡住提示' },
    { title: '走讀轉換週', focus: '把不同科目分配到房間位置', materialPrompt: '貼上本週要讀的科目與章節。', deliverable: '一份 20/5 走讀課表 + 空間分類' },
  ],
  logical_dominant: [
    { title: '因果解密週', focus: '把破碎知識整理成 A→B→C 邏輯鏈', materialPrompt: '貼上雜亂資料、歷史事件、理科流程或商業概念。', deliverable: '一張因果圖 + 反例檢查' },
    { title: '字根拆解週', focus: '把長單字與術語拆成組件', materialPrompt: '貼上 8-10 個長單字、專有名詞或公式名稱。', deliverable: '一棵字根/結構拆解樹' },
    { title: 'AI 除錯週', focus: '用找錯與修正強化規則', materialPrompt: '貼上錯題、錯誤筆記或容易混淆的摘要。', deliverable: '錯誤原因表 + 修正版規則' },
  ],
};

const TASK_SCHEDULES: Record<string, TaskSchedule> = {
  number_encoding: {
    taskId: 'number_encoding',
    intensity: 'daily',
    bestTime: '早上或通勤前',
    spacedDays: [1, 3, 7, 14],
    dailyMinutes: 8,
    checklist: ['拆數字', '建立諧音/分段/故事碼', '遮住原數字回想', '隔天反向測驗'],
  },
  memory_palace: {
    taskId: 'memory_palace',
    intensity: 'threeTimes',
    bestTime: '下午或晚餐後',
    spacedDays: [1, 3, 8, 20],
    dailyMinutes: 10,
    checklist: ['選熟悉空間', '放置 10 個物件', '閉眼走一遍', '三天後重走一次'],
  },
  data_to_table: {
    taskId: 'data_to_table',
    intensity: 'threeTimes',
    bestTime: '讀新章節前',
    spacedDays: [1, 4, 10, 21],
    dailyMinutes: 12,
    checklist: ['切欄位', '命名分類', '整理規則', '不看資料重建摘要'],
  },
  concept_web: {
    taskId: 'concept_web',
    intensity: 'twice',
    bestTime: '完成一段學習後',
    spacedDays: [1, 5, 15, 40],
    dailyMinutes: 12,
    checklist: ['列概念節點', '畫出關係', '說明每條線', '補一個跨域類比'],
  },
  sound_shadow: {
    taskId: 'sound_shadow',
    intensity: 'daily',
    bestTime: '睡前 20 分鐘',
    spacedDays: [1, 4, 10, 28],
    dailyMinutes: 7,
    checklist: ['純聽一次', '跟讀一次', '遮稿複述', '錄下卡住點'],
  },
  live_output: {
    taskId: 'live_output',
    intensity: 'daily',
    bestTime: '開始學習前暖身',
    spacedDays: [1, 3, 9, 25],
    dailyMinutes: 5,
    checklist: ['抽題', '30 秒輸出', '找一個錯誤', '重做一輪'],
  },
  error_repair: {
    taskId: 'error_repair',
    intensity: 'threeTimes',
    bestTime: '做題後立刻',
    spacedDays: [1, 2, 7, 16],
    dailyMinutes: 8,
    checklist: ['圈出錯誤', '寫原因', '重做一次', '口頭說規則'],
  },
  root_tree: {
    taskId: 'root_tree',
    intensity: 'twice',
    bestTime: '背長單字前',
    spacedDays: [1, 7, 21, 60],
    dailyMinutes: 9,
    checklist: ['拆 prefix/root/suffix', '寫字源邏輯', '延伸同根字', '用新字造句'],
  },
  body_anchor: {
    taskId: 'body_anchor',
    intensity: 'daily',
    bestTime: '記抽象概念時',
    spacedDays: [1, 3, 8, 20],
    dailyMinutes: 5,
    checklist: ['替概念配動作', '做動作說概念', '只看動作回想', '卡住時重做動作'],
  },
  causal_map: {
    taskId: 'causal_map',
    intensity: 'twice',
    bestTime: '讀歷史/地理/理科後',
    spacedDays: [1, 5, 14, 35],
    dailyMinutes: 12,
    checklist: ['列 A/B/C 節點', '畫因果箭頭', '檢查反例', '口頭重建整條鏈'],
  },
};

const TRAINING_METHODS: TrainingMethod[] = [
  {
    id: 'number-code',
    title: '數字轉碼法',
    subtitle: '把年份、公式、編號轉成諧音、分段、故事碼或空間碼。',
    icon: TimerReset,
    schedule: '每天 8 分鐘；第 1、3、7、14 天回想。',
    output: '一張數字碼表 + 一次反向測驗',
    steps: ['先把數字切成 2-3 個區段', '替每段找諧音、形狀或故事', '遮住原數字只看故事回想', '隔天反向：看到數字說故事，看到故事說數字'],
  },
  {
    id: 'spatial-location',
    title: '空間定位法',
    subtitle: '把資訊放進房間、路線或 3D 場景的位置，用移動順序提取。',
    icon: MapPinned,
    schedule: '每週 3 次；第 1、3、8、20 天重走路線。',
    output: '一條 10 點路線 + 閉眼回想紀錄',
    steps: ['選一個熟悉空間', '固定 10 個位置順序', '把每個知識點變成誇張物件', '閉眼沿路走，說出每個位置的內容'],
  },
  {
    id: 'table-structure',
    title: '資料表格化',
    subtitle: '把雜亂內容切成欄位、分類、規則和摘要。',
    icon: Table2,
    schedule: '每週 3 次；適合讀新章節前後各一次。',
    output: '一張表格 + 三句摘要',
    steps: ['先決定欄位名稱', '把資料分類', '找出規則與例外', '不看原文重建表格摘要'],
  },
  {
    id: 'active-recall',
    title: '主動回想排程',
    subtitle: '不是重看，而是在固定天數遮住提示重新提取。',
    icon: RotateCcw,
    schedule: '第 1、3、7、16、35 天；越容易忘的越密集。',
    output: '回想分數 + 下一次複習日期',
    steps: ['第一次學完立刻回想', '第 1 天只看標題回想', '第 3/7 天混合題目測驗', '答錯的任務進錯誤修正回路'],
  },
];

const WEEK_PLAN = [
  { day: '週一', focus: '數字轉碼 + 即時輸出', taskIds: ['number_encoding', 'live_output'] },
  { day: '週二', focus: '資料表格化 + 錯誤修正', taskIds: ['data_to_table', 'error_repair'] },
  { day: '週三', focus: '空間定位 + 聲音跟讀', taskIds: ['memory_palace', 'sound_shadow'] },
  { day: '週四', focus: '概念織網 + 字根拆解', taskIds: ['concept_web', 'root_tree'] },
  { day: '週五', focus: '因果地圖 + 微動作錨定', taskIds: ['causal_map', 'body_anchor'] },
  { day: '週六', focus: '混合挑戰日', taskIds: ['roleplay_quest', 'ai_debugger'] },
  { day: '週日', focus: '回想與整理日', taskIds: ['memory_palace', 'number_encoding', 'error_repair'] },
];

const intensityLabel: Record<ScheduleIntensity, string> = {
  daily: '每日',
  threeTimes: '每週 3 次',
  twice: '每週 2 次',
  weekly: '每週 1 次',
};

function taskById(taskId: string) {
  return LEARNING_GYM_TASKS.find((task) => task.id === taskId);
}

function fallbackSchedule(task: LearningGymTask): TaskSchedule {
  return {
    taskId: task.id,
    intensity: task.duration.includes('5') || task.duration.includes('6') ? 'daily' : 'twice',
    bestTime: '主課程後 10 分鐘',
    spacedDays: [1, 3, 7, 16],
    dailyMinutes: Number.parseInt(task.duration, 10) || 8,
    checklist: task.coachFocus,
  };
}

function abilityLine(task: LearningGymTask) {
  return Object.entries(task.abilityWeights)
    .slice(0, 3)
    .map(([ability, value]) => `${LEARNING_GYM_ABILITY_LABELS[ability as LearningGymAbility]} +${value}`)
    .join('、');
}

function getWeekNumber(date: Date) {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  return Math.ceil((((target.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getWeekKey(date = new Date()) {
  return `${date.getFullYear()}-W${String(getWeekNumber(date)).padStart(2, '0')}`;
}

function loadWeeklyInput(weekKey: string): WeeklyTrainingInput {
  try {
    const all = JSON.parse(localStorage.getItem(WEEKLY_INPUT_KEY) || '{}') as Record<string, WeeklyTrainingInput>;
    return { ...DEFAULT_WEEKLY_INPUT, ...(all[weekKey] || {}) };
  } catch {
    return DEFAULT_WEEKLY_INPUT;
  }
}

function saveWeeklyInput(weekKey: string, input: WeeklyTrainingInput) {
  try {
    const all = JSON.parse(localStorage.getItem(WEEKLY_INPUT_KEY) || '{}') as Record<string, WeeklyTrainingInput>;
    localStorage.setItem(WEEKLY_INPUT_KEY, JSON.stringify({ ...all, [weekKey]: input }));
  } catch {
    /* ignore */
  }
}

function splitItems(text: string, fallback: string[]) {
  const items = text
    .split(/[\n,，、;；]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  return (items.length ? items : fallback).slice(0, 8);
}

function rotateTasks(tasks: LearningGymTask[], weekNumber: number) {
  if (!tasks.length) return [];
  const start = weekNumber % tasks.length;
  return [...tasks.slice(start), ...tasks.slice(0, start)];
}

function materialAssignment(task: LearningGymTask, input: WeeklyTrainingInput) {
  if (task.id.includes('number') || task.id === 'mnemonic_meme') {
    return splitItems(input.numbers, ['1815 維也納會議', '3.14159', '1492 哥倫布', 'CO2 + H2O']);
  }
  if (task.id === 'memory_palace' || task.group === 'visual_dominant') {
    return splitItems(input.concepts || input.rawMaterial, ['光合作用', '供需曲線', 'monotonous', '氫氦鋰鈹硼']);
  }
  if (task.id === 'error_repair' || task.id === 'ai_debugger') {
    return splitItems(input.mistakes, ['容易把 affect/effect 混淆', '忘記公式適用條件', '摘要因果倒置']);
  }
  return splitItems(input.rawMaterial || input.concepts, ['本週課文重點', '相似概念', '核心定義', '考前易錯點']);
}

function useChecklistState() {
  const [checked, setChecked] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem(PLAN_STORAGE_KEY) || '{}');
    } catch {
      return {};
    }
  });

  const toggle = (id: string, value: boolean) => {
    const next = { ...checked, [id]: value };
    setChecked(next);
    localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(next));
  };

  const reset = () => {
    setChecked({});
    localStorage.removeItem(PLAN_STORAGE_KEY);
  };

  return { checked, toggle, reset };
}

const LearningGymPlan = () => {
  const navigate = useNavigate();
  const { user, profile, isAdmin, signOut } = useAuth();
  const { checked, toggle, reset } = useChecklistState();
  const weekKey = getWeekKey();
  const weekNumber = getWeekNumber(new Date());
  const [selectedGenius, setSelectedGenius] = useState<GeniusType>(() => {
    try {
      return (localStorage.getItem(MANUAL_GENIUS_KEY) as GeniusType) || loadGeniusType() || 'visionary';
    } catch {
      return loadGeniusType() || 'visionary';
    }
  });
  const [weeklyInput, setWeeklyInput] = useState<WeeklyTrainingInput>(() => loadWeeklyInput(weekKey));
  const [remoteInputId, setRemoteInputId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedDay, setSelectedDay] = useState(WEEK_PLAN[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1].day);
  const selectedPlan = WEEK_PLAN.find((item) => item.day === selectedDay) || WEEK_PLAN[0];
  const identity = getGeniusIdentityTraining(selectedGenius);
  const talentProfile = getTalentTrainingProfile(identity?.groupId);
  const weeklyThemes = identity ? WEEKLY_THEMES[identity.groupId] : WEEKLY_THEMES.visual_dominant;
  const weeklyTheme = weeklyThemes[weekNumber % weeklyThemes.length];
  const recommendedTasks = rotateTasks(getRecommendedGymTasks(selectedGenius, null), weekNumber).slice(0, 6);
  const primaryTasks = identity
    ? identity.primaryTaskIds.map((taskId) => taskById(taskId)).filter(Boolean) as LearningGymTask[]
    : [];
  const generatedWeeklyTasks = [...primaryTasks, ...recommendedTasks]
    .filter((task, index, list) => list.findIndex((item) => item.id === task.id) === index)
    .slice(0, 6);

  const scheduledTasks = useMemo(() => LEARNING_GYM_TASKS.map((task) => ({
    task,
    schedule: TASK_SCHEDULES[task.id] || fallbackSchedule(task),
  })), []);

  const checkedCount = Object.values(checked).filter(Boolean).length;
  const totalChecklistItems = TRAINING_METHODS.reduce((sum, method) => sum + method.steps.length, 0);
  const completion = Math.round((checkedCount / totalChecklistItems) * 100);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;

    loadRemoteWeeklyTrainingInput(user.id, weekKey).then(({ data }) => {
      if (cancelled || !data) return;
      const remoteInput: WeeklyTrainingInput = {
        subject: data.subject,
        rawMaterial: data.raw_material,
        numbers: data.numbers,
        concepts: data.concepts,
        mistakes: data.mistakes,
      };
      setRemoteInputId(data.id);
      setWeeklyInput(remoteInput);
      saveWeeklyInput(weekKey, remoteInput);
      if (data.genius_type && GENIUS_INFO[data.genius_type as GeniusType]) {
        setSelectedGenius(data.genius_type as GeniusType);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [user?.id, weekKey]);

  const updateGenius = (value: GeniusType) => {
    setSelectedGenius(value);
    localStorage.setItem(MANUAL_GENIUS_KEY, value);
  };

  const updateWeeklyInput = (patch: Partial<WeeklyTrainingInput>) => {
    const next = { ...weeklyInput, ...patch };
    setWeeklyInput(next);
    saveWeeklyInput(weekKey, next);
  };

  const syncWeeklyPlan = async () => {
    if (!user?.id) {
      toast.error('請先登入，才能同步到 Supabase');
      return;
    }
    setIsSyncing(true);
    try {
      const inputResult = await upsertWeeklyTrainingInput(user.id, {
        weekKey,
        subject: weeklyInput.subject,
        rawMaterial: weeklyInput.rawMaterial,
        numbers: weeklyInput.numbers,
        concepts: weeklyInput.concepts,
        mistakes: weeklyInput.mistakes,
        geniusType: selectedGenius,
        talentGroup: identity?.groupId || null,
      });

      if (inputResult.error) throw inputResult.error;
      const inputId = inputResult.data?.id || remoteInputId;
      setRemoteInputId(inputId || null);

      const generatedPlan = generatedWeeklyTasks.map((task, index) => ({
        dayIndex: index + 1,
        taskId: task.id,
        title: task.title,
        group: task.group,
        material: materialAssignment(task, weeklyInput),
        schedule: TASK_SCHEDULES[task.id] || fallbackSchedule(task),
        abilityWeights: task.abilityWeights,
      }));

      const planResult = await upsertWeeklyTrainingPlan(user.id, {
        weekKey,
        weeklyTrainingInputId: inputId,
        geniusType: selectedGenius,
        talentGroup: identity?.groupId || null,
        themeTitle: weeklyTheme.title,
        themeFocus: weeklyTheme.focus,
        taskIds: generatedWeeklyTasks.map((task) => task.id),
        dailyPlan: WEEK_PLAN,
        generatedPlan: {
          subject: weeklyInput.subject,
          theme: weeklyTheme,
          tasks: generatedPlan,
        },
      });

      if (planResult.error) throw planResult.error;
      toast.success('已同步本週輸入與訓練計畫到 Supabase');
    } catch (error) {
      console.error('Failed to sync weekly training plan:', error);
      toast.error('同步失敗，請稍後再試');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        isLoggedIn={!!user}
        isAdmin={isAdmin}
        userName={profile?.display_name || user?.email?.split('@')[0] || 'User'}
        onLogin={() => navigate('/auth')}
        onLogout={signOut}
      />

      <main className="container mx-auto px-4 py-8">
        <Button variant="ghost" className="mb-6" onClick={() => navigate('/practice')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          回到 Practice
        </Button>

        <section className="mb-8 border-b pb-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                <CalendarDays className="h-4 w-4" />
                Learning Gym Planner
              </div>
              <h1 className="text-3xl sm:text-4xl font-display font-bold">訓練排程與每日課表</h1>
              <p className="mt-3 text-muted-foreground">
                這一頁獨立於目前 Practice 畫面，用來安排每張訓練卡的頻率、間隔複習與每日清單。
                核心原則是：先編碼，再回想，再排程修正。
              </p>
            </div>
            <Button onClick={() => navigate('/talent-card-game')} className="gap-2 rounded-full bg-[#173a34] hover:bg-[#28564d]">
              <Sparkles className="h-4 w-4" />
              進入卡牌情境遊戲
            </Button>
          </div>
        </section>

        <section className="mb-8 grid gap-4 xl:grid-cols-[0.95fr_1.25fr]">
          <div className="rounded-2xl border bg-card p-5">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">依天賦身份組自動更新</h2>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              系統會先讀記憶天才測驗結果；若還沒測，也可以在這裡手動選。本週代碼：{weekKey}。
            </p>

            <label className="mt-4 block text-sm font-medium">目前套用身份</label>
            <select
              value={selectedGenius}
              onChange={(event) => updateGenius(event.target.value as GeniusType)}
              className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm"
            >
              {Object.values(GENIUS_INFO).map((info) => (
                <option key={info.type} value={info.type}>
                  {info.nameZh} / {info.nameEn} · {info.vark}
                </option>
              ))}
            </select>

            <div className="mt-4 rounded-xl border border-primary/15 bg-primary/5 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-lg">{geniusInfo(selectedGenius)?.emoji}</span>
                <h3 className="font-bold">{identity?.identityName}</h3>
                {talentProfile && (
                  <span className="rounded-full bg-background px-2 py-1 text-xs text-muted-foreground">
                    {talentProfile.name} · {talentProfile.nameEn}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{identity?.mechanism}</p>
              {talentProfile && (
                <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
                  <div className="rounded-lg bg-background/80 px-3 py-2">超能力：{talentProfile.superpower}</div>
                  <div className="rounded-lg bg-background/80 px-3 py-2">地雷：{talentProfile.landmine}</div>
                </div>
              )}
            </div>

            <div className="mt-4 rounded-xl border bg-background p-4">
              <div className="text-sm font-bold">本週自動主題：{weeklyTheme.title}</div>
              <p className="mt-1 text-sm text-muted-foreground">{weeklyTheme.focus}</p>
              <div className="mt-3 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                要輸入什麼：{weeklyTheme.materialPrompt}
              </div>
              <div className="mt-2 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                產出目標：{weeklyTheme.deliverable}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-bold">本週材料輸入區</h2>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  這裡就是輸入訓練資料的位置。貼上這週要學的課文、數字、公式、錯題或單字，系統會分配到下面的卡牌排程。
                </p>
              </div>
              <Button onClick={syncWeeklyPlan} disabled={isSyncing} className="shrink-0">
                {isSyncing ? '同步中...' : user ? '同步到 Supabase' : '登入後同步'}
              </Button>
            </div>
            {!user && (
              <div className="mt-3 rounded-lg border border-dashed bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                未登入時資料會先存在本機瀏覽器；登入後按同步即可寫入 Supabase。
              </div>
            )}

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium">本週科目 / 主題</label>
                <input
                  value={weeklyInput.subject}
                  onChange={(event) => updateWeeklyInput({ subject: event.target.value })}
                  className="mt-2 w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  placeholder="例：多益單字、物理力學、歷史大航海時代"
                />
              </div>
              <div>
                <label className="text-sm font-medium">數字 / 年份 / 公式</label>
                <Textarea
                  value={weeklyInput.numbers}
                  onChange={(event) => updateWeeklyInput({ numbers: event.target.value })}
                  className="mt-2 min-h-24"
                  placeholder="例：1815、1492、F=ma、PV=nRT"
                />
              </div>
              <div>
                <label className="text-sm font-medium">單字 / 概念 / 知識點</label>
                <Textarea
                  value={weeklyInput.concepts}
                  onChange={(event) => updateWeeklyInput({ concepts: event.target.value })}
                  className="mt-2 min-h-28"
                  placeholder="一行一個：monotonous、photosynthesis、supply curve..."
                />
              </div>
              <div>
                <label className="text-sm font-medium">錯題 / 易混淆 / 卡住點</label>
                <Textarea
                  value={weeklyInput.mistakes}
                  onChange={(event) => updateWeeklyInput({ mistakes: event.target.value })}
                  className="mt-2 min-h-28"
                  placeholder="例：affect/effect 混淆、公式忘記適用條件、因果順序搞反"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium">原始材料</label>
                <Textarea
                  value={weeklyInput.rawMaterial}
                  onChange={(event) => updateWeeklyInput({ rawMaterial: event.target.value })}
                  className="mt-2 min-h-32"
                  placeholder="貼上課文、筆記、考試範圍、老師講義或你想練的內容..."
                />
              </div>
            </div>
          </div>
        </section>

        <section className="mb-8 rounded-2xl border bg-card p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">本週自動生成訓練內容</h2>
              <p className="text-sm text-muted-foreground">
                依 {identity?.identityName}、{weeklyTheme.title} 和你輸入的材料產生。下週會自動換主題與卡牌順序。
              </p>
            </div>
            <Button onClick={() => navigate('/practice')}>去 Practice 開始訓練</Button>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {generatedWeeklyTasks.map((task, index) => {
              const assigned = materialAssignment(task, weeklyInput);
              const schedule = TASK_SCHEDULES[task.id] || fallbackSchedule(task);
              return (
                <article key={task.id} className="rounded-xl border bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs text-primary">Day {index + 1}</div>
                      <h3 className="font-bold">{task.title}</h3>
                    </div>
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
                      {schedule.dailyMinutes} 分
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{task.subtitle}</p>
                  <div className="mt-3 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                    排程：{intensityLabel[schedule.intensity]} · {schedule.bestTime} · {schedule.spacedDays.map((day) => `第${day}天`).join(' / ')}
                  </div>
                  <div className="mt-3">
                    <div className="mb-1 text-xs font-semibold">本週材料</div>
                    <div className="flex flex-wrap gap-1.5">
                      {assigned.slice(0, 5).map((item) => (
                        <span key={item} className="rounded-full border bg-card px-2 py-1 text-[11px] text-muted-foreground">
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-primary">能力：{abilityLine(task)}</div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mb-8 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-2xl border bg-card p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold">每日課表</h2>
                <p className="text-sm text-muted-foreground">每天 25-35 分鐘，先短練，再主訓練，最後回想。</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {WEEK_PLAN.map((item) => (
                  <button
                    key={item.day}
                    onClick={() => setSelectedDay(item.day)}
                    className={`rounded-full border px-3 py-1 text-sm ${
                      selectedDay === item.day ? 'border-primary bg-primary text-primary-foreground' : 'bg-background text-muted-foreground'
                    }`}
                  >
                    {item.day}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border bg-background p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Clock3 className="h-4 w-4 text-primary" />
                  5 分鐘
                </div>
                <div className="mt-2 text-sm text-muted-foreground">暖身回想：昨天最容易忘的一個點。</div>
              </div>
              <div className="rounded-xl border bg-background p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Dumbbell className="h-4 w-4 text-primary" />
                  15-20 分鐘
                </div>
                <div className="mt-2 text-sm text-muted-foreground">{selectedPlan.focus}</div>
              </div>
              <div className="rounded-xl border bg-background p-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <RotateCcw className="h-4 w-4 text-primary" />
                  5-10 分鐘
                </div>
                <div className="mt-2 text-sm text-muted-foreground">遮住提示，做一次主動回想並標記錯誤。</div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {selectedPlan.taskIds.map((taskId) => {
                const task = taskById(taskId);
                if (!task) return null;
                const schedule = TASK_SCHEDULES[task.id] || fallbackSchedule(task);
                return (
                  <div key={task.id} className="rounded-xl border bg-background p-4">
                    <div className="text-sm font-bold">{task.title}</div>
                    <p className="mt-1 text-sm text-muted-foreground">{task.subtitle}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-primary/10 px-2 py-1 text-primary">{intensityLabel[schedule.intensity]}</span>
                      <span className="rounded-full bg-muted px-2 py-1 text-muted-foreground">{schedule.dailyMinutes} 分鐘</span>
                      <span className="rounded-full bg-muted px-2 py-1 text-muted-foreground">{schedule.bestTime}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5">
            <div className="flex items-center gap-2">
              <ListChecks className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">訓練清單</h2>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">完成度會存在本機瀏覽器。</p>
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span>今日清單完成度</span>
                <span className="text-muted-foreground">{completion}%</span>
              </div>
              <Progress value={completion} />
            </div>
            <Button variant="outline" size="sm" className="mt-4" onClick={reset}>
              重置清單
            </Button>
          </div>
        </section>

        <section className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">新增核心訓練法</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-4">
            {TRAINING_METHODS.map((method) => {
              const Icon = method.icon;
              return (
                <article key={method.id} className="rounded-2xl border bg-card p-4">
                  <div className="mb-3 flex items-start gap-3">
                    <div className="rounded-lg border bg-background p-2">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold">{method.title}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">{method.subtitle}</p>
                    </div>
                  </div>
                  <div className="mb-3 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                    {method.schedule}
                  </div>
                  <div className="space-y-2">
                    {method.steps.map((step, index) => {
                      const id = `${method.id}-${index}`;
                      return (
                        <label key={id} className="flex items-start gap-2 rounded-lg border bg-background px-3 py-2 text-sm">
                          <Checkbox checked={!!checked[id]} onCheckedChange={(value) => toggle(id, Boolean(value))} />
                          <span className={checked[id] ? 'text-muted-foreground line-through' : ''}>{step}</span>
                        </label>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-xs text-primary">
                    <CheckCircle2 className="h-4 w-4" />
                    {method.output}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">每個練習項目的排程</h2>
              <p className="text-sm text-muted-foreground">所有 Learning Gym 卡牌都有頻率、最佳時間、間隔複習和完成清單。</p>
            </div>
            <Button onClick={() => navigate('/practice')} className="hidden sm:inline-flex">
              前往 Practice
            </Button>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {scheduledTasks.map(({ task, schedule }) => (
              <article key={task.id} className="rounded-2xl border bg-card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold">{task.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{task.subtitle}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
                    {intensityLabel[schedule.intensity]}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
                  <div className="rounded-lg bg-muted/60 px-3 py-2">時間：{schedule.bestTime} · {schedule.dailyMinutes} 分鐘</div>
                  <div className="rounded-lg bg-muted/60 px-3 py-2">間隔：{schedule.spacedDays.map((day) => `第 ${day} 天`).join(' → ')}</div>
                  <div className="rounded-lg bg-muted/60 px-3 py-2">能力：{abilityLine(task)}</div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {schedule.checklist.slice(0, 4).map((item) => (
                    <span key={item} className="rounded-full border bg-background px-2 py-1 text-[11px] text-muted-foreground">
                      {item}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default LearningGymPlan;
