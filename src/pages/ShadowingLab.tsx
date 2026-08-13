import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Brain, Check, ChevronRight, Ear, Eye, Gauge, Mic, Pause,
  Play, RotateCcw, Sparkles, Square, Volume2, Waves, X, Library,
  Flame, Cloud, CloudOff, ScanText, AudioLines, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { GENIUS_INFO, loadGeniusType, type GeniusType } from '@/lib/genius-type';
import { useAuth } from '@/contexts/AuthContext';
import {
  SHADOWING_MATERIALS, addPracticeDay, calculateStreak, compareTranscript,
  loadCloudProgress, syncCloudProgress, todayKey,
  type DailyProgress, type ShadowingLevel,
} from '@/lib/shadowing-lab';
import { analyzeAudioBlob, buildReferenceContours, type PronunciationScores } from '@/lib/pronunciation-analysis';
import { diagnoseWordPhonemes } from '@/lib/ipa-alignment';

type Stage = 'understand' | 'listen' | 'slow' | 'shadow' | 'recall';

type NextPlan = {
  prediction: string;
  why: string;
  options: { title: string; detail: string; value: string }[];
};

const TYPES = Object.keys(GENIUS_INFO) as GeniusType[];
const STAGES: { id: Stage; label: string; short: string }[] = [
  { id: 'understand', label: '熟悉文本', short: '看懂' },
  { id: 'listen', label: '主動聆聽', short: '聽音' },
  { id: 'slow', label: '慢速跟讀', short: '跟準' },
  { id: 'shadow', label: '影子同步', short: '跟上' },
  { id: 'recall', label: '遮稿提取', short: '記住' },
];

const NEXT_PLANS: Record<Exclude<Stage, 'recall'>, NextPlan> = {
  understand: {
    prediction: '下一階段，你會先建立完整的「聲音藍圖」。',
    why: '你已經理解句意，接著需要暫停閱讀，讓耳朵辨認語速、重音與語調。',
    options: [
      { title: '節奏優先', detail: '第一遍只感受快慢與停頓，不強求每個字。', value: 'rhythm' },
      { title: '重音獵人', detail: '專注找出句中最凸顯的 3–5 個內容詞。', value: 'stress' },
      { title: '情緒雷達', detail: '判斷說話者的情緒，追蹤句尾升降調。', value: 'emotion' },
    ],
  },
  listen: {
    prediction: '下一階段，你會用 0.75× 慢速把聲音轉成口腔動作。',
    why: '聲音輪廓已進入工作記憶，現在最適合校準發音、連音與嘴型。',
    options: [
      { title: '發音精準', detail: '每次只修一個最容易卡住的音。', value: 'pronunciation' },
      { title: '連音拆解', detail: '把相連的字視為一個聲音區塊來模仿。', value: 'linking' },
      { title: '短句循環', detail: '切成 5–10 秒片段，各跟讀三次。', value: 'loop' },
    ],
  },
  slow: {
    prediction: '下一階段，你會回到 1.00×，落後原音約 0.5–1 秒同步輸出。',
    why: '發音已經校準，接下來要把精準度轉成不中斷的真實語流。',
    options: [
      { title: '流暢優先', detail: '跟丟時直接接回來，不因一個錯音停下。', value: 'fluency' },
      { title: '語調模仿', detail: '誇張複製強弱、停頓和句尾走向。', value: 'intonation' },
      { title: '動作帶讀', detail: '站起來或加入手勢，讓身體帶動節奏。', value: 'movement' },
    ],
  },
  shadow: {
    prediction: '下一階段，逐字稿會消失，你將只靠聲音與記憶完成提取。',
    why: '同步跟讀建立了聲音迴路；遮稿能找出真正內化與仍會停頓的片段。',
    options: [
      { title: '完整盲跟', detail: '不看文字完成整句，先確認能否持續跟上。', value: 'blind' },
      { title: '關鍵詞提取', detail: '先回想重音詞，再用它們重建完整句子。', value: 'keywords' },
      { title: '錄音診斷', detail: '錄下盲跟版本，回聽比較節奏與遺漏處。', value: 'diagnose' },
    ],
  },
};

const TYPE_GUIDES: Record<GeniusType, { cue: string; action: string; color: string; schedule: string }> = {
  explorer: { cue: '把句子放進真實情境，站起來邊走邊說。', action: '想像你正在和新同事分享一個好消息。', color: '#1f8fff', schedule: '1・3・8・20 天' },
  melodist: { cue: '先抓重音與旋律，再讓嘴巴成為聲音的影子。', action: '用手指打拍，模仿句尾的降調。', color: '#f28b30', schedule: '1・4・10・28 天' },
  architect: { cue: '先看句子結構，再逐層拿掉文字鷹架。', action: '辨認主詞、動作與結果三個句塊。', color: '#7357d9', schedule: '1・7・21・60 天' },
  narrator: { cue: '替這句話加上人物、情緒和故事轉折。', action: '帶著「終於完成」的開心情緒說。', color: '#d4a311', schedule: '1・5・14・35 天' },
  connector: { cue: '把新聲音連到你已經會說的相似句型。', action: '想一個你也投入三年的計畫。', color: '#2ea86b', schedule: '1・5・15・40 天' },
  analyst: { cue: '注意完成式為何在這裡表達延續到現在。', action: '跟讀後，用自己的話解釋句型邏輯。', color: '#e24a4a', schedule: '1・7・21・60 天' },
  performer: { cue: '少想一點，立刻開口；用表情與手勢帶動節奏。', action: '像在台上宣布成果，連續說三遍。', color: '#e35f9b', schedule: '1・3・9・25 天' },
  visionary: { cue: '把重音詞變成畫面，用位置記住聲音順序。', action: '看見 project → 3 years → finally ready 三格畫面。', color: '#ec7b27', schedule: '1・6・18・45 天' },
};

const DEFAULT_TEXT = "I've been working on this project for three years, and it's finally ready.";
const STORAGE_KEY = 'memo_shadowing_progress';
const DAILY_KEY = 'memo_shadowing_daily';
const EMPTY_DAILY: DailyProgress = { practicedDates: [], totalSessions: 0 };

function markTranscript(text: string) {
  const stress = new Set(['working', 'project', 'three', 'years', 'finally', 'ready.']);
  return text.split(' ').map((word, i) => (
    <span key={`${word}-${i}`} className={stress.has(word.toLowerCase()) ? 'font-extrabold text-foreground' : 'text-muted-foreground'}>
      {word}{i < text.split(' ').length - 1 ? ' ' : ''}
    </span>
  ));
}

function ContourOverlay({ values, reference, label }: { values: number[]; reference: number[]; label: string }) {
  const width = 640; const height = 112;
  const path = (series: number[]) => series.map((value, index) => `${index ? 'L' : 'M'} ${(index / Math.max(series.length - 1, 1) * width).toFixed(1)} ${(height - 10 - value * (height - 20)).toFixed(1)}`).join(' ');
  return <div>
    <div className="text-[11px] font-black text-black/55 mb-1.5">{label}</div>
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24 rounded-xl bg-white/70" role="img" aria-label={`${label}：你的錄音與原音參考疊圖`}>
      <path d={`M 0 ${height / 2} L ${width} ${height / 2}`} stroke="#17201d" strokeOpacity=".08" />
      <path d={path(reference)} fill="none" stroke="#7357d9" strokeWidth="4" strokeDasharray="9 7" />
      <path d={path(values)} fill="none" stroke="#d55b38" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>;
}

function ProsodyOverlay({ pronunciation, text }: { pronunciation: PronunciationScores; text: string }) {
  const reference = buildReferenceContours(text, pronunciation.features.energyContour.length);
  return <div className="mt-4 rounded-2xl bg-white/75 p-4">
    <div className="flex flex-wrap items-center justify-between gap-2"><div className="text-xs font-black text-[#5b43bc]">原音目標 × 我的錄音</div><div className="flex gap-3 text-[10px] text-black/45"><span><i className="inline-block w-4 border-t-2 border-dashed border-[#7357d9] mr-1" />原音目標</span><span><i className="inline-block w-4 border-t-2 border-[#d55b38] mr-1" />我的錄音</span></div></div>
    <div className="grid md:grid-cols-2 gap-4 mt-4">
      <ContourOverlay label="重音／能量波形" values={pronunciation.features.energyContour} reference={reference.energy} />
      <ContourOverlay label="音高／語調曲線" values={pronunciation.features.pitchContour} reference={reference.pitch} />
    </div>
    <p className="text-[10px] leading-relaxed text-black/40 mt-3">原音目標依目前逐字稿的內容詞重音與句尾語調建立；橘線為裝置實測錄音。兩線越貼近，節奏與語調越一致。</p>
  </div>;
}

export default function ShadowingLab() {
  const { user } = useAuth();
  const detected = useMemo(() => loadGeniusType(), []);
  const [type, setType] = useState<GeniusType>(detected ?? 'melodist');
  const [stage, setStage] = useState<Stage>('understand');
  const [text, setText] = useState(DEFAULT_TEXT);
  const [speed, setSpeed] = useState(0.85);
  const [showText, setShowText] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState<string | null>(null);
  const [completed, setCompleted] = useState<Stage[]>([]);
  const [showScore, setShowScore] = useState(false);
  const [showNextPlan, setShowNextPlan] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState('');
  const [score, setScore] = useState(3);
  const [level, setLevel] = useState<ShadowingLevel>('intermediate');
  const [materialId, setMaterialId] = useState('project-ready');
  const [spokenText, setSpokenText] = useState('');
  const [recognizing, setRecognizing] = useState(false);
  const [daily, setDaily] = useState<DailyProgress>(EMPTY_DAILY);
  const [syncState, setSyncState] = useState<'local' | 'syncing' | 'synced' | 'error'>('local');
  const [pronunciation, setPronunciation] = useState<PronunciationScores | null>(null);
  const [analysisState, setAnalysisState] = useState<'idle' | 'analyzing' | 'ready' | 'error'>('idle');
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const chunksRef = useRef<Blob[]>([]);
  const info = GENIUS_INFO[type];
  const guide = TYPE_GUIDES[type];
  const stageIndex = STAGES.findIndex(s => s.id === stage);
  const comparison = useMemo(() => spokenText.trim() ? compareTranscript(text, spokenText) : null, [text, spokenText]);
  const phonemeDiagnostics = useMemo(() => comparison ? diagnoseWordPhonemes(comparison.compared) : [], [comparison]);
  const streak = calculateStreak(daily.practicedDates);
  const practicedToday = daily.practicedDates.includes(todayKey());

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (Array.isArray(saved.completed)) setCompleted(saved.completed.filter((x: Stage) => STAGES.some(s => s.id === x)));
    } catch { /* ignore corrupt local data */ }
  }, []);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DAILY_KEY) || 'null');
      if (saved?.practicedDates && Array.isArray(saved.practicedDates)) setDaily(saved);
    } catch { /* ignore corrupt local data */ }
  }, []);

  useEffect(() => {
    if (!user) { setSyncState('local'); return; }
    let active = true;
    setSyncState('syncing');
    loadCloudProgress(user.id).then(cloud => {
      if (!active) return;
      if (cloud) {
        setDaily(current => {
          const merged = {
            practicedDates: Array.from(new Set([...current.practicedDates, ...cloud.practicedDates])).sort(),
            totalSessions: Math.max(current.totalSessions, cloud.totalSessions),
            lastMaterialId: cloud.lastMaterialId ?? current.lastMaterialId,
          };
          localStorage.setItem(DAILY_KEY, JSON.stringify(merged));
          return merged;
        });
      }
      setSyncState('synced');
    }).catch(() => active && setSyncState('error'));
    return () => { active = false; };
  }, [user]);

  useEffect(() => () => {
    speechSynthesis.cancel();
    recognitionRef.current?.abort?.();
    if (recordingUrl) URL.revokeObjectURL(recordingUrl);
  }, [recordingUrl]);

  const chooseMaterial = (id: string) => {
    const material = SHADOWING_MATERIALS.find(item => item.id === id);
    if (!material) return;
    setMaterialId(id);
    setLevel(material.level);
    setText(material.text);
    setSpokenText('');
    setPronunciation(null);
    setAnalysisState('idle');
    setCompleted([]);
    setStage('understand');
    setShowText(true);
  };

  const toggleRecognition = () => {
    if (recognizing) { recognitionRef.current?.stop?.(); return; }
    const Recognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Recognition) {
      window.alert('此瀏覽器未提供即時語音辨識，仍可在下方輸入你說出的內容進行逐字比對。');
      return;
    }
    const recognition = new Recognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onresult = (event: any) => {
      const result = Array.from(event.results as ArrayLike<any>).map((item: any) => item[0]?.transcript ?? '').join(' ');
      setSpokenText(result.trim());
    };
    recognition.onend = () => setRecognizing(false);
    recognition.onerror = () => setRecognizing(false);
    recognitionRef.current = recognition;
    recognition.start();
    setRecognizing(true);
  };

  const saveCompletedSession = async () => {
    const nextDaily = addPracticeDay(daily, materialId);
    setDaily(nextDaily);
    localStorage.setItem(DAILY_KEY, JSON.stringify(nextDaily));
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ completed: STAGES.map(s => s.id), score, transcriptScore: comparison?.score ?? null, pronunciation, lastPractice: new Date().toISOString(), type }));
    setShowScore(false);
    if (user) {
      setSyncState('syncing');
      try { await syncCloudProgress(user.id, nextDaily); setSyncState('synced'); }
      catch { setSyncState('error'); }
    }
  };

  const speak = () => {
    if (!text.trim()) return;
    if (playing) {
      speechSynthesis.cancel();
      setPlaying(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = speed;
    utterance.pitch = 1;
    utterance.onend = () => setPlaying(false);
    utterance.onerror = () => setPlaying(false);
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
    setPlaying(true);
  };

  const toggleRecording = async () => {
    if (recording && recorderRef.current) {
      recorderRef.current.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = e => e.data.size && chunksRef.current.push(e.data);
      recorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        if (recordingUrl) URL.revokeObjectURL(recordingUrl);
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        setRecordingUrl(URL.createObjectURL(blob));
        setAnalysisState('analyzing');
        analyzeAudioBlob(blob, comparison?.score ?? null, text.trim().split(/\s+/).length)
          .then(result => { setPronunciation(result); setAnalysisState('ready'); })
          .catch(() => { setPronunciation(null); setAnalysisState('error'); });
      };
      recorder.start();
      setRecording(true);
    } catch {
      window.alert('需要麥克風權限才能錄下跟讀。請允許存取後再試一次。');
    }
  };

  const finishStage = () => {
    const nextCompleted = completed.includes(stage) ? completed : [...completed, stage];
    setCompleted(nextCompleted);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ completed: nextCompleted, lastPractice: new Date().toISOString(), type }));
    if (stageIndex < STAGES.length - 1) {
      setSelectedStrategy('');
      setShowNextPlan(true);
    } else setShowScore(true);
  };

  const enterNextStage = (strategy: string) => {
    const next = STAGES[stageIndex + 1].id;
    setSelectedStrategy(strategy);
    setStage(next);
    setShowNextPlan(false);
    if (next === 'recall') setShowText(false);
    if (next === 'slow') setSpeed(0.75);
    if (next === 'shadow') setSpeed(1);
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...saved, nextStrategy: strategy, nextStage: next, type }));
    } catch { /* ignore corrupt local data */ }
  };

  return (
    <main className="min-h-screen bg-[#f6f5f0] text-[#17201d] pb-28 md:pb-12">
      <header className="border-b border-black/10 bg-[#f6f5f0]/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto h-16 px-4 md:px-8 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold"><ArrowLeft className="w-4 h-4" /> 回首頁</Link>
          <div className="flex items-center gap-2 font-extrabold tracking-tight"><Waves className="w-5 h-5 text-[#d55b38]" /> MemoLingua Shadow Lab</div>
          <div className="text-xs font-bold tabular-nums">{completed.length}/5 完成</div>
        </div>
      </header>

      <section className="max-w-7xl mx-auto px-4 md:px-8 pt-8 md:pt-12">
        <div className="grid lg:grid-cols-[1fr_310px] gap-6 items-start">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-bold mb-4">
              <Sparkles className="w-3.5 h-3.5 text-[#d55b38]" /> VARK × 八大記憶天賦
            </div>
            <h1 className="text-4xl md:text-6xl font-black tracking-[-0.045em] leading-[0.98] max-w-3xl">讓耳朵、嘴巴與記憶<br /><span className="text-[#d55b38]">跑在同一條聲音軌道。</span></h1>
            <p className="mt-5 text-base md:text-lg text-black/60 max-w-2xl">以 0.5–1 秒時間差追蹤原音；從理解、聆聽到遮稿提取，完成一輪真正能留下來的 Shadowing。</p>
          </div>

          <Card className="p-5 border-0 shadow-none bg-[#17201d] text-white rounded-3xl">
            <div className="text-xs text-white/55 font-bold tracking-widest uppercase">Your memory mode</div>
            <div className="flex items-center gap-3 mt-3">
              <div className="w-12 h-12 rounded-2xl grid place-items-center text-2xl" style={{ backgroundColor: `${guide.color}33` }}>{info.emoji}</div>
              <div><div className="font-extrabold text-lg">{info.nameZh} · {info.nameEn}</div><div className="text-sm text-white/60">VARK {info.vark} · {info.brainwave}</div></div>
            </div>
            <select aria-label="選擇記憶天賦" value={type} onChange={e => setType(e.target.value as GeniusType)} className="mt-4 w-full rounded-xl bg-white/10 border border-white/15 px-3 py-2 text-sm text-white">
              {TYPES.map(t => <option className="text-black" key={t} value={t}>{GENIUS_INFO[t].emoji} {GENIUS_INFO[t].nameZh}</option>)}
            </select>
            <p className="mt-4 text-sm leading-relaxed text-white/80">{guide.cue}</p>
          </Card>
        </div>

        <Card className="mt-8 border border-black/10 shadow-none rounded-[28px] bg-white p-5 md:p-7">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div><div className="flex items-center gap-2 text-sm font-black"><Library className="w-4 h-4 text-[#d55b38]" /> 分級練習素材</div><p className="text-sm text-black/45 mt-1">選一段符合目前負荷的短句，完成五階段循環。</p></div>
            <div className="flex gap-2" role="group" aria-label="素材難度">
              {(['beginner', 'intermediate', 'advanced'] as ShadowingLevel[]).map(item => <button key={item} onClick={() => setLevel(item)} className={`rounded-full px-4 py-2 text-xs font-black border transition ${level === item ? 'bg-[#17201d] text-white border-[#17201d]' : 'bg-white border-black/10'}`}>{item === 'beginner' ? '初階' : item === 'intermediate' ? '中階' : '進階'}</button>)}
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-3 mt-5">
            {SHADOWING_MATERIALS.filter(item => item.level === level).map(material => <button key={material.id} onClick={() => chooseMaterial(material.id)} className={`text-left rounded-2xl border p-4 transition ${materialId === material.id ? 'border-[#d55b38] bg-[#fff8f4] ring-1 ring-[#d55b38]' : 'border-black/10 hover:border-black/30'}`}>
              <div className="flex items-center justify-between gap-3"><span className="font-black">{material.title}</span>{materialId === material.id && <Check className="w-4 h-4 text-[#d55b38]" />}</div>
              <div className="text-xs text-black/40 mt-1">{material.context}</div><p className="text-xs leading-relaxed text-black/60 mt-3 line-clamp-2">{material.text}</p><div className="text-[11px] font-bold text-[#a6482d] mt-3">練習：{material.focus}</div>
            </button>)}
          </div>
        </Card>

        <div className="mt-10 overflow-x-auto pb-2">
          <div className="min-w-[650px] grid grid-cols-5 gap-2">
            {STAGES.map((s, i) => {
              const active = s.id === stage; const done = completed.includes(s.id);
              return <button key={s.id} onClick={() => { setStage(s.id); setShowText(s.id !== 'recall'); }} className={`text-left rounded-2xl px-4 py-3 border transition ${active ? 'bg-[#17201d] text-white border-[#17201d]' : 'bg-white border-black/10 hover:border-black/30'}`}>
                <div className="flex items-center justify-between text-[11px] font-bold opacity-60">0{i + 1}{done && <Check className="w-3.5 h-3.5" />}</div>
                <div className="font-extrabold mt-1">{s.short}</div><div className="text-xs opacity-60">{s.label}</div>
              </button>;
            })}
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_310px] gap-6 mt-4">
          <Card className="border border-black/10 shadow-none rounded-[28px] overflow-hidden bg-white">
            <div className="px-5 md:px-8 py-5 border-b border-black/10 flex flex-wrap gap-4 items-center justify-between">
              <div><div className="text-xs font-bold text-black/40">STEP {stageIndex + 1} OF 5</div><h2 className="text-xl font-black mt-1">{STAGES[stageIndex].label}</h2></div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowText(v => !v)}>{showText ? <Eye className="w-4 h-4 mr-2" /> : <X className="w-4 h-4 mr-2" />}{showText ? '隱藏逐字稿' : '顯示逐字稿'}</Button>
                <Button size="sm" className="bg-[#d55b38] hover:bg-[#bb4829]" onClick={speak}>{playing ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}{playing ? '暫停' : '播放原音'}</Button>
              </div>
            </div>

            <div className="p-5 md:p-8">
              <div className="rounded-3xl bg-[#f1efe8] min-h-[210px] p-6 md:p-9 flex flex-col justify-center relative overflow-hidden">
                <div className="absolute right-5 top-4 text-[80px] leading-none font-black text-black/[0.035]">“</div>
                {showText ? <div className="text-2xl md:text-4xl leading-snug tracking-tight">{markTranscript(text)}</div> : <div className="text-center py-6"><Ear className="w-12 h-12 mx-auto text-[#d55b38]" /><div className="font-black text-2xl mt-4">文字已遮住，跟著聲音走</div><p className="text-black/50 mt-2">只靠耳朵與聲音記憶，落後 0.5–1 秒開口。</p></div>}
                {showText && <div className="mt-6 flex items-center gap-3 text-sm text-black/45"><span className="font-bold text-black">重音</span><span className="w-8 h-px bg-black/30" /> project · three years · finally ready</div>}
              </div>

              {stage === 'understand' && <div className="mt-5"><label className="text-sm font-bold">練習逐字稿</label><Textarea value={text} onChange={e => setText(e.target.value)} className="mt-2 min-h-24" /><p className="text-xs text-black/45 mt-2">先確定理解全文；也可以貼入自己的 30–60 秒短句素材。</p></div>}

              <div className="mt-6 grid md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-black/10 p-4">
                  <div className="flex items-center justify-between"><span className="text-sm font-bold flex items-center gap-2"><Gauge className="w-4 h-4" /> 播放速度</span><span className="font-black tabular-nums">{speed.toFixed(2)}×</span></div>
                  <Slider min={0.6} max={1.15} step={0.05} value={[speed]} onValueChange={v => setSpeed(v[0])} className="mt-5" />
                  <div className="flex justify-between text-[10px] text-black/40 mt-2"><span>精準 0.60×</span><span>原速 1.00×</span></div>
                </div>
                <div className="rounded-2xl border border-black/10 p-4 flex items-center justify-between gap-4">
                  <div><div className="text-sm font-bold flex items-center gap-2"><Mic className="w-4 h-4" /> 錄下我的影子</div><div className="text-xs text-black/45 mt-1">回聽比較節奏與語調</div></div>
                  <Button aria-label={recording ? '停止錄音' : '開始錄音'} variant={recording ? 'destructive' : 'outline'} size="icon" className={recording ? 'animate-pulse' : ''} onClick={toggleRecording}>{recording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}</Button>
                </div>
              </div>
              {recordingUrl && <audio className="w-full mt-4" controls src={recordingUrl} />}
              {(analysisState !== 'idle' || pronunciation) && <div className="mt-4 rounded-3xl border border-black/10 p-5 md:p-6 bg-[#f4f0ff]" aria-live="polite">
                <div className="flex items-start justify-between gap-4">
                  <div><div className="text-sm font-black flex items-center gap-2"><AudioLines className="w-4 h-4 text-[#7357d9]" /> 發音教練評分</div><p className="text-xs text-black/45 mt-1">錄音只在你的裝置內分析；分數是聲學練習指標，不是臨床或母語者認證。</p></div>
                  {pronunciation && <div className="text-right"><div className="text-3xl font-black text-[#5b43bc]">{pronunciation.overall}</div><div className="text-[10px] text-black/40">綜合分數</div></div>}
                </div>
                {analysisState === 'analyzing' && <div className="py-8 flex items-center justify-center gap-2 text-sm font-bold text-black/55"><Loader2 className="w-4 h-4 animate-spin" /> 正在分析音量、節奏與音高…</div>}
                {analysisState === 'error' && <div className="mt-5 rounded-2xl bg-white/75 p-4 text-sm text-[#a83b31]"><div className="font-black">這次無法產生可靠分數</div><p className="text-xs mt-1 leading-relaxed">請靠近麥克風，連續說滿一秒後再停止錄音。過短或太安靜的錄音不會硬給分。</p></div>}
                {pronunciation && <>
                  <div className="grid grid-cols-3 gap-2 md:gap-3 mt-5">
                    {[
                      { key: 'phoneme', label: '音素清晰', value: pronunciation.phoneme },
                      { key: 'stress', label: '重音節奏', value: pronunciation.stress },
                      { key: 'intonation', label: '語調走向', value: pronunciation.intonation },
                    ].map(item => <div key={item.key} className={`rounded-2xl p-3 md:p-4 ${pronunciation.weakest === item.key ? 'bg-[#fff0cf] ring-1 ring-[#e0a938]' : 'bg-white/75'}`}>
                      <div className="text-xl md:text-2xl font-black">{item.value}</div><div className="text-[10px] md:text-xs text-black/50 mt-1">{item.label}</div>{pronunciation.weakest === item.key && <div className="text-[9px] font-black text-[#925f12] mt-2">本輪優先</div>}
                    </div>)}
                  </div>
                  <div className="mt-4 rounded-2xl bg-white/75 p-4"><div className="text-xs font-black text-[#5b43bc]">下一輪預測與建議</div><p className="text-sm leading-relaxed mt-1.5">{pronunciation.advice}</p></div>
                  <ProsodyOverlay pronunciation={pronunciation} text={text} />
                </>}
              </div>}

              <div className="mt-6 rounded-3xl border border-black/10 p-5 md:p-6 bg-[#fbfbf8]">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div><div className="text-sm font-black flex items-center gap-2"><ScanText className="w-4 h-4 text-[#d55b38]" /> 語音辨識與逐字比對</div><p className="text-xs text-black/45 mt-1">說完整句子，系統會找出正確、遺漏與替換的詞。</p></div>
                  <Button onClick={toggleRecognition} variant={recognizing ? 'destructive' : 'outline'} className={recognizing ? 'animate-pulse' : ''}><Mic className="w-4 h-4 mr-2" />{recognizing ? '正在聆聽…' : '開始語音辨識'}</Button>
                </div>
                <Textarea aria-label="語音辨識文字" value={spokenText} onChange={event => setSpokenText(event.target.value)} placeholder="辨識結果會顯示在這裡；若瀏覽器不支援，也可以手動輸入你說出的句子。" className="mt-4 min-h-20 bg-white" />
                {comparison && <div className="mt-4">
                  <div className="flex items-center justify-between"><span className="text-xs font-black text-black/50">逐字相似度</span><span className={`text-2xl font-black ${comparison.score >= 80 ? 'text-[#27845f]' : comparison.score >= 55 ? 'text-[#c47a18]' : 'text-[#c34b3f]'}`}>{comparison.score}%</span></div>
                  <Progress value={comparison.score} className="h-2 mt-2" />
                  <div className="flex flex-wrap gap-2 mt-4">{comparison.compared.map((item, index) => <span key={`${item.word}-${index}`} title={item.status === 'replaced' ? `你說：${item.spoken}` : undefined} className={`rounded-lg px-2 py-1 text-sm font-bold ${item.status === 'correct' ? 'bg-[#dff4eb] text-[#236d52]' : item.status === 'missed' ? 'bg-[#fbe3df] text-[#a83b31] line-through' : 'bg-[#fff0cf] text-[#925f12]'}`}>{item.word}</span>)}</div>
                  <div className="flex flex-wrap gap-4 mt-3 text-[11px] text-black/45"><span>綠色＝正確</span><span>紅色＝遺漏</span><span>黃色＝替換（游標停留可看辨識詞）</span></div>
                  <div className="mt-5 border-t border-black/10 pt-5">
                    <div className="flex flex-wrap items-start justify-between gap-2"><div><div className="text-xs font-black text-[#5b43bc]">逐音素 IPA 定位</div><p className="text-[11px] text-black/45 mt-1">將辨識詞轉為 IPA 後逐音素對齊，紅色是遺漏音、黃色是疑似錯音。</p></div><div className="text-[10px] rounded-full bg-white border border-black/10 px-2.5 py-1">GA 美式 IPA</div></div>
                    <div className="grid sm:grid-cols-2 gap-2 mt-4">
                      {phonemeDiagnostics.map((word, index) => <div key={`${word.word}-${index}`} className={`rounded-xl border p-3 ${word.status === 'correct' ? 'border-black/5 bg-white/60' : word.status === 'unknown' ? 'border-black/10 bg-black/[0.025]' : 'border-[#e0a938]/40 bg-[#fffaf0]'}`}>
                        <div className="flex items-center justify-between gap-2"><span className="text-xs font-black">{word.word}</span><span className="text-[10px] text-black/40">{word.spoken && word.spoken !== word.word ? `辨識：${word.spoken}` : word.status === 'missed' ? '未辨識' : ''}</span></div>
                        <div className="flex flex-wrap gap-1 mt-2" aria-label={`${word.word} ${word.ipa}`}>
                          {word.phonemes.length ? word.phonemes.map((phoneme, phonemeIndex) => <span key={`${phoneme.symbol}-${phonemeIndex}`} title={phoneme.status === 'replaced' ? `預期 ${phoneme.symbol}，辨識接近 ${phoneme.spoken}` : undefined} className={`min-w-7 rounded-md px-1.5 py-1 text-center font-mono text-sm font-black ${phoneme.status === 'correct' ? 'bg-[#dff4eb] text-[#236d52]' : phoneme.status === 'missed' ? 'bg-[#fbe3df] text-[#a83b31] line-through' : 'bg-[#fff0cf] text-[#925f12]'}`}>{phoneme.symbol}</span>) : <span className="text-xs text-black/35">{word.ipa}・自訂詞彙尚無可靠音標</span>}
                        </div>
                      </div>)}
                    </div>
                    <p className="text-[10px] leading-relaxed text-black/40 mt-3">定位依瀏覽器辨識詞推算，可指出具體音素差異；若要量測舌位或聲帶發音，仍需專業聲學模型或教師確認。</p>
                  </div>
                </div>}
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <Button variant="ghost" onClick={() => { setCompleted([]); localStorage.removeItem(STORAGE_KEY); setStage('understand'); setShowText(true); }}><RotateCcw className="w-4 h-4 mr-2" />重新開始</Button>
                <Button size="lg" className="rounded-full bg-[#17201d] hover:bg-black px-7" disabled={!text.trim()} onClick={finishStage}>{stageIndex === 4 ? '完成並自評' : '完成這一步'}<ChevronRight className="w-4 h-4 ml-2" /></Button>
              </div>
            </div>
          </Card>

          <aside className="space-y-4">
            <Card className="p-5 border-0 shadow-none rounded-3xl bg-[#17201d] text-white">
              <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-sm font-black"><Flame className="w-4 h-4 text-[#ff8a58]" /> 每日任務</div><div className="text-xs text-white/55">{practicedToday ? '今日完成' : '待完成'}</div></div>
              <div className="grid grid-cols-2 gap-3 mt-4"><div className="rounded-2xl bg-white/10 p-3"><div className="text-2xl font-black">{streak}</div><div className="text-[11px] text-white/55">連續天數</div></div><div className="rounded-2xl bg-white/10 p-3"><div className="text-2xl font-black">{daily.totalSessions}</div><div className="text-[11px] text-white/55">完成輪數</div></div></div>
              <div className="mt-4 flex items-center gap-2 text-xs text-white/65">{syncState === 'synced' ? <Cloud className="w-4 h-4 text-[#7be0ba]" /> : <CloudOff className="w-4 h-4" />} {syncState === 'syncing' ? '正在同步…' : syncState === 'synced' ? '已跨裝置同步' : syncState === 'error' ? '同步失敗，已保存在本機' : '登入後可跨裝置同步'}</div>
            </Card>
            <Card className="p-5 border border-black/10 shadow-none rounded-3xl bg-[#fff7e8]">
              <div className="flex items-center gap-2 text-sm font-black"><Brain className="w-4 h-4 text-[#d55b38]" /> 你的天賦提示</div>
              <p className="mt-3 text-sm leading-relaxed text-black/70">{guide.action}</p>
              <div className="mt-4 pt-4 border-t border-black/10 text-xs text-black/50">建議複習節奏</div><div className="font-black mt-1">{guide.schedule}</div>
            </Card>
            <Card className="p-5 border border-black/10 shadow-none rounded-3xl">
              <div className="flex items-center justify-between text-sm font-black"><span>本輪進度</span><span>{completed.length * 20}%</span></div>
              <Progress value={completed.length * 20} className="mt-3 h-2" />
              <div className="mt-5 space-y-3">
                {STAGES.map((s, i) => <div key={s.id} className="flex items-center gap-3 text-sm"><div className={`w-6 h-6 rounded-full grid place-items-center text-[10px] font-black ${completed.includes(s.id) ? 'bg-[#2e8b65] text-white' : s.id === stage ? 'bg-[#d55b38] text-white' : 'bg-black/5 text-black/40'}`}>{completed.includes(s.id) ? <Check className="w-3.5 h-3.5" /> : i + 1}</div><span className={s.id === stage ? 'font-bold' : 'text-black/50'}>{s.label}</span></div>)}
              </div>
            </Card>
            <div className="px-2 text-xs leading-relaxed text-black/45"><Volume2 className="inline w-3.5 h-3.5 mr-1" /> 建議選擇音質清晰、有逐字稿且可重複的 30–60 秒素材。</div>
            {selectedStrategy && <Card className="p-5 border-0 shadow-none rounded-3xl bg-[#dff4eb]">
              <div className="text-xs font-black text-[#236d52] tracking-wider">本階段採用策略</div>
              <div className="font-black mt-2">{Object.values(NEXT_PLANS).flatMap(plan => plan.options).find(option => option.value === selectedStrategy)?.title}</div>
            </Card>}
          </aside>
        </div>
      </section>

      {showNextPlan && stage !== 'recall' && (() => {
        const plan = NEXT_PLANS[stage];
        const nextStage = STAGES[stageIndex + 1];
        return <div className="fixed inset-0 z-50 bg-[#17201d]/65 backdrop-blur-sm grid place-items-center p-4" role="dialog" aria-modal="true" aria-labelledby="next-plan-title">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-[30px] p-6 md:p-8 border-0 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#fff0e9] grid place-items-center"><Sparkles className="w-6 h-6 text-[#d55b38]" /></div>
              <div className="text-xs font-black rounded-full bg-[#17201d] text-white px-3 py-1.5">下一步 · {nextStage.label}</div>
            </div>
            <div className="mt-5 text-xs font-black text-[#d55b38] tracking-widest">NEXT STAGE PREDICTION</div>
            <h2 id="next-plan-title" className="text-2xl md:text-3xl font-black mt-2 leading-tight">{plan.prediction}</h2>
            <p className="mt-3 text-sm md:text-base text-black/55 leading-relaxed">{plan.why}</p>
            <div className="mt-6 text-sm font-black">選一個這次要採用的策略</div>
            <div className="grid md:grid-cols-3 gap-3 mt-3">
              {plan.options.map((option, index) => <button key={option.value} onClick={() => enterNextStage(option.value)} className="text-left rounded-2xl border border-black/10 p-4 hover:border-[#d55b38] hover:bg-[#fff8f4] focus:outline-none focus:ring-2 focus:ring-[#d55b38] transition group">
                <div className="flex items-center justify-between"><span className="text-[11px] font-black text-black/35">0{index + 1}</span><ChevronRight className="w-4 h-4 text-black/25 group-hover:text-[#d55b38]" /></div>
                <div className="font-black mt-3">{option.title}</div>
                <p className="text-xs text-black/50 leading-relaxed mt-1.5">{option.detail}</p>
              </button>)}
            </div>
            <div className="mt-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-black/10 pt-5">
              <p className="text-xs text-black/45">依 {info.nameZh} · VARK {info.vark} 預測，你也可以直接採用推薦選項。</p>
              <Button variant="ghost" onClick={() => enterNextStage(plan.options[0].value)}>採用推薦：{plan.options[0].title}<ChevronRight className="w-4 h-4 ml-2" /></Button>
            </div>
          </Card>
        </div>;
      })()}

      {showScore && <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4" role="dialog" aria-modal="true">
        <Card className="max-w-md w-full rounded-[30px] p-7 border-0 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-[#fff0e9] grid place-items-center"><Sparkles className="w-7 h-7 text-[#d55b38]" /></div>
          <h2 className="text-2xl font-black mt-5">一輪完成，聲音軌道已建立。</h2>
          <p className="text-sm text-black/55 mt-2">你覺得這次能跟上多少？結果會用來安排下一次提取。</p>
          <div className="grid grid-cols-4 gap-2 mt-6">{[1,2,3,4].map(n => <button key={n} onClick={() => setScore(n)} className={`rounded-xl py-3 border font-black ${score === n ? 'bg-[#17201d] text-white border-[#17201d]' : 'border-black/10'}`}>{n}</button>)}</div>
          {comparison && <div className="mt-4 rounded-2xl bg-[#f1efe8] p-4 flex items-center justify-between"><span className="text-sm font-bold">本次逐字相似度</span><span className="text-xl font-black">{comparison.score}%</span></div>}
          {pronunciation && <div className="mt-3 grid grid-cols-4 gap-2 rounded-2xl bg-[#f4f0ff] p-3 text-center"><div><div className="font-black">{pronunciation.overall}</div><div className="text-[9px] text-black/45">綜合</div></div><div><div className="font-black">{pronunciation.phoneme}</div><div className="text-[9px] text-black/45">音素</div></div><div><div className="font-black">{pronunciation.stress}</div><div className="text-[9px] text-black/45">重音</div></div><div><div className="font-black">{pronunciation.intonation}</div><div className="text-[9px] text-black/45">語調</div></div></div>}
          <div className="flex gap-3 mt-6"><Button variant="outline" className="flex-1" onClick={() => setShowScore(false)}>再練一次</Button><Button className="flex-1 bg-[#d55b38] hover:bg-[#bb4829]" onClick={saveCompletedSession}>儲存結果</Button></div>
        </Card>
      </div>}
    </main>
  );
}
