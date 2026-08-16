import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Headphones,
  Heart,
  Mic,
  Play,
  RefreshCw,
  Sparkles,
  Table2,
  ThumbsDown,
  ThumbsUp,
  Volume2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { LearningStyle, STYLE_INFO } from '@/lib/learning-styles';
import { GeniusType, geniusInfo } from '@/lib/genius-type';
import {
  LearningGymAbility,
  LearningGymProgress,
  LearningGymTask,
} from '@/lib/learning-gym';

type CoreTaskId = 'scene_anchor' | 'data_to_table' | 'sound_shadow' | 'story_recall';

interface Props {
  task: LearningGymTask & { id: CoreTaskId };
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

const STYLE_COACH: Record<LearningStyle, Record<CoreTaskId, string>> = {
  visual: {
    scene_anchor: '用兩張對比畫面區分「成功談成」與「談判破裂」，讓場景顏色與結果綁定。',
    data_to_table: '先用顏色標記人物、數字與問題，再把同色資訊移到同一欄。',
    sound_shadow: '把重音畫大、停頓畫斜線，讓聲音先變成看得見的節奏圖。',
    story_recall: '先想像角色表情與場景色調，再用三格分鏡重建故事。',
  },
  auditory: {
    scene_anchor: '先聽正反情境的關鍵台詞，再模仿角色語氣說出 negotiate。',
    data_to_table: '整理前先口頭分類：「人物、時間、方法、問題」，再填入表格。',
    sound_shadow: '優先使用純聽與跟讀，先抓旋律、重音和停頓，不急著看文字。',
    story_recall: '替不同角色設計聲音，用對話和情緒語氣重述故事。',
  },
  reading: {
    scene_anchor: '用「地點—角色—衝突—任務—句型」五欄寫下正反例。',
    data_to_table: '先定義欄位規則，再逐句擷取資料，最後寫三句摘要。',
    sound_shadow: '標註重音、連音與停頓，寫下自己最容易漏掉的音節。',
    story_recall: '用角色、目標、阻礙、轉折、結果五段式寫成短篇。',
  },
  kinesthetic: {
    scene_anchor: '站起來分飾雙方，用握手代表成功、轉身離開代表失敗。',
    data_to_table: '把資訊想成卡片，用拖移與分類的動作把資料放進欄位。',
    sound_shadow: '用手勢打拍、身體前傾標重音，邊走邊完成遮稿複述。',
    story_recall: '為每個事件設計一個動作，用身體演完再反向回想。',
  },
};

const SCENES: Record<string, {
  meaning: string;
  positive: { title: string; place: string; role: string; action: string; line: string };
  negative: { title: string; place: string; role: string; action: string; line: string };
}> = {
  Negotiate: {
    meaning: '協商；透過溝通調整條件，找出雙方可接受的方案',
    positive: {
      title: '雙方找到共同方案', place: '明亮的會議室', role: '你是專案經理，對方是客戶',
      action: '你拿出時程表，交換條件後握手', line: 'We negotiated a deadline that works for both teams.',
    },
    negative: {
      title: '堅持立場，談判破裂', place: '氣氛緊繃的會議室', role: '你是供應商，對方是採購主管',
      action: '雙方提高音量，對方收起文件離席', line: 'We failed to negotiate because neither side would compromise.',
    },
  },
  Persuade: {
    meaning: '說服；運用理由或情感，使他人願意採取行動',
    positive: { title: '提案獲得支持', place: '團隊簡報室', role: '你是提案人，對方是主管', action: '你展示證據，主管點頭同意', line: 'I persuaded my manager to test the new idea.' },
    negative: { title: '理由不足，沒有說服', place: '臨時會議', role: '你是組員，對方是團隊', action: '你只重複結論，大家露出疑惑表情', line: 'I could not persuade them without clear evidence.' },
  },
  Apologize: {
    meaning: '道歉；承認造成的影響並表達歉意',
    positive: { title: '真誠道歉，修復關係', place: '安靜的咖啡店', role: '你與一位朋友', action: '你看著對方，承認錯誤並提出補救', line: 'I apologized for missing our appointment.' },
    negative: { title: '敷衍道歉，衝突加深', place: '忙亂的辦公室', role: '你與同事', action: '你邊看手機邊說抱歉，沒有承認問題', line: 'He apologized, but he did not take responsibility.' },
  },
};

const RAW_DATA = 'Amy 本週練習 4 天，每次 20 分鐘，使用跟讀，發音進步但單字容易忘。Ben 練習 2 天，每次 45 分鐘，做文法題，正確率提高但不敢開口。Cindy 練習 5 天，每次 15 分鐘，用單字卡，記憶穩定但造句不足。';

const TASK_META: Record<CoreTaskId, { eyebrow: string; title: string; description: string; accent: string }> = {
  scene_anchor: { eyebrow: 'SCENE ANCHOR LAB', title: '把單字放進成功與失敗的真實情境', description: '不要只背中文意思。比較正向與負向結果，讓大腦知道這個單字何時會出現。', accent: 'from-teal-500 to-cyan-500' },
  data_to_table: { eyebrow: 'STRUCTURE LAB', title: '把雜亂內容整理成可以比較的結構', description: '先決定欄位，再分類資訊，最後遮住原文重建規律。', accent: 'from-sky-500 to-indigo-500' },
  sound_shadow: { eyebrow: 'SOUND LOOP LAB', title: '用純聽、節奏與遮稿建立聲音記憶', description: '一輪只處理一件事：先聽旋律，再跟讀，最後不看文字說回來。', accent: 'from-violet-500 to-fuchsia-500' },
  story_recall: { eyebrow: 'EMOTION STORY LAB', title: '讓概念跟著人物與情緒轉折留下來', description: '角色要有目標、阻礙與反應；情緒變化就是主動回想的索引。', accent: 'from-rose-500 to-orange-500' },
};

function gainProgress(progress: LearningGymProgress, task: LearningGymTask) {
  const next = { ...progress };
  Object.entries(task.abilityWeights).forEach(([ability, value]) => {
    next[ability as LearningGymAbility] += value || 0;
  });
  return next;
}

function SceneDemo({ style }: { style: LearningStyle }) {
  const [word, setWord] = useState('Negotiate');
  const [polarity, setPolarity] = useState<'positive' | 'negative'>('positive');
  const [recall, setRecall] = useState('');
  const scene = SCENES[word];
  const active = scene[polarity];

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
      <div className="space-y-5">
        <div className="rounded-2xl border bg-card p-5">
          <label className="text-sm font-bold">選擇要記住的單字</label>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.keys(SCENES).map((item) => (
              <button key={item} onClick={() => { setWord(item); setRecall(''); }} className={`rounded-xl border px-4 py-2 text-sm font-bold ${word === item ? 'border-primary bg-primary text-white' : 'bg-background hover:border-primary/40'}`}>{item}</button>
            ))}
          </div>
          <div className="mt-4 rounded-xl bg-slate-50 p-4">
            <div className="text-2xl font-black">{word}</div>
            <p className="mt-1 text-sm text-muted-foreground">{scene.meaning}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <button onClick={() => setPolarity('positive')} className={`rounded-2xl border-2 p-5 text-left transition ${polarity === 'positive' ? 'border-emerald-400 bg-emerald-50 shadow-md' : 'border-slate-200 bg-white'}`}>
            <div className="flex items-center gap-2 text-sm font-black text-emerald-700"><ThumbsUp className="h-5 w-5" />正向情境</div>
            <h3 className="mt-3 text-lg font-black">{scene.positive.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">透過溝通、交換條件，成功找到雙方都能接受的結果。</p>
          </button>
          <button onClick={() => setPolarity('negative')} className={`rounded-2xl border-2 p-5 text-left transition ${polarity === 'negative' ? 'border-rose-400 bg-rose-50 shadow-md' : 'border-slate-200 bg-white'}`}>
            <div className="flex items-center gap-2 text-sm font-black text-rose-700"><ThumbsDown className="h-5 w-5" />負向情境</div>
            <h3 className="mt-3 text-lg font-black">{scene.negative.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">缺少傾聽或讓步，導致協商失敗並留下負面結果。</p>
          </button>
        </div>

        <div className="rounded-2xl border bg-card p-5">
          <div className="flex items-center justify-between"><h3 className="font-black">場景／動作／角色範例</h3><span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">已依 {STYLE_INFO[style].name} 調整</span></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {[['場景', active.place], ['角色', active.role], ['動作', active.action]].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-slate-50 p-4"><div className="text-xs font-black text-primary">{label}</div><p className="mt-2 text-sm leading-6">{value}</p></div>
            ))}
          </div>
          <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-4"><div className="text-xs font-black text-primary">情境句</div><p className="mt-2 font-semibold">{active.line}</p></div>
        </div>

        <div className="rounded-2xl border bg-card p-5">
          <label className="font-black" htmlFor="scene-recall">關掉提示後，用自己的話演一次</label>
          <Textarea id="scene-recall" value={recall} onChange={(e) => setRecall(e.target.value)} className="mt-3 min-h-32" placeholder={`我在什麼地方？和誰互動？為什麼需要 ${word.toLowerCase()}？最後發生什麼事？`} />
        </div>
      </div>
      <aside className="space-y-4">
        <div className={`rounded-2xl bg-gradient-to-br ${polarity === 'positive' ? 'from-emerald-500 to-teal-600' : 'from-rose-500 to-orange-600'} p-6 text-white shadow-lg`}>
          <div className="text-xs font-black tracking-widest">LIVE SCENE CARD</div>
          <div className="mt-8 text-5xl">{polarity === 'positive' ? '🤝' : '💥'}</div>
          <h3 className="mt-5 text-2xl font-black">{active.title}</h3>
          <p className="mt-3 text-sm leading-6 text-white/80">{active.place}<br />{active.role}</p>
          <div className="mt-6 rounded-xl bg-white/15 p-4 text-sm leading-6">「{active.line}」</div>
        </div>
        <div className="rounded-2xl border bg-white p-5"><div className="font-black">你的學習提示</div><p className="mt-2 text-sm leading-6 text-muted-foreground">{STYLE_COACH[style].scene_anchor}</p></div>
      </aside>
    </div>
  );
}

function TableDemo({ style }: { style: LearningStyle }) {
  const [raw, setRaw] = useState(RAW_DATA);
  const [built, setBuilt] = useState(false);
  const rows = [
    ['Amy', '4 天 × 20 分', '跟讀', '發音進步', '單字容易忘'],
    ['Ben', '2 天 × 45 分', '文法題', '正確率提高', '不敢開口'],
    ['Cindy', '5 天 × 15 分', '單字卡', '記憶穩定', '造句不足'],
  ];
  return <div className="grid gap-5 lg:grid-cols-[1fr_330px]">
    <div className="space-y-5">
      <div className="rounded-2xl border bg-card p-5"><div className="flex items-center justify-between"><h3 className="font-black">1. 貼入雜亂資料</h3><Button variant="outline" size="sm" onClick={() => { setRaw(RAW_DATA); setBuilt(false); }}><RefreshCw className="mr-2 h-4 w-4" />載入範例</Button></div><Textarea value={raw} onChange={(e) => { setRaw(e.target.value); setBuilt(false); }} className="mt-3 min-h-36" /><Button disabled={!raw.trim()} onClick={() => setBuilt(true)} className="mt-3"><Table2 className="mr-2 h-4 w-4" />產生欄位範例</Button></div>
      {built && <div className="overflow-hidden rounded-2xl border bg-card"><div className="border-b p-5"><h3 className="font-black">2. 比較表</h3><p className="mt-1 text-sm text-muted-foreground">欄位：人物｜頻率｜方法｜進步｜卡點</p></div><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-sm"><thead className="bg-slate-50"><tr>{['人物','頻率','方法','進步','卡點'].map(h => <th key={h} className="px-4 py-3 text-left">{h}</th>)}</tr></thead><tbody>{rows.map(row => <tr key={row[0]} className="border-t">{row.map(cell => <td key={cell} className="px-4 py-3">{cell}</td>)}</tr>)}</tbody></table></div></div>}
      <div className="rounded-2xl border bg-card p-5"><h3 className="font-black">3. 遮住原文，重建規律</h3><Textarea className="mt-3 min-h-32" placeholder="不看原文，寫下五個欄位、三位人物的主要方法，以及你發現的規律……" /></div>
    </div>
    <aside className="space-y-4"><div className="rounded-2xl bg-sky-50 p-5"><div className="font-black text-sky-900">結構化順序</div>{['找出比較對象','圈出數字與時間','分開成果與問題','用一句話摘要規律'].map((s,i)=><div key={s} className="mt-3 flex gap-2 text-sm text-sky-900"><span className="font-black">0{i+1}</span>{s}</div>)}</div><div className="rounded-2xl border bg-card p-5"><div className="font-black">個人化提示</div><p className="mt-2 text-sm leading-6 text-muted-foreground">{STYLE_COACH[style].data_to_table}</p></div></aside>
  </div>;
}

function SoundDemo({ style }: { style: LearningStyle }) {
  const text = 'We can negotiate the price if the order is large.';
  const [stage, setStage] = useState(0);
  const stages = ['純聽', '節奏標記', '跟讀', '遮稿複述'];
  const speak = () => { if ('speechSynthesis' in window) { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'en-US'; u.rate = .82; speechSynthesis.speak(u); } };
  return <div className="grid gap-5 lg:grid-cols-[1fr_330px]"><div className="space-y-5"><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{stages.map((s,i)=><button key={s} onClick={()=>setStage(i)} className={`rounded-xl border p-3 text-sm font-bold ${stage===i?'border-violet-400 bg-violet-50 text-violet-800':'bg-white'}`}>0{i+1} {s}</button>)}</div><div className="rounded-3xl border bg-card p-8 text-center"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-violet-100 text-violet-700">{stage===0?<Headphones className="h-9 w-9"/>:<Mic className="h-9 w-9"/>}</div><h3 className="mt-5 text-xl font-black">{stages[stage]}</h3>{stage!==0&&stage!==3&&<p className="mt-5 text-2xl font-black leading-relaxed">We can <span className="text-violet-600">NE·GO·TI·ATE</span> / the PRICE / if the OR·DER is LARGE.</p>}{stage===3&&<div className="mt-5 rounded-xl bg-slate-100 p-6 text-slate-400">文字已遮住，請完整說回來</div>}<Button onClick={speak} className="mt-6 bg-violet-600 hover:bg-violet-700"><Volume2 className="mr-2 h-4 w-4" />播放示範</Button><div className="mt-4"><Button variant="outline" onClick={()=>setStage(Math.min(3,stage+1))}>完成本輪 <ChevronRight className="ml-2 h-4 w-4"/></Button></div></div><div className="rounded-2xl border bg-card p-5"><h3 className="font-black">遮稿後寫下你說出的句子</h3><Textarea className="mt-3 min-h-28" placeholder="不要回頭看文字，記錄剛才說出的內容與卡住的位置……" /></div></div><aside className="space-y-4"><div className="rounded-2xl bg-violet-50 p-5"><div className="font-black text-violet-950">聲音記憶規則</div><p className="mt-3 text-sm leading-6 text-violet-900">先抓句子的音樂性，再處理單字正確度。每次跟讀只比上一輪多修正一件事。</p></div><div className="rounded-2xl border bg-card p-5"><div className="font-black">個人化提示</div><p className="mt-2 text-sm leading-6 text-muted-foreground">{STYLE_COACH[style].sound_shadow}</p></div></aside></div>;
}

function StoryDemo({ style }: { style: LearningStyle }) {
  const [emotion, setEmotion] = useState('焦慮 → 放鬆');
  const [revealed, setRevealed] = useState(false);
  return <div className="grid gap-5 lg:grid-cols-[1fr_330px]"><div className="space-y-5"><div className="rounded-2xl border bg-card p-5"><h3 className="font-black">選擇情緒轉折</h3><div className="mt-3 flex flex-wrap gap-2">{['焦慮 → 放鬆','失望 → 驚喜','害怕 → 勇敢'].map(e=><button key={e} onClick={()=>{setEmotion(e);setRevealed(false)}} className={`rounded-xl border px-4 py-2 text-sm font-bold ${emotion===e?'border-rose-400 bg-rose-50 text-rose-800':'bg-white'}`}>{e}</button>)}</div></div><div className="grid gap-3 sm:grid-cols-4">{[['角色','新進業務 Mia'],['目標','談成第一份合約'],['阻礙','客戶要求降價 20%'],['轉折',emotion]].map(([a,b])=><div key={a} className="rounded-xl border bg-white p-4"><div className="text-xs font-black text-rose-600">{a}</div><p className="mt-2 text-sm font-semibold">{b}</p></div>)}</div><div className="rounded-2xl border bg-card p-5"><h3 className="font-black">把概念寫進故事</h3><Textarea className="mt-3 min-h-44" placeholder="Mia 第一次獨自面對客戶，她……（讓 negotiate 成為故事轉折的關鍵動作）" /><Button onClick={()=>setRevealed(true)} className="mt-3 bg-rose-600 hover:bg-rose-700"><Heart className="mr-2 h-4 w-4" />查看情感故事範例</Button>{revealed&&<div className="mt-4 rounded-xl bg-rose-50 p-4 text-sm leading-7 text-rose-950">Mia 緊張地握著報價單。客戶要求降價 20%，她差點直接答應；但她深呼吸後，提出「增加訂購量，交換較低單價」。雙方開始 <b>negotiate</b>，最後找到可接受的方案。走出會議室時，她第一次感到自己真的能獨當一面。</div>}</div><div className="rounded-2xl border bg-card p-5"><h3 className="font-black">遮住故事後，用四句話複述</h3><Textarea className="mt-3 min-h-28" placeholder="誰？想完成什麼？遇到什麼情緒與阻礙？最後如何改變？" /></div></div><aside className="space-y-4"><div className="rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 p-6 text-white"><div className="text-5xl">🎭</div><h3 className="mt-5 text-2xl font-black">{emotion}</h3><p className="mt-3 text-sm leading-6 text-white/85">情緒不是裝飾，而是提醒你「故事在哪裡發生轉折」的記憶索引。</p></div><div className="rounded-2xl border bg-card p-5"><div className="font-black">個人化提示</div><p className="mt-2 text-sm leading-6 text-muted-foreground">{STYLE_COACH[style].story_recall}</p></div></aside></div>;
}

export function CoreTrainingDemo({ task, progress, learningStyle, geniusType, onProgressChange, onBack }: Props) {
  const [completed, setCompleted] = useState(false);
  const style = learningStyle || 'visual';
  const meta = TASK_META[task.id];
  const identity = geniusInfo(geniusType);
  const content = useMemo(() => {
    if (task.id === 'scene_anchor') return <SceneDemo style={style} />;
    if (task.id === 'data_to_table') return <TableDemo style={style} />;
    if (task.id === 'sound_shadow') return <SoundDemo style={style} />;
    return <StoryDemo style={style} />;
  }, [task.id, style]);
  const complete = () => { const next = gainProgress(progress, task); onProgressChange(next, task.abilityWeights, `${task.title} Demo 完成`); setCompleted(true); };
  return <div className="min-h-screen bg-[#f6f8fb]"><header className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur"><div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4"><Button variant="ghost" size="icon" onClick={onBack} aria-label="返回"><ArrowLeft className="h-5 w-5" /></Button><div className="min-w-0 flex-1"><h1 className="truncate text-xl font-black">{task.title}</h1><p className="truncate text-xs text-muted-foreground">{task.duration} · {task.outcome}</p></div><div className="hidden items-center gap-2 rounded-full border bg-white px-3 py-1.5 text-xs font-bold sm:flex">{STYLE_INFO[style].emoji} {STYLE_INFO[style].name}</div></div></header><main className="mx-auto max-w-7xl px-4 py-6"><section className="relative overflow-hidden rounded-[28px] bg-[#111936] p-7 text-white md:p-9"><div className={`absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br ${meta.accent} opacity-30 blur-3xl`} /><div className="relative max-w-3xl"><div className="text-xs font-black tracking-[.2em] text-cyan-300">{meta.eyebrow}</div><h2 className="mt-3 text-3xl font-black leading-tight md:text-4xl">{meta.title}</h2><p className="mt-3 text-sm leading-7 text-slate-300">{meta.description}</p><div className="mt-5 flex flex-wrap gap-2"><span className="rounded-full bg-white/10 px-3 py-1.5 text-xs">{STYLE_INFO[style].emoji} {STYLE_INFO[style].name}</span>{identity&&<span className="rounded-full bg-white/10 px-3 py-1.5 text-xs">{identity.emoji} {identity.nameZh}</span>}</div></div></section><section className="mt-6">{content}</section><div className="mt-6 rounded-2xl border bg-white p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="font-black">完成這次 Demo</div><p className="mt-1 text-sm text-muted-foreground">完成後會依原卡片權重累積 Learning Gym 能力值。</p></div><Button onClick={complete} disabled={completed} className="gap-2"><CheckCircle2 className="h-4 w-4" />{completed?'本回合已完成':'完成並記錄能力值'}</Button></div></div></main></div>;
}
