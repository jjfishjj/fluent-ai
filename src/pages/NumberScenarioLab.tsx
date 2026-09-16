import { FormEvent, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpenCheck,
  CheckCircle2,
  ChevronDown,
  Eye,
  Lightbulb,
  RefreshCw,
  Shuffle,
  Sparkles,
  UserRoundPen,
  WandSparkles,
} from 'lucide-react';
import { chunkNumber, CODE_WORDS } from '@/lib/number-codebook';

type Scenario = {
  id: string;
  category: string;
  title: string;
  pain: string;
  digits: string;
  format: string;
  sample: string;
  prompt: string;
  chunks: { code: string; image: string }[];
  actions: string[];
  answer: string;
  answers?: string[];
  color: string;
  emoji: string;
};

const scenarios: Scenario[] = [
  {
    id: 'door', category: '個人生活', title: '電子鎖／門禁密碼', pain: '回家時不能看提示，必須一次輸入正確。',
    digits: '4–6 位數', format: '電子鎖數字鍵盤', sample: '882019', prompt: '你走到家門口，鍵盤只亮五秒。請把密碼拍成一個會動的腦內短片。',
    chunks: [{ code: '88', image: '兩個雪人' }, { code: '20', image: '耳環' }, { code: '19', image: '藥酒' }],
    actions: ['追逐', '搶走', '撞碎', '吞下', '噴出', '凍結'],
    answer: '兩個雪人追著一只巨大的耳環跑；雪人搶走耳環，卻撞碎一缸藥酒，藥酒瞬間噴滿整扇門。', color: '#5eead4', emoji: '🔐',
  },
  {
    id: 'phone', category: '個人生活', title: '重要親友電話', pain: '手機沒電時，仍能借電話完成緊急聯絡。',
    digits: '10 位數', format: '手機撥號畫面', sample: '0912-345-678', prompt: '手機只剩 1% 電量。把電話號碼轉成一段能立刻重播的求救電影。',
    chunks: [{ code: '09', image: '靈柩' }, { code: '12', image: '嬰兒' }, { code: '34', image: '紳士' }, { code: '56', image: '蝸牛' }, { code: '78', image: '西瓜' }],
    actions: ['推開', '抱起', '呼叫', '騎著', '劈開', '飛越'],
    answer: '嬰兒推開靈柩跳出來，呼叫紳士；紳士騎著蝸牛飛越街道，最後劈開西瓜找到電話。', color: '#67e8f9', emoji: '📱',
  },
  {
    id: 'parking', category: '個人生活', title: '車牌與車位', pain: '逛完街後能直接找到車，不在停車場繞圈。',
    digits: '4–7 位數', format: '車牌＋地下停車格', sample: 'BFG-8819／B3-508', prompt: '你剛停好車。把車牌與樓層做成一幕發生在停車格上的誇張事件。',
    chunks: [{ code: '88', image: '兩個雪人' }, { code: '19', image: '藥酒' }, { code: '50', image: '武林高手' }, { code: '08', image: '籬笆' }],
    actions: ['守住', '倒進', '踢飛', '纏住', '變大', '爆開'],
    answer: '兩個雪人守住 B3 車位，把藥酒倒進引擎；武林高手踢飛籬笆，籬笆變大後纏住車牌。', color: '#93c5fd', emoji: '🅿️',
  },
  {
    id: 'id', category: '個人生活', title: '證件號碼', pain: '線上填表時不用反覆拿出證件核對。',
    digits: '8–12 位數', format: '證件卡面', sample: '1234-5678-9012', prompt: '證件卡突然活了起來。請讓每組圖像在卡面上完成一連串動作。',
    chunks: [{ code: '12', image: '嬰兒' }, { code: '34', image: '紳士' }, { code: '56', image: '蝸牛' }, { code: '78', image: '西瓜' }, { code: '90', image: '酒瓶' }, { code: '12', image: '嬰兒' }],
    actions: ['交給', '踩上', '鑽入', '切開', '喝光', '變身'],
    answer: '嬰兒把證件交給紳士；紳士踩上蝸牛，鑽進西瓜，再切開酒瓶，最後變回另一個嬰兒。', color: '#c4b5fd', emoji: '🪪',
  },
  {
    id: 'card', category: '金融消費', title: '信用卡號碼與安全碼', pain: '限量商品結帳時，能迅速完成輸入。',
    digits: '16 位＋CVC', format: '3D 信用卡', sample: '4579-1234-5678-9012', prompt: '信用卡變成一座微型舞台。請創作一個依序經過每組圖像的搶購故事。',
    chunks: [{ code: '45', image: '師父' }, { code: '79', image: '氣球' }, { code: '12', image: '嬰兒' }, { code: '34', image: '紳士' }, { code: '56', image: '蝸牛' }, { code: '78', image: '西瓜' }],
    actions: ['抓住', '放飛', '交棒', '追趕', '撞進', '炸開'],
    answer: '師父抓住氣球升空，把購物袋交棒給嬰兒；紳士追趕騎蝸牛的嬰兒，大家撞進西瓜後炸開結帳畫面。', color: '#f9a8d4', emoji: '💳',
  },
  {
    id: 'bank', category: '金融消費', title: '銀行／郵局帳戶', pain: '朋友分帳時可以直接、流暢地念出帳號。',
    digits: '12–14 位數', format: '轉帳 App', sample: '700-002123456789', prompt: '把帳號想成一條輸送帶。每個轉碼物件都必須把下一個物件帶進畫面。',
    chunks: [{ code: '70', image: '麒麟' }, { code: '00', image: '望遠鏡' }, { code: '21', image: '鱷魚' }, { code: '23', image: '和尚' }, { code: '45', image: '師父' }, { code: '67', image: '流星' }, { code: '89', image: '芭蕉' }],
    actions: ['馱著', '瞄準', '咬住', '召喚', '接住', '點燃'],
    answer: '麒麟馱著望遠鏡，瞄準咬住存摺的鱷魚；鱷魚召喚和尚與師父，兩人接住流星並點燃一片芭蕉。', color: '#86efac', emoji: '🏦',
  },
  {
    id: 'history', category: '學科知識', title: '歷史事件與法條年代', pain: '相近年代容易互相干擾，需要事件與年份雙向連結。',
    digits: '4 位數', format: '歷史事件卡', sample: '1789／1911', prompt: '不要只背年份。請讓轉碼角色直接參與歷史事件，並留下因果動作。',
    chunks: [{ code: '17', image: '儀器' }, { code: '89', image: '芭蕉' }, { code: '19', image: '藥酒' }, { code: '11', image: '筷子' }],
    actions: ['測量', '砍倒', '點燃', '推翻', '高舉', '敲響'],
    answer: '1789：革命群眾用儀器測量城牆，再用芭蕉把城門砍倒。1911：藥酒被點燃，兩根筷子高舉成革命旗幟。', color: '#fbbf24', emoji: '📜',
  },
  {
    id: 'presentation', category: '職場知識', title: '簡報數據與產品規格', pain: '上台不用盯講稿，也能準確說出關鍵數字。',
    digits: '4–8 位數', format: '商業 Dashboard', sample: 'RTX 4090／Q3 8520萬', prompt: '想像你在台上展示產品。讓數字圖像直接改造產品或圖表。',
    chunks: [{ code: '40', image: '司令' }, { code: '90', image: '酒瓶' }, { code: '85', image: '白虎' }, { code: '20', image: '耳環' }],
    actions: ['下令', '灌入', '撕開', '拖曳', '暴增', '照亮'],
    answer: '司令對 RTX 下令，把酒瓶灌進顯示卡；白虎撕開 Q3 圖表，拖曳巨型耳環，營收柱立刻暴增到 8520 萬。', color: '#fb923c', emoji: '📊',
  },
  {
    id: 'science', category: '學科知識', title: '科學常數與地理數據', pain: '抽象的常數與高度缺乏具體畫面。',
    digits: '4–8 位數', format: '科學／地理卡', sample: '玉山 3952m／π 3.1415926', prompt: '讓數字圖像改變地形或實驗結果，建立「數字＋單位＋意義」的完整記憶。',
    chunks: [{ code: '39', image: '山鳩' }, { code: '52', image: '鼓兒' }, { code: '31', image: '鯊魚' }, { code: '41', image: '司儀' }, { code: '59', image: '五角星' }, { code: '26', image: '河流' }],
    actions: ['飛越', '敲擊', '游過', '宣布', '旋轉', '沖刷'],
    answer: '玉山 3952m：山鳩飛越山頂，敲擊一面 52 公尺的大鼓。π：鯊魚游過圓圈，司儀宣布五角星開始旋轉，最後被河流沖刷成 3.1415926。', color: '#a7f3d0', emoji: '🔬',
  },
];

const categoryOptions = ['全部', '個人生活', '金融消費', '學科知識', '職場知識', '自我輸入'];

const storyActions = [
  ['突然撞見', '一把抓住', '高速追趕', '一起跌進', '最後炸開'],
  ['用力推倒', '立刻喚醒', '接著騎上', '張嘴吞下', '最後變成'],
  ['從背後嚇到', '伸手拉住', '用力丟向', '噴出光包住', '最後衝向'],
] as const;

const randomLengths: Record<string, number> = {
  door: 6, phone: 10, parking: 6, id: 12, card: 16,
  bank: 14, history: 4, presentation: 6, science: 8,
};

function buildStoryOptions(chunks: Scenario['chunks'], setting: string) {
  return storyActions.map((actions, version) => {
    const links = chunks.slice(1).map((chunk, index) => {
      const action = actions[index % actions.length];
      return `${chunks[index].image}${action}${chunk.image}`;
    }).join('；');
    const endings = ['，整個畫面定格成你要記住的數字。', '，結果在現場留下巨大的數字軌跡。', '，最後所有角色排成原本的數字順序。'];
    return `在「${setting}」裡，${links}${endings[version]}`;
  });
}

function createRandomDigits(length: number) {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
}

function buildCustomScenario(title: string, rawDigits: string, context: string): Scenario | null {
  const digits = rawDigits.replace(/\D/g, '');
  const codes = chunkNumber(rawDigits);
  if (!title.trim() || digits.length < 2 || digits.length > 20 || !codes.length) return null;
  const chunks = codes.map((code) => ({ code, image: CODE_WORDS[Number(code)] }));
  const setting = context.trim() || title.trim();
  const answers = buildStoryOptions(chunks, setting);
  return {
    id: 'custom', category: '自我輸入', title: title.trim(), pain: `這是你自己建立的「${title.trim()}」記憶任務。`,
    digits: `${digits.length} 位數`, format: context.trim() || '自訂真實情境', sample: rawDigits.trim(),
    prompt: `系統已依 00–99 轉碼表拆解數字，並自動用動作與因果把圖像串成故事。`,
    chunks, actions: [], answer: answers[0], answers, color: '#d9ff73', emoji: '✍️',
  };
}

export default function NumberScenarioLab() {
  const [category, setCategory] = useState('全部');
  const filtered = useMemo(() => category === '全部' ? scenarios : scenarios.filter((item) => item.category === category), [category]);
  const [scenarioId, setScenarioId] = useState(scenarios[0].id);
  const [story, setStory] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customDigits, setCustomDigits] = useState('');
  const [customContext, setCustomContext] = useState('');
  const [customError, setCustomError] = useState('');
  const [customScenario, setCustomScenario] = useState<Scenario | null>(null);
  const [randomizedScenario, setRandomizedScenario] = useState<Scenario | null>(null);
  const baseScenario = scenarios.find((item) => item.id === scenarioId) ?? scenarios[0];
  const scenario = scenarioId === 'custom' && customScenario ? customScenario : randomizedScenario?.id === scenarioId ? randomizedScenario : baseScenario;

  const chooseScenario = (id: string) => {
    setScenarioId(id); setRandomizedScenario(null); setStory(''); setRevealed(false); setSubmitted(false);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (story.trim()) setSubmitted(true);
  };

  const randomScenario = () => {
    const length = randomLengths[baseScenario.id] ?? 6;
    const digits = createRandomDigits(length);
    const codes = chunkNumber(digits);
    const chunks = codes.map((code) => ({ code, image: CODE_WORDS[Number(code)] }));
    const answers = buildStoryOptions(chunks, baseScenario.title);
    setRandomizedScenario({
      ...baseScenario,
      sample: codes.join('-'),
      chunks,
      answer: answers[0],
      answers,
    });
    setStory(''); setRevealed(false); setSubmitted(false);
  };

  const generateCustom = (event: FormEvent) => {
    event.preventDefault();
    const generated = buildCustomScenario(customTitle, customDigits, customContext);
    if (!generated) {
      setCustomError('請輸入名稱，以及 2–20 位的數字；空格與「-」可以保留，系統會自動清除。');
      return;
    }
    setCustomError(''); setCustomScenario(generated); chooseScenario('custom');
  };

  return (
    <div className="min-h-screen bg-[#f4f2ed] pb-24 text-[#1d2523]">
      <header className="border-b border-black/10 bg-[#f4f2ed]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
          <Link to="/practice" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-950"><ArrowLeft className="h-4 w-4" />返回訓練場</Link>
          <div className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-black tracking-[.16em]">SCENE CODE LAB</div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
        <section className="grid gap-8 lg:grid-cols-[1.05fr_.95fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-[#d9ff73] px-3 py-1.5 text-xs font-black"><Sparkles className="h-4 w-4" />數字不是答案，是故事的分鏡</div>
            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-[1.05] tracking-tight md:text-6xl">把生活中的數字，<br />拍成忘不掉的腦內電影。</h1>
          </div>
          <p className="max-w-xl text-sm font-medium leading-7 text-slate-600 md:text-base">從真實情境選題，或輸入自己要記憶的數字。系統會自動切成兩碼圖像並用動作、衝突與結果串成故事；你也可以先自行聯想，再展開參考答案。</p>
        </section>

        <div className="mt-10 flex gap-2 overflow-x-auto pb-2" aria-label="情境分類">
          {categoryOptions.map((item) => <button key={item} onClick={() => setCategory(item)} className={`shrink-0 rounded-full border px-4 py-2 text-sm font-black transition ${category === item ? 'border-[#17211f] bg-[#17211f] text-white' : item === '自我輸入' ? 'border-lime-300 bg-[#efffc1] hover:border-lime-500' : 'border-black/10 bg-white hover:border-black/30'}`}>{item === '自我輸入' ? '＋ 自我輸入' : item}</button>)}
        </div>

        {category === '自我輸入' && <form onSubmit={generateCustom} className="mt-4 rounded-[26px] border border-black/10 bg-white p-5 shadow-sm md:p-7">
          <div className="flex items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#d9ff73]"><UserRoundPen className="h-5 w-5" /></div><div><h2 className="text-xl font-black">建立自己的記憶任務</h2><p className="mt-1 text-sm leading-6 text-slate-500">輸入需要記住的數字，系統會使用目前的 00–99 轉碼資料庫自動分段、配圖並產生三套故事。</p></div></div>
          <div className="mt-6 grid gap-4 md:grid-cols-[1fr_1fr_1.2fr]">
            <label className="text-sm font-black">要記憶的東西<input value={customTitle} onChange={(event) => setCustomTitle(event.target.value)} className="mt-2 h-12 w-full rounded-xl border-2 border-slate-200 bg-[#fbfbf8] px-4 font-medium outline-none focus:border-[#17211f]" placeholder="例如：媽媽的電話" /></label>
            <label className="text-sm font-black">數字<input value={customDigits} onChange={(event) => setCustomDigits(event.target.value)} inputMode="numeric" className="mt-2 h-12 w-full rounded-xl border-2 border-slate-200 bg-[#fbfbf8] px-4 font-mono font-bold outline-none focus:border-[#17211f]" placeholder="例如：0912-345-678" /></label>
            <label className="text-sm font-black">發生情境（選填）<input value={customContext} onChange={(event) => setCustomContext(event.target.value)} className="mt-2 h-12 w-full rounded-xl border-2 border-slate-200 bg-[#fbfbf8] px-4 font-medium outline-none focus:border-[#17211f]" placeholder="例如：手機沒電時借電話求救" /></label>
          </div>
          {customError && <p role="alert" className="mt-3 text-sm font-bold text-rose-600">{customError}</p>}
          <button type="submit" className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#17211f] px-6 font-black text-white hover:bg-black md:w-auto"><WandSparkles className="h-4 w-4" />自動轉碼並產生故事</button>
        </form>}

        {category !== '自我輸入' && <section className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <button key={item.id} onClick={() => chooseScenario(item.id)} className={`group rounded-[22px] border p-5 text-left transition ${scenario.id === item.id ? 'border-[#17211f] bg-[#17211f] text-white shadow-xl' : 'border-black/10 bg-white hover:-translate-y-1 hover:border-black/30'}`}>
              <div className="flex items-start justify-between"><span className="text-3xl">{item.emoji}</span><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${scenario.id === item.id ? 'bg-white/10' : 'bg-slate-100 text-slate-600'}`}>{item.category}</span></div>
              <h2 className="mt-5 text-lg font-black">{item.title}</h2><p className={`mt-2 text-xs leading-5 ${scenario.id === item.id ? 'text-slate-300' : 'text-slate-500'}`}>{item.digits} · {item.format}</p>
            </button>
          ))}
        </section>}

        {(category !== '自我輸入' || customScenario) && <section className="mt-8 overflow-hidden rounded-[30px] border border-black/10 bg-white shadow-[0_25px_80px_-45px_rgba(15,23,42,.45)]">
          <div className="grid lg:grid-cols-[.82fr_1.18fr]">
            <aside className="relative overflow-hidden bg-[#17211f] p-6 text-white md:p-8">
              <div className="absolute right-[-20%] top-[-10%] h-64 w-64 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: scenario.color }} />
              <div className="relative">
                <div className="text-xs font-black tracking-[.2em] text-[#d9ff73]">MISSION BRIEF</div>
                <h2 className="mt-3 text-3xl font-black">{scenario.emoji} {scenario.title}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-300">{scenario.prompt}</p>
                <p className="mt-3 rounded-xl border border-white/10 bg-black/10 px-3 py-2 text-xs leading-5 text-slate-400">真實痛點：{scenario.pain}</p>
                <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="text-[11px] font-black tracking-widest text-slate-400">本題數字</div>
                  <div className="mt-2 break-words font-mono text-3xl font-black tracking-wider" data-testid="scenario-number">{scenario.sample}</div>
                </div>
                <div className="mt-6">
                  <div className="flex items-center justify-between text-xs font-black"><span>兩碼分鏡</span><span className="text-slate-400">依序串接</span></div>
                  <div className="mt-3 space-y-2">
                    {scenario.chunks.map((chunk, index) => <div key={`${chunk.code}-${index}`} className="flex items-center gap-3 rounded-xl bg-white/7 p-3"><span className="flex h-9 w-11 items-center justify-center rounded-lg bg-white/10 font-mono font-black" style={{ color: scenario.color }}>{chunk.code}</span><ArrowRight className="h-4 w-4 text-slate-500" /><span className="text-sm font-bold">{chunk.image}</span></div>)}
                  </div>
                </div>
              </div>
            </aside>

            <form onSubmit={submit} className="p-6 md:p-8">
              <div className="flex items-start justify-between gap-4">
                <div><div className="text-xs font-black tracking-[.18em] text-slate-400">STORY STUDIO</div><h3 className="mt-2 text-2xl font-black">寫下你看見的情境</h3></div>
                {scenario.id !== 'custom' && <button type="button" onClick={randomScenario} className="inline-flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-black hover:bg-slate-50"><Shuffle className="h-4 w-4" />換一組亂數</button>}
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-500">不用挑選動詞。請先自由想像；參考答案會依圖像關係，自動加入連續動作與因果。</p>
              <label htmlFor="memory-story" className="mt-6 block text-sm font-black">我的聯想故事</label>
              <textarea id="memory-story" value={story} onChange={(event) => { setStory(event.target.value); setSubmitted(false); }} rows={7} className="mt-2 w-full resize-none rounded-2xl border-2 border-slate-200 bg-[#fbfbf8] p-4 text-base font-medium leading-7 outline-none transition placeholder:text-slate-400 focus:border-[#17211f]" placeholder={`例如：${scenario.chunks[0].image}突然遇見下一個圖像……`} />
              <div className="mt-3 flex justify-end text-xs text-slate-400">{story.trim().length} 字</div>
              <button type="submit" disabled={!story.trim()} className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#17211f] font-black text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40"><WandSparkles className="h-4 w-4" />完成我的聯想</button>
              {submitted && <div className="mt-4 flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-900"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /><span>已完成！先閉眼重播一次你的故事，再嘗試只看故事反推數字。</span></div>}

              <div className="mt-6 border-t pt-6">
                <button type="button" aria-expanded={revealed} onClick={() => setRevealed((value) => !value)} className="flex w-full items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left text-sm font-black text-amber-950">
                  <span className="flex items-center gap-2">{revealed ? <Eye className="h-5 w-5" /> : <Lightbulb className="h-5 w-5" />}{revealed ? '收起參考答案' : '沒有靈感？展開參考答案'}</span><ChevronDown className={`h-5 w-5 transition ${revealed ? 'rotate-180' : ''}`} />
                </button>
                {revealed && <div className="mt-3 rounded-2xl border border-amber-200 bg-[#fffbeb] p-5" data-testid="reference-answer"><div className="flex items-center gap-2 text-xs font-black tracking-wider text-amber-700"><BookOpenCheck className="h-4 w-4" />{scenario.answers ? '三套自動故事（選一套再改寫）' : '參考分鏡（沒有唯一答案）'}</div><div className="mt-3 space-y-3">{(scenario.answers ?? [scenario.answer]).map((answer, index) => <div key={answer} className="rounded-xl border border-amber-200/70 bg-white/60 p-4"><div className="text-[11px] font-black text-amber-700">版本 {index + 1}</div><p className="mt-2 text-sm font-semibold leading-7 text-amber-950">{answer}</p><button type="button" onClick={() => { setStory(answer); setSubmitted(false); }} className="mt-3 inline-flex items-center gap-2 text-xs font-black text-amber-800 underline underline-offset-4"><RefreshCw className="h-3.5 w-3.5" />帶入後再改寫</button></div>)}</div></div>}
              </div>
            </form>
          </div>
        </section>}

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {[['01', '圖像登場', '先讓每一組兩碼都有明確角色或物件。'], ['02', '動作相撞', '用追逐、吞下、爆開等多個動詞建立因果。'], ['03', '遮住反推', '閉眼重播故事，依序把圖像還原成原始數字。']].map(([number, title, copy]) => <div key={number} className="rounded-2xl border border-black/10 bg-white p-5"><div className="font-mono text-xs font-black text-slate-400">{number}</div><div className="mt-3 font-black">{title}</div><p className="mt-2 text-sm leading-6 text-slate-500">{copy}</p></div>)}
        </section>
      </main>
    </div>
  );
}
