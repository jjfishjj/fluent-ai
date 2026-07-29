import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Award, BarChart3, Check, ChevronRight, CircleHelp, Coins, Flame, Heart, Lock, Mic, MousePointer2, RotateCcw, ShieldCheck, Sparkles, Star, Trophy, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { GENIUS_INFO, GeniusType, loadGeniusType } from '@/lib/genius-type';
import { streamChat } from '@/lib/stream-chat';
import { ABILITY_COLOR, ABILITY_LABEL, GAME_BADGES, GAME_CARDS, GAME_SCENARIOS, GameBadge, GameCard, GameScenario, TALENT_TAGLINES } from '@/lib/talent-card-game';
import { getQueuedTalentEvents, isTalentAnalyticsEnabled, setTalentAnalyticsEnabled, summarizeTalentEvents, trackTalentGameEvent } from '@/lib/talent-game-analytics';

type Phase = 'home' | 'map' | 'play' | 'result' | 'collection';
type TutorialStep = 'intro' | 'start' | 'map' | 'card' | 'input' | 'submit' | 'feedback' | null;
interface SaveData { xp: number; coins: number; streak: number; lastLogin: string; unlocked: string[]; levels: Record<string, number>; completed: string[]; dailyClaimed: string; badges: string[]; }

const SAVE_KEY = 'talent_card_game_save_v2';
const TUTORIAL_KEY = 'talent_card_game_tutorial_completed_v1';
const today = () => new Date().toISOString().slice(0, 10);
const freshSave = (): SaveData => ({ xp: 0, coins: 100, streak: 1, lastLogin: today(), unlocked: GAME_CARDS.filter(c => c.rarity === 'common').map(c => c.id), levels: {}, completed: [], dailyClaimed: '', badges: [] });
const loadSave = (): SaveData => {
  try {
    const base = freshSave();
    const parsed = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}') as Partial<SaveData>;
    return {
      ...base,
      ...parsed,
      unlocked: Array.from(new Set([...base.unlocked, ...(parsed.unlocked || [])])),
      completed: parsed.completed || base.completed,
      badges: parsed.badges || base.badges,
      levels: parsed.levels || base.levels,
    };
  } catch {
    return freshSave();
  }
};
const playerLevel = (xp: number) => Math.floor(xp / 300) + 1;
const badgeById = (id: string) => GAME_BADGES.find(badge => badge.id === id);

export default function TalentCardGame() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('home');
  const [talent, setTalent] = useState<GeniusType>(() => loadGeniusType() || 'explorer');
  const [save, setSave] = useState<SaveData>(loadSave);
  const [scenario, setScenario] = useState<GameScenario>(GAME_SCENARIOS[0]);
  const [round, setRound] = useState(0);
  const [energy, setEnergy] = useState(3);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [selected, setSelected] = useState<GameCard | null>(null);
  const [answer, setAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [aiFeedback, setAiFeedback] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [reward, setReward] = useState<string[]>([]);
  const [newBadges, setNewBadges] = useState<GameBadge[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [answerMethod, setAnswerMethod] = useState<'text' | 'voice'>('text');
  const [analyticsEnabled, setAnalyticsEnabled] = useState(isTalentAnalyticsEnabled);
  const [analyticsEvents, setAnalyticsEvents] = useState(getQueuedTalentEvents);
  const [tutorialStep, setTutorialStep] = useState<TutorialStep>(() => {
    const replay = new URLSearchParams(window.location.search).get('tutorial') === '1';
    return replay || localStorage.getItem(TUTORIAL_KEY) !== 'true' ? 'intro' : null;
  });
  const activeScenario = useRef<{ id: string; highestRound: number; startedAt: number } | null>(null);
  const info = GENIUS_INFO[talent];
  const current = scenario.rounds[round];
  const level = playerLevel(save.xp);
  const initialAnalyticsContext = useRef({ talent, level });
  const latestRoundContext = useRef({ talent, level, energy });
  latestRoundContext.current = { talent, level, energy };
  const analyticsSummary = useMemo(() => summarizeTalentEvents(analyticsEvents), [analyticsEvents]);

  useEffect(() => { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); }, [save]);
  useEffect(() => {
    const todayValue = today();
    if (save.lastLogin !== todayValue) setSave(s => ({ ...s, lastLogin: todayValue, streak: s.streak + 1 }));
  }, [save.lastLogin]);
  useEffect(() => {
    const initial = initialAnalyticsContext.current;
    trackTalentGameEvent('session_started', { talent: initial.talent }, { player_level: initial.level, app_version: 'memoquest-analytics-v1' });
    const refresh = () => setAnalyticsEvents(getQueuedTalentEvents());
    window.addEventListener('talent-game-event', refresh);
    return () => window.removeEventListener('talent-game-event', refresh);
  }, []);
  useEffect(() => {
    trackTalentGameEvent('screen_viewed', { talent }, { screen: phase });
  }, [phase, talent]);
  useEffect(() => {
    if (phase !== 'play') return;
    if (activeScenario.current) activeScenario.current.highestRound = Math.max(activeScenario.current.highestRound, round);
    const context = latestRoundContext.current;
    trackTalentGameEvent('round_viewed', { scenario_id: scenario.id, round_index: round, talent: context.talent }, { energy: context.energy, player_level: context.level });
  }, [phase, round, scenario.id]);
  useEffect(() => {
    const captureAbandonment = () => {
      const active = activeScenario.current;
      if (!active) return;
      trackTalentGameEvent('scenario_abandoned', { scenario_id: active.id, round_index: active.highestRound, talent }, { elapsed_seconds: Math.round((Date.now() - active.startedAt) / 1000) });
      activeScenario.current = null;
    };
    window.addEventListener('pagehide', captureAbandonment);
    return () => window.removeEventListener('pagehide', captureAbandonment);
  }, [talent]);
  useEffect(() => {
    if (tutorialStep === 'start' && phase === 'map') setTutorialStep('map');
    else if (tutorialStep === 'map' && phase === 'play') setTutorialStep('card');
    else if (tutorialStep === 'card' && selected) setTutorialStep('input');
    else if (tutorialStep === 'input' && answer.trim()) setTutorialStep('submit');
    else if (tutorialStep === 'submit' && feedback) setTutorialStep('feedback');
  }, [tutorialStep, phase, selected, answer, feedback]);

  const beginTutorial = () => {
    setPhase('home'); setSelected(null); setAnswer(''); setFeedback(''); setTutorialStep('start');
  };
  const finishTutorial = () => {
    localStorage.setItem(TUTORIAL_KEY, 'true');
    setTutorialStep(null);
  };

  const ownedCards = useMemo(() => GAME_CARDS.filter(c => save.unlocked.includes(c.id) || c.talents.includes(talent)), [save.unlocked, talent]);
  const hand = useMemo(() => {
    const talentCards = ownedCards.filter(c => c.talents.includes(talent));
    const common = ownedCards.filter(c => !c.talents.length);
    return [...talentCards, ...common].slice(0, 4);
  }, [ownedCards, talent]);

  const claimDaily = () => {
    if (save.dailyClaimed === today()) return;
    setSave(s => ({ ...s, coins: s.coins + 50, dailyClaimed: today() }));
    trackTalentGameEvent('daily_reward_claimed', { talent }, { streak: save.streak, coins: 50 });
  };
  const startScenario = (item: GameScenario) => {
    if (level < item.unlockLevel) return;
    if (activeScenario.current) trackTalentGameEvent('scenario_abandoned', { scenario_id: activeScenario.current.id, round_index: activeScenario.current.highestRound, talent }, { reason: 'started_another_scenario' });
    activeScenario.current = { id: item.id, highestRound: 0, startedAt: Date.now() };
    trackTalentGameEvent('scenario_started', { scenario_id: item.id, talent }, { player_level: level, first_attempt: !save.completed.includes(item.id) });
    setScenario(item); setRound(0); setEnergy(3); setScore(0); setCombo(0); setBestCombo(0); setSelected(null); setAnswer(''); setFeedback(''); setAiFeedback(''); setReward([]); setNewBadges([]); setPhase('play');
  };
  const chooseCard = (card: GameCard) => {
    setSelected(card); setAnswer(''); setAnswerMethod('text'); setFeedback(''); setAiFeedback('');
    trackTalentGameEvent('card_selected', { scenario_id: scenario.id, round_index: round, card_id: card.id, talent }, { ability: card.ability, talent_bonus: card.talents.includes(talent), card_level: save.levels[card.id] || 1 });
  };
  const localEvaluate = () => {
    const text = answer.trim();
    const enough = text.split(/\s+/).length >= 3;
    const matched = selected?.ability === current.best;
    return { enough, matched, points: (matched ? 120 : 70) + (selected?.talents.includes(talent) ? 30 : 0) + (enough ? 30 : 0) + combo * 10 };
  };
  const submitAnswer = async () => {
    if (!selected || !answer.trim() || isEvaluating) return;
    const result = localEvaluate();
    const wordCount = answer.trim().split(/\s+/).length;
    trackTalentGameEvent('answer_submitted', { scenario_id: scenario.id, round_index: round, card_id: selected.id, talent }, {
      valid: result.enough, strategy_matched: result.matched, input_method: answerMethod,
      word_count_bucket: wordCount < 3 ? '0-2' : wordCount < 8 ? '3-7' : '8+', points: result.points,
    });
    const nextCombo = result.matched && result.enough ? combo + 1 : 0;
    setScore(v => v + result.points);
    setCombo(nextCombo);
    setBestCombo(v => Math.max(v, nextCombo));
    if (!result.enough) setEnergy(v => Math.max(0, v - 1));
    setFeedback(result.enough ? (result.matched ? `Perfect！${ABILITY_LABEL[selected.ability]}與你的句子都命中情境。` : `句子成立！若改用${ABILITY_LABEL[current.best]}策略，效果會更好。`) : '再多說一點會更自然；至少完成一個三個字以上的英文句子。');
    setIsEvaluating(true);
    let response = '';
    await streamChat({
      messages: [{ role: 'user', content: `You are evaluating one line in a language card game. Situation: ${current.prompt}. Goal: ${current.goal}. Learner said: "${answer}". Reply in Traditional Chinese in exactly 2 short sentences: first give one specific correction or praise, then show one natural English version. Do not roleplay further.` }],
      settings: { language: 'english', difficulty: 'intermediate', tone: 'semi-formal', mode: 'practice', speed: 'normal', scenario: scenario.title },
      geniusType: talent, learningStyle: null,
      onDelta: delta => { response += delta; setAiFeedback(response.replace(/<<<[^>]+>>>/g, '')); },
      onDone: () => setIsEvaluating(false),
      onError: () => { setAiFeedback(`離線教練：可以這樣說得更完整——“${current.example}”`); setIsEvaluating(false); },
    });
  };
  const nextRound = () => {
    if (round >= scenario.rounds.length - 1 || energy === 0) return finishScenario();
    setRound(v => v + 1); setSelected(null); setAnswer(''); setFeedback(''); setAiFeedback('');
  };
  const finishScenario = () => {
    const firstClear = !save.completed.includes(scenario.id);
    const candidate = GAME_CARDS.find(c => c.talents.includes(talent) && !save.unlocked.includes(c.id));
    const earned = scenario.reward + Math.floor(score / 10);
    const nextCompleted = firstClear ? [...save.completed, scenario.id] : save.completed;
    const nextUnlocked = candidate ? Array.from(new Set([...save.unlocked, candidate.id])) : save.unlocked;
    const nextBadges = new Set(save.badges || []);
    if (nextCompleted.length >= 1) nextBadges.add('first-clear');
    if (nextCompleted.length >= 3) nextBadges.add('map-runner');
    if (nextCompleted.length >= GAME_SCENARIOS.length) nextBadges.add('world-clear');
    if (bestCombo >= 3) nextBadges.add('combo-three');
    if (score >= 360) nextBadges.add('high-score');
    if (nextUnlocked.length >= 8) nextBadges.add('collector');
    const earnedBadges = Array.from(nextBadges).filter(id => !(save.badges || []).includes(id)).map(badgeById).filter(Boolean) as GameBadge[];
    setSave(s => ({ ...s, xp: s.xp + earned, coins: s.coins + 30, completed: nextCompleted, unlocked: nextUnlocked, badges: Array.from(nextBadges) }));
    trackTalentGameEvent('scenario_completed', { scenario_id: scenario.id, round_index: round, talent }, { score, best_combo: bestCombo, energy_remaining: energy, first_clear: firstClear, earned_xp: earned });
    activeScenario.current = null;
    setNewBadges(earnedBadges);
    setReward([`+${earned} XP`, '+30 金幣', ...(candidate ? [`解鎖 ${candidate.title}`] : []), ...earnedBadges.map(badge => `徽章 ${badge.title}`)]);
    setPhase('result');
  };
  const upgrade = (card: GameCard) => {
    if (!save.unlocked.includes(card.id)) return;
    const currentLevel = save.levels[card.id] || 1;
    const cost = currentLevel * 50;
    if (save.coins < cost || currentLevel >= 5) return;
    setSave(s => ({ ...s, coins: s.coins - cost, levels: { ...s.levels, [card.id]: currentLevel + 1 } }));
    trackTalentGameEvent('card_upgraded', { card_id: card.id, talent }, { from_level: currentLevel, to_level: currentLevel + 1, coin_cost: cost });
  };
  const listen = () => {
    const SpeechRecognition = (window as unknown as { webkitSpeechRecognition?: new () => { lang: string; interimResults: boolean; onresult: (event: { results: { 0: { 0: { transcript: string } } }[] }) => void; onend: () => void; start: () => void } }).webkitSpeechRecognition;
    if (!SpeechRecognition) { setFeedback('此瀏覽器不支援語音辨識，請改用文字輸入。'); return; }
    const recognition = new SpeechRecognition(); recognition.lang = 'en-US'; recognition.interimResults = false; setIsListening(true);
    recognition.onresult = event => { setAnswer(event.results[0][0].transcript); setAnswerMethod('voice'); };
    recognition.onend = () => setIsListening(false); recognition.start();
  };

  return <main className="min-h-screen overflow-x-hidden bg-[#f4efe5] text-[#173a34] pb-24">
    <header className="sticky top-0 z-30 border-b border-[#173a34]/10 bg-[#f4efe5]/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <button onClick={() => { if (phase === 'play' && activeScenario.current) { trackTalentGameEvent('scenario_abandoned', { scenario_id: scenario.id, round_index: round, talent }, { reason: 'returned_home' }); activeScenario.current = null; } if (phase === 'home') navigate(-1); else setPhase('home'); }} className="flex items-center gap-2 text-sm font-bold"><ArrowLeft className="h-4 w-4" /> {phase === 'home' ? '返回訓練場' : '遊戲首頁'}</button>
        <button onClick={() => setPhase('home')} className="font-black tracking-tight">MEMO<span className="text-[#e26a3b]">QUEST</span></button>
        <div className="flex items-center gap-3 text-xs font-black"><button onClick={() => navigate('/talent-card-game-guide')} className="flex items-center gap-1 rounded-full border border-[#173a34]/15 px-2.5 py-1.5"><CircleHelp className="h-4 w-4" />玩法</button><span className="flex items-center gap-1"><Coins className="h-4 w-4 text-[#d18a29]" />{save.coins}</span><span>LV.{level}</span></div>
      </div>
    </header>

    {phase === 'home' && <section className="mx-auto max-w-6xl px-4 py-10 md:py-16">
      <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_.95fr]">
        <div><div className="inline-flex items-center gap-2 rounded-full bg-[#dce9c7] px-3 py-1.5 text-xs font-extrabold tracking-wider"><Sparkles className="h-4 w-4" /> TALENT CARD ADVENTURE</div><h1 className="mt-5 text-5xl font-black leading-[.95] tracking-[-.055em] md:text-7xl">把語言天份<br />變成你的<span className="text-[#e26a3b]">超能力</span></h1><p className="mt-6 max-w-xl text-lg leading-relaxed text-[#355b54]">走進五種真實情境，選策略卡、說出英文，讓 AI 教練依你的天份即時改變故事。</p><div className="mt-7 flex flex-wrap gap-3"><Button onClick={() => setPhase('map')} className="rounded-full bg-[#173a34] px-7">開始冒險 <ChevronRight className="ml-1 h-4 w-4" /></Button><Button onClick={() => navigate('/talent-card-game-guide')} variant="outline" className="rounded-full"><CircleHelp className="mr-2 h-4 w-4" />玩法說明</Button><Button onClick={() => setPhase('collection')} variant="outline" className="rounded-full">我的牌庫</Button></div></div>
        <div className="rounded-[32px] bg-[#173a34] p-7 text-white shadow-xl"><div className="flex items-center justify-between"><div><p className="text-xs font-black tracking-widest text-[#dce9c7]">PLAYER PROFILE</p><h2 className="mt-1 text-2xl font-black">{info.emoji} {info.nameZh}</h2></div><Trophy className="h-9 w-9 text-[#efb83b]" /></div><p className="mt-3 text-white/70">{TALENT_TAGLINES[talent]}</p><div className="mt-6"><div className="mb-2 flex justify-between text-xs font-bold"><span>LV.{level}</span><span>{save.xp % 300}/300 XP</span></div><Progress value={(save.xp % 300) / 3} className="h-2" /></div><div className="mt-6 grid grid-cols-4 gap-2 text-center"><div className="rounded-xl bg-white/10 p-3"><div className="font-black">{save.completed.length}/5</div><div className="text-[10px] text-white/60">關卡</div></div><div className="rounded-xl bg-white/10 p-3"><div className="font-black">{save.unlocked.length}</div><div className="text-[10px] text-white/60">卡牌</div></div><div className="rounded-xl bg-white/10 p-3"><div className="font-black">{save.badges.length}</div><div className="text-[10px] text-white/60">徽章</div></div><div className="rounded-xl bg-white/10 p-3"><div className="font-black">{save.streak}</div><div className="text-[10px] text-white/60">連續日</div></div></div></div>
      </div>
      <div className="mt-12 grid gap-4 md:grid-cols-[1fr_2fr]"><div className="rounded-3xl bg-[#f6dfd5] p-6"><Flame className="h-7 w-7 text-[#e26a3b]" /><h3 className="mt-3 text-xl font-black">每日登入獎勵</h3><p className="mt-1 text-sm text-[#57736e]">連續第 {save.streak} 天・今天可領 50 金幣</p><Button disabled={save.dailyClaimed === today()} onClick={claimDaily} className="mt-4 rounded-full bg-[#e26a3b]">{save.dailyClaimed === today() ? '今日已領取' : '領取獎勵'}</Button></div><div className="rounded-3xl bg-white p-6"><p className="text-xs font-black tracking-widest text-[#6d5bd0]">DAILY QUEST</p><h3 className="mt-2 text-xl font-black">完成一個情境並使用 3 張不同策略卡</h3><div className="mt-5 flex items-center gap-3"><Progress value={Math.min(save.completed.length * 33, 100)} className="h-2" /><span className="text-xs font-black">{Math.min(save.completed.length, 3)}/3</span></div></div></div>
      <AnalyticsNotice enabled={analyticsEnabled} summary={analyticsSummary} onToggle={() => {
        const next = !analyticsEnabled;
        if (!next) trackTalentGameEvent('analytics_preference_changed', { talent }, { enabled: false });
        setTalentAnalyticsEnabled(next); setAnalyticsEnabled(next); setAnalyticsEvents(getQueuedTalentEvents());
        if (next) trackTalentGameEvent('analytics_preference_changed', { talent }, { enabled: true });
      }} />
      <BadgeShelf badges={GAME_BADGES} earnedIds={save.badges} compact />
      <div className="mt-10"><p className="text-xs font-black tracking-widest text-[#e26a3b]">CHOOSE TALENT</p><div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">{(Object.keys(GENIUS_INFO) as GeniusType[]).map(type => <button key={type} onClick={() => setTalent(type)} className={`rounded-2xl border p-4 text-left transition ${talent === type ? 'bg-[#173a34] text-white shadow-lg' : 'bg-white/70'}`}><div>{GENIUS_INFO[type].emoji}</div><div className="mt-2 font-black">{GENIUS_INFO[type].nameZh}</div><div className="mt-1 text-xs opacity-65">{TALENT_TAGLINES[type]}</div></button>)}</div></div>
    </section>}

    {phase === 'map' && <section className="mx-auto max-w-6xl px-4 py-10"><div><p className="text-xs font-black tracking-widest text-[#e26a3b]">WORLD MAP</p><h1 className="mt-2 text-4xl font-black">今天想去哪裡冒險？</h1><p className="mt-2 text-[#57736e]">完成情境取得 XP、金幣與你的天份專屬卡。</p></div><div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{GAME_SCENARIOS.map(item => { const locked = level < item.unlockLevel; const done = save.completed.includes(item.id); return <button key={item.id} disabled={locked} onClick={() => startScenario(item)} className="group relative min-h-64 overflow-hidden rounded-[28px] p-6 text-left text-white shadow-lg transition hover:-translate-y-1 disabled:grayscale" style={{ background: item.color }}><div className="absolute -right-8 -top-10 text-[120px] opacity-15">{item.icon}</div><div className="relative flex h-full flex-col"><div className="flex justify-between"><span className="rounded-full bg-white/15 px-3 py-1 text-xs font-black">LV.{item.unlockLevel}</span>{locked ? <Lock className="h-5 w-5" /> : done ? <span className="flex items-center gap-1 text-xs font-black"><Check className="h-4 w-4" />完成</span> : null}</div><div className="mt-auto"><div className="text-4xl">{item.icon}</div><h2 className="mt-3 text-2xl font-black">{item.title}</h2><p className="mt-1 text-sm text-white/70">{item.subtitle}</p><div className="mt-4 text-xs font-black">獎勵 {item.reward} XP・3 回合</div></div></div></button> })}</div></section>}

    {phase === 'play' && !feedback && <div className="mx-auto max-w-6xl px-4 pt-5"><div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#d18a29]/25 bg-[#fff6de] px-4 py-3 text-sm"><p><strong>這回合怎麼玩：</strong>① 讀左側問題與任務；② 選一張回答策略卡；③ 依情境自己說一句英文。卡片提示不是標準答案。</p><button onClick={() => navigate('/talent-card-game-guide')} className="shrink-0 font-black text-[#b66f12] hover:underline">看完整示範 →</button></div></div>}
    {phase === 'play' && <section className="mx-auto max-w-6xl px-4 py-6 md:py-10"><div className="mb-6 flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-xl">{scenario.icon}</div><div><div className="font-black">{scenario.title}</div><div className="text-xs text-[#57736e]">ROUND {round + 1}/{scenario.rounds.length}</div></div></div><div className="flex items-center gap-4 text-sm font-black"><span className="flex gap-1">{[0,1,2].map(i => <Heart key={i} className={`h-5 w-5 ${i < energy ? 'fill-[#e26a3b] text-[#e26a3b]' : 'text-[#baa]'}`} />)}</span><span>COMBO ×{combo}</span><span>{score} XP</span></div></div><div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]"><div className="relative flex min-h-[420px] flex-col overflow-hidden rounded-[32px] bg-[#173a34] p-7 text-white md:p-9"><span className="w-fit rounded-full bg-white/10 px-3 py-1 text-xs font-black">{current.speaker}</span><h2 className="mt-12 text-3xl font-black leading-tight md:text-5xl">“{current.prompt}”</h2><p className="mt-5 text-white/65">任務：{current.goal}</p>{feedback && <div className="mt-auto pt-8"><div className="rounded-2xl bg-white p-4 text-[#173a34]"><p className="text-xs font-black text-[#e26a3b]">情境結果</p><p className="mt-1 font-bold">{feedback}</p>{aiFeedback && <p className="mt-3 border-t pt-3 text-sm text-[#57736e]">{aiFeedback}</p>}</div></div>}</div><aside className="rounded-[32px] border border-[#173a34]/10 bg-white p-6 shadow-sm md:p-8">{!feedback ? <>{!selected ? <><p className="text-xs font-black tracking-widest text-[#e26a3b]">YOUR HAND</p><h2 className="mt-1 text-2xl font-black">選一張策略卡</h2><div className="mt-5 grid grid-cols-2 gap-3">{hand.map(card => <button key={card.id} onClick={() => chooseCard(card)} className="min-h-44 rounded-2xl border-2 p-4 text-left transition hover:-translate-y-1 hover:shadow-lg" style={{ borderColor: `${ABILITY_COLOR[card.ability]}55`, background: `${ABILITY_COLOR[card.ability]}0d` }}><div className="flex justify-between"><span className="text-3xl">{card.icon}</span>{card.talents.includes(talent) && <span className="h-fit rounded-full bg-[#dce9c7] px-2 py-1 text-[10px] font-black">天份加成</span>}</div><h3 className="mt-4 font-black">{card.title}</h3><p className="mt-1 text-xs text-[#57736e]">{card.subtitle}</p></button>)}</div></> : <><button onClick={() => setSelected(null)} className="text-xs font-bold text-[#57736e]">← 換一張卡</button><div className="mt-4 rounded-2xl p-4" style={{ background: `${ABILITY_COLOR[selected.ability]}12` }}><div className="text-3xl">{selected.icon}</div><h3 className="mt-2 text-xl font-black">{selected.title}</h3><p className="mt-1 text-sm text-[#57736e]">句型提示：{selected.sentence}</p></div><label className="mt-5 block text-sm font-black" htmlFor="game-answer">說出或輸入你的回應</label><textarea id="game-answer" value={answer} onChange={e => { setAnswer(e.target.value); setAnswerMethod('text'); }} placeholder={current.example} className="mt-2 min-h-28 w-full rounded-2xl border bg-[#faf8f2] p-4 outline-none focus:ring-2 focus:ring-[#1f8a70]" /><div className="mt-2 rounded-xl bg-[#f4efe5] p-3 text-xs leading-relaxed text-[#57736e]"><strong>示範答案：</strong>{current.example}<button type="button" onClick={() => { setAnswer(current.example); setAnswerMethod('text'); }} className="ml-2 font-black text-[#1f8a70] hover:underline">套用</button></div><div className="mt-3 flex gap-2"><Button variant="outline" onClick={listen} className="rounded-full"><Mic className={`mr-2 h-4 w-4 ${isListening ? 'animate-pulse text-red-500' : ''}`} />{isListening ? '聆聽中' : '語音輸入'}</Button><Button disabled={!answer.trim() || isEvaluating} onClick={submitAnswer} className="flex-1 rounded-full bg-[#e26a3b]">{isEvaluating ? 'AI 評估中…' : '送出回應'}</Button></div></>}</> : <div className="flex h-full flex-col"><div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#dce9c7]"><Check className="h-7 w-7" /></div><h2 className="mt-5 text-2xl font-black">回合完成</h2><p className="mt-3 text-[#57736e]">角色回應：{localEvaluate().enough ? current.successReply : current.retryReply}</p><Button onClick={nextRound} className="mt-auto rounded-full bg-[#173a34]">{round === scenario.rounds.length - 1 || energy === 0 ? '查看結算' : '下一個情境'}<ChevronRight className="ml-1 h-4 w-4" /></Button></div>}</aside></div><div className="mt-6 flex items-center gap-4"><Progress value={((round + (feedback ? 1 : 0)) / scenario.rounds.length) * 100} className="h-2" /><span className="whitespace-nowrap text-xs font-black">QUEST PROGRESS</span></div></section>}

    {phase === 'result' && <section className="mx-auto max-w-2xl px-4 py-14 text-center"><div className="rounded-[36px] border bg-white p-8 shadow-xl md:p-12"><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#dce9c7]"><Zap className="h-9 w-9 fill-[#173a34]" /></div><p className="mt-6 text-xs font-black tracking-[.25em] text-[#e26a3b]">QUEST COMPLETE</p><h1 className="mt-2 text-4xl font-black">{scenario.title}完成！</h1><div className="mt-6 flex justify-center gap-2">{[0,1,2].map(i => <Star key={i} className={`h-10 w-10 ${i < (score >= 420 ? 3 : score >= 280 ? 2 : 1) ? 'fill-[#efb83b] text-[#efb83b]' : 'text-[#ddd6ca]'}`} />)}</div><div className="mt-8 grid gap-3 sm:grid-cols-3">{reward.map(item => <div key={item} className="rounded-2xl bg-[#f4efe5] p-4 font-black">{item}</div>)}</div>{newBadges.length > 0 && <div className="mt-8 rounded-3xl bg-[#173a34] p-5 text-white"><div className="flex items-center justify-center gap-2 text-xs font-black tracking-widest text-[#efb83b]"><Award className="h-4 w-4" /> NEW BADGE</div><div className="mt-4 grid gap-3 sm:grid-cols-2">{newBadges.map(badge => <div key={badge.id} className="rounded-2xl bg-white/10 p-4"><div className="text-3xl">{badge.icon}</div><div className="mt-2 font-black">{badge.title}</div><div className="mt-1 text-xs text-white/65">{badge.detail}</div></div>)}</div></div>}<div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><Button variant="outline" className="rounded-full" onClick={() => startScenario(scenario)}><RotateCcw className="mr-2 h-4 w-4" />再玩一次</Button><Button className="rounded-full bg-[#173a34]" onClick={() => setPhase('map')}>繼續冒險 <ChevronRight className="ml-1 h-4 w-4" /></Button></div></div></section>}

    {phase === 'collection' && <section className="mx-auto max-w-6xl px-4 py-10"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-black tracking-widest text-[#6d5bd0]">CARD COLLECTION</p><h1 className="mt-2 text-4xl font-black">我的天份牌庫</h1><p className="mt-2 text-[#57736e]">完成關卡解鎖卡牌，用金幣升級效果，也能收集成就徽章。</p></div><div className="rounded-full bg-white px-4 py-2 text-sm font-black"><Coins className="mr-2 inline h-4 w-4 text-[#d18a29]" />{save.coins}</div></div><BadgeShelf badges={GAME_BADGES} earnedIds={save.badges} /><div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{GAME_CARDS.map(card => { const owned = save.unlocked.includes(card.id); const cardLevel = save.levels[card.id] || 1; const cost = cardLevel * 50; return <div key={card.id} className={`relative min-h-72 rounded-[26px] border-2 p-5 ${owned ? 'bg-white' : 'bg-[#ded9cf] opacity-60'}`} style={{ borderColor: owned ? `${ABILITY_COLOR[card.ability]}66` : '#bbb' }}><div className="flex justify-between"><span className="text-4xl">{owned ? card.icon : '🔒'}</span><span className="text-[10px] font-black uppercase">{card.rarity}</span></div><h2 className="mt-5 text-xl font-black">{owned ? card.title : '尚未解鎖'}</h2><p className="mt-2 text-sm text-[#57736e]">{owned ? card.subtitle : '完成更多情境取得這張牌。'}</p>{owned && <div className="mt-5"><div className="flex justify-between text-xs font-black"><span>LV.{cardLevel}</span><span>{ABILITY_LABEL[card.ability]}</span></div><Progress value={cardLevel * 20} className="mt-2 h-2" /><Button disabled={cardLevel >= 5 || save.coins < cost} onClick={() => upgrade(card)} size="sm" className="mt-4 w-full rounded-full bg-[#173a34]">{cardLevel >= 5 ? '已滿級' : `升級・${cost} 金幣`}</Button></div>}</div> })}</div></section>}
    <TutorialCoach step={tutorialStep} onBegin={beginTutorial} onFinish={finishTutorial} onSkip={finishTutorial} />
  </main>;
}

const TUTORIAL_COPY: Record<Exclude<TutorialStep, 'intro' | null>, { progress: string; title: string; text: string; direction: string }> = {
  start: { progress: '1 / 6', title: '先進入情境地圖', text: '點頁面上方的「開始冒險」。', direction: '↑' },
  map: { progress: '2 / 6', title: '選擇第一個練習情境', text: '推薦點「城市咖啡店」，旅行轉運站也可以。', direction: '↑' },
  card: { progress: '3 / 6', title: '選一張回答策略卡', text: '先選有「天份加成」的卡。卡牌是回答方法，不是標準答案。', direction: '↗' },
  input: { progress: '4 / 6', title: '組成你的英文回應', text: '點輸入框開始打字；不知道怎麼說，可點示範答案旁的「套用」。', direction: '↗' },
  submit: { progress: '5 / 6', title: '送出這次回答', text: '確認句子有直接回應左邊角色，再點橘色「送出回應」。', direction: '↗' },
  feedback: { progress: '6 / 6', title: '完成！記得看教練回饋', text: '回饋會告訴你策略是否命中，以及更自然的英文說法。', direction: '✓' },
};

function TutorialCoach({ step, onBegin, onFinish, onSkip }: { step: TutorialStep; onBegin: () => void; onFinish: () => void; onSkip: () => void }) {
  if (!step) return null;
  if (step === 'intro') return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-[#102d28]/70 p-4 backdrop-blur-sm"><div role="dialog" aria-modal="true" aria-labelledby="tutorial-title" className="w-full max-w-md rounded-[30px] bg-white p-7 shadow-2xl md:p-9"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#dce9c7]"><MousePointer2 className="h-7 w-7" /></div><p className="mt-5 text-xs font-black tracking-widest text-[#e26a3b]">60 秒新手導覽</p><h2 id="tutorial-title" className="mt-2 text-3xl font-black">第一次玩嗎？<br />我帶你完成第一題</h2><p className="mt-4 leading-relaxed text-[#57736e]">跟著畫面箭頭依序選情境、點卡、輸入英文並送出。實際操作一次就會懂。</p><div className="mt-7 flex flex-col gap-2 sm:flex-row"><Button onClick={onBegin} className="flex-1 rounded-full bg-[#173a34]">開始互動教學 <ChevronRight className="ml-1 h-4 w-4" /></Button><Button onClick={onSkip} variant="ghost" className="rounded-full">先跳過</Button></div></div></div>;
  const copy = TUTORIAL_COPY[step];
  return <div className="pointer-events-none fixed inset-x-0 bottom-20 z-[70] flex justify-center px-4 md:bottom-6"><div role="status" className="pointer-events-auto w-full max-w-lg rounded-[26px] border-2 border-[#efb83b] bg-white p-5 shadow-2xl"><div className="flex items-start gap-4"><div className="flex h-12 w-12 shrink-0 animate-bounce items-center justify-center rounded-2xl bg-[#fff0bf] text-2xl font-black text-[#b66f12]">{copy.direction}</div><div className="min-w-0 flex-1"><div className="text-xs font-black tracking-widest text-[#e26a3b]">互動教學 {copy.progress}</div><h3 className="mt-1 text-xl font-black">{copy.title}</h3><p className="mt-1 text-sm leading-relaxed text-[#57736e]">{copy.text}</p></div></div><div className="mt-4 flex justify-end gap-2">{step === 'feedback' ? <Button onClick={onFinish} className="rounded-full bg-[#173a34]">完成教學 <Check className="ml-1 h-4 w-4" /></Button> : <button onClick={onSkip} className="text-xs font-bold text-[#57736e] hover:underline">跳過教學</button>}</div></div></div>;
}

function BadgeShelf({ badges, earnedIds, compact = false }: { badges: GameBadge[]; earnedIds: string[]; compact?: boolean }) {
  const visibleBadges = compact ? badges.slice(0, 3) : badges;

  return (
    <section className="mt-10 rounded-[28px] border border-[#173a34]/10 bg-white/75 p-5 shadow-sm md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-black tracking-widest text-[#6d5bd0]">ACHIEVEMENT BADGES</p>
          <h2 className="mt-1 text-2xl font-black">成就徽章</h2>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-[#173a34] px-4 py-2 text-sm font-black text-white">
          <Award className="h-4 w-4 text-[#efb83b]" />
          {earnedIds.length}/{badges.length}
        </div>
      </div>
      <div className={`mt-5 grid gap-3 ${compact ? 'sm:grid-cols-3' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
        {visibleBadges.map(badge => {
          const earned = earnedIds.includes(badge.id);
          return (
            <div key={badge.id} className={`min-h-32 rounded-2xl border p-4 transition ${earned ? 'bg-white shadow-sm' : 'bg-[#ebe5d8] opacity-60'}`} style={{ borderColor: earned ? `${badge.tone}66` : '#d2c9b8' }}>
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-2xl" style={{ background: earned ? `${badge.tone}18` : '#d8d0c1' }}>{earned ? badge.icon : '🔒'}</span>
                {earned && <span className="rounded-full px-2 py-1 text-[10px] font-black text-white" style={{ background: badge.tone }}>已解鎖</span>}
              </div>
              <h3 className="mt-4 font-black">{badge.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-[#57736e]">{badge.detail}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function AnalyticsNotice({
  enabled,
  summary,
  onToggle,
}: {
  enabled: boolean;
  summary: ReturnType<typeof summarizeTalentEvents>;
  onToggle: () => void;
}) {
  return (
    <section className="mt-4 rounded-3xl border border-[#173a34]/10 bg-white/75 p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex max-w-2xl gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#dce9c7]"><ShieldCheck className="h-5 w-5" /></span>
          <div><p className="text-xs font-black tracking-widest text-[#1f8a70]">PRIVACY-SAFE ANALYTICS</p><h2 className="mt-1 text-xl font-black">匿名遊戲體驗分析</h2><p className="mt-1 text-sm leading-relaxed text-[#57736e]">只記錄關卡進度、卡牌選擇與回答是否完成；不保存英文原文、語音、姓名或帳號資料。離線時最多暫存 200 筆。</p></div>
        </div>
        <Button variant="outline" onClick={onToggle} className="rounded-full">{enabled ? '停止匿名分析' : '開啟匿名分析'}</Button>
      </div>
      {enabled && <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4"><div className="rounded-2xl bg-[#f4efe5] p-3"><BarChart3 className="h-4 w-4" /><div className="mt-2 text-xl font-black">{summary.starts}</div><div className="text-xs text-[#57736e]">本機開始局數</div></div><div className="rounded-2xl bg-[#f4efe5] p-3"><div className="text-xl font-black">{summary.completionRate}%</div><div className="text-xs text-[#57736e]">關卡完成率</div></div><div className="rounded-2xl bg-[#f4efe5] p-3"><div className="text-xl font-black">{summary.validAnswerRate}%</div><div className="text-xs text-[#57736e]">有效回答率</div></div><div className="rounded-2xl bg-[#f4efe5] p-3"><div className="truncate text-sm font-black">{summary.mostUsedCard || '尚無資料'}</div><div className="mt-1 text-xs text-[#57736e]">最常使用卡牌</div></div></div>}
    </section>
  );
}
