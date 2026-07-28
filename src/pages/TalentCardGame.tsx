import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Brain, Check, ChevronRight, Heart, RotateCcw, Sparkles, Star, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { GENIUS_INFO, GeniusType, loadGeniusType } from '@/lib/genius-type';

type Ability = 'observe' | 'connect' | 'express' | 'listen' | 'memory' | 'repair';
type Phase = 'choose' | 'play' | 'result';

interface TalentCard {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  ability: Ability;
  talents: GeniusType[];
  sentence: string;
  effect: string;
}

interface SceneRound {
  speaker: string;
  place: string;
  prompt: string;
  goal: string;
  best: Ability;
  reply: string;
}

const TALENT_TAGLINES: Record<GeniusType, string> = {
  explorer: '用行動試出一句話', architect: '用結構搭好語言骨架', melodist: '用聲音抓住語感', narrator: '用故事讓句子活起來',
  connector: '把新句子連回已知', analyst: '拆規則、找出精準表達', performer: '勇敢開口，邊演邊學', visionary: '把語言變成腦中畫面',
};

const CARDS: TalentCard[] = [
  { id: 'scene-scan', title: '情境掃描', subtitle: '先看人、地點與線索', icon: '👀', ability: 'observe', talents: ['explorer', 'visionary'], sentence: 'Let me make sure I understand the situation first.', effect: '觀察 +2・壓力 -1' },
  { id: 'sound-loop', title: '聲音迴圈', subtitle: '跟著節奏複誦關鍵句', icon: '🎧', ability: 'listen', talents: ['melodist', 'performer'], sentence: 'Could you say that one more time, a little slower?', effect: '聽力 +2・音感 +1' },
  { id: 'sentence-frame', title: '句型骨架', subtitle: '把需求放進清楚結構', icon: '🧱', ability: 'connect', talents: ['architect', 'analyst'], sentence: 'I’d like ___, because ___.', effect: '連結 +2・精準 +1' },
  { id: 'story-bridge', title: '故事橋接', subtitle: '用一個小故事延伸對話', icon: '🌉', ability: 'connect', talents: ['narrator', 'connector'], sentence: 'That reminds me of a time when…', effect: '連結 +2・好感 +1' },
  { id: 'brave-move', title: '勇敢出招', subtitle: '先說再修正，不讓回合停住', icon: '⚡', ability: 'express', talents: ['explorer', 'performer'], sentence: 'What I’m trying to say is…', effect: '表達 +2・勇氣 +1' },
  { id: 'picture-anchor', title: '圖像錨點', subtitle: '把關鍵字綁在鮮明畫面', icon: '🖼️', ability: 'memory', talents: ['visionary', 'connector'], sentence: 'I picture it like this…', effect: '記憶 +2・畫面 +1' },
  { id: 'repair-loop', title: '修補迴路', subtitle: '聽不懂時重述與確認', icon: '🔁', ability: 'repair', talents: ['analyst', 'connector'], sentence: 'So you mean ___, right?', effect: '修補 +2・對話不中斷' },
  { id: 'emotion-switch', title: '情緒換裝', subtitle: '同一句話換成禮貌、興奮或冷靜', icon: '🎭', ability: 'express', talents: ['performer', 'narrator'], sentence: 'I’m excited about it, but I’d like to check one thing.', effect: '表達 +2・語氣 +1' },
  { id: 'keyword-radar', title: '關鍵字雷達', subtitle: '先抓數字、時間、地點與動詞', icon: '📡', ability: 'listen', talents: ['analyst', 'explorer'], sentence: 'The key details are time, place, and action.', effect: '聽力 +2・資訊擷取' },
  { id: 'memory-palace', title: '記憶宮殿', subtitle: '把新詞放進房間路線', icon: '🏛️', ability: 'memory', talents: ['visionary', 'architect'], sentence: 'I’ll put this word in a clear mental location.', effect: '記憶 +2・提取 +1' },
  { id: 'social-pass', title: '社交傳球', subtitle: '用追問把話題丟回去', icon: '🏀', ability: 'repair', talents: ['connector', 'explorer'], sentence: 'How about you? What would you choose?', effect: '修補 +2・互動 +1' },
  { id: 'fast-map', title: '快速地圖', subtitle: '把想法切成 first / then / finally', icon: '🗺️', ability: 'connect', talents: ['architect', 'analyst'], sentence: 'First I’ll explain the goal, then the reason, finally the next step.', effect: '連結 +2・流暢 +1' },
];

const ROUNDS: SceneRound[] = [
  { place: '城市咖啡店', speaker: 'MIA・咖啡師', prompt: 'Hi! What can I get started for you?', goal: '看懂菜單線索，選出你想要的飲料。', best: 'observe', reply: 'Great choice! Would you like that hot or iced?' },
  { place: '機場轉機口', speaker: '地勤人員', prompt: 'Your gate has changed to B17, boarding starts in ten minutes.', goal: '抓到 gate、時間與下一步方向。', best: 'listen', reply: 'Yes, B17. Please follow the signs on your right.' },
  { place: '遊戲公會頻道', speaker: '隊友', prompt: 'Can you explain the plan before the next boss fight?', goal: '用簡短結構說明分工和下一步。', best: 'connect', reply: 'Clear plan. I’ll take defense and follow your timing.' },
  { place: '語言交換桌', speaker: '新朋友', prompt: 'I didn’t quite catch what you meant. Can you explain it another way?', goal: '不僵住，重述自己的意思。', best: 'repair', reply: 'Oh, I get it now. That makes sense.' },
  { place: '單字迷宮', speaker: '學習任務板', prompt: 'Remember these three words and use one in a sentence: vivid, delay, recover.', goal: '把新詞放進畫面或故事，避免只靠硬背。', best: 'memory', reply: 'The image is strong. You can recall it faster now.' },
  { place: '產品面試室', speaker: '面試官', prompt: 'Tell me about a project where you used AI to improve a workflow.', goal: '勇敢輸出，讓回答有情境、方法與成果。', best: 'express', reply: 'That answer feels concrete and easy to follow.' },
];

const ABILITY_LABEL: Record<Ability, string> = {
  observe: '觀察力',
  listen: '聽力預測',
  connect: '結構連結',
  repair: '對話修補',
  memory: '記憶錨定',
  express: '勇敢表達',
};
const ABILITY_COLOR: Record<Ability, string> = {
  observe: '#1f8a70',
  listen: '#2474a6',
  connect: '#e26a3b',
  repair: '#c0557a',
  memory: '#8c6a24',
  express: '#6d5bd0',
};
const STORAGE_KEY = 'talent_card_game_best_v1';

export default function TalentCardGame() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('choose');
  const [talent, setTalent] = useState<GeniusType>(() => loadGeniusType() || 'explorer');
  const [round, setRound] = useState(0);
  const [energy, setEnergy] = useState(4);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [selected, setSelected] = useState<TalentCard | null>(null);
  const [feedback, setFeedback] = useState('');
  const [bestScore, setBestScore] = useState(() => Number(localStorage.getItem(STORAGE_KEY) || 0));
  const info = GENIUS_INFO[talent];
  const scene = ROUNDS[round];
  const hand = useMemo(() => [...CARDS].sort((a, b) => Number(b.talents.includes(talent)) - Number(a.talents.includes(talent))).slice(0, 5), [talent]);

  useEffect(() => {
    if (phase === 'result' && score > bestScore) {
      setBestScore(score);
      localStorage.setItem(STORAGE_KEY, String(score));
    }
  }, [phase, score, bestScore]);

  const start = () => { setRound(0); setEnergy(4); setScore(0); setCombo(0); setSelected(null); setFeedback(''); setPhase('play'); };
  const playCard = (card: TalentCard) => {
    if (selected) return;
    const matched = card.ability === scene.best;
    const talentBonus = card.talents.includes(talent);
    const points = (matched ? 120 : 70) + (talentBonus ? 30 : 0) + combo * 10;
    setSelected(card);
    setScore(value => value + points);
    setCombo(matched ? value => value + 1 : 0);
    if (!matched) setEnergy(value => Math.max(0, value - 1));
    setFeedback(matched ? `Perfect！${ABILITY_LABEL[card.ability]}正是這個情境需要的能力。` : `有效，但還可以更貼近情境。這回合最需要的是${ABILITY_LABEL[scene.best]}。`);
  };
  const next = () => {
    if (round === ROUNDS.length - 1 || energy === 0) setPhase('result');
    else { setRound(value => value + 1); setSelected(null); setFeedback(''); }
  };
  const stars = score >= 420 ? 3 : score >= 300 ? 2 : 1;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#f4efe5] text-[#173a34] pb-24">
      <header className="border-b border-[#173a34]/10 bg-[#f4efe5]/90 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm font-bold hover:text-[#e26a3b]"><ArrowLeft className="w-4 h-4" /> 返回訓練場</button>
          <div className="font-black tracking-tight">MEMO<span className="text-[#e26a3b]">QUEST</span></div>
          <div className="text-xs font-bold rounded-full border border-[#173a34]/15 px-3 py-1.5">BEST {bestScore}</div>
        </div>
      </header>

      {phase === 'choose' && (
        <section className="mx-auto max-w-6xl px-4 py-10 md:py-16">
          <div className="grid lg:grid-cols-[1.05fr_.95fr] gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#dce9c7] px-3 py-1.5 text-xs font-extrabold tracking-wider"><Sparkles className="w-4 h-4" /> TALENT CARD ADVENTURE</div>
              <h1 className="mt-5 text-5xl md:text-7xl font-black leading-[.95] tracking-[-.055em]">把語言天份<br />變成你的<span className="text-[#e26a3b]">卡牌技能</span></h1>
              <p className="mt-6 max-w-xl text-lg text-[#355b54] leading-relaxed">我把外語能力拆成像積木一樣可組合的卡牌。抽出咖啡店、機場、遊戲公會、面試等情境任務，再選最適合的策略卡解題。</p>
              <div className="mt-7 flex flex-wrap gap-3 text-sm font-bold"><span className="rounded-xl bg-white px-4 py-3 shadow-sm">6 個情境關卡</span><span className="rounded-xl bg-white px-4 py-3 shadow-sm">12 張策略卡</span><span className="rounded-xl bg-white px-4 py-3 shadow-sm">即時能力回饋</span></div>
            </div>
            <div className="relative min-h-[420px] flex items-center justify-center">
              <div className="absolute w-72 h-72 rounded-full bg-[#dce9c7] blur-2xl opacity-80" />
              {CARDS.slice(0, 3).map((card, index) => (
                <div key={card.id} className="absolute w-56 h-80 rounded-[28px] border-4 border-white p-5 shadow-2xl flex flex-col justify-between text-white transition-transform" style={{ background: ABILITY_COLOR[card.ability], transform: `translateX(${(index - 1) * 115}px) rotate(${(index - 1) * 10}deg) translateY(${Math.abs(index - 1) * 22}px)`, zIndex: index === 1 ? 3 : 2 }}>
                  <div className="text-5xl">{card.icon}</div><div><div className="text-xs font-black opacity-70">{ABILITY_LABEL[card.ability]}</div><h3 className="text-2xl font-black mt-1">{card.title}</h3><p className="text-sm mt-2 opacity-85">{card.subtitle}</p></div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-10 border-t border-[#173a34]/15 pt-8">
            <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-black tracking-widest text-[#e26a3b]">CHOOSE YOUR TALENT</p><h2 className="text-2xl font-black mt-1">選擇這局的天份角色</h2></div><Button onClick={start} className="rounded-full bg-[#173a34] hover:bg-[#28564d] px-6">開始冒險 <ChevronRight className="w-4 h-4 ml-1" /></Button></div>
            <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
              {(Object.keys(GENIUS_INFO) as GeniusType[]).map(type => { const item = GENIUS_INFO[type]; const active = talent === type; return <button key={type} onClick={() => setTalent(type)} className={`text-left rounded-2xl border p-4 transition-all ${active ? 'bg-[#173a34] text-white border-[#173a34] -translate-y-1 shadow-lg' : 'bg-white/70 border-[#173a34]/10 hover:border-[#173a34]/35'}`}><div className="text-xl">{item.emoji}</div><div className="font-black mt-2">{item.nameZh}</div><div className={`text-xs mt-1 ${active ? 'text-white/70' : 'text-[#57736e]'}`}>{TALENT_TAGLINES[type]}</div></button>; })}
            </div>
          </div>
        </section>
      )}

      {phase === 'play' && (
        <section className="mx-auto max-w-6xl px-4 py-6 md:py-10">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3"><div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center text-xl shadow-sm">{info.emoji}</div><div><div className="font-black">{info.nameZh}牌組</div><div className="text-xs text-[#57736e]">{TALENT_TAGLINES[talent]}</div></div></div>
            <div className="flex items-center gap-4 text-sm font-black"><span className="flex gap-1">{[0,1,2,3].map(i => <Heart key={i} className={`w-5 h-5 ${i < energy ? 'fill-[#e26a3b] text-[#e26a3b]' : 'text-[#baa]'}`} />)}</span><span>COMBO ×{combo}</span><span>{score} XP</span></div>
          </div>
          <div className="grid lg:grid-cols-[1.1fr_.9fr] gap-6">
            <div className="rounded-[32px] bg-[#173a34] text-white p-6 md:p-9 min-h-[390px] flex flex-col relative overflow-hidden">
              <div className="absolute -right-16 -top-16 w-52 h-52 rounded-full bg-[#dce9c7]/10" />
              <div className="flex items-center gap-3"><span className="rounded-full bg-white/10 px-3 py-1 text-xs font-black">情境任務・{scene.place}</span><span className="text-xs text-white/60">ROUND {round + 1}/{ROUNDS.length}</span></div>
              <div className="mt-12"><p className="text-xs font-black tracking-widest text-[#dce9c7]">{scene.speaker}</p><h2 className="mt-3 text-3xl md:text-5xl font-black leading-tight">“{scene.prompt}”</h2><p className="mt-5 text-white/65">任務：{scene.goal}</p></div>
              {selected && <div className="mt-auto pt-8"><div className="rounded-2xl bg-white text-[#173a34] p-4"><p className="text-xs font-black text-[#e26a3b]">你的回應</p><p className="font-bold mt-1">“{selected.sentence}”</p></div><p className="text-sm mt-4 text-[#dce9c7]">MIA：{scene.reply}</p></div>}
            </div>
            <aside className="rounded-[32px] bg-white p-6 md:p-8 shadow-sm border border-[#173a34]/10">
              {!selected ? <><p className="text-xs font-black tracking-widest text-[#e26a3b]">YOUR HAND</p><h2 className="text-2xl font-black mt-1">你要打出哪張策略卡？</h2><div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">{hand.map(card => <button key={card.id} onClick={() => playCard(card)} className="group min-h-40 rounded-2xl border-2 p-4 text-left hover:-translate-y-1 hover:shadow-lg transition-all" style={{ borderColor: `${ABILITY_COLOR[card.ability]}55`, background: `${ABILITY_COLOR[card.ability]}0d` }}><div className="flex justify-between"><span className="text-3xl">{card.icon}</span>{card.talents.includes(talent) && <span className="text-[10px] font-black rounded-full bg-[#dce9c7] px-2 py-1 h-fit">天份加成</span>}</div><h3 className="mt-4 font-black text-lg">{card.title}</h3><p className="text-xs text-[#57736e] mt-1">{card.subtitle}</p><div className="mt-4 text-[11px] font-black" style={{ color: ABILITY_COLOR[card.ability] }}>{card.effect}</div></button>)}</div></> : <div className="h-full flex flex-col"><div className={`w-14 h-14 rounded-full flex items-center justify-center ${selected.ability === scene.best ? 'bg-[#dce9c7]' : 'bg-[#f6dfd5]'}`}>{selected.ability === scene.best ? <Check className="w-7 h-7" /> : <Brain className="w-7 h-7" />}</div><h2 className="text-2xl font-black mt-5">{feedback}</h2><div className="mt-5 rounded-2xl bg-[#f4efe5] p-4"><p className="text-xs font-black text-[#57736e]">語言拆招</p><p className="mt-2 font-bold">{selected.sentence}</p><p className="text-sm text-[#57736e] mt-2">不用背完整答案，記住這個句型開頭，下次可以替換內容再出牌。</p></div><Button onClick={next} className="mt-auto rounded-full bg-[#e26a3b] hover:bg-[#cc582d]">{round === ROUNDS.length - 1 || energy === 0 ? '查看結算' : '下一個情境'} <ChevronRight className="w-4 h-4 ml-1" /></Button></div>}
            </aside>
          </div>
          <div className="mt-6 flex items-center gap-4"><Progress value={((round + (selected ? 1 : 0)) / ROUNDS.length) * 100} className="h-2" /><span className="text-xs font-black whitespace-nowrap">QUEST PROGRESS</span></div>
        </section>
      )}

      {phase === 'result' && (
        <section className="mx-auto max-w-2xl px-4 py-14 text-center">
          <div className="rounded-[36px] bg-white border border-[#173a34]/10 p-8 md:p-12 shadow-xl">
            <div className="mx-auto w-20 h-20 rounded-full bg-[#dce9c7] flex items-center justify-center"><Zap className="w-9 h-9 fill-[#173a34]" /></div>
            <p className="mt-6 text-xs font-black tracking-[.25em] text-[#e26a3b]">QUEST COMPLETE</p><h1 className="mt-2 text-4xl font-black">語言卡牌任務完成！</h1>
            <div className="mt-6 flex justify-center gap-2">{[0,1,2].map(i => <Star key={i} className={`w-10 h-10 ${i < stars ? 'fill-[#efb83b] text-[#efb83b]' : 'text-[#ddd6ca]'}`} />)}</div>
            <div className="mt-8 grid grid-cols-3 gap-3"><div className="rounded-2xl bg-[#f4efe5] p-4"><div className="text-2xl font-black">{score}</div><div className="text-xs text-[#57736e]">總 XP</div></div><div className="rounded-2xl bg-[#f4efe5] p-4"><div className="text-2xl font-black">{combo}</div><div className="text-xs text-[#57736e]">最高連擊</div></div><div className="rounded-2xl bg-[#f4efe5] p-4"><div className="text-2xl font-black">+{stars * 20}</div><div className="text-xs text-[#57736e]">天份熟練</div></div></div>
            <p className="mt-7 text-[#57736e]">你的「{info.nameZh}」天份在這局把學習策略變成了可使用的英文句型。接著到 Practice，把句型放進真正的 AI 對話。</p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center"><Button variant="outline" className="rounded-full" onClick={start}><RotateCcw className="w-4 h-4 mr-2" />再玩一次</Button><Button className="rounded-full bg-[#173a34]" onClick={() => navigate(`/practice?lang=english&prompt=${encodeURIComponent('Let’s role-play ordering at a café. Help me practice the phrases I just learned, one turn at a time.')}`)}>進入 AI 實戰 <ChevronRight className="w-4 h-4 ml-1" /></Button></div>
          </div>
        </section>
      )}
    </main>
  );
}
