import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Blocks,
  Building2,
  ChevronRight,
  Hammer,
  Heart,
  Loader2,
  Mic,
  RotateCcw,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { GENIUS_INFO, GeniusType, loadGeniusType } from '@/lib/genius-type';
import { streamChat } from '@/lib/stream-chat';
import {
  ABILITY_COLOR,
  ABILITY_LABEL,
  GameAbility,
  GameCard,
  GameRound,
} from '@/lib/talent-card-game';
import {
  addBlocks,
  advanceCity,
  availableSites,
  BlockBank,
  blocksForRound,
  bondTier,
  BuildingDef,
  buildingDef,
  canAfford,
  CityEvent,
  CityEventKind,
  CityState,
  cityGrid,
  cityHand,
  loadCity,
  missingBlocks,
  offlineScore,
  parseRoundScore,
  raiseBuilding,
  resolveEvent,
  Resident,
  residentDef,
  RoundScore,
  RoundVerdict,
  saveCity,
  SCORE_LABEL,
  SCORE_MARKER_HINT,
  SCORE_RUBRIC,
  stripScoreMarker,
} from '@/lib/language-city';

type Phase = 'city' | 'talk';

const EVENT_KIND: Record<CityEventKind, { label: string; tone: string }> = {
  life: { label: '日常', tone: '#1f8a70' },
  recall: { label: '記得你說過', tone: '#6d5bd0' },
  gossip: { label: '提到別人', tone: '#e26a3b' },
};

/** What the dialogue engine is currently running. */
type Session =
  | { kind: 'build'; def: BuildingDef; rounds: GameRound[] }
  | { kind: 'event'; event: CityEvent; rounds: GameRound[] };

export default function LanguageCity() {
  const navigate = useNavigate();
  const [talent] = useState<GeniusType>(() => loadGeniusType() || 'explorer');
  const [city, setCity] = useState<CityState>(() => advanceCity(loadCity()));
  const [phase, setPhase] = useState<Phase>('city');
  const [session, setSession] = useState<Session | null>(null);
  const [openResident, setOpenResident] = useState<string | null>(null);
  const [banner, setBanner] = useState('');

  useEffect(() => { saveCity(city); }, [city]);

  const sites = useMemo(() => availableSites(city), [city]);
  const hand = useMemo(() => cityHand(talent, []), [talent]);
  const info = GENIUS_INFO[talent];
  const totalBlocks = city.blocks.observe + city.blocks.connect + city.blocks.express;

  const startBuild = (def: BuildingDef) => {
    setSession({ kind: 'build', def, rounds: def.rounds });
    setPhase('talk');
  };

  const startEvent = (event: CityEvent) => {
    setSession({ kind: 'event', event, rounds: [event.round] });
    setPhase('talk');
  };

  /** One round cleared — blocks land immediately so progress is visible mid-run. */
  const onRoundCleared = (blocks: Partial<BlockBank>) => {
    setCity(prev => addBlocks(prev, blocks));
  };

  const onSessionDone = (lastLine: string) => {
    if (!session) return;
    if (session.kind === 'event') {
      setCity(prev => resolveEvent(prev, session.event, lastLine, talent));
      const def = residentDef(session.event.residentId);
      setBanner(`跟${def?.nameZh ?? '居民'}聊完了，好感 +${session.event.bond}。`);
    } else {
      const def = session.def;
      setCity(prev => {
        if (!canAfford(prev, def)) return prev;
        return raiseBuilding(prev, def);
      });
      setBanner(`${def.title}的工程完成了——如果積木還不夠，回到城市補齊再蓋。`);
    }
    setSession(null);
    setPhase('city');
  };

  if (phase === 'talk' && session) {
    return (
      <Dialogue
        title={session.kind === 'build' ? session.def.title : session.event.headline}
        subtitle={session.kind === 'build' ? '完成三個回合就能動工' : '居民主動找你說話'}
        icon={session.kind === 'build' ? session.def.icon : residentDef(session.event.residentId)?.emoji ?? '💬'}
        color={session.kind === 'build' ? session.def.color : '#e26a3b'}
        rounds={session.rounds}
        hand={hand}
        talent={talent}
        // Recall and gossip already quote the line inside the prompt; only plain
        // life events need the reminder pinned alongside.
        memoryHint={session.kind === 'event' && session.event.kind === 'life'
          ? memoryHintFor(city, session.event.residentId)
          : ''}
        onRoundCleared={onRoundCleared}
        onDone={onSessionDone}
        onQuit={() => { setSession(null); setPhase('city'); }}
      />
    );
  }

  return (
    <main className="min-h-screen bg-[#f4efe5] pb-24 text-[#173a34]">
      <header className="sticky top-0 z-30 border-b border-[#173a34]/10 bg-[#f4efe5]/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <button
            onClick={() => (phase === 'city' ? navigate(-1) : setPhase('city'))}
            className="flex items-center gap-2 text-sm font-bold"
          >
            <ArrowLeft className="h-4 w-4" /> {phase === 'city' ? '返回訓練場' : '回到城市'}
          </button>
          <span className="font-black tracking-tight">
            語言<span className="text-[#e26a3b]">城市</span>
          </span>
          <div className="flex items-center gap-3 text-xs font-black">
            <span className="flex items-center gap-1"><Blocks className="h-4 w-4 text-[#d18a29]" />{totalBlocks}</span>
            <span className="flex items-center gap-1"><Users className="h-4 w-4 text-[#3978c5]" />{city.population}</span>
          </div>
        </div>
      </header>

      {banner && (
        <div className="mx-auto mt-4 max-w-6xl px-4">
          <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#dce9c7] px-5 py-3 text-sm font-bold">
            <span className="flex items-center gap-2"><Sparkles className="h-4 w-4" />{banner}</span>
            <button onClick={() => setBanner('')} className="text-xs opacity-60">關閉</button>
          </div>
        </div>
      )}

      {phase === 'city' && (
        <section className="mx-auto max-w-6xl px-4 py-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-black tracking-widest text-[#e26a3b]">DAY {city.day}</p>
              <h1 className="mt-2 text-4xl font-black">{info.emoji} {info.nameZh}的城市</h1>
              <p className="mt-2 text-[#57736e]">
                {city.buildings.length
                  ? `${city.buildings.length} 棟建築・${city.population} 位居民・已對話 ${city.talkCount} 次`
                  : '這裡還是一片空地。先蓋一間咖啡店，城市才會有人住進來。'}
              </p>
            </div>
            <BlockShelf blocks={city.blocks} />
          </div>

          <CityGrid city={city} onPick={id => setOpenResident(id)} />

          {city.events.length > 0 && (
            <section className="mt-10">
              <p className="text-xs font-black tracking-widest text-[#e26a3b]">TODAY IN THE CITY</p>
              <h2 className="mt-1 text-2xl font-black">居民的近況</h2>
              <p className="mt-1 text-sm text-[#57736e]">你不在的時候，城市也在過日子。點進去回應他們。</p>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {city.events.map(event => {
                  const def = residentDef(event.residentId);
                  const about = event.aboutId ? residentDef(event.aboutId) : null;
                  const kind = EVENT_KIND[event.kind];
                  return (
                    <button
                      key={event.id}
                      onClick={() => startEvent(event)}
                      className="rounded-3xl border border-[#173a34]/10 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                    >
                      <div className="flex items-center gap-3">
                        <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f4efe5] text-2xl">
                          {def?.emoji}
                          {about && (
                            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-sm shadow">
                              {about.emoji}
                            </span>
                          )}
                        </span>
                        <div>
                          <div className="font-black">{def?.nameZh}</div>
                          <div className="text-xs text-[#57736e]">{def?.role}</div>
                        </div>
                        <span className="ml-auto rounded-full bg-[#f6dfd5] px-3 py-1 text-[10px] font-black text-[#e26a3b]">
                          好感 +{event.bond}
                        </span>
                      </div>
                      <div className="mt-4 flex items-center gap-2">
                        <span
                          className="rounded-full px-2.5 py-1 text-[10px] font-black text-white"
                          style={{ background: kind.tone }}
                        >
                          {kind.label}
                        </span>
                        {about && <span className="text-[10px] font-bold text-[#57736e]">關於 {about.nameZh}</span>}
                      </div>
                      <p className="mt-3 font-bold leading-relaxed">{event.headline}</p>
                      <p className="mt-2 line-clamp-2 text-sm italic text-[#57736e]">“{event.round.prompt}”</p>
                      <span className="mt-4 flex items-center gap-1 text-xs font-black text-[#1f8a70]">
                        回應他 <ChevronRight className="h-3 w-3" />
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          <section className="mt-10">
            <p className="text-xs font-black tracking-widest text-[#6d5bd0]">CONSTRUCTION SITES</p>
            <h2 className="mt-1 text-2xl font-black">可以動工的地皮</h2>
            <p className="mt-1 text-sm text-[#57736e]">
              完成情境對話賺積木，積木夠了就能蓋。每蓋一棟，就有新居民搬進來。
            </p>
            <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {sites.map(def => {
                const affordable = canAfford(city, def);
                const gap = missingBlocks(city, def);
                return (
                  <div
                    key={def.id}
                    className="relative flex min-h-64 flex-col overflow-hidden rounded-[28px] p-6 text-white shadow-lg"
                    style={{ background: def.color }}
                  >
                    <div className="absolute -right-8 -top-10 text-[120px] opacity-15">{def.icon}</div>
                    <div className="relative flex h-full flex-col">
                      <span className="w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-black">
                        {ABILITY_LABEL[def.ability]}街區
                      </span>
                      <div className="mt-auto">
                        <div className="text-4xl">{def.icon}</div>
                        <h3 className="mt-3 text-2xl font-black">{def.title}</h3>
                        <p className="mt-1 text-sm text-white/70">{def.subtitle}</p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {(Object.entries(def.cost) as [GameAbility, number][]).map(([ability, need]) => (
                            <span key={ability} className="rounded-full bg-white/15 px-3 py-1 text-xs font-black">
                              {ABILITY_LABEL[ability]} {city.blocks[ability]}/{need}
                            </span>
                          ))}
                          {!Object.keys(def.cost).length && (
                            <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-black">免費起手</span>
                          )}
                        </div>
                        <Button
                          onClick={() => startBuild(def)}
                          className="mt-5 w-full rounded-full bg-white text-[#173a34] hover:bg-white/90"
                        >
                          {affordable ? <><Hammer className="mr-2 h-4 w-4" />開始施工</> : <>賺積木・還差 {Object.values(gap).reduce((a, b) => a + b, 0)} 塊</>}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {!sites.length && (
                <div className="rounded-[28px] border border-dashed border-[#173a34]/25 p-8 text-center text-sm text-[#57736e]">
                  目前的地皮都蓋滿了。跟居民多聊聊，新的機會會冒出來。
                </div>
              )}
            </div>
          </section>

          {city.residents.length > 0 && (
            <section className="mt-10">
              <p className="text-xs font-black tracking-widest text-[#3978c5]">RESIDENTS</p>
              <h2 className="mt-1 text-2xl font-black">城市居民</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {city.residents.map(resident => (
                  <ResidentCard
                    key={resident.defId}
                    resident={resident}
                    talent={talent}
                    open={openResident === resident.defId}
                    onToggle={() =>
                      setOpenResident(openResident === resident.defId ? null : resident.defId)
                    }
                  />
                ))}
              </div>
            </section>
          )}
        </section>
      )}
    </main>
  );
}

/** Last thing the player said to this resident — quoted back into the AI prompt. */
function memoryHintFor(city: CityState, residentId: string) {
  const resident = city.residents.find(r => r.defId === residentId);
  return resident?.memories[0]?.line ?? '';
}

function BlockShelf({ blocks }: { blocks: BlockBank }) {
  return (
    <div className="flex gap-3">
      {(Object.keys(blocks) as GameAbility[]).map(ability => (
        <div
          key={ability}
          className="rounded-2xl px-4 py-3 text-center"
          style={{ background: `${ABILITY_COLOR[ability]}18` }}
        >
          <div className="text-2xl font-black" style={{ color: ABILITY_COLOR[ability] }}>
            {blocks[ability]}
          </div>
          <div className="mt-0.5 text-[10px] font-black text-[#57736e]">{ABILITY_LABEL[ability]}積木</div>
        </div>
      ))}
    </div>
  );
}

function CityGrid({ city, onPick }: { city: CityState; onPick: (residentId: string) => void }) {
  // An empty grid is just a wall of dashed boxes; show the invitation instead.
  if (!city.buildings.length) {
    return (
      <div className="mt-7 flex flex-wrap items-center gap-4 rounded-[32px] border border-dashed border-[#173a34]/20 bg-gradient-to-b from-[#e8f0dc] to-[#f7f2e7] px-6 py-7">
        <span className="text-4xl">🏗️</span>
        <div>
          <h2 className="text-xl font-black">還沒有天際線</h2>
          <p className="mt-1 text-sm text-[#57736e]">
            城市會從你蓋的第一棟建築長出來。地皮就在下面，咖啡店免費起手。
          </p>
        </div>
      </div>
    );
  }

  const { cols, plots } = cityGrid(city.buildings.length);

  const cells = Array.from({ length: plots }, (_, i) => {
    const placed = city.buildings[i];
    const def = placed ? buildingDef(placed.defId) : null;
    if (!def) {
      return (
        <div
          key={`plot-${i}`}
          aria-hidden
          className="flex aspect-square items-center justify-center rounded-2xl border border-dashed border-[#173a34]/10 bg-white/25"
        >
          <span className="text-xs text-[#173a34]/20">空地</span>
        </div>
      );
    }
    const residents = city.residents.filter(r => residentDef(r.defId)?.building === def.id);
    return (
      <button
        key={def.id}
        onClick={() => residents[0] && onPick(residents[0].defId)}
        className="group relative aspect-square rounded-2xl shadow-md transition hover:-translate-y-1"
        style={{ background: def.color }}
      >
        <span className="flex h-full flex-col items-center justify-center gap-1 p-2 text-white">
          <span className="text-3xl drop-shadow md:text-4xl">{def.icon}</span>
          <span className="text-[10px] font-black leading-tight">{def.title}</span>
          <span className="flex gap-0.5 text-[10px]">
            {residents.map(r => residentDef(r.defId)?.emoji)}
          </span>
        </span>
      </button>
    );
  });

  return (
    <div className="mt-7 w-fit max-w-full rounded-[32px] border border-[#173a34]/10 bg-gradient-to-b from-[#e8f0dc] to-[#f7f2e7] p-3 shadow-inner md:p-4">
      <div
        className="grid gap-2 md:gap-3"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, width: `${cols * 132}px`, maxWidth: '100%' }}
      >
        {cells}
      </div>
    </div>
  );
}

function ResidentCard({
  resident,
  talent,
  open,
  onToggle,
}: {
  resident: Resident;
  talent: GeniusType;
  open: boolean;
  onToggle: () => void;
}) {
  const def = residentDef(resident.defId);
  if (!def) return null;
  const tier = bondTier(resident.bond);
  const resonates = def.affinity === talent;

  return (
    <button
      onClick={onToggle}
      className="rounded-3xl border border-[#173a34]/10 bg-white p-5 text-left shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f4efe5] text-2xl">{def.emoji}</span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-black">{def.nameZh}</span>
            {resonates && (
              <span className="rounded-full bg-[#dce9c7] px-2 py-0.5 text-[10px] font-black">天份共鳴</span>
            )}
          </div>
          <div className="truncate text-xs text-[#57736e]">{def.role}・住在{buildingDef(def.building)?.title}</div>
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-[#57736e]">{def.persona}</p>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs font-black">
          <span className="flex items-center gap-1" style={{ color: tier.tone }}>
            <Heart className="h-3 w-3 fill-current" />{tier.label}
          </span>
          <span>{resident.bond}/100</span>
        </div>
        <Progress value={resident.bond} className="mt-2 h-2" />
      </div>

      {open && (
        <div className="mt-4 border-t pt-4">
          <p className="text-[10px] font-black tracking-widest text-[#6d5bd0]">
            {def.nameZh}記得的事（{resident.memories.length}）
          </p>
          {resident.memories.length ? (
            <ul className="mt-3 space-y-3">
              {resident.memories.map(memory => (
                <li key={`${memory.at}-${memory.line}`} className="text-sm">
                  <p className="font-bold leading-snug">“{memory.line}”</p>
                  <p className="mt-0.5 text-xs text-[#57736e]">{memory.at}・{memory.gist}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-[#57736e]">還沒跟你說過話。等他來找你，或多蓋幾棟建築。</p>
          )}
        </div>
      )}
    </button>
  );
}

function ScoreStars({ score }: { score: RoundScore }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3].map(step => (
        <Star
          key={step}
          className={`h-8 w-8 ${step <= score ? 'fill-[#efb83b] text-[#efb83b]' : 'text-[#ddd6ca]'}`}
        />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dialogue engine — shared by construction runs and resident invitations
// ---------------------------------------------------------------------------

function Dialogue({
  title,
  subtitle,
  icon,
  color,
  rounds,
  hand,
  talent,
  memoryHint,
  onRoundCleared,
  onDone,
  onQuit,
}: {
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  rounds: GameRound[];
  hand: GameCard[];
  talent: GeniusType;
  memoryHint: string;
  onRoundCleared: (blocks: Partial<BlockBank>) => void;
  onDone: (lastLine: string) => void;
  onQuit: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<GameCard | null>(null);
  const [answer, setAnswer] = useState('');
  const [verdict, setVerdict] = useState<RoundVerdict | null>(null);
  const [coach, setCoach] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [lastLine, setLastLine] = useState('');
  const round = rounds[index];
  const isLast = index === rounds.length - 1;

  const chooseCard = (card: GameCard) => {
    setSelected(card);
    setAnswer(card.sentence.includes('___') ? '' : card.sentence);
    setVerdict(null);
    setCoach('');
  };

  /** Settle the round on whatever grade we ended up with, and pay out the blocks. */
  const settle = (card: GameCard, score: RoundScore, graded: boolean) => {
    const blocks = blocksForRound(score, card, round, talent);
    setVerdict({ score, blocks, graded });
    if (score > 0) onRoundCleared(blocks);
    setIsEvaluating(false);
  };

  const submit = async () => {
    if (!selected || !answer.trim() || isEvaluating) return;
    const card = selected;
    const text = answer.trim();
    setLastLine(text);
    setCoach('');
    setIsEvaluating(true);

    let response = '';
    await streamChat({
      messages: [{
        role: 'user',
        content: [
          'You are the coach in a language city game. Grade one line the learner said.',
          `Situation: ${round.prompt}`,
          `Goal: ${round.goal}`,
          memoryHint ? `The learner previously said to this character: "${memoryHint}".` : '',
          `Learner said: "${text}"`,
          '用繁體中文回覆，正好兩個短句：先給一個具體的修正或稱讚，再給一個自然的英文說法。不要繼續角色扮演。',
          `然後依這個標準評分：${SCORE_RUBRIC}。`,
          SCORE_MARKER_HINT,
        ].filter(Boolean).join('\n'),
      }],
      settings: {
        language: 'english', difficulty: 'intermediate', tone: 'semi-formal',
        mode: 'practice', speed: 'normal', scenario: title,
        instantCorrection: false,
      },
      geniusType: talent,
      learningStyle: null,
      onDelta: delta => { response += delta; setCoach(stripScoreMarker(response)); },
      onDone: () => {
        const score = parseRoundScore(response);
        // A coach that answered but skipped the marker still saw the sentence —
        // fall back to the offline check rather than throwing the reply away.
        settle(card, score ?? offlineScore(text), score !== null);
      },
      onError: () => {
        setCoach(`離線教練：無法連上 AI，這回合用離線標準計分。可以這樣說得更完整——“${round.example}”`);
        settle(card, offlineScore(text), false);
      },
    });
  };

  /** Zero-score rounds don't advance — the learner gets another go at the same line. */
  const retry = () => {
    setVerdict(null);
    setCoach('');
  };

  const next = () => {
    if (isLast) return onDone(lastLine);
    setIndex(v => v + 1);
    setSelected(null);
    setAnswer('');
    setVerdict(null);
    setCoach('');
  };

  const listen = () => {
    const SpeechRecognition = (window as unknown as {
      webkitSpeechRecognition?: new () => {
        lang: string; interimResults: boolean;
        onresult: (event: { results: { 0: { transcript: string } }[] }) => void;
        onend: () => void; start: () => void;
      };
    }).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setCoach('此瀏覽器不支援語音辨識，請改用文字輸入。');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    setIsListening(true);
    recognition.onresult = event => setAnswer(event.results[0][0].transcript);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  return (
    <main className="min-h-screen bg-[#f4efe5] pb-24 text-[#173a34]">
      <header className="sticky top-0 z-30 border-b border-[#173a34]/10 bg-[#f4efe5]/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <button onClick={onQuit} className="flex items-center gap-2 text-sm font-bold">
            <ArrowLeft className="h-4 w-4" /> 離開對話
          </button>
          <span className="text-xs font-black">ROUND {index + 1}/{rounds.length}</span>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-6 md:py-10">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl" style={{ background: `${color}1f` }}>
            {icon}
          </span>
          <div>
            <div className="font-black">{title}</div>
            <div className="text-xs text-[#57736e]">{subtitle}</div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_.95fr]">
          <div className="relative flex min-h-[400px] flex-col overflow-hidden rounded-[32px] p-7 text-white md:p-9" style={{ background: color }}>
            <span className="w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-black">{round.speaker}</span>
            <h2 className="mt-10 text-3xl font-black leading-tight md:text-4xl">“{round.prompt}”</h2>
            <p className="mt-5 text-white/70">任務：{round.goal}</p>
            {memoryHint && (
              <p className="mt-3 text-sm text-white/55">他還記得你說過：“{memoryHint}”</p>
            )}
            {coach && (
              <div className="mt-auto pt-8">
                <div className="rounded-2xl bg-white p-4 text-[#173a34]">
                  <p className="text-xs font-black text-[#e26a3b]">AI 教練</p>
                  <p className="mt-1 text-sm leading-relaxed text-[#355b54]">{coach}</p>
                </div>
              </div>
            )}
          </div>

          <aside className="rounded-[32px] border border-[#173a34]/10 bg-white p-6 shadow-sm md:p-8">
            {verdict ? (
              <div className="flex h-full flex-col">
                <ScoreStars score={verdict.score} />
                <h2 className="mt-4 text-2xl font-black">{SCORE_LABEL[verdict.score]}</h2>
                <p className="mt-3 text-[#57736e]">
                  角色回應：{verdict.score > 0 ? round.successReply : round.retryReply}
                </p>

                {verdict.score > 0 ? (
                  <div className="mt-5 rounded-2xl bg-[#f4efe5] p-4">
                    <p className="text-xs font-black tracking-widest text-[#e26a3b]">BLOCKS EARNED</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(Object.entries(verdict.blocks) as [GameAbility, number][]).map(([ability, amount]) => (
                        <span
                          key={ability}
                          className="rounded-full px-3 py-1.5 text-sm font-black text-white"
                          style={{ background: ABILITY_COLOR[ability] }}
                        >
                          {ABILITY_LABEL[ability]} +{amount}
                        </span>
                      ))}
                    </div>
                    <p className="mt-3 text-xs text-[#57736e]">
                      評分 {verdict.score}
                      {selected?.ability === round.best && ` ・策略命中 +1`}
                      {selected?.talents.includes(talent) && ` ・天份加成 +1`}
                    </p>
                  </div>
                ) : (
                  <p className="mt-5 rounded-2xl bg-[#f6dfd5] p-4 text-sm text-[#8a4a2b]">
                    這回合沒有拿到積木。看一下教練的建議，再說一次就好——不會扣任何東西。
                  </p>
                )}

                {!verdict.graded && (
                  <p className="mt-3 text-xs text-[#8a8578]">
                    AI 教練沒有回應。離線只能檢查句子的形狀、無法判斷內容，所以這回合給最低分。
                  </p>
                )}

                {verdict.score > 0 ? (
                  <Button onClick={next} className="mt-auto rounded-full bg-[#173a34]">
                    {isLast ? '結束並回到城市' : '下一個回合'}
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                ) : (
                  <div className="mt-auto flex gap-2 pt-5">
                    <Button onClick={retry} className="flex-1 rounded-full bg-[#e26a3b]">
                      <RotateCcw className="mr-2 h-4 w-4" />再說一次
                    </Button>
                    <Button onClick={next} variant="outline" className="rounded-full">
                      {isLast ? '直接結束' : '跳過'}
                    </Button>
                  </div>
                )}
              </div>
            ) : isEvaluating ? (
              <div className="flex h-full flex-col items-center justify-center py-16 text-center">
                <Loader2 className="h-10 w-10 animate-spin text-[#1f8a70]" />
                <h2 className="mt-5 text-xl font-black">AI 教練評分中…</h2>
                <p className="mt-2 max-w-xs text-sm text-[#57736e]">
                  積木產出由這次的評分決定，稍等一下。
                </p>
              </div>
            ) : !selected ? (
              <>
                <p className="text-xs font-black tracking-widest text-[#e26a3b]">YOUR BLOCKS</p>
                <h2 className="mt-1 text-2xl font-black">選一張策略卡</h2>
                <p className="mt-1 text-sm text-[#57736e]">
                  卡片顏色就是它產出的積木。積木數量由 AI 教練的評分決定，選對情境需要的能力再 +1。
                </p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  {hand.map(card => (
                    <button
                      key={card.id}
                      onClick={() => chooseCard(card)}
                      className="min-h-40 rounded-2xl border-2 p-4 text-left transition hover:-translate-y-1 hover:shadow-lg"
                      style={{ borderColor: `${ABILITY_COLOR[card.ability]}55`, background: `${ABILITY_COLOR[card.ability]}0d` }}
                    >
                      <div className="flex items-start justify-between">
                        <span className="text-3xl">{card.icon}</span>
                        {card.talents.includes(talent) && (
                          <span className="rounded-full bg-[#dce9c7] px-2 py-1 text-[10px] font-black">天份加成</span>
                        )}
                      </div>
                      <h3 className="mt-3 font-black">{card.title}</h3>
                      <p className="mt-1 text-xs text-[#57736e]">{card.subtitle}</p>
                      <p className="mt-2 text-[10px] font-black" style={{ color: ABILITY_COLOR[card.ability] }}>
                        {ABILITY_LABEL[card.ability]}積木
                      </p>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <button onClick={() => setSelected(null)} className="text-xs font-bold text-[#57736e]">
                  ← 換一張卡
                </button>
                <div className="mt-4 rounded-2xl p-4" style={{ background: `${ABILITY_COLOR[selected.ability]}12` }}>
                  <div className="text-3xl">{selected.icon}</div>
                  <h3 className="mt-2 text-xl font-black">{selected.title}</h3>
                  <p className="mt-1 text-sm text-[#57736e]">句型提示：{selected.sentence}</p>
                </div>
                <label className="mt-5 block text-sm font-black" htmlFor="city-answer">
                  說出或輸入你的回應
                </label>
                <textarea
                  id="city-answer"
                  value={answer}
                  onChange={e => setAnswer(e.target.value)}
                  placeholder={round.example}
                  className="mt-2 min-h-28 w-full rounded-2xl border bg-[#faf8f2] p-4 outline-none focus:ring-2 focus:ring-[#1f8a70]"
                />
                <div className="mt-3 flex gap-2">
                  <Button variant="outline" onClick={listen} className="rounded-full">
                    <Mic className={`mr-2 h-4 w-4 ${isListening ? 'animate-pulse text-red-500' : ''}`} />
                    {isListening ? '聆聽中' : '語音輸入'}
                  </Button>
                  <Button
                    disabled={!answer.trim() || isEvaluating}
                    onClick={submit}
                    className="flex-1 rounded-full bg-[#e26a3b]"
                  >
                    {isEvaluating ? 'AI 評估中…' : '送出回應'}
                  </Button>
                </div>
              </>
            )}
          </aside>
        </div>

        <div className="mt-6 flex items-center gap-4">
          <Progress value={((index + (verdict?.score ? 1 : 0)) / rounds.length) * 100} className="h-2" />
          <span className="whitespace-nowrap text-xs font-black">
            <Building2 className="mr-1 inline h-3 w-3" />PROGRESS
          </span>
        </div>
      </section>
    </main>
  );
}
