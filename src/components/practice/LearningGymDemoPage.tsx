import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Flame, Heart, Lightbulb, RotateCcw, Sparkles, Star, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { GeniusType, geniusInfo } from '@/lib/genius-type';
import { LearningStyle, STYLE_INFO } from '@/lib/learning-styles';
import { LearningGymTask } from '@/lib/learning-gym';

type DemoId = 'scene_anchor' | 'data_to_table' | 'story_recall' | 'concept_web';
type Props = {
  task: LearningGymTask;
  learningStyle: LearningStyle | null;
  geniusType: GeniusType | null;
  onComplete: (gained: LearningGymTask['abilityWeights']) => void;
  onBack: () => void;
};

const steps = ['起跑測驗', '記憶裝備', '迷霧挑戰', 'Boss 關', '結算'];
const themes: Record<DemoId, { emoji: string; label: string; title: string; copy: string; gradient: string }> = {
  scene_anchor: { emoji: '🎬', label: 'SCENE ANCHOR LAB', title: '讓場景替你叫出那句話', copy: '時間、地點、人物與目的會一起成為提取線索。從看得懂，練到在真實情境中能立刻說出口。', gradient: 'from-teal-500 to-cyan-500' },
  data_to_table: { emoji: '🗂️', label: 'STRUCTURE LAB', title: '把零散知識整理成可提取的結構', copy: '先分類、再比較、最後遮住欄位重建規律。讓文法與單字不再混成一團。', gradient: 'from-sky-500 to-indigo-500' },
  story_recall: { emoji: '🎭', label: 'EMOTION STORY LAB', title: '用情緒轉折綁住整組單字', copy: '人物有目標、事件有阻礙、情緒有轉折。回想故事時，目標詞也會一起回來。', gradient: 'from-rose-500 to-orange-500' },
  concept_web: { emoji: '🕸️', label: 'CONCEPT WEB LAB', title: '替一個概念建立多條回想路徑', copy: '從詞族、場景、反義與先後順序建立連線；忘記一條路，仍能從另一個節點找回來。', gradient: 'from-violet-500 to-fuchsia-500' },
};

function Choice({ children, active, correct, onClick }: { children: React.ReactNode; active?: boolean; correct?: boolean; onClick: () => void }) {
  const state = !active ? 'border-slate-200 bg-white hover:border-primary/30' : correct ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm' : 'border-rose-400 bg-rose-50 text-rose-800 shadow-sm';
  return <button onClick={onClick} className={`w-full rounded-2xl border-2 p-4 text-left text-sm font-semibold transition hover:-translate-y-0.5 ${state}`}><span className="flex items-center justify-between gap-3"><span>{children}</span>{active&&<span className="text-xs font-black">{correct?'答對 +100 XP':'再想想'}</span>}</span></button>;
}

function GameHud({ phase, score }: { phase: number; score: number }) {
  const xp = phase * 40 + score * 100;
  return <div className="grid grid-cols-3 gap-2 rounded-2xl border bg-white p-3 shadow-sm">
    <div className="flex items-center gap-2 rounded-xl bg-rose-50 px-3 py-2 text-rose-700"><Heart className="h-4 w-4 fill-current"/><div><div className="text-[10px] font-bold">能量</div><div className="text-sm font-black">3/3</div></div></div>
    <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-amber-700"><Star className="h-4 w-4 fill-current"/><div><div className="text-[10px] font-bold">經驗值</div><div className="text-sm font-black">{xp} XP</div></div></div>
    <div className="flex items-center gap-2 rounded-xl bg-orange-50 px-3 py-2 text-orange-700"><Flame className="h-4 w-4"/><div><div className="text-[10px] font-bold">連擊</div><div className="text-sm font-black">×{Math.max(1,score)}</div></div></div>
  </div>;
}

function Result({ score, onReset }: { score: number; onReset: () => void }) {
  return <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
    <div className="rounded-3xl border bg-white p-6 md:p-8"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700"><CheckCircle2 className="h-7 w-7" /></div><h3 className="mt-5 text-2xl font-black">訓練完成，記憶路徑已建立</h3><p className="mt-2 text-sm leading-7 text-muted-foreground">你已完成辨認、主動回想與新情境遷移。Demo 分數依互動完成度計算。</p><div className="mt-6 grid gap-3 sm:grid-cols-3">{[['無提示回想','40% → 85%'],['啟動時間','6.4s → 2.7s'],['新情境遷移',`${score}/3`]].map(([a,b])=><div key={a} className="rounded-2xl bg-slate-50 p-4"><div className="text-xs font-bold text-muted-foreground">{a}</div><div className="mt-2 text-xl font-black">{b}</div></div>)}</div><Button onClick={onReset} variant="outline" className="mt-6"><RotateCcw className="mr-2 h-4 w-4" />重新體驗</Button></div>
    <div className="rounded-3xl bg-[#111936] p-6 text-white"><div className="text-sm font-bold text-cyan-300">語言能力轉換</div><p className="mt-4 text-lg font-black leading-8">不只是答對，而是能在提示消失、場景改變後，再次提取並使用。</p><div className="mt-6 h-2 overflow-hidden rounded-full bg-white/15"><div className="h-full w-[85%] rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" /></div><div className="mt-2 text-right text-xs text-white/70">記憶穩定度 85%</div></div>
  </div>;
}

function SceneActivity({ phase, setScore }: { phase: number; setScore: (n: number) => void }) {
  const [choice, setChoice] = useState(''); const [answer, setAnswer] = useState(''); const [hint, setHint] = useState(false);
  if (phase === 0) return <Panel title="前測：你能立刻回應嗎？" copy="晚上七點，你走進東京餐廳。接待員問：Do you have a reservation?">
    {['I have a reservation under the name Kuo.','I am reservation Kuo.','Where is the reservation food?'].map(x=><Choice key={x} active={choice===x} correct={x.startsWith('I have')} onClick={()=>{setChoice(x); if(x.startsWith('I have'))setScore(1)}}>{x}</Choice>)}
  </Panel>;
  if (phase === 1) return <Panel title="建立五個情境鉤子" copy="把句子掛在一段可以重新進入的場景，而不是只記中文翻譯。"><div className="grid gap-3 sm:grid-cols-5">{[['時間','晚上 7:00'],['地點','東京餐廳'],['人物','接待員'],['目的','確認訂位'],['物件','手機紀錄']].map(([a,b])=><div className="rounded-2xl border bg-white p-4" key={a}><div className="text-xs font-black text-teal-600">{a}</div><div className="mt-2 text-sm font-semibold">{b}</div></div>)}</div><div className="mt-5 rounded-2xl bg-teal-50 p-5 text-lg font-black text-teal-950">“I have a reservation under the name Kuo.”</div></Panel>;
  if (phase === 2) return <Panel title="提示遞減：現在只剩三個關鍵字" copy="reservation / under / Kuo"><Textarea value={answer} onChange={e=>setAnswer(e.target.value)} className="min-h-28" placeholder="輸入完整句子…" /><div className="mt-3 flex gap-2"><Button onClick={()=>{if(answer.toLowerCase().includes('reservation')&&answer.toLowerCase().includes('kuo'))setScore(2)}}>檢查回答</Button><Button variant="outline" onClick={()=>setHint(!hint)}><Lightbulb className="mr-2 h-4 w-4" />提示</Button></div>{hint&&<p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm">句型：I have a ___ under the name ___.</p>}</Panel>;
  return <Panel title="新情境遷移" copy="這次你沒有訂位。請詢問是否還有兩人座位。"><Textarea className="min-h-28" placeholder="We don't have…" onChange={e=>{if(e.target.value.toLowerCase().includes('table for two'))setScore(3)}}/><p className="mt-3 text-sm text-muted-foreground">成功條件：說明沒有訂位＋詢問兩人座位。</p></Panel>;
}

const travelCards = [
  ['check in','機場','動作'],['boarding pass','機場','物品'],['gate','機場','地點'],['delayed','機場','狀況'],['reservation','飯店','資訊'],['front desk','飯店','地點'],
];
function TableActivity({ phase, setScore }: { phase: number; setScore: (n: number) => void }) {
  const [assigned,setAssigned]=useState<Record<string,string>>({}); const [recall,setRecall]=useState('');
  if(phase===0)return <Panel title="前測：快速分類" copy="check in 在不同場景代表什麼？"><div className="grid gap-3 sm:grid-cols-2">{['只能用在機場','只能用在飯店','機場報到與飯店入住都能使用','代表結帳'].map(x=><Choice key={x} active={assigned.pre===x} correct={x.startsWith('機場')} onClick={()=>{setAssigned({...assigned,pre:x});if(x.startsWith('機場'))setScore(1)}}>{x}</Choice>)}</div></Panel>;
  if(phase===1)return <Panel title="把零散卡片放進正確欄位" copy="點選每張卡片的場景。完成分類後，比較同一場景中的動作、物品與地點。"><div className="grid gap-3 sm:grid-cols-2">{travelCards.map(([word,place,type])=><div key={word} className="rounded-2xl border bg-white p-4"><div className="flex items-center justify-between"><b>{word}</b><span className="text-xs text-muted-foreground">{type}</span></div><div className="mt-3 flex gap-2">{['機場','飯店'].map(p=><button key={p} onClick={()=>{const n={...assigned,[word]:p};setAssigned(n);if(travelCards.every(([w,correct])=>(n[w]||assigned[w])===correct))setScore(2)}} className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${assigned[word]===p?'bg-primary text-white':'bg-slate-50'}`}>{p}</button>)}</div></div>)}</div></Panel>;
  if(phase===2)return <Panel title="遮住英文欄，重建資料" copy="機場報到後取得登機證，接著前往登機門。請寫出三個英文詞。"><Textarea value={recall} onChange={e=>{setRecall(e.target.value);if(['check in','boarding pass','gate'].every(w=>e.target.value.toLowerCase().includes(w)))setScore(2)}} className="min-h-28" placeholder="1. …  2. …  3. …"/></Panel>;
  return <Panel title="Boss 關：把規則用在新資料" copy="新詞 carry-on luggage 應該放在哪個場景？它屬於動作、物品、地點或狀況？"><div className="grid gap-3 sm:grid-cols-2">{['機場／物品','機場／動作','飯店／地點','飯店／狀況'].map(x=><Choice key={x} active={assigned.transfer===x} correct={x==='機場／物品'} onClick={()=>{setAssigned({...assigned,transfer:x});if(x==='機場／物品')setScore(3)}}>{x}</Choice>)}</div></Panel>;
}

const storyEvents=['Emma 搭上錯誤方向的公車','她發現方向不對，感到困惑又尷尬','她向司機道歉並詢問下車地點','一位乘客主動提供協助','Emma 抵達飯店，終於鬆了一口氣'];
function StoryActivity({ phase,setScore }:{phase:number;setScore:(n:number)=>void}){
 const [order,setOrder]=useState([...storyEvents].sort(()=>.5-Math.random())); const [text,setText]=useState('');
 const move=(i:number,d:number)=>{const n=[...order],j=i+d;if(j<0||j>=n.length)return;[n[i],n[j]]=[n[j],n[i]];setOrder(n);if(n.every((x,k)=>x===storyEvents[k]))setScore(2)};
 if(phase===0)return <Panel title="前測：哪個詞最符合情緒轉折？" copy="Emma 找不到正確方向；有人幫她後，她終於抵達飯店。"><div className="grid gap-3 sm:grid-cols-3">{['excited','relieved','proud'].map(x=><Choice key={x} active={text===x} correct={x==='relieved'} onClick={()=>{setText(x);if(x==='relieved')setScore(1)}}>{x}</Choice>)}</div></Panel>;
 if(phase===1)return <Panel title="重建故事的事件順序" copy="用上下按鈕排列：目標 → 阻礙 → 情緒 → 行動 → 結果。"><div className="space-y-2">{order.map((x,i)=><div key={x} className="flex items-center gap-3 rounded-xl border bg-white p-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-rose-100 text-xs font-black text-rose-700">{i+1}</span><span className="flex-1 text-sm font-semibold">{x}</span><button onClick={()=>move(i,-1)} aria-label="上移">↑</button><button onClick={()=>move(i,1)} aria-label="下移">↓</button></div>)}</div></Panel>;
 if(phase===2)return <Panel title="只看五個詞，重新說故事" copy="wrong bus / realized / embarrassed / offered / relieved"><Textarea className="min-h-40" placeholder="Emma was traveling alone…" onChange={e=>{setText(e.target.value);if(['bus','embarrassed','relieved'].every(w=>e.target.value.toLowerCase().includes(w)))setScore(2)}}/></Panel>;
 return <Panel title="改變結局" copy="假設沒有人幫助 Emma。請使用 ask for directions、map、another bus 寫出新結局。"><Textarea className="min-h-36" onChange={e=>{if(['directions','map','bus'].every(w=>e.target.value.toLowerCase().includes(w)))setScore(3)}} placeholder="Nobody offered to help, so Emma…"/></Panel>;
}

const links=[['check in','boarding pass'],['security','gate'],['delay','announcement']];
function WebActivity({phase,setScore}:{phase:number;setScore:(n:number)=>void}){
 const nodes=['check in','boarding pass','security','gate','delay','announcement']; const [first,setFirst]=useState(''); const [made,setMade]=useState<string[]>([]); const [answer,setAnswer]=useState('');
 const tap=(n:string)=>{if(!first){setFirst(n);return}const key=[first,n].sort().join('|');const valid=links.some(p=>[...p].sort().join('|')===key);setFirst('');if(valid&&!made.includes(key)){const next=[...made,key];setMade(next);if(next.length===3)setScore(2)}};
 if(phase===0)return <Panel title="前測：找到最直接的關係" copy="完成 check in 後，通常會取得什麼？"><div className="grid gap-3 sm:grid-cols-3">{['gate','boarding pass','delay'].map(x=><Choice key={x} active={answer===x} correct={x==='boarding pass'} onClick={()=>{setAnswer(x);if(x==='boarding pass')setScore(1)}}>{x}</Choice>)}</div></Panel>;
 if(phase===1)return <Panel title="點兩個節點，建立三條正確連線" copy="想想先後順序、原因結果，以及動作與物品。"><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{nodes.map(n=><button key={n} onClick={()=>tap(n)} className={`rounded-2xl border-2 p-5 font-black transition ${first===n?'border-violet-500 bg-violet-50':'bg-white'}`}>{n}</button>)}</div><div className="mt-4 rounded-xl bg-violet-50 p-3 text-sm font-semibold text-violet-900">已建立 {made.length}/3 條連線</div></Panel>;
 if(phase===2)return <Panel title="隱藏節點回想" copy="You wait at the ______ before boarding."><Textarea value={answer} onChange={e=>{setAnswer(e.target.value);if(e.target.value.toLowerCase().includes('gate'))setScore(2)}} className="min-h-24" placeholder="輸入節點…"/></Panel>;
 return <Panel title="新概念遷移：建立詞族" copy="請從 predict 延伸至少三個詞，例如名詞、形容詞與否定形容詞。"><Textarea className="min-h-32" placeholder="predict → …" onChange={e=>{if(['prediction','predictable','unpredictable'].every(w=>e.target.value.toLowerCase().includes(w)))setScore(3)}}/></Panel>;
}

function Panel({title,copy,children}:{title:string;copy:string;children:React.ReactNode}){return <div className="rounded-3xl border bg-white p-5 shadow-sm md:p-7"><h3 className="text-xl font-black">{title}</h3><p className="mt-2 mb-5 text-sm leading-7 text-muted-foreground">{copy}</p><div className="space-y-3">{children}</div></div>}

export function LearningGymDemoPage({task,learningStyle,geniusType,onComplete,onBack}:Props){
 const id=task.id as DemoId; const theme=themes[id]; const [phase,setPhase]=useState(0); const [score,setScore]=useState(0); const [done,setDone]=useState(false); const [style,setStyle]=useState<LearningStyle>(learningStyle||'visual'); const [reward,setReward]=useState(false); const identity=useMemo(()=>geniusInfo(geniusType),[geniusType]);
 useEffect(()=>{if(score>0){setReward(true);const timer=window.setTimeout(()=>setReward(false),1200);return()=>window.clearTimeout(timer)}},[score]);
 const restart=()=>{setPhase(0);setScore(0);setDone(false)};
 const requirements: Record<DemoId,number[]>={scene_anchor:[1,1,2,3],data_to_table:[1,2,2,3],story_recall:[1,2,2,3],concept_web:[1,2,2,3]};
 const unlocked=score>=requirements[id][phase];
 const next=()=>{if(!unlocked)return;if(phase<4)setPhase(phase+1);if(phase===3&&!done){onComplete(task.abilityWeights);setDone(true)}};
 const activity=id==='scene_anchor'?<SceneActivity phase={phase} setScore={n=>setScore(Math.max(score,n))}/>:id==='data_to_table'?<TableActivity phase={phase} setScore={n=>setScore(Math.max(score,n))}/>:id==='story_recall'?<StoryActivity phase={phase} setScore={n=>setScore(Math.max(score,n))}/>:<WebActivity phase={phase} setScore={n=>setScore(Math.max(score,n))}/>;
 return <div className="min-h-screen bg-[#f5f7fb] pb-20"><header className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur"><div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3"><Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5"/></Button><div className="min-w-0 flex-1"><h1 className="truncate font-black">{task.title}</h1><p className="text-xs text-muted-foreground">{task.duration} · 個別互動 Demo</p></div><select value={style} onChange={e=>setStyle(e.target.value as LearningStyle)} className="rounded-xl border bg-white px-3 py-2 text-xs font-bold">{Object.entries(STYLE_INFO).map(([k,v])=><option value={k} key={k}>{v.emoji} {v.name}</option>)}</select></div></header>
 <main className="mx-auto max-w-7xl px-4 py-6"><section className="relative overflow-hidden rounded-[30px] bg-[#111936] p-7 text-white md:p-10"><div className={`absolute -right-16 -top-20 h-64 w-64 rounded-full bg-gradient-to-br ${theme.gradient} opacity-40 blur-3xl`}/><div className="relative max-w-3xl"><div className="text-5xl">{theme.emoji}</div><div className="mt-5 text-xs font-black tracking-[.2em] text-cyan-300">{theme.label}</div><h2 className="mt-3 text-3xl font-black md:text-4xl">{theme.title}</h2><p className="mt-3 leading-7 text-slate-300">{theme.copy}</p><div className="mt-5 flex flex-wrap gap-2"><span className="rounded-full bg-white/10 px-3 py-1.5 text-xs">{STYLE_INFO[style].emoji} {STYLE_INFO[style].name}</span>{identity&&<span className="rounded-full bg-white/10 px-3 py-1.5 text-xs">{identity.emoji} {identity.nameZh}</span>}<span className="rounded-full bg-white/10 px-3 py-1.5 text-xs">提示會逐步消失</span></div></div></section>
 <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_390px]"><GameHud phase={phase} score={score}/><div className="rounded-2xl border border-violet-200 bg-gradient-to-r from-violet-50 to-fuchsia-50 p-4"><div className="flex items-center gap-2 text-sm font-black text-violet-800"><Trophy className="h-4 w-4"/>本關任務</div><p className="mt-1 text-xs leading-5 text-violet-700">完成互動取得 XP，解鎖下一關；最後用新情境打倒 Boss。</p></div></div>
 {reward&&<div className="fixed left-1/2 top-24 z-50 -translate-x-1/2 animate-bounce rounded-full bg-emerald-500 px-5 py-2 text-sm font-black text-white shadow-xl"><Sparkles className="mr-2 inline h-4 w-4"/>答對了！+100 XP</div>}
 <div className="mt-5 grid grid-cols-5 gap-2">{steps.map((s,i)=><button key={s} onClick={()=>i<=phase&&setPhase(i)} className={`rounded-xl border px-2 py-3 text-xs font-bold ${i===phase?'border-primary bg-primary text-white':i<phase?'border-primary/30 bg-primary/5 text-primary':'bg-white text-muted-foreground'}`}><span className="hidden sm:inline">0{i+1} </span>{s}</button>)}</div>
 <section className="mt-5">{phase===4?<Result score={score} onReset={restart}/>:activity}</section>
 {phase<4&&<div className="mt-5 flex items-center justify-between rounded-2xl border bg-white p-4"><div><div className="text-sm font-black">關卡進度 {Math.round(((phase+1)/5)*100)}%</div><div className={`mt-1 text-xs ${unlocked?'text-emerald-600':'text-amber-600'}`}>{unlocked?'✓ 任務完成，下一關已解鎖':'先完成本關任務才能前進'}</div></div><Button onClick={next} disabled={!unlocked}>{phase===3?'領取獎勵':'進入下一關'}<ArrowRight className="ml-2 h-4 w-4"/></Button></div>}
 </main></div>;
}
