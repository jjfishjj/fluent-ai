import { Component, FormEvent, lazy, Suspense, useEffect, useMemo, useRef, useState, type ComponentType, type ErrorInfo, type ReactNode } from 'react';
import { Brain, CalendarClock, CheckCircle2, Crosshair, Expand, Gauge, Lightbulb, MousePointer2, Pause, Play, Rotate3D, RotateCcw, Smartphone, Snail, Sparkles, Timer, Trophy, Volume2, VolumeX, XCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatRecallDelay, getDueRecalls, gradeScheduledRecall, readRecallSchedule, scheduleWrongCodes, type ScheduledRecall } from '@/lib/number-recall-schedule';
import { saveNumberAttempt } from '@/lib/number-training-analytics';
import { upsertCloudNumberAttempt } from '@/lib/number-training-supabase';
import { readActiveStudent } from '@/lib/number-classroom';

const WebGLNumberScene = lazy(() => import('./WebGLNumberScene').then((module) => ({ default: module.WebGLNumberScene })));

export type SpatialRound = {
  code: string;
  word: string;
  aliases: string[];
  icon: string;
  material: string;
  palette: string;
  transformation: string;
  animation: string;
};

export const SPATIAL_NUMBER_ROUNDS: SpatialRound[] = [
  { code: '04', word: '水母', aliases: ['水母', '游泳', '海洋'], icon: '🪼', material: '水晶凝膠', palette: '#67e8f9', transformation: '0 融成傘狀身體，4 拉成觸手', animation: '半透明水母發光脈動，游向鏡頭' },
  { code: '18', word: '泥巴', aliases: ['泥巴', '泥土', '沼澤'], icon: '🟤', material: '濕潤陶土', palette: '#d6a66f', transformation: '數字表面龜裂後軟化坍塌', animation: '泥滴失重漂浮，再啪地黏滿鏡頭' },
  { code: '23', word: '和尚', aliases: ['和尚', '僧人', '寺廟'], icon: '🧘', material: '暖金銅像', palette: '#fbbf24', transformation: '2 變肩臂，3 盤成打坐雙腿', animation: '金色梵文字環繞，鐘聲震出光圈' },
  { code: '31', word: '鯊魚', aliases: ['鯊魚', '魚', '海'], icon: '🦈', material: '液態銀', palette: '#60a5fa', transformation: '3 展開成魚鰭，1 伸成尾鰭', animation: '鯊魚穿越數字碎片，繞場一周' },
  { code: '43', word: '石山', aliases: ['石山', '山', '岩石'], icon: '⛰️', material: '黑曜岩', palette: '#a78bfa', transformation: '4 與 3 風化成兩座陡峭山峰', animation: '碎石倒流重組，雲海從腳下湧起' },
  { code: '51', word: '狐狸', aliases: ['狐狸', '狐仙', '動物'], icon: '🦊', material: '橘紅毛絨', palette: '#fb923c', transformation: '5 捲成尾巴，1 直立成敏捷身體', animation: '狐狸躍出霓虹火圈，留下殘影' },
  { code: '64', word: '律師', aliases: ['律師', '法官', '法庭'], icon: '⚖️', material: '深藍琺瑯', palette: '#38bdf8', transformation: '6 旋成法槌，4 展開為正義天秤', animation: '文件如鳥群飛起，法槌落下震波' },
  { code: '77', word: '機器人', aliases: ['機器人', '機械', '鋼鐵'], icon: '🤖', material: '鍍鉻霓虹', palette: '#34d399', transformation: '雙 7 折疊成機械骨架與雙臂', animation: '零件磁吸組裝，掃描線掠過空間' },
  { code: '80', word: '巴黎鐵塔', aliases: ['巴黎鐵塔', '鐵塔', '巴黎'], icon: '🗼', material: '鉚釘鐵構', palette: '#f472b6', transformation: '8 展開塔身，0 化成頂端探照燈', animation: '鐵塔拔地升起，夜空綻放煙火' },
  { code: '94', word: '教師', aliases: ['教師', '老師', '教室'], icon: '🧑‍🏫', material: '粉筆粒子', palette: '#c4b5fd', transformation: '9 化為頭部，4 展成手持教鞭', animation: '公式粒子繞身公轉，黑板向後展開' },
];

/** 3D 場景元件的介面。不傳就用預設的 WebGLNumberScene，/mnemoverse 頁注入自己的加強版場景。 */
export type NumberSceneComponent = ComponentType<{
  round: SpatialRound;
  submitted: boolean;
  combo: number;
  quality: 'low' | 'high';
  recallMode?: boolean;
  morphSpeed?: number;
  animationEnabled?: boolean;
}>;

type Props = { onComplete: (evidence: string) => void; scene?: NumberSceneComponent; userId?: string };
type Phase = 'encode' | 'interference' | 'recall' | 'scheduledRecall' | 'result';
type Quality = 'auto' | 'low' | 'high';
type RecallResult = { code: string; answer: string; correct: boolean; responseMs: number; animationEnabled?: boolean; retryAfterSeconds?: number };

const RECALL_ORDER = [3, 0, 7, 4, 1, 9, 5, 2, 8, 6];

type FeedbackSound = 'morph' | 'correct' | 'wrong';
let feedbackAudioContext: AudioContext | null = null;

function playFeedbackSound(kind: FeedbackSound) {
  try {
    feedbackAudioContext ??= new AudioContext();
    const context = feedbackAudioContext;
    const now = context.currentTime;
    const notes = kind === 'morph' ? [220, 440, 660] : kind === 'correct' ? [523, 784] : [180, 130];
    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = now + index * .09;
      oscillator.type = kind === 'wrong' ? 'sawtooth' : 'sine';
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(.0001, start);
      gain.gain.exponentialRampToValueAtTime(kind === 'wrong' ? .035 : .055, start + .015);
      gain.gain.exponentialRampToValueAtTime(.0001, start + .16);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + .18);
    });
  } catch { /* Audio feedback is optional on restricted browsers. */ }
}

function vibrateFeedback(kind: FeedbackSound) {
  if (!('vibrate' in navigator)) return;
  navigator.vibrate(kind === 'morph' ? [20, 25, 45] : kind === 'correct' ? [35, 30, 80] : [70, 45, 70]);
}

class WebGLBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.warn('WebGL scene unavailable; using the accessible fallback.', error.message, info.componentStack);
  }
  render() { return this.state.failed ? this.props.fallback : this.props.children; }
}

function SpatialFallback({ round, revealObject }: { round: SpatialRound; revealObject: boolean }) {
  return <div className="flex h-full flex-col items-center justify-center bg-[radial-gradient(circle_at_center,#17324b,#050a18_65%)]"><div className={`transition-all duration-700 ${revealObject ? 'scale-100 opacity-100' : 'scale-100 opacity-100'}`}>{revealObject ? <span className="text-[9rem] drop-shadow-[0_0_35px_var(--round-color)]" role="img" aria-label="3D 備援物件">{round.icon}</span> : <span className="font-mono text-[8rem] font-black drop-shadow-[0_0_30px_var(--round-color)]" style={{ color: round.palette }}>{round.code}</span>}</div><div className="mt-5 rounded-full border border-white/10 bg-black/25 px-3 py-1 text-[10px] font-bold tracking-widest text-slate-400">WEBGL FALLBACK · TRAINING AVAILABLE</div></div>;
}

function scoreAssociation(answer: string, round: SpatialRound) {
  const normalized = answer.trim();
  if (!normalized) return { score: 0, label: '等待輸入' };
  const exact = round.aliases.some((word) => normalized.includes(word));
  const vivid = /爆|飛|游|跳|燃|光|融|碎|巨大|透明|旋轉|衝|噴/.test(normalized);
  return { score: Math.min(100, (exact ? 76 : 48) + (vivid ? 14 : 0) + Math.min(10, normalized.length)), label: exact ? '轉碼共鳴' : '創意新連結' };
}

function detectLowPowerDevice() {
  if (typeof navigator === 'undefined') return false;
  const nav = navigator as Navigator & { deviceMemory?: number };
  return (nav.hardwareConcurrency || 8) <= 4 || (nav.deviceMemory || 8) <= 4 || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function detectWebGLSupport() {
  if (typeof document === 'undefined') return true;
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!context) return false;
    context.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export function SpatialNumberGame({ onComplete, scene, userId }: Props) {
  const SceneComponent = scene ?? WebGLNumberScene;
  const [phase, setPhase] = useState<Phase>('encode');
  const [roundIndex, setRoundIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [showGuide, setShowGuide] = useState(false);
  const [interferenceSolved, setInterferenceSolved] = useState(false);
  const [recallIndex, setRecallIndex] = useState(0);
  const [recallAnswer, setRecallAnswer] = useState('');
  const [recallFeedback, setRecallFeedback] = useState<RecallResult | null>(null);
  const [recallResults, setRecallResults] = useState<RecallResult[]>([]);
  const [schedule, setSchedule] = useState<ScheduledRecall[]>(() => readRecallSchedule());
  const [scheduledQueue, setScheduledQueue] = useState<ScheduledRecall[]>([]);
  const [clock, setClock] = useState(Date.now());
  const [quality, setQuality] = useState<Quality>('auto');
  const [morphSpeed, setMorphSpeed] = useState<1 | .4>(1);
  const [morphReplayKey, setMorphReplayKey] = useState(0);
  const [morphProgress, setMorphProgress] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeStudent] = useState(readActiveStudent);
  const [animationEnabled, setAnimationEnabled] = useState(() => readActiveStudent()?.testGroup !== 'static');
  const [lowPower] = useState(detectLowPowerDevice);
  const [webglAvailable] = useState(detectWebGLSupport);
  const recallStartedAt = useRef(Date.now());
  const completionSent = useRef(false);
  const attemptId = useRef(`attempt-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const animationModeByCode = useRef<Record<string, boolean>>({});
  const effectiveQuality = quality === 'auto' ? (lowPower ? 'low' : 'high') : quality;
  const isScheduledRecall = phase === 'scheduledRecall';
  const round = phase === 'recall' ? SPATIAL_NUMBER_ROUNDS[RECALL_ORDER[recallIndex]] : isScheduledRecall ? SPATIAL_NUMBER_ROUNDS.find((item) => item.code === scheduledQueue[recallIndex]?.code) ?? SPATIAL_NUMBER_ROUNDS[0] : SPATIAL_NUMBER_ROUNDS[roundIndex];
  const result = useMemo(() => scoreAssociation(answer, round), [answer, round]);
  const isCodeOnly = answer.trim() === round.code;
  const correctCount = recallResults.filter((item) => item.correct).length;
  const averageSeconds = recallResults.length ? recallResults.reduce((sum, item) => sum + item.responseMs, 0) / recallResults.length / 1000 : 0;

  useEffect(() => { if (phase === 'recall' || phase === 'scheduledRecall') recallStartedAt.current = Date.now(); }, [phase, recallIndex]);
  useEffect(() => {
    if (phase !== 'encode' || !activeStudent) return;
    if (activeStudent.testGroup === 'dynamic') setAnimationEnabled(true);
    if (activeStudent.testGroup === 'static') setAnimationEnabled(false);
    if (activeStudent.testGroup === 'alternating') setAnimationEnabled(roundIndex % 2 === 0);
  }, [activeStudent, phase, roundIndex]);
  useEffect(() => {
    if (!submitted || phase !== 'encode') { setMorphProgress(0); return; }
    const startedAt = performance.now();
    const duration = 2400 / morphSpeed;
    setMorphProgress(0);
    const timer = window.setInterval(() => {
      const next = Math.min(100, ((performance.now() - startedAt) / duration) * 100);
      setMorphProgress(next);
      if (next >= 100) window.clearInterval(timer);
    }, 50);
    return () => window.clearInterval(timer);
  }, [submitted, phase, morphReplayKey, morphSpeed]);
  useEffect(() => {
    if (phase !== 'result') return;
    const timer = window.setInterval(() => setClock(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [phase]);
  useEffect(() => {
    if (phase !== 'result' || !recallResults.length) return;
    setSchedule(scheduleWrongCodes(recallResults.filter((item) => !item.correct).map((item) => item.code), attemptId.current));
    const attempt = { id: attemptId.current, student: activeStudent ? `${activeStudent.name}（${activeStudent.studentCode}）` : '學生 A', studentCode: activeStudent?.studentCode, completedAt: Date.now(), correct: recallResults.filter((item) => item.correct).length, total: recallResults.length, averageResponseMs: recallResults.reduce((sum, item) => sum + item.responseMs, 0) / recallResults.length, results: recallResults.map(({ code, correct, responseMs, animationEnabled }) => ({ code, correct, responseMs, animationEnabled })) };
    saveNumberAttempt(attempt);
    if (userId) void upsertCloudNumberAttempt(userId, attempt).catch(() => undefined);
  }, [activeStudent, phase, recallResults, userId]);

  const submitEncoding = (event: FormEvent) => {
    event.preventDefault();
    if (!answer.trim() || isCodeOnly) return;
    animationModeByCode.current[round.code] = animationEnabled;
    setSubmitted(true);
    setMorphReplayKey((value) => value + 1);
    if (soundEnabled) playFeedbackSound('morph');
    vibrateFeedback('morph');
    const nextCombo = result.score >= 70 ? combo + 1 : 0;
    setCombo(nextCombo);
    setBestCombo((value) => Math.max(value, nextCombo));
  };

  const nextEncoding = () => {
    if (roundIndex === SPATIAL_NUMBER_ROUNDS.length - 1) {
      setPhase('interference');
      return;
    }
    setRoundIndex((value) => value + 1);
    setAnswer(''); setSubmitted(false); setShowGuide(false);
  };

  const submitRecall = (event: FormEvent) => {
    event.preventDefault();
    if (!/^\d{2}$/.test(recallAnswer)) return;
    const now = Date.now();
    const item: RecallResult = { code: round.code, answer: recallAnswer, correct: recallAnswer === round.code, responseMs: now - recallStartedAt.current, animationEnabled: animationModeByCode.current[round.code] };
    if (isScheduledRecall) {
      const scheduled = scheduledQueue[recallIndex];
      const graded = gradeScheduledRecall({ id: scheduled.id, correct: item.correct, responseMs: item.responseMs }, now);
      setSchedule(graded.schedule);
      if (!item.correct && graded.retryAfterMs) item.retryAfterSeconds = Math.ceil(graded.retryAfterMs / 1000);
    }
    setRecallFeedback(item);
    if (soundEnabled) playFeedbackSound(item.correct ? 'correct' : 'wrong');
    vibrateFeedback(item.correct ? 'correct' : 'wrong');
    if (!isScheduledRecall) setRecallResults((items) => [...items, item]);
  };

  const nextRecall = () => {
    const total = isScheduledRecall ? scheduledQueue.length : SPATIAL_NUMBER_ROUNDS.length;
    if (recallIndex === total - 1) {
      if (isScheduledRecall) {
        setScheduledQueue([]); setRecallIndex(0); setRecallAnswer(''); setRecallFeedback(null); setPhase('result');
        return;
      }
      setPhase('result');
      if (!completionSent.current) {
        completionSent.current = true;
        onComplete(`3D 延遲回想 ${correctCount}/10，最高 ${bestCombo} Combo`);
      }
      return;
    }
    setRecallIndex((value) => value + 1);
    setRecallAnswer(''); setRecallFeedback(null);
  };

  const startDueRecall = () => {
    const due = getDueRecalls(schedule, Date.now());
    if (!due.length) return;
    setScheduledQueue(due); setRecallIndex(0); setRecallAnswer(''); setRecallFeedback(null); setPhase('scheduledRecall');
  };

  const restart = () => {
    setPhase('encode'); setRoundIndex(0); setAnswer(''); setSubmitted(false); setCombo(0); setBestCombo(0); setShowGuide(false);
    setInterferenceSolved(false); setRecallIndex(0); setRecallAnswer(''); setRecallFeedback(null); setRecallResults([]); completionSent.current = false;
    animationModeByCode.current = {};
  };

  const replayMorph = () => {
    setMorphReplayKey((value) => value + 1);
    if (soundEnabled) playFeedbackSound('morph');
    vibrateFeedback('morph');
  };

  if (phase === 'interference') return (
    <section className="spatial-shell rounded-[28px] p-6 text-white md:p-10" style={{ '--round-color': '#fbbf24' } as React.CSSProperties}>
      <div className="mx-auto max-w-2xl py-8 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border border-amber-300/30 bg-amber-300/10"><Brain className="h-9 w-9 text-amber-300" /></div>
        <div className="mt-6 text-xs font-black tracking-[.3em] text-amber-300">DISTRACTION GATE</div>
        <h2 className="mt-3 text-3xl font-black">先切換注意力，再測長期提取</h2>
        <p className="mt-3 text-sm leading-7 text-slate-400">這道干擾題會暫時移開工作記憶。請找出「不屬於」數字轉碼流程的一項。</p>
        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          {['兩碼切塊', '建立具體圖像', '加入誇張動作', '逐筆抄寫二十次'].map((choice) => (
            <button key={choice} type="button" onClick={() => setInterferenceSolved(choice === '逐筆抄寫二十次')} className={`rounded-2xl border p-5 text-sm font-black transition ${interferenceSolved && choice === '逐筆抄寫二十次' ? 'border-emerald-300 bg-emerald-300/15 text-emerald-200' : 'border-white/10 bg-white/5 hover:border-amber-300/40'}`}>{choice}</button>
          ))}
        </div>
        {interferenceSolved && <div className="mt-5 rounded-xl bg-emerald-300/10 p-3 text-sm font-bold text-emerald-200">注意力重置完成。接下來不再顯示數字與聯想詞。</div>}
        <Button disabled={!interferenceSolved} onClick={() => setPhase('recall')} className="mt-7 h-12 rounded-full bg-amber-300 px-8 font-black text-slate-950 hover:bg-amber-200">進入延遲回想測驗</Button>
      </div>
    </section>
  );

  if (phase === 'result') return (
    <section className="spatial-shell rounded-[28px] p-6 text-white md:p-10" style={{ '--round-color': '#67e8f9' } as React.CSSProperties}>
      <div className="mx-auto max-w-3xl py-8 text-center">
        <Trophy className="mx-auto h-16 w-16 text-amber-300" />
        <div className="mt-5 text-xs font-black tracking-[.3em] text-cyan-300">RECALL ANALYSIS COMPLETE</div>
        <h2 className="mt-3 text-4xl font-black">真正記住了 {correctCount}/10 組</h2>
        <div className="mt-7 grid grid-cols-3 gap-3"><Metric label="正確率" value={`${correctCount * 10}%`} /><Metric label="平均反應" value={`${averageSeconds.toFixed(1)}s`} /><Metric label="最高連擊" value={`${bestCombo}`} /></div>
        <div className="mt-7 grid gap-2 sm:grid-cols-5">{recallResults.map((item) => <div key={item.code} className={`rounded-xl border p-3 text-xs ${item.correct ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-200' : 'border-rose-400/25 bg-rose-400/10 text-rose-200'}`}><div className="font-mono text-lg font-black">{item.code}</div><div>{item.correct ? '正確' : `答 ${item.answer}`}</div></div>)}</div>
        <RecallSchedulePanel schedule={schedule} now={clock} onStart={startDueRecall} currentWrongCount={recallResults.filter((item) => !item.correct).length} />
        <p className="mt-6 text-sm text-slate-400">本次答錯項目已自動排入 30 秒、3 分鐘與次日回想；上方數量包含先前尚未完成的待辦，重新整理頁面也會保留。</p>
        <Button onClick={restart} className="mt-7 rounded-full bg-cyan-300 px-8 font-black text-slate-950 hover:bg-cyan-200">重練錯題與十組模型</Button>
      </div>
    </section>
  );

  const isRecall = phase === 'recall' || phase === 'scheduledRecall';
  return (
    <section className={`spatial-shell relative overflow-hidden rounded-[28px] text-white ${submitted && !isRecall ? 'spatial-impact' : ''}`} style={{ '--round-color': round.palette } as React.CSSProperties}>
      <style>{`.spatial-shell{background:radial-gradient(circle at 50% 38%,color-mix(in srgb,var(--round-color,#67e8f9) 18%,transparent),transparent 32%),linear-gradient(155deg,#081226,#101229 55%,#071b23);box-shadow:inset 0 0 80px #020617,0 24px 70px -30px #020617}.spatial-impact{animation:camera-shake .42s linear}@keyframes camera-shake{0%,100%{transform:translate(0)}25%{transform:translate(-5px,3px)}50%{transform:translate(6px,-2px)}75%{transform:translate(-3px,-3px)}}`}</style>
      <div className="relative flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4 md:px-7">
        <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-300/30 bg-cyan-300/10"><Expand className="h-4 w-4 text-cyan-200" /></div><div><div className="text-xs font-black tracking-[.22em] text-cyan-300">MNEMO・VERSE</div><div className="text-[11px] text-slate-400">{isRecall ? '延遲回想艙 · 隱藏提示' : '十組超現實編碼艙'}</div></div></div>
        <div className="flex items-center gap-2 text-xs font-bold"><button type="button" onClick={() => setAnimationEnabled((value) => !value)} aria-label={animationEnabled ? '切換為靜態記憶組' : '切換為動態記憶組'} aria-pressed={animationEnabled} className={`flex h-8 items-center gap-1 rounded-full border px-2 transition ${animationEnabled ? 'border-cyan-300/30 bg-cyan-300/10 text-cyan-200' : 'border-white/10 bg-white/5 text-slate-400'}`}>{animationEnabled ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}<span className="hidden sm:inline">{animationEnabled ? '動態組' : '靜態組'}</span></button><button type="button" onClick={() => setSoundEnabled((value) => !value)} aria-label={soundEnabled ? '關閉互動音效' : '開啟互動音效'} aria-pressed={soundEnabled} className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10">{soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}</button><span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">{isScheduledRecall ? 'RETRY' : isRecall ? 'RECALL' : 'ENCODE'} {(isRecall ? recallIndex : roundIndex) + 1}/{isScheduledRecall ? scheduledQueue.length : 10}</span><span className="rounded-full border border-orange-300/20 bg-orange-300/10 px-3 py-1.5 text-orange-200"><Zap className="mr-1 inline h-3 w-3" />{combo} COMBO</span></div>
      </div>

      <div className="relative grid min-h-[620px] lg:grid-cols-[1fr_360px]">
        <div className="relative min-h-[420px] overflow-hidden border-b border-white/10 lg:border-b-0 lg:border-r">
          <div className="absolute left-5 top-5 z-10 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-[11px] text-slate-300 backdrop-blur"><MousePointer2 className="mr-1.5 hidden h-3.5 w-3.5 sm:inline" /><Smartphone className="mr-1.5 inline h-3.5 w-3.5 sm:hidden" />{isRecall ? '只看物件，反推原始兩位數' : <><span className="hidden sm:inline">拖曳旋轉數字，建立空間線索</span><span className="sm:hidden">單指拖曳旋轉 3D 數字</span></>}</div>
          <div className="absolute right-5 top-5 z-10 flex items-center gap-2">
            <Gauge className="h-3.5 w-3.5 text-slate-500" /><select aria-label="3D 效能模式" value={quality} onChange={(event) => setQuality(event.target.value as Quality)} className="rounded-lg border border-white/10 bg-slate-950/70 px-2 py-1.5 text-[10px] font-bold text-slate-300"><option value="auto">AUTO · {effectiveQuality === 'low' ? '30' : '60'} FPS</option><option value="low">省電 · 30 FPS</option><option value="high">高畫質 · 60 FPS</option></select>
          </div>
          <div className="absolute inset-0 touch-none select-none">
            {webglAvailable ? <Suspense fallback={<div className="flex h-full items-center justify-center bg-[#050a18] text-xs font-black tracking-[.2em] text-cyan-300"><span className="animate-pulse">LOADING WEBGL MODULE…</span></div>}>
                <WebGLBoundary fallback={<SpatialFallback round={round} revealObject={isRecall || submitted} />}>
                  <SceneComponent key={`${round.code}-${morphReplayKey}-${morphSpeed}`} round={round} submitted={isRecall || submitted} combo={combo} quality={effectiveQuality} recallMode={isRecall} morphSpeed={morphSpeed} animationEnabled={animationEnabled} />
                </WebGLBoundary>
              </Suspense> : <SpatialFallback round={round} revealObject={isRecall || submitted} />}
          </div>
          <Crosshair className="pointer-events-none absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 text-white/40" strokeWidth={1} />
          <div className="pointer-events-none absolute inset-x-5 bottom-5 flex items-center justify-between text-[10px] tracking-widest text-slate-500"><span>WEBGL · MORPH TARGETS</span><span>{effectiveQuality === 'low' ? 'ECO 30 FPS' : 'ULTRA 60 FPS'}</span></div>
        </div>

        <div className="relative flex flex-col bg-slate-950/45 p-5 backdrop-blur-sm md:p-7">
          {isRecall ? <RecallPanel round={round} value={recallAnswer} setValue={setRecallAnswer} feedback={recallFeedback} onSubmit={submitRecall} onNext={nextRecall} index={recallIndex} isLast={recallIndex === (isScheduledRecall ? scheduledQueue.length : 10) - 1} /> : !submitted ? <>
            <div className="text-xs font-black tracking-[.2em] text-violet-300">ENCODE SIGNAL</div><h2 className="mt-3 text-2xl font-black">你看見了什麼？</h2><p className="mt-2 text-sm leading-6 text-slate-400">把數字轉成具體、荒謬而且會動的畫面。</p>
            <button type="button" onClick={() => setShowGuide(!showGuide)} className="mt-5 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 text-left text-xs text-slate-300"><span><Lightbulb className="mr-2 inline h-4 w-4 text-amber-300" />提示遞減 Lv.{showGuide ? '1' : '0'}</span><span>{showGuide ? '−' : '+'}</span></button>
            {showGuide && <div className="mt-2 rounded-xl border border-cyan-300/15 bg-cyan-300/5 p-3 text-xs leading-5 text-cyan-100">提示：念「{round.code}」的聲音，再觀察形狀。下一階段所有提示都會消失。</div>}
            <form onSubmit={submitEncoding} className="mt-6 flex flex-1 flex-col"><label htmlFor="spatial-answer" className="text-xs font-bold text-slate-300">輸入聯想到的物件或動態畫面</label><input id="spatial-answer" value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder={`例如：${round.word}在星空中游動…`} aria-describedby="spatial-answer-help" className={`mt-2 h-14 rounded-xl border bg-white/5 px-4 text-base font-semibold text-white outline-none placeholder:text-slate-600 ${isCodeOnly ? 'border-amber-300/70' : 'border-white/10 focus:border-cyan-300/50'}`} autoComplete="off" /><div id="spatial-answer-help" className="mt-3 flex items-start justify-between gap-3 text-[11px]"><span className={isCodeOnly ? 'font-bold text-amber-300' : 'text-slate-500'}>{isCodeOnly ? `請不要重複輸入 ${round.code}；請輸入聯想物件，例如「${round.word}」` : '越具體、動態、誇張越好'}</span><span className="shrink-0" style={{ color: answer && !isCodeOnly ? round.palette : undefined }}>{isCodeOnly ? '等待聯想' : result.label}</span></div><Button disabled={!answer.trim() || isCodeOnly} className="mt-auto h-12 rounded-xl bg-cyan-300 font-black text-slate-950 hover:bg-cyan-200"><Crosshair className="mr-2 h-4 w-4" />鎖定並啟動 Morph</Button></form>
          </> : <>
            <div role="status" aria-live="polite" className="rounded-xl border border-emerald-300/30 bg-emerald-300/10 p-3 text-sm font-black text-emerald-200"><CheckCircle2 className="mr-2 inline h-5 w-5" />轉碼完成！3D 動畫與記憶說明已生成</div><div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3"><div className="flex items-center justify-between text-[11px] font-bold"><span>{morphProgress < 100 ? 'MORPH 播放中' : 'MORPH 播放完成'}</span><span className="font-mono text-cyan-200">{Math.round(morphProgress)}%</span></div><div role="progressbar" aria-label="Morph 動畫播放進度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(morphProgress)} className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-cyan-300 transition-[width] duration-75" style={{ width: `${morphProgress}%` }} /></div><div className="mt-3 grid grid-cols-2 gap-2"><Button type="button" variant="outline" onClick={replayMorph} className="h-9 border-white/15 bg-white/5 text-xs text-white hover:bg-white/10 hover:text-white"><RotateCcw className="mr-1.5 h-3.5 w-3.5" />重新播放</Button><Button type="button" variant="outline" aria-pressed={morphSpeed === .4} onClick={() => setMorphSpeed((value) => value === 1 ? .4 : 1)} className={`h-9 border-white/15 text-xs hover:text-white ${morphSpeed === .4 ? 'bg-amber-300/15 text-amber-200' : 'bg-white/5 text-white hover:bg-white/10'}`}><Snail className="mr-1.5 h-3.5 w-3.5" />{morphSpeed === .4 ? '慢動作 ON' : '慢動作'}</Button></div></div><div className="mt-5 flex items-center justify-between"><div className="text-xs font-black tracking-[.2em] text-emerald-300">MORPH TARGET COMPLETE</div><div className="font-mono text-2xl font-black" style={{ color: round.palette }}>{result.score}%</div></div><h2 className="mt-4 text-3xl font-black">{round.code} → {round.word}</h2><p className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm leading-6 text-slate-300">你的畫面：「{answer}」</p><div className="mt-5 space-y-3 text-sm"><Info label="GPU 網格形變" text={round.transformation} /><Info label="空間動畫" text={round.animation} /></div><div className="mt-4 flex items-center gap-2 rounded-xl border border-orange-300/20 bg-orange-300/10 p-3 text-sm font-black text-orange-200"><Sparkles className="h-4 w-4" />{result.score >= 70 ? `記憶共鳴！${combo} COMBO` : '新連結已收錄'}</div><Button onClick={nextEncoding} className="mt-5 h-12 rounded-xl bg-white font-black text-slate-950 hover:bg-slate-100">{roundIndex === 9 ? <><Brain className="mr-2 h-4 w-4" />進入注意力干擾關</> : <>下一座編碼艙 <span className="ml-2">→</span></>}</Button>
          </>}
        </div>
      </div>

      <details className="relative border-t border-white/10 bg-black/15 px-5 py-4 md:px-7"><summary className="cursor-pointer list-none text-xs font-bold text-slate-300"><Rotate3D className="mr-2 inline h-4 w-4 text-cyan-300" />10 組專屬 3D 模型 <span className="ml-2 text-slate-600">展開圖鑑</span></summary><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[860px] text-left text-xs"><thead className="text-slate-500"><tr><th className="pb-3">數字造型</th><th className="pb-3">聯想</th><th className="pb-3">模型類型</th><th className="pb-3">Morph Target</th><th className="pb-3">動畫效果名稱</th></tr></thead><tbody>{SPATIAL_NUMBER_ROUNDS.map((item) => <tr key={item.code} className="border-t border-white/5"><td className="py-3 font-mono font-black" style={{ color: item.palette }}>{item.code} · {item.material}</td><td className="py-3">{item.icon} {item.word}</td><td className="py-3"><span className="rounded-full bg-emerald-300/10 px-2 py-1 text-[10px] font-black text-emerald-200">GLB MORPH</span></td><td className="py-3 text-slate-400">{item.transformation}</td><td className="py-3 text-slate-400">{item.animation}</td></tr>)}</tbody></table></div></details>
    </section>
  );
}

function RecallPanel({ round, value, setValue, feedback, onSubmit, onNext, index, isLast = index === 9 }: { round: SpatialRound; value: string; setValue: (value: string) => void; feedback: RecallResult | null; onSubmit: (event: FormEvent) => void; onNext: () => void; index: number; isLast?: boolean }) {
  return <><div className="flex items-center justify-between"><div className="text-xs font-black tracking-[.2em] text-amber-300">ACTIVE RECALL</div><Timer className="h-4 w-4 text-slate-500" /></div><h2 className="mt-4 text-2xl font-black">這個 3D 物件原本是哪兩位數？</h2><p className="mt-2 text-sm leading-6 text-slate-400">文字、諧音與數字都已隱藏。請只靠你建立的空間影像提取。</p><form onSubmit={onSubmit} className="mt-7 flex flex-1 flex-col"><label htmlFor="recall-code" className="text-xs font-bold text-slate-300">輸入兩位數</label><input id="recall-code" inputMode="numeric" pattern="[0-9]{2}" maxLength={2} disabled={Boolean(feedback)} value={value} onChange={(event) => setValue(event.target.value.replace(/\D/g, '').slice(0, 2))} placeholder="__" className="mt-2 h-20 rounded-2xl border border-white/10 bg-white/5 text-center font-mono text-4xl font-black tracking-[.3em] text-white outline-none focus:border-amber-300/60" />{!feedback ? <Button disabled={!/^\d{2}$/.test(value)} className="mt-auto h-12 rounded-xl bg-amber-300 font-black text-slate-950 hover:bg-amber-200">確認回想</Button> : <div className="mt-auto"><div className={`rounded-xl border p-4 ${feedback.correct ? 'border-emerald-300/25 bg-emerald-300/10 text-emerald-200' : 'border-rose-300/25 bg-rose-300/10 text-rose-200'}`}>{feedback.correct ? <CheckCircle2 className="mr-2 inline h-5 w-5" /> : <XCircle className="mr-2 inline h-5 w-5" />}<b>{feedback.correct ? '提取成功' : `正確答案是 ${round.code}`}</b><div className="mt-1 text-xs opacity-75">反應時間 {(feedback.responseMs / 1000).toFixed(1)} 秒</div>{feedback.retryAfterSeconds && <div className="mt-2 rounded-lg bg-rose-300/10 px-2 py-1.5 text-xs font-bold">再次答錯，已縮短為 {feedback.retryAfterSeconds} 秒後優先重試</div>}</div><Button type="button" onClick={onNext} className="mt-3 h-12 w-full rounded-xl bg-white font-black text-slate-950 hover:bg-slate-100">{isLast ? '完成本輪回想' : '下一個物件'}</Button></div>}</form></>;
}

function RecallSchedulePanel({ schedule, now, onStart, currentWrongCount }: { schedule: ScheduledRecall[]; now: number; onStart: () => void; currentWrongCount: number }) {
  const pending = schedule.filter((item) => !item.completedAt);
  const due = getDueRecalls(schedule, now);
  const nextDue = pending.reduce<ScheduledRecall | null>((next, item) => !next || item.dueAt < next.dueAt ? item : next, null);
  const highRisk = pending.filter((item) => (item.failureCount || 0) > 0).length;
  const seconds = nextDue ? Math.max(0, Math.ceil((nextDue.dueAt - now) / 1000)) : 0;
  return <div className="mt-7 rounded-2xl border border-cyan-300/20 bg-cyan-300/5 p-5 text-left"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2 text-sm font-black text-cyan-200"><CalendarClock className="h-5 w-5" />錯題間隔回想</div><span className="rounded-full bg-cyan-300/10 px-3 py-1 text-[10px] font-bold text-cyan-100">本次新增 {currentWrongCount} 組 × 3 輪</span></div><div className="mt-2 flex flex-wrap justify-between gap-2 text-[10px] text-slate-500"><span>以下為所有訓練累計、尚未完成的待辦</span>{highRisk > 0 && <span className="font-bold text-rose-300">高風險重試 {highRisk} 題</span>}</div><div className="mt-4 grid grid-cols-3 gap-2">{(['30s', '3m', '1d'] as const).map((delay) => { const items = pending.filter((item) => item.delay === delay); return <div key={delay} className="rounded-xl border border-white/10 bg-black/20 p-3 text-center"><div className="text-[10px] font-bold text-slate-500">{formatRecallDelay(delay)}</div><div className="mt-1 font-mono text-xl font-black">{items.length}</div><div className="text-[10px] text-slate-500">累計待回想</div></div>; })}</div><div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400"><span>{due.length ? `已有 ${due.length} 題到期` : nextDue ? `下一輪 ${seconds} 秒後解鎖` : '目前沒有待回想項目'}</span><Button disabled={!due.length} onClick={onStart} className="rounded-full bg-cyan-300 px-5 font-black text-slate-950 hover:bg-cyan-200">開始到期錯題</Button></div></div>;
}

function Info({ label, text }: { label: string; text: string }) { return <div className="rounded-xl bg-white/5 p-3"><span className="text-[10px] font-black tracking-widest text-cyan-300">{label}</span><p className="mt-1 text-slate-200">{text}</p></div>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="text-xs text-slate-500">{label}</div><div className="mt-1 text-2xl font-black">{value}</div></div>; }
