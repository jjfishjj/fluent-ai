import { Component, FormEvent, lazy, Suspense, useEffect, useMemo, useRef, useState, type ComponentType, type ErrorInfo, type ReactNode } from 'react';
import { Brain, CheckCircle2, Crosshair, Expand, Gauge, Lightbulb, MousePointer2, Rotate3D, Sparkles, Timer, Trophy, XCircle, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
}>;

type Props = { onComplete: (evidence: string) => void; scene?: NumberSceneComponent };
type Phase = 'encode' | 'interference' | 'recall' | 'result';
type Quality = 'auto' | 'low' | 'high';
type RecallResult = { code: string; answer: string; correct: boolean; responseMs: number };

const RECALL_ORDER = [3, 0, 7, 4, 1, 9, 5, 2, 8, 6];

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

export function SpatialNumberGame({ onComplete, scene }: Props) {
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
  const [quality, setQuality] = useState<Quality>('auto');
  const [lowPower] = useState(detectLowPowerDevice);
  const [webglAvailable] = useState(detectWebGLSupport);
  const recallStartedAt = useRef(Date.now());
  const completionSent = useRef(false);
  const effectiveQuality = quality === 'auto' ? (lowPower ? 'low' : 'high') : quality;
  const round = phase === 'recall' ? SPATIAL_NUMBER_ROUNDS[RECALL_ORDER[recallIndex]] : SPATIAL_NUMBER_ROUNDS[roundIndex];
  const result = useMemo(() => scoreAssociation(answer, round), [answer, round]);
  const correctCount = recallResults.filter((item) => item.correct).length;
  const averageSeconds = recallResults.length ? recallResults.reduce((sum, item) => sum + item.responseMs, 0) / recallResults.length / 1000 : 0;

  useEffect(() => { if (phase === 'recall') recallStartedAt.current = Date.now(); }, [phase, recallIndex]);

  const submitEncoding = (event: FormEvent) => {
    event.preventDefault();
    if (!answer.trim()) return;
    setSubmitted(true);
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
    const item = { code: round.code, answer: recallAnswer, correct: recallAnswer === round.code, responseMs: Date.now() - recallStartedAt.current };
    setRecallFeedback(item);
    setRecallResults((items) => [...items, item]);
  };

  const nextRecall = () => {
    if (recallIndex === SPATIAL_NUMBER_ROUNDS.length - 1) {
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

  const restart = () => {
    setPhase('encode'); setRoundIndex(0); setAnswer(''); setSubmitted(false); setCombo(0); setBestCombo(0); setShowGuide(false);
    setInterferenceSolved(false); setRecallIndex(0); setRecallAnswer(''); setRecallFeedback(null); setRecallResults([]); completionSent.current = false;
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
        <p className="mt-6 text-sm text-slate-400">答錯的項目不是失敗，而是下一輪應優先強化的記憶鉤子。</p>
        <Button onClick={restart} className="mt-7 rounded-full bg-cyan-300 px-8 font-black text-slate-950 hover:bg-cyan-200">重練錯題與十組模型</Button>
      </div>
    </section>
  );

  const isRecall = phase === 'recall';
  return (
    <section className={`spatial-shell relative overflow-hidden rounded-[28px] text-white ${submitted && !isRecall ? 'spatial-impact' : ''}`} style={{ '--round-color': round.palette } as React.CSSProperties}>
      <style>{`.spatial-shell{background:radial-gradient(circle at 50% 38%,color-mix(in srgb,var(--round-color,#67e8f9) 18%,transparent),transparent 32%),linear-gradient(155deg,#081226,#101229 55%,#071b23);box-shadow:inset 0 0 80px #020617,0 24px 70px -30px #020617}.spatial-impact{animation:camera-shake .42s linear}@keyframes camera-shake{0%,100%{transform:translate(0)}25%{transform:translate(-5px,3px)}50%{transform:translate(6px,-2px)}75%{transform:translate(-3px,-3px)}}`}</style>
      <div className="relative flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4 md:px-7">
        <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl border border-cyan-300/30 bg-cyan-300/10"><Expand className="h-4 w-4 text-cyan-200" /></div><div><div className="text-xs font-black tracking-[.22em] text-cyan-300">MNEMO・VERSE</div><div className="text-[11px] text-slate-400">{isRecall ? '延遲回想艙 · 隱藏提示' : '十組超現實編碼艙'}</div></div></div>
        <div className="flex items-center gap-2 text-xs font-bold"><span className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5">{isRecall ? 'RECALL' : 'ENCODE'} {(isRecall ? recallIndex : roundIndex) + 1}/10</span><span className="rounded-full border border-orange-300/20 bg-orange-300/10 px-3 py-1.5 text-orange-200"><Zap className="mr-1 inline h-3 w-3" />{combo} COMBO</span></div>
      </div>

      <div className="relative grid min-h-[620px] lg:grid-cols-[1fr_360px]">
        <div className="relative min-h-[420px] overflow-hidden border-b border-white/10 lg:border-b-0 lg:border-r">
          <div className="absolute left-5 top-5 z-10 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-[11px] text-slate-300 backdrop-blur"><MousePointer2 className="mr-1.5 inline h-3.5 w-3.5" />{isRecall ? '只看物件，反推原始兩位數' : '拖曳旋轉數字，建立空間線索'}</div>
          <div className="absolute right-5 top-5 z-10 flex items-center gap-2">
            <Gauge className="h-3.5 w-3.5 text-slate-500" /><select aria-label="3D 效能模式" value={quality} onChange={(event) => setQuality(event.target.value as Quality)} className="rounded-lg border border-white/10 bg-slate-950/70 px-2 py-1.5 text-[10px] font-bold text-slate-300"><option value="auto">AUTO · {effectiveQuality === 'low' ? '30' : '60'} FPS</option><option value="low">省電 · 30 FPS</option><option value="high">高畫質 · 60 FPS</option></select>
          </div>
          <div className="absolute inset-0 touch-none select-none">
            {webglAvailable ? <Suspense fallback={<div className="flex h-full items-center justify-center bg-[#050a18] text-xs font-black tracking-[.2em] text-cyan-300"><span className="animate-pulse">LOADING WEBGL MODULE…</span></div>}>
                <WebGLBoundary fallback={<SpatialFallback round={round} revealObject={isRecall || submitted} />}>
                  <SceneComponent round={round} submitted={isRecall || submitted} combo={combo} quality={effectiveQuality} recallMode={isRecall} />
                </WebGLBoundary>
              </Suspense> : <SpatialFallback round={round} revealObject={isRecall || submitted} />}
          </div>
          <Crosshair className="pointer-events-none absolute left-1/2 top-1/2 h-10 w-10 -translate-x-1/2 -translate-y-1/2 text-white/40" strokeWidth={1} />
          <div className="pointer-events-none absolute inset-x-5 bottom-5 flex items-center justify-between text-[10px] tracking-widest text-slate-500"><span>WEBGL · MORPH TARGETS</span><span>{effectiveQuality === 'low' ? 'ECO 30 FPS' : 'ULTRA 60 FPS'}</span></div>
        </div>

        <div className="relative flex flex-col bg-slate-950/45 p-5 backdrop-blur-sm md:p-7">
          {isRecall ? <RecallPanel round={round} value={recallAnswer} setValue={setRecallAnswer} feedback={recallFeedback} onSubmit={submitRecall} onNext={nextRecall} index={recallIndex} /> : !submitted ? <>
            <div className="text-xs font-black tracking-[.2em] text-violet-300">ENCODE SIGNAL</div><h2 className="mt-3 text-2xl font-black">你看見了什麼？</h2><p className="mt-2 text-sm leading-6 text-slate-400">把數字轉成具體、荒謬而且會動的畫面。</p>
            <button type="button" onClick={() => setShowGuide(!showGuide)} className="mt-5 flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 text-left text-xs text-slate-300"><span><Lightbulb className="mr-2 inline h-4 w-4 text-amber-300" />提示遞減 Lv.{showGuide ? '1' : '0'}</span><span>{showGuide ? '−' : '+'}</span></button>
            {showGuide && <div className="mt-2 rounded-xl border border-cyan-300/15 bg-cyan-300/5 p-3 text-xs leading-5 text-cyan-100">提示：念「{round.code}」的聲音，再觀察形狀。下一階段所有提示都會消失。</div>}
            <form onSubmit={submitEncoding} className="mt-6 flex flex-1 flex-col"><label htmlFor="spatial-answer" className="text-xs font-bold text-slate-300">創意轉碼文字</label><input id="spatial-answer" value={answer} onChange={(event) => setAnswer(event.target.value)} placeholder="例如：水母在星空中游動…" className="mt-2 h-14 rounded-xl border border-white/10 bg-white/5 px-4 text-base font-semibold text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/50" autoComplete="off" /><div className="mt-3 flex items-center justify-between text-[11px]"><span className="text-slate-500">越具體、動態、誇張越好</span><span style={{ color: answer ? round.palette : undefined }}>{result.label}</span></div><Button disabled={!answer.trim()} className="mt-auto h-12 rounded-xl bg-cyan-300 font-black text-slate-950 hover:bg-cyan-200"><Crosshair className="mr-2 h-4 w-4" />鎖定並啟動 Morph</Button></form>
          </> : <>
            <div className="flex items-center justify-between"><div className="text-xs font-black tracking-[.2em] text-emerald-300">MORPH TARGET COMPLETE</div><div className="font-mono text-2xl font-black" style={{ color: round.palette }}>{result.score}%</div></div><h2 className="mt-4 text-3xl font-black">{round.code} → {round.word}</h2><p className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm leading-6 text-slate-300">你的畫面：「{answer}」</p><div className="mt-5 space-y-3 text-sm"><Info label="GPU 網格形變" text={round.transformation} /><Info label="空間動畫" text={round.animation} /></div><div className="mt-4 flex items-center gap-2 rounded-xl border border-orange-300/20 bg-orange-300/10 p-3 text-sm font-black text-orange-200"><Sparkles className="h-4 w-4" />{result.score >= 70 ? `記憶共鳴！${combo} COMBO` : '新連結已收錄'}</div><Button onClick={nextEncoding} className="mt-auto h-12 rounded-xl bg-white font-black text-slate-950 hover:bg-slate-100">{roundIndex === 9 ? <><Brain className="mr-2 h-4 w-4" />進入注意力干擾關</> : <>下一座編碼艙 <span className="ml-2">→</span></>}</Button>
          </>}
        </div>
      </div>

      <details className="relative border-t border-white/10 bg-black/15 px-5 py-4 md:px-7"><summary className="cursor-pointer list-none text-xs font-bold text-slate-300"><Rotate3D className="mr-2 inline h-4 w-4 text-cyan-300" />10 組專屬程序 3D 模型 <span className="ml-2 text-slate-600">展開圖鑑</span></summary><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead className="text-slate-500"><tr><th className="pb-3">數字造型</th><th className="pb-3">聯想</th><th className="pb-3">Morph Target</th><th className="pb-3">空間動畫</th></tr></thead><tbody>{SPATIAL_NUMBER_ROUNDS.map((item) => <tr key={item.code} className="border-t border-white/5"><td className="py-3 font-mono font-black" style={{ color: item.palette }}>{item.code} · {item.material}</td><td className="py-3">{item.icon} {item.word}</td><td className="py-3 text-slate-400">{item.transformation}</td><td className="py-3 text-slate-400">{item.animation}</td></tr>)}</tbody></table></div></details>
    </section>
  );
}

function RecallPanel({ round, value, setValue, feedback, onSubmit, onNext, index }: { round: SpatialRound; value: string; setValue: (value: string) => void; feedback: RecallResult | null; onSubmit: (event: FormEvent) => void; onNext: () => void; index: number }) {
  return <><div className="flex items-center justify-between"><div className="text-xs font-black tracking-[.2em] text-amber-300">ACTIVE RECALL</div><Timer className="h-4 w-4 text-slate-500" /></div><h2 className="mt-4 text-2xl font-black">這個 3D 物件原本是哪兩位數？</h2><p className="mt-2 text-sm leading-6 text-slate-400">文字、諧音與數字都已隱藏。請只靠你建立的空間影像提取。</p><form onSubmit={onSubmit} className="mt-7 flex flex-1 flex-col"><label htmlFor="recall-code" className="text-xs font-bold text-slate-300">輸入兩位數</label><input id="recall-code" inputMode="numeric" pattern="[0-9]{2}" maxLength={2} disabled={Boolean(feedback)} value={value} onChange={(event) => setValue(event.target.value.replace(/\D/g, '').slice(0, 2))} placeholder="__" className="mt-2 h-20 rounded-2xl border border-white/10 bg-white/5 text-center font-mono text-4xl font-black tracking-[.3em] text-white outline-none focus:border-amber-300/60" />{!feedback ? <Button disabled={!/^\d{2}$/.test(value)} className="mt-auto h-12 rounded-xl bg-amber-300 font-black text-slate-950 hover:bg-amber-200">確認回想</Button> : <div className="mt-auto"><div className={`rounded-xl border p-4 ${feedback.correct ? 'border-emerald-300/25 bg-emerald-300/10 text-emerald-200' : 'border-rose-300/25 bg-rose-300/10 text-rose-200'}`}>{feedback.correct ? <CheckCircle2 className="mr-2 inline h-5 w-5" /> : <XCircle className="mr-2 inline h-5 w-5" />}<b>{feedback.correct ? '提取成功' : `正確答案是 ${round.code}`}</b><div className="mt-1 text-xs opacity-75">反應時間 {(feedback.responseMs / 1000).toFixed(1)} 秒</div></div><Button type="button" onClick={onNext} className="mt-3 h-12 w-full rounded-xl bg-white font-black text-slate-950 hover:bg-slate-100">{index === 9 ? '查看記憶分析' : '下一個物件'}</Button></div>}</form></>;
}

function Info({ label, text }: { label: string; text: string }) { return <div className="rounded-xl bg-white/5 p-3"><span className="text-[10px] font-black tracking-widest text-cyan-300">{label}</span><p className="mt-1 text-slate-200">{text}</p></div>; }
function Metric({ label, value }: { label: string; value: string }) { return <div className="rounded-2xl border border-white/10 bg-white/5 p-4"><div className="text-xs text-slate-500">{label}</div><div className="mt-1 text-2xl font-black">{value}</div></div>; }
