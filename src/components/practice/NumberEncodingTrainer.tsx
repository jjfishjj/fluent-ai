import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Eye,
  Headphones,
  Lightbulb,
  RefreshCw,
  Sparkles,
  Trophy,
  Volume2,
  Zap,
  Orbit,
  GraduationCap,
  LockKeyhole,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { LearningStyle } from '@/lib/learning-styles';
import { GeniusType, geniusInfo } from '@/lib/genius-type';
import {
  LearningGymAbility,
  LearningGymProgress,
  LearningGymTask,
} from '@/lib/learning-gym';
import { normalizeDigits, questLevel, scoreRecall } from '@/lib/memory-quest';
import {
  createMemoryQuestAttemptId,
  memoryQuestStats,
  readMemoryQuestHistory,
  saveMemoryQuestAttempt,
} from '@/lib/memory-quest-analytics';
import { MemoryQuestXpTrendChart } from './MemoryQuestXpTrendChart';

const SpatialNumberGame = lazy(() => import('./SpatialNumberGame').then((module) => ({ default: module.SpatialNumberGame })));
const NumberTeacherDashboard = lazy(() => import('./NumberTeacherDashboard').then((module) => ({ default: module.NumberTeacherDashboard })));

interface NumberEncodingTrainerProps {
  userId?: string;
  task: LearningGymTask;
  progress: LearningGymProgress;
  learningStyle: LearningStyle | null;
  geniusType: GeniusType | null;
  onProgressChange: (
    next: LearningGymProgress,
    gained: Partial<Record<LearningGymAbility, number>>,
    evidence: string
  ) => void;
  onBack: () => void;
}

const CODE_WORDS = [
  '鈴鐺', '靈異事件', '趙靈兒', '山', '零食', '領舞', '溜冰', '令旗', '泥巴', '菱角',
  '棒球', '筷子', '嬰兒', '醫生', '鑰匙', '鸚鵡', '石榴', '儀器', '腰包', '藥酒',
  '鴨子', '鱷魚', '耳機', '和尚', '鬧鐘', '二胡', '河流', '耳塞', '惡霸', '餓囚',
  '森林', '鯊魚', '扇兒', '仙丹', '紳士', '珊瑚', '山鹿', '山雞', '婦女', '三角尺',
  '司令', '司儀', '柿兒', '石山', '石獅', '師父', '石榴', '司機', '絲瓜', '死狗',
  '武林', '狐狸', '木耳', '烏山', '武士', '火舞', '物流箱', '武器', '尾巴', '五角星',
  '榴槤', '輪椅', '牛耳', '硫酸', '律師', '鑼鼓', '乳牛', '油漆', '喇叭', '遛狗',
  '麒麟', '蜥蜴', '企鵝', '旗山', '騎士', '積木', '犀牛', '機器人', '西瓜', '氣球',
  '巴黎鐵塔', '白蟻', '靶心', '爬山', '巴士', '白虎', '芭樂', '白旗', '琵琶', '八爪魚',
  '精靈', '球衣', '球兒', '舊傘', '教師', '酒壺', '九頭牛', '酒旗', '酒吧', '舅舅',
] as const;

const STYLE_MODULES: Record<LearningStyle, {
  emoji: string;
  title: string;
  summary: string;
  tips: string[];
}> = {
  visual: {
    emoji: '👁️',
    title: '電影導演模式',
    summary: '把每個代碼拍成高彩度、會動的畫面。',
    tips: ['放大角色與道具', '使用誇張顏色', '讓兩個物件碰撞'],
  },
  auditory: {
    emoji: '👂',
    title: '聲音劇場模式',
    summary: '把代碼唸出來，再用聲音與節奏串成一段。',
    tips: ['兩碼一拍', '加入人物台詞', '閉眼複誦三次'],
  },
  reading: {
    emoji: '📖',
    title: '編劇筆記模式',
    summary: '用「角色—動作—結果」寫成一句完整劇情。',
    tips: ['每組先寫關鍵詞', '使用因為／所以', '最後反向寫回數字'],
  },
  kinesthetic: {
    emoji: '🏃',
    title: '動作演員模式',
    summary: '每個代碼配一個手勢，用身體演完故事。',
    tips: ['站著練習', '每組做一個動作', '轉身後立刻回想'],
  },
};

const DEFAULT_STYLE: LearningStyle = 'visual';

const GENIUS_CODEBOOKS: Record<GeniusType, {
  name: string;
  emoji: string;
  vark: string;
  description: string;
  cue: (word: string, code: string, index: number) => string;
}> = {
  explorer: {
    name: '探索者', emoji: '🔵', vark: 'K 動覺', description: '把代碼放進真實場景，用任務與移動路線提取。',
    cue: (word, _code, index) => `${['門口', '客廳', '廚房', '車站', '教室'][index % 5]}遇見${word}`,
  },
  architect: {
    name: '建築師', emoji: '🟣', vark: 'R 讀寫', description: '用十位數分樓層、個位數分房間，建立穩定結構。',
    cue: (_word, code) => `${code[0]} 樓 · ${code[1]} 號格`,
  },
  melodist: {
    name: '旋律人', emoji: '🟠', vark: 'A 聽覺', description: '兩碼一拍，把代碼詞唸成有重音與尾韻的聲音鉤子。',
    cue: (word, _code, index) => `${index % 2 ? '弱—強' : '強—弱'}拍：${word}`,
  },
  narrator: {
    name: '敘事者', emoji: '🟡', vark: 'A+K', description: '讓每個代碼成為有情緒、目標與反應的故事角色。',
    cue: (word, _code, index) => `${word}${['很驚訝', '正在逃跑', '突然大笑', '急著求救'][index % 4]}`,
  },
  connector: {
    name: '織網者', emoji: '🟢', vark: 'A+R', description: '把代碼詞和熟悉領域、人物或概念建立類比連結。',
    cue: (word, _code, index) => `${word} ↔ ${['工作', '旅行', '電影', '食物', '朋友'][index % 5]}`,
  },
  analyst: {
    name: '分析師', emoji: '🔴', vark: 'R+K', description: '保留固定規則，標出數字、轉碼與反推原因。',
    cue: (word, code) => `${code} → ${word} → 反推 ${code}`,
  },
  performer: {
    name: '表演者', emoji: '🌸', vark: 'K+A', description: '每組代碼配一個可演出的手勢與一句即興台詞。',
    cue: (word, _code, index) => `${['指向前方', '雙手張開', '蹲下跳起', '轉身拍手'][index % 4]}演${word}`,
  },
  visionary: {
    name: '圖像家', emoji: '🔶', vark: 'V 視覺', description: '用顏色、大小與空間位置強化誇張圖像。',
    cue: (word, _code, index) => `${['螢光藍', '烈焰紅', '亮黃色', '紫色'][index % 4]}巨型${word}`,
  },
};

function chunkNumber(value: string) {
  const chunks: string[] = [];
  let index = 0;
  if (value.length % 2 === 1) {
    chunks.push(value.slice(0, 1).padStart(2, '0'));
    index = 1;
  }
  while (index < value.length) {
    chunks.push(value.slice(index, index + 2));
    index += 2;
  }
  return chunks;
}

function sampleStory(chunks: string[]) {
  const words = chunks.map((chunk) => CODE_WORDS[Number(chunk)]);
  if (words.length === 1) return `${words[0]}突然出現在眼前，畫面越荒謬越好。`;
  return `${words[0]}遇見${words[1]}，${words.slice(2).map((word) => `接著用${word}引發下一幕`).join('，')}。把整段想成一鏡到底的誇張短片。`;
}

function randomDigits(length: number) {
  let result = String(Math.floor(Math.random() * 9) + 1);
  while (result.length < length) result += Math.floor(Math.random() * 10);
  return result;
}

export function NumberEncodingTrainer({
  userId,
  task,
  progress,
  learningStyle,
  geniusType,
  onProgressChange,
  onBack,
}: NumberEncodingTrainerProps) {
  const storageUserId = userId || 'guest';
  const [mode, setMode] = useState<'learn' | 'game' | 'spatial' | 'teacher'>('learn');
  const [length, setLength] = useState(7);
  const [digits, setDigits] = useState('5201314');
  const [association, setAssociation] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [completedRounds, setCompletedRounds] = useState(0);
  const [recallStarted, setRecallStarted] = useState(false);
  const [recallAnswer, setRecallAnswer] = useState('');
  const [recallAttempts, setRecallAttempts] = useState(0);
  const [recallFeedback, setRecallFeedback] = useState<'idle' | 'wrong' | 'correct'>('idle');
  const [questHistory, setQuestHistory] = useState(() => readMemoryQuestHistory(storageUserId));
  const [lastQuestPoints, setLastQuestPoints] = useState(0);
  const roundIdRef = useRef(createMemoryQuestAttemptId());
  const roundStartedAtRef = useRef(Date.now());
  const settledQuestIdRef = useRef<string | null>(null);
  const questPoints = useMemo(() => memoryQuestStats(questHistory).totalXp, [questHistory]);

  useEffect(() => {
    setQuestHistory(readMemoryQuestHistory(storageUserId));
    roundIdRef.current = createMemoryQuestAttemptId();
    roundStartedAtRef.current = Date.now();
    settledQuestIdRef.current = null;
    setLastQuestPoints(0);
  }, [storageUserId]);
  const [query, setQuery] = useState('');
  const [selectedGenius, setSelectedGenius] = useState<GeniusType>(geniusType || 'visionary');
  const style = learningStyle || DEFAULT_STYLE;
  const styleModule = STYLE_MODULES[style];
  const codebook = GENIUS_CODEBOOKS[selectedGenius];
  const chunks = useMemo(() => chunkNumber(digits), [digits]);
  const reference = useMemo(() => sampleStory(chunks), [chunks]);
  const filteredCodes = useMemo(() => {
    const normalized = query.trim();
    return CODE_WORDS.map((word, number) => ({
      code: String(number).padStart(2, '0'),
      word,
      cue: GENIUS_CODEBOOKS[selectedGenius].cue(word, String(number).padStart(2, '0'), number),
    })).filter((item) => !normalized || item.code.includes(normalized) || item.word.includes(normalized) || item.cue.includes(normalized));
  }, [query, selectedGenius]);

  const newRound = () => {
    roundIdRef.current = createMemoryQuestAttemptId();
    roundStartedAtRef.current = Date.now();
    settledQuestIdRef.current = null;
    setDigits(randomDigits(length));
    setAssociation('');
    setRevealed(false);
    setRecallStarted(false);
    setRecallAnswer('');
    setRecallAttempts(0);
    setRecallFeedback('idle');
    setLastQuestPoints(0);
  };

  const speakCodes = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(
      revealed
        ? chunks.map((chunk) => `${chunk}，${CODE_WORDS[Number(chunk)]}`).join('；')
        : digits.split('').join('，')
    );
    utterance.lang = 'zh-TW';
    utterance.rate = 0.82;
    window.speechSynthesis.speak(utterance);
  };

  const finishRound = () => {
    const nextProgress = { ...progress };
    const gained = { numberCoding: 3, storyBinding: 1, activeRecall: 1 };
    Object.entries(gained).forEach(([key, value]) => {
      const ability = key as LearningGymAbility;
      nextProgress[ability] = (nextProgress[ability] || 0) + value;
    });
    onProgressChange(nextProgress, gained, `數字 ${digits}：${association}`);
    setCompletedRounds((round) => round + 1);
  };

  const startRecall = () => {
    setRecallStarted(true);
    setRecallAnswer('');
    setRecallAttempts(0);
    setRecallFeedback('idle');
  };

  const submitRecall = () => {
    const result = scoreRecall(digits, recallAnswer, recallAttempts);
    if (!result.correct) {
      setRecallAttempts((attempts) => attempts + 1);
      setRecallFeedback('wrong');
      return;
    }
    if (settledQuestIdRef.current === roundIdRef.current) return;

    settledQuestIdRef.current = roundIdRef.current;
    const completedAt = Date.now();
    const attempt = {
      id: roundIdRef.current,
      userId: storageUserId,
      startedAt: roundStartedAtRef.current,
      completedAt,
      digitsLength: digits.length,
      attempts: recallAttempts,
      points: result.points,
      grade: result.grade,
    };
    const nextHistory = saveMemoryQuestAttempt(attempt, storageUserId);
    setQuestHistory(nextHistory);
    setLastQuestPoints(result.points);
    finishRound();
    setRecallFeedback('correct');
  };

  const nextQuest = () => {
    newRound();
  };

  return (
    <div className="min-h-screen bg-[#f6f7fb] text-slate-900">
      <div className="border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Button variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            返回訓練場
          </Button>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-bold text-amber-700">
              <Zap className="h-4 w-4 fill-current" />
              數字轉碼 Lv.{Math.max(1, Math.floor(progress.numberCoding / 10) + 1)}
            </div>
            <div className="hidden items-center gap-2 rounded-full bg-violet-50 px-3 py-1.5 text-sm font-bold text-violet-700 sm:flex">
              <Trophy className="h-4 w-4" />
              記憶任務 Lv.{questLevel(questPoints)} · {questPoints} XP
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8">
        <section className="relative overflow-hidden rounded-[28px] bg-[#111936] px-6 py-8 text-white shadow-xl md:px-10">
          <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="absolute bottom-0 right-24 h-40 w-40 rounded-full bg-violet-500/20 blur-3xl" />
          <div className="relative grid gap-7 lg:grid-cols-[1fr_340px] lg:items-center">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold text-cyan-200">
                <Sparkles className="h-3.5 w-3.5" />
                NUMBER STORY LAB
              </div>
              <h1 className="max-w-2xl text-3xl font-black leading-tight md:text-5xl">讓數字變成<br />腦中看得見的故事</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
                每兩位數是一個固定圖像。先把長數字切塊，再讓所有圖像發生一件離奇的事，就能從故事反推出原始數字。
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-5 backdrop-blur">
              <div className="flex items-start gap-3">
                <div className="text-3xl">{styleModule.emoji}</div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-cyan-200">為你推薦</div>
                  <div className="mt-1 text-lg font-black">{styleModule.title}</div>
                  <p className="mt-1 text-xs leading-5 text-slate-300">{styleModule.summary}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {styleModule.tips.map((tip) => (
                  <span key={tip} className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] text-slate-200">{tip}</span>
                ))}
              </div>
              {geniusType && (
                <div className="mt-4 border-t border-white/10 pt-3 text-xs text-slate-300">
                  {geniusInfo(geniusType)?.emoji} 已依「{geniusInfo(geniusType)?.nameZh}」天賦調整任務節奏
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="mt-6 grid grid-cols-2 rounded-2xl border bg-white p-1.5 shadow-sm sm:w-[820px] sm:grid-cols-4">
          <button
            type="button"
            onClick={() => setMode('learn')}
            className={`rounded-xl px-4 py-3 text-sm font-bold transition ${mode === 'learn' ? 'bg-slate-900 text-white shadow' : 'text-slate-500'}`}
          >
            <BookOpen className="mr-2 inline h-4 w-4" />01 學習轉碼表
          </button>
          <button
            type="button"
            onClick={() => setMode('game')}
            className={`rounded-xl px-4 py-3 text-sm font-bold transition ${mode === 'game' ? 'bg-slate-900 text-white shadow' : 'text-slate-500'}`}
          >
            <Trophy className="mr-2 inline h-4 w-4" />02 故事挑戰
          </button>
          <button
            type="button"
            onClick={() => setMode('spatial')}
            className={`rounded-xl px-3 py-3 text-sm font-bold transition ${mode === 'spatial' ? 'bg-slate-900 text-white shadow' : 'text-slate-500'}`}
          >
            <Orbit className="mr-2 inline h-4 w-4" />03 3D 空間戰
          </button>
          <button type="button" onClick={() => setMode('teacher')} className={`rounded-xl px-3 py-3 text-sm font-bold transition ${mode === 'teacher' ? 'bg-slate-900 text-white shadow' : 'text-slate-500'}`}>
            <GraduationCap className="mr-2 inline h-4 w-4" />04 教師儀表板
          </button>
        </div>

        {mode === 'learn' ? (
          <section className="mt-6 rounded-[28px] border bg-white p-5 shadow-sm md:p-8">
            <div className="mb-6 rounded-2xl border bg-slate-50 p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-black">選擇你的八種天賦轉碼表</div>
                  <p className="mt-1 text-xs text-slate-500">VARK 決定輸入方式，記憶天賦決定每個數字要用哪一種鉤子。</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600">{codebook.vark}</span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
                {(Object.keys(GENIUS_CODEBOOKS) as GeniusType[]).map((type) => {
                  const profile = GENIUS_CODEBOOKS[type];
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => { setSelectedGenius(type); setQuery(''); }}
                      className={`rounded-xl border px-2 py-2 text-xs font-bold transition ${selectedGenius === type ? 'border-cyan-400 bg-cyan-50 text-cyan-900 shadow-sm' : 'bg-white text-slate-600 hover:border-cyan-200'}`}
                    >
                      <span className="block text-lg">{profile.emoji}</span>{profile.name}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600"><b>{codebook.emoji} {codebook.name}：</b>{codebook.description}</p>
            </div>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <div className="text-xs font-black tracking-[0.2em] text-cyan-600">00—99 CODEBOOK</div>
                <h2 className="mt-2 text-2xl font-black">100 組圖像轉碼字典</h2>
                <p className="mt-2 text-sm text-slate-500">這是一套起始範例。熟悉後，請把不直覺的詞換成你自己的角色、品牌或回憶。</p>
              </div>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜尋數字或關鍵字"
                className="h-11 rounded-xl border bg-slate-50 px-4 text-sm outline-none ring-cyan-500 transition focus:ring-2 md:w-64"
              />
            </div>
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-bold text-cyan-800 hover:bg-cyan-100"
              >
                <ArrowLeft className="h-4 w-4" />
                回到完整學習轉碼表
              </button>
            )}
            <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10">
              {filteredCodes.map((item) => (
                <button key={item.code} type="button" onClick={() => setQuery(item.code)} className="group rounded-2xl border bg-slate-50 p-3 text-left transition hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-cyan-50">
                  <div className="font-mono text-2xl font-black text-slate-900">{item.code}</div>
                  <div className="mt-1 truncate text-xs font-semibold text-slate-500 group-hover:text-cyan-800">{item.word}</div>
                  <div className="mt-2 line-clamp-2 text-[10px] leading-4 text-slate-400">{item.cue}</div>
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setMode('game')} className="gap-2 rounded-xl">
                我準備好了，開始挑戰
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </section>
        ) : mode === 'game' ? (
          <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_330px]">
            <div className="rounded-[28px] border bg-white p-5 shadow-sm md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-black tracking-[0.2em] text-violet-600">STORY CHALLENGE</div>
                  <h2 className="mt-2 text-2xl font-black">把數字轉碼成一段故事</h2>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={length}
                    onChange={(event) => setLength(Number(event.target.value))}
                    className="h-10 rounded-xl border bg-white px-3 text-sm font-semibold"
                    aria-label="數字長度"
                  >
                    <option value={4}>暖身 · 4 位</option>
                    <option value={6}>標準 · 6 位</option>
                    <option value={7}>進階 · 7 位</option>
                    <option value={10}>高手 · 10 位</option>
                  </select>
                  <Button variant="outline" size="icon" onClick={newRound} aria-label="換一題">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="my-8 text-center">
                <div className="font-mono text-5xl font-black tracking-[0.14em] text-slate-950 sm:text-7xl">{recallStarted ? '•••••••' : digits}</div>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {chunks.map((chunk, index) => (
                    <div key={`${chunk}-${index}`} className={`rounded-xl border px-4 py-2 ${recallStarted ? 'border-violet-200 bg-violet-50' : 'border-cyan-200 bg-cyan-50'}`}>
                      <span className={`font-mono font-black ${recallStarted ? 'text-violet-300' : 'text-cyan-950'}`}>{recallStarted ? '••' : chunk}</span>
                      {revealed && !recallStarted && (
                        <span className="ml-2 text-sm text-cyan-700">{CODE_WORDS[Number(chunk)]}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <label className="text-sm font-black" htmlFor="association">你的聯想故事</label>
              <Textarea
                id="association"
                value={association}
                onChange={(event) => setAssociation(event.target.value)}
                placeholder="例：我愛你一生一世。也可以把每組圖像串成有角色、動作、衝突的荒謬故事……"
                className="mt-2 min-h-36 rounded-2xl bg-slate-50 p-4 text-base leading-7"
              />
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-between">
                <Button variant="outline" onClick={speakCodes} className="gap-2">
                  <Volume2 className="h-4 w-4" />
                  {revealed ? '聽轉碼' : '聽數字'}
                </Button>
                <Button
                  onClick={() => setRevealed(true)}
                  disabled={!association.trim()}
                  className="gap-2 rounded-xl bg-violet-600 hover:bg-violet-700"
                >
                  <Eye className="h-4 w-4" />
                  看參考答案
                </Button>
              </div>

              {revealed && (
                <div className={`mt-6 rounded-2xl border p-5 ${recallStarted ? 'border-violet-200 bg-violet-50' : 'border-amber-200 bg-amber-50'}`}>
                  {!recallStarted ? (
                    <>
                      <div className="flex items-start gap-3">
                        <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                        <div>
                          <div className="font-black text-amber-950">參考故事（沒有唯一答案）</div>
                          <p className="mt-2 leading-7 text-amber-900">{digits === '5201314' ? '「我愛你一生一世」— 先用熟悉的數字語意建立整體鉤子，再用 52／01／31／04 的圖像補強細節。' : reference}</p>
                          <div className="mt-3 text-xs leading-5 text-amber-700">
                            好故事檢核：每個轉碼都有出現、有明確動作、畫面夠誇張，而且你能從故事反推數字。
                          </div>
                        </div>
                      </div>
                      <Button onClick={startRecall} className="mt-5 w-full gap-2 rounded-xl bg-violet-600 hover:bg-violet-700">
                        <LockKeyhole className="h-4 w-4" />
                        藏起答案，開始回想
                      </Button>
                    </>
                  ) : (
                    <>
                      <div className="flex items-start gap-3">
                        <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-violet-700" />
                        <div>
                          <div className="font-black text-violet-950">記憶回想關：從故事反推出數字</div>
                          <p className="mt-2 text-sm leading-6 text-violet-800">答案已藏起來。先在腦中重播角色、動作與衝突，再輸入完整數字；支援全形數字、空格與連字號。</p>
                        </div>
                      </div>
                      <form onSubmit={(event) => { event.preventDefault(); if (recallFeedback !== 'correct') submitRecall(); }} className="mt-5">
                        <label htmlFor="memory-recall-answer" className="text-sm font-black text-violet-950">你的回想答案</label>
                        <input
                          id="memory-recall-answer"
                          inputMode="numeric"
                          autoComplete="off"
                          value={recallAnswer}
                          onChange={(event) => { setRecallAnswer(normalizeDigits(event.target.value).replace(/[^0-9]/g, '').slice(0, digits.length)); setRecallFeedback('idle'); }}
                          placeholder={`${digits.length} 位數字`}
                          className="mt-2 h-12 w-full rounded-xl border border-violet-200 bg-white px-4 font-mono text-lg font-black tracking-[0.18em] text-violet-950 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-200"
                        />
                        <div className="mt-3 min-h-6 text-sm font-bold">
                          {recallFeedback === 'wrong' && <span className="text-rose-600">還差一點。再重播一次故事，先找第一個畫面，再逐段往回推。</span>}
                          {recallFeedback === 'correct' && <span className="text-emerald-700">答對了！本回合獲得 +{lastQuestPoints} XP，記憶任務完成。</span>}
                        </div>
                        <Button type={recallFeedback === 'correct' ? 'button' : 'submit'} onClick={recallFeedback === 'correct' ? nextQuest : undefined} disabled={!recallAnswer.trim()} className="mt-2 w-full gap-2 rounded-xl bg-violet-600 hover:bg-violet-700">
                          {recallFeedback === 'correct' ? <><RotateCcw className="h-4 w-4" />下一場記憶任務</> : <><CheckCircle2 className="h-4 w-4" />送出回想答案</>}
                        </Button>
                      </form>
                      <div className="mt-4 rounded-xl border border-violet-200 bg-white/70 p-3 text-xs leading-5 text-violet-800">小提示：不要急著猜。記憶提取本身就是訓練，答錯後再嘗試一次，通常比立刻看答案更有幫助。</div>
                    </>
                  )}
                </div>
              )}
            </div>

            <aside className="space-y-4">
              <div className="rounded-2xl border bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="font-black">本次訓練</h3>
                  <span className="text-2xl">🔥</span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="text-xs text-slate-500">完成回合</div>
                    <div className="mt-1 text-2xl font-black">{completedRounds}</div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3">
                    <div className="text-xs text-slate-500">數字轉碼</div>
                    <div className="mt-1 text-2xl font-black">{progress.numberCoding}</div>
                  </div>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-500" style={{ width: `${Math.min(100, completedRounds * 20)}%` }} />
                </div>
                <p className="mt-2 text-xs text-slate-500">今日目標：完成 5 回合</p>
              </div>

              <MemoryQuestXpTrendChart history={questHistory} />

              <div className="rounded-2xl bg-[#eafcff] p-5">
                <div className="flex items-center gap-2 font-black text-cyan-950">
                  {style === 'auditory' ? <Headphones className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
                  你的專屬練法
                </div>
                <p className="mt-2 text-sm leading-6 text-cyan-900">{styleModule.summary}</p>
                <ol className="mt-4 space-y-3 text-sm text-cyan-950">
                  {styleModule.tips.map((tip, index) => (
                    <li key={tip} className="flex gap-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-200 text-[10px] font-black">{index + 1}</span>
                      {tip}
                    </li>
                  ))}
                </ol>
              </div>

              <div className="rounded-2xl border border-dashed bg-white p-5 text-sm leading-6 text-slate-600">
                <div className="font-black text-slate-900">快速公式</div>
                <p className="mt-2">數字 → 兩碼切塊 → 固定圖像 → 動作衝突 → 遮住後反推。</p>
              </div>
            </aside>
          </section>
        ) : mode === 'spatial' ? (
          <div className="mt-6">
            <Suspense fallback={<div className="flex min-h-[520px] items-center justify-center rounded-[28px] bg-[#07101f] text-xs font-black tracking-[.22em] text-cyan-300"><span className="animate-pulse">LOADING THREE.JS LAB…</span></div>}>
            <SpatialNumberGame userId={userId} onComplete={(lastAnswer) => {
              const nextProgress = { ...progress };
              const gained = { numberCoding: 5, visualSpatial: 3, activeRecall: 2 };
              Object.entries(gained).forEach(([key, value]) => {
                const ability = key as LearningGymAbility;
                nextProgress[ability] = (nextProgress[ability] || 0) + value;
              });
              onProgressChange(nextProgress, gained, `完成 3D 空間數字轉碼：${lastAnswer}`);
              setCompletedRounds((round) => round + 5);
            }} />
            </Suspense>
          </div>
        ) : <Suspense fallback={<div className="mt-6 rounded-[28px] bg-slate-900 p-16 text-center text-cyan-300">LOADING ANALYTICS…</div>}><NumberTeacherDashboard userId={userId} /></Suspense>}
      </main>
    </div>
  );
}
