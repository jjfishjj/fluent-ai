import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Brain, Check, ChevronRight, Ear, Eye, Gauge, Mic, Pause,
  Play, RotateCcw, Sparkles, Square, Volume2, Waves, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { GENIUS_INFO, loadGeniusType, type GeniusType } from '@/lib/genius-type';

type Stage = 'understand' | 'listen' | 'slow' | 'shadow' | 'recall';

const TYPES = Object.keys(GENIUS_INFO) as GeniusType[];
const STAGES: { id: Stage; label: string; short: string }[] = [
  { id: 'understand', label: '熟悉文本', short: '看懂' },
  { id: 'listen', label: '主動聆聽', short: '聽音' },
  { id: 'slow', label: '慢速跟讀', short: '跟準' },
  { id: 'shadow', label: '影子同步', short: '跟上' },
  { id: 'recall', label: '遮稿提取', short: '記住' },
];

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

function markTranscript(text: string) {
  const stress = new Set(['working', 'project', 'three', 'years', 'finally', 'ready.']);
  return text.split(' ').map((word, i) => (
    <span key={`${word}-${i}`} className={stress.has(word.toLowerCase()) ? 'font-extrabold text-foreground' : 'text-muted-foreground'}>
      {word}{i < text.split(' ').length - 1 ? ' ' : ''}
    </span>
  ));
}

export default function ShadowingLab() {
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
  const [score, setScore] = useState(3);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const info = GENIUS_INFO[type];
  const guide = TYPE_GUIDES[type];
  const stageIndex = STAGES.findIndex(s => s.id === stage);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (Array.isArray(saved.completed)) setCompleted(saved.completed.filter((x: Stage) => STAGES.some(s => s.id === x)));
    } catch { /* ignore corrupt local data */ }
  }, []);

  useEffect(() => () => {
    speechSynthesis.cancel();
    if (recordingUrl) URL.revokeObjectURL(recordingUrl);
  }, [recordingUrl]);

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
        setRecordingUrl(URL.createObjectURL(new Blob(chunksRef.current, { type: recorder.mimeType })));
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
      const next = STAGES[stageIndex + 1].id;
      setStage(next);
      if (next === 'recall') setShowText(false);
      if (next === 'slow') setSpeed(0.75);
      if (next === 'shadow') setSpeed(1);
    } else setShowScore(true);
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

              <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <Button variant="ghost" onClick={() => { setCompleted([]); localStorage.removeItem(STORAGE_KEY); setStage('understand'); setShowText(true); }}><RotateCcw className="w-4 h-4 mr-2" />重新開始</Button>
                <Button size="lg" className="rounded-full bg-[#17201d] hover:bg-black px-7" disabled={!text.trim()} onClick={finishStage}>{stageIndex === 4 ? '完成並自評' : '完成這一步'}<ChevronRight className="w-4 h-4 ml-2" /></Button>
              </div>
            </div>
          </Card>

          <aside className="space-y-4">
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
          </aside>
        </div>
      </section>

      {showScore && <div className="fixed inset-0 z-50 bg-black/50 grid place-items-center p-4" role="dialog" aria-modal="true">
        <Card className="max-w-md w-full rounded-[30px] p-7 border-0 shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-[#fff0e9] grid place-items-center"><Sparkles className="w-7 h-7 text-[#d55b38]" /></div>
          <h2 className="text-2xl font-black mt-5">一輪完成，聲音軌道已建立。</h2>
          <p className="text-sm text-black/55 mt-2">你覺得這次能跟上多少？結果會用來安排下一次提取。</p>
          <div className="grid grid-cols-4 gap-2 mt-6">{[1,2,3,4].map(n => <button key={n} onClick={() => setScore(n)} className={`rounded-xl py-3 border font-black ${score === n ? 'bg-[#17201d] text-white border-[#17201d]' : 'border-black/10'}`}>{n}</button>)}</div>
          <div className="flex gap-3 mt-6"><Button variant="outline" className="flex-1" onClick={() => setShowScore(false)}>再練一次</Button><Button className="flex-1 bg-[#d55b38] hover:bg-[#bb4829]" onClick={() => { localStorage.setItem(STORAGE_KEY, JSON.stringify({ completed: STAGES.map(s => s.id), score, lastPractice: new Date().toISOString(), type })); setShowScore(false); }}>儲存結果</Button></div>
        </Card>
      </div>}
    </main>
  );
}
