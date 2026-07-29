// 語言城市 — the persistent layer on top of the talent card game.
//
// Clearing a scenario raises a building on your city grid; the building attracts
// residents who go on living between sessions. Each day that passes, residents
// roll a life event from the template pool their topics allow, which becomes a
// one-round conversation invitation waiting for you. Talking raises the bond and
// leaves a memory the resident can quote back later; silence lets the bond decay.
//
// Everything here is deterministic and offline-capable — the AI coach in
// stream-chat is an enhancement layer, never a dependency.

import { GameAbility, GameCard, GameRound, GAME_CARDS } from './talent-card-game';
import { GeniusType } from './genius-type';

export type BlockBank = Record<GameAbility, number>;

export type ResidentTopic =
  | 'food' | 'travel' | 'work' | 'study' | 'art'
  | 'health' | 'family' | 'sport' | 'tech' | 'music' | 'story' | 'city';

export interface BuildingDef {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  /** Ability this district trains hardest — shown as its banner. */
  ability: GameAbility;
  /** Blocks required to raise it. The cafe is free so day one has a way in. */
  cost: Partial<BlockBank>;
  /** Building ids that must already stand before this site appears. */
  requires: string[];
  rounds: GameRound[];
}

export interface ResidentDef {
  id: string;
  name: string;
  nameZh: string;
  emoji: string;
  role: string;
  /** One-line personality, shown on the resident card and fed to the AI coach. */
  persona: string;
  /** Talent this resident resonates with — bond grows faster for a matching player. */
  affinity: GeniusType;
  topics: ResidentTopic[];
  greeting: string;
  building: string;
}

export interface LifeEventTemplate {
  id: string;
  topics: ResidentTopic[];
  /** Chinese feed headline. {name} is replaced with the resident's Chinese name. */
  headline: string;
  round: Omit<GameRound, 'speaker'>;
  bond: number;
}

export interface Memory {
  /** ISO date the line was said. */
  at: string;
  /** The learner's own sentence, kept verbatim so residents can quote it. */
  line: string;
  /** Chinese gist of what the exchange was about. */
  gist: string;
}

export interface Resident {
  defId: string;
  bond: number;
  metOn: string;
  lastTalkedOn: string;
  memories: Memory[];
}

/**
 * Position is not stored — buildings occupy plots in build order, so the grid
 * can grow around them without any saved coordinate going stale.
 */
export interface PlacedBuilding {
  defId: string;
  level: number;
  builtOn: string;
}

/**
 * Why a resident is talking to you today.
 * - `life`   — something happened to them, drawn from the template pool
 * - `recall` — they bring up a line you actually said to them
 * - `gossip` — they talk about another resident they're tied to, sometimes
 *              relaying a line you said to that other person
 */
export type CityEventKind = 'life' | 'recall' | 'gossip';

export interface CityEvent {
  id: string;
  residentId: string;
  templateId: string;
  kind: CityEventKind;
  /** The other resident, for gossip events. */
  aboutId?: string;
  day: number;
  headline: string;
  round: GameRound;
  bond: number;
}

export interface CityState {
  version: 3;
  /** Days the city has been alive — advanced by real calendar days. */
  day: number;
  lastSeenOn: string;
  blocks: BlockBank;
  buildings: PlacedBuilding[];
  residents: Resident[];
  events: CityEvent[];
  /** Life-event template ids already used per resident, so nothing repeats early. */
  seen: Record<string, string[]>;
  population: number;
  talkCount: number;
}

const MAX_ACTIVE_EVENTS = 6;
const MAX_TICKS = 3;
const MAX_MEMORIES = 8;
const BOND_DECAY_PER_IDLE_DAY = 3;

export const todayISO = () => new Date().toISOString().slice(0, 10);
const daysBetween = (from: string, to: string) =>
  Math.max(0, Math.round((Date.parse(to) - Date.parse(from)) / 86400000));

// ---------------------------------------------------------------------------
// Buildings
// ---------------------------------------------------------------------------

export const BUILDING_DEFS: BuildingDef[] = [
  {
    id: 'cafe',
    title: '街角咖啡店',
    subtitle: '城市的第一盞燈：點餐、閒聊、認識鄰居',
    icon: '☕',
    color: '#1f8a70',
    ability: 'observe',
    cost: {},
    requires: [],
    rounds: [
      { speaker: 'MIA・咖啡師', prompt: 'Morning! You must be new around here. What can I get you?', goal: '看懂情境並點一杯飲料。', best: 'observe', example: 'I’d like an iced latte, please.', successReply: 'Coming right up. Welcome to the neighbourhood!', retryReply: 'Take your time—just tell me a drink you like.' },
      { speaker: 'MIA・咖啡師', prompt: 'We have oat, soy, and regular milk. Which works for you?', goal: '說出偏好並補上一個原因。', best: 'connect', example: 'Oat milk, please, because I prefer the taste.', successReply: 'Good call. Oat milk goes really well with that.', retryReply: '用 because 接上一個理由會更完整。' },
      { speaker: '排隊的鄰居', prompt: 'That looks good. Are you moving in nearby?', goal: '主動回應並把話題交回去。', best: 'express', example: 'Yes, I just moved in. Do you live around here too?', successReply: 'I do! You’ll like this street. See you around.', retryReply: '回答之後反問一句，對話才會延續。' },
    ],
  },
  {
    id: 'station',
    title: '中央轉運站',
    subtitle: '問路、改票、處理突發狀況',
    icon: '🚉',
    color: '#3978c5',
    ability: 'express',
    cost: { observe: 3, express: 2 },
    requires: ['cafe'],
    rounds: [
      { speaker: '站務員 RAJ', prompt: 'Where are you trying to get to today?', goal: '清楚說出目的地與時間。', best: 'express', example: 'I’m trying to get to Oxford before noon.', successReply: 'Platform six is your fastest option.', retryReply: '先講目的地，再補上時間。' },
      { speaker: '站務員 RAJ', prompt: 'Bad news—that train was cancelled. Want the next one?', goal: '理解變動並確認新方案。', best: 'observe', example: 'Yes, please. What time does the next train leave?', successReply: 'It leaves at 11:20 from platform four.', retryReply: '用一個問題確認新班次的時間或月台。' },
      { speaker: '迷路的旅客', prompt: 'Sorry—is this platform four?', goal: '根據線索協助對方。', best: 'connect', example: 'I think so. The sign over there says platform four.', successReply: 'Thank you! That sign was easy to miss.', retryReply: '指出一個你看到的線索當證據。' },
    ],
  },
  {
    id: 'market',
    title: '生鮮市集',
    subtitle: '挑食材、問價錢、跟攤商搏感情',
    icon: '🥬',
    color: '#5f9e3f',
    ability: 'observe',
    cost: { observe: 4, connect: 2 },
    requires: ['cafe'],
    rounds: [
      { speaker: '攤商 OLGA', prompt: 'These tomatoes came in this morning. Ever cooked with them?', goal: '描述你看到的東西並提問。', best: 'observe', example: 'They look really fresh. How much are they per kilo?', successReply: 'Three euros a kilo. Smell one—go on.', retryReply: '先描述你看到的，再問一個問題。' },
      { speaker: '攤商 OLGA', prompt: 'What are you making tonight?', goal: '說出計畫並連上理由。', best: 'connect', example: 'A simple pasta, because I don’t have much time tonight.', successReply: 'Then take the basil too. It’s on me.', retryReply: '講一道菜，再說為什麼選它。' },
      { speaker: '隔壁攤的老闆', prompt: 'She gave you free basil? You must have said something nice.', goal: '輕鬆回應一句玩笑。', best: 'express', example: 'I just asked good questions, I guess!', successReply: 'Ha! Come back next week, then.', retryReply: '不用完美，接一句輕鬆的話就好。' },
    ],
  },
  {
    id: 'office',
    title: '共享辦公室',
    subtitle: '自我介紹、開會發言、爭取資源',
    icon: '🏢',
    color: '#6d5bd0',
    ability: 'connect',
    cost: { connect: 4, express: 3 },
    requires: ['station'],
    rounds: [
      { speaker: '社群經理 DANA', prompt: 'Welcome! Tell the room what you’re working on.', goal: '用結構化方式介紹自己。', best: 'connect', example: 'I’m a product designer, and I’m building a language learning app.', successReply: 'Nice. A few people here could help with that.', retryReply: '先講角色，再講你在做什麼。' },
      { speaker: '鄰座 SAM', prompt: 'What’s the hardest part of it right now?', goal: '拆解問題並具體說明。', best: 'observe', example: 'Users leave after the first week, so I’m studying where they drop off.', successReply: 'That’s a good way to frame it.', retryReply: '先描述問題，再說你怎麼處理。' },
      { speaker: '社群經理 DANA', prompt: 'We have a demo night on Thursday. Interested?', goal: '接受邀請並問清細節。', best: 'express', example: 'I’d love to. What time should I arrive?', successReply: 'Seven o’clock. I’ll put you on the list.', retryReply: '答應之後追問一個細節。' },
    ],
  },
  {
    id: 'campus',
    title: '社區語言學校',
    subtitle: '課堂討論、小組合作、請求協助',
    icon: '🎓',
    color: '#d18a29',
    ability: 'connect',
    cost: { observe: 3, connect: 4 },
    requires: ['cafe', 'market'],
    rounds: [
      { speaker: '同組同學 YUKI', prompt: 'We need a topic for the group project. Any ideas?', goal: '提出想法並邀請回饋。', best: 'express', example: 'How about AI in education? What do you think?', successReply: 'I like it. We could compare a few tools.', retryReply: '給一個明確的題目，再問對方意見。' },
      { speaker: '老師 CLARA', prompt: 'Why do you agree with that argument?', goal: '連結理由與例子。', best: 'connect', example: 'I agree because it gives students faster feedback.', successReply: 'Good link. Can you add an example?', retryReply: '用 because 把理由接上來。' },
      { speaker: '圖書館員', prompt: 'What kind of source are you looking for?', goal: '具體描述你要的資料。', best: 'observe', example: 'I need a recent research paper about language learning.', successReply: 'Try the education database on this floor.', retryReply: '說出主題、格式或年份其中一項。' },
    ],
  },
  {
    id: 'clinic',
    title: '社區診所',
    subtitle: '描述身體狀況、聽懂指示、確認細節',
    icon: '🏥',
    color: '#d85f78',
    ability: 'observe',
    cost: { observe: 5, express: 3 },
    requires: ['market'],
    rounds: [
      { speaker: '護理師 NOOR', prompt: 'What brings you in today?', goal: '描述症狀與持續時間。', best: 'observe', example: 'I’ve had a sore throat for three days.', successReply: 'Thanks. Let me take your temperature.', retryReply: '講出症狀，再加上持續多久。' },
      { speaker: '醫師 PATEL', prompt: 'Take one tablet twice a day, after food. Clear?', goal: '複述指示確認理解。', best: 'connect', example: 'So that’s one tablet, twice a day, after meals?', successReply: 'Exactly right. Come back if it gets worse.', retryReply: '把指示用自己的話重講一次。' },
      { speaker: '櫃檯人員', prompt: 'Would you like a reminder by text or email?', goal: '做出選擇並說明。', best: 'express', example: 'By text, please—I check my phone more often.', successReply: 'Done. You’ll get it on Monday morning.', retryReply: '選一個，再簡單說原因。' },
    ],
  },
  {
    id: 'studio',
    title: '播客工作室',
    subtitle: '開麥、講故事、接住即興提問',
    icon: '🎙️',
    color: '#e26a3b',
    ability: 'express',
    cost: { express: 6, connect: 3 },
    requires: ['office'],
    rounds: [
      { speaker: '主持人 LEO', prompt: 'We’re live in three, two… so, who are you?', goal: '在壓力下快速自我介紹。', best: 'express', example: 'I’m Jay, and I help people learn languages through games.', successReply: 'Great energy. Let’s dig into that.', retryReply: '先說名字跟一句你在做的事就夠了。' },
      { speaker: '主持人 LEO', prompt: 'Tell us about a moment this really worked for someone.', goal: '講一個有畫面的小故事。', best: 'connect', example: 'One learner told me she finally ordered coffee without freezing.', successReply: 'That’s the kind of story people remember.', retryReply: '用一個具體的人、一個具體的場景。' },
      { speaker: '聽眾來電', prompt: 'I get nervous every time I open my mouth. Any advice?', goal: '同理對方並給出建議。', best: 'observe', example: 'I know that feeling. Start with one sentence you’ve practised.', successReply: 'That actually helps. Thank you.', retryReply: '先接住對方的感受，再給建議。' },
    ],
  },
  {
    id: 'park',
    title: '中央公園',
    subtitle: '閒聊、運動、跟陌生人自然搭話',
    icon: '🌳',
    color: '#2f8f52',
    ability: 'express',
    cost: { express: 4, observe: 4 },
    requires: ['station'],
    rounds: [
      { speaker: '慢跑者 ELI', prompt: 'Nice morning, isn’t it? Do you run here often?', goal: '接住閒聊並回問。', best: 'express', example: 'It really is. I’m just starting. Do you come every day?', successReply: 'Most days. You should join us on Saturdays.', retryReply: '回答之後丟一個問題回去。' },
      { speaker: '慢跑者 ELI', prompt: 'We do five kilometres. Too much for a first time?', goal: '誠實表達能力並協商。', best: 'connect', example: 'Maybe. Could I do three and see how it goes?', successReply: 'Of course. We’ll go at your pace.', retryReply: '說出你的狀況，再提一個替代方案。' },
      { speaker: '遛狗的老先生', prompt: 'She likes you. She doesn’t like everyone.', goal: '觀察情境並輕鬆回應。', best: 'observe', example: 'She’s beautiful. How old is she?', successReply: 'Nine years old. Still thinks she’s a puppy.', retryReply: '從你看到的細節接一句話。' },
    ],
  },
  {
    id: 'theater',
    title: '街區小劇場',
    subtitle: '即興演出、角色扮演、大聲說出來',
    icon: '🎭',
    color: '#8e44ad',
    ability: 'express',
    cost: { express: 7, connect: 5, observe: 3 },
    requires: ['studio', 'campus'],
    rounds: [
      { speaker: '導演 VIV', prompt: 'You’re a traveller who lost everything. Go.', goal: '進入角色即興開口。', best: 'express', example: 'Excuse me—I’ve lost my bag, my passport, everything.', successReply: 'Good! Keep that panic in your voice.', retryReply: '不要想文法，先讓角色說第一句話。' },
      { speaker: '對戲演員 OMAR', prompt: 'I found a bag by the fountain. Was it yours?', goal: '接住對手戲並推進劇情。', best: 'connect', example: 'It might be! Was there a blue notebook inside?', successReply: 'There was. You’d better come with me.', retryReply: '接住對方給的線索，再加一個細節。' },
      { speaker: '導演 VIV', prompt: 'Now say the same line, but you’re relieved, not scared.', goal: '調整語氣重新表達。', best: 'observe', example: 'Oh, thank goodness. That’s my bag—thank you so much.', successReply: 'That’s it. You just acted in a second language.', retryReply: '一樣的意思，換一個情緒說。' },
    ],
  },
];

export const buildingDef = (id: string) => BUILDING_DEFS.find(b => b.id === id);

// ---------------------------------------------------------------------------
// Residents
// ---------------------------------------------------------------------------

export const RESIDENT_DEFS: ResidentDef[] = [
  { id: 'mia', name: 'Mia', nameZh: '米亞', emoji: '👩‍🍳', role: '咖啡師', persona: '記得每個人的常點，話少但觀察很細。', affinity: 'visionary', topics: ['food', 'city', 'story'], greeting: 'Your usual?', building: 'cafe' },
  { id: 'theo', name: 'Theo', nameZh: '西奧', emoji: '🧑‍🎨', role: '常客・插畫家', persona: '每天坐同一個位子畫路人，喜歡問奇怪的問題。', affinity: 'narrator', topics: ['art', 'story', 'city'], greeting: 'Can I draw you? Don’t move.', building: 'cafe' },
  { id: 'raj', name: 'Raj', nameZh: '拉吉', emoji: '🧑‍✈️', role: '站務員', persona: '背得出所有班次，講話快、直接、不繞圈。', affinity: 'analyst', topics: ['travel', 'city', 'work'], greeting: 'Two minutes till the next one. Talk fast.', building: 'station' },
  { id: 'nina', name: 'Nina', nameZh: '妮娜', emoji: '🎒', role: '長途背包客', persona: '待不久就走，總是在講下一個城市。', affinity: 'explorer', topics: ['travel', 'story', 'food'], greeting: 'Guess where I’m going next.', building: 'station' },
  { id: 'olga', name: 'Olga', nameZh: '歐嘉', emoji: '🧑‍🌾', role: '市集攤商', persona: '嗓門大、心很軟，會硬塞東西給你。', affinity: 'performer', topics: ['food', 'family', 'health'], greeting: 'You look hungry. Sit.', building: 'market' },
  { id: 'ben', name: 'Ben', nameZh: '阿班', emoji: '🧑‍🍳', role: '市集後方的廚師', persona: '沉默寡言，但一講到食材就停不下來。', affinity: 'architect', topics: ['food', 'work', 'health'], greeting: 'Taste this. Tell me what’s missing.', building: 'market' },
  { id: 'dana', name: 'Dana', nameZh: '黛娜', emoji: '👩‍💼', role: '社群經理', persona: '幫每個人牽線，記得所有人的專長。', affinity: 'connector', topics: ['work', 'city', 'tech'], greeting: 'I’ve got someone you should meet.', building: 'office' },
  { id: 'sam', name: 'Sam', nameZh: '山姆', emoji: '🧑‍💻', role: '獨立開發者', persona: '深夜還在座位上，講話喜歡先給結論。', affinity: 'analyst', topics: ['tech', 'work', 'study'], greeting: 'Quick question—do you have two minutes?', building: 'office' },
  { id: 'yuki', name: 'Yuki', nameZh: '由紀', emoji: '🧑‍🎓', role: '交換學生', persona: '筆記做得極整齊，開口前會先想很久。', affinity: 'architect', topics: ['study', 'story', 'travel'], greeting: 'I wrote down three questions for you.', building: 'campus' },
  { id: 'clara', name: 'Clara', nameZh: '克拉拉', emoji: '👩‍🏫', role: '語言老師', persona: '從不直接給答案，只會再問一個問題。', affinity: 'connector', topics: ['study', 'art', 'story'], greeting: 'And why do you think that is?', building: 'campus' },
  { id: 'noor', name: 'Noor', nameZh: '努爾', emoji: '👩‍⚕️', role: '護理師', persona: '講話溫和但精準，會確認你真的聽懂了。', affinity: 'analyst', topics: ['health', 'family', 'work'], greeting: 'How have you been sleeping?', building: 'clinic' },
  { id: 'hugo', name: 'Hugo', nameZh: '雨果', emoji: '🧓', role: '每週回診的老先生', persona: '看診是藉口，其實是來找人說話。', affinity: 'narrator', topics: ['story', 'family', 'city'], greeting: 'Did I ever tell you about the winter of ’78?', building: 'clinic' },
  { id: 'leo', name: 'Leo', nameZh: '里歐', emoji: '🎧', role: '播客主持人', persona: '什麼都能接話，最怕安靜三秒。', affinity: 'performer', topics: ['story', 'music', 'city'], greeting: 'We’re recording. Say something.', building: 'studio' },
  { id: 'ivy', name: 'Ivy', nameZh: '艾薇', emoji: '🎚️', role: '聲音工程師', persona: '耳朵極利，會糾正你的重音而不是文法。', affinity: 'melodist', topics: ['music', 'tech', 'art'], greeting: 'Say that again—your stress was off.', building: 'studio' },
  { id: 'eli', name: 'Eli', nameZh: '艾里', emoji: '🏃', role: '晨跑社團長', persona: '永遠精力過剩，會把你拉去參加各種活動。', affinity: 'explorer', topics: ['sport', 'health', 'city'], greeting: 'You’re coming on Saturday, right?', building: 'park' },
  { id: 'rosa', name: 'Rosa', nameZh: '蘿莎', emoji: '🐕', role: '公園裡的遛狗人', persona: '認識公園裡每一隻狗，不認識人的名字。', affinity: 'visionary', topics: ['city', 'family', 'health'], greeting: 'Look at her ears. She heard you coming.', building: 'park' },
  { id: 'viv', name: 'Viv', nameZh: '薇薇', emoji: '🎬', role: '劇場導演', persona: '嚴格但不刻薄，只在乎你有沒有真的開口。', affinity: 'performer', topics: ['art', 'story', 'work'], greeting: 'Again. Louder this time.', building: 'theater' },
  { id: 'omar', name: 'Omar', nameZh: '奧瑪', emoji: '🎭', role: '即興演員', persona: '從不說不，你丟什麼他都接得住。', affinity: 'explorer', topics: ['art', 'story', 'music'], greeting: 'Yes, and—?', building: 'theater' },
];

export const residentDef = (id: string) => RESIDENT_DEFS.find(r => r.id === id);
export const residentsOfBuilding = (buildingId: string) =>
  RESIDENT_DEFS.filter(r => r.building === buildingId);

// ---------------------------------------------------------------------------
// Life events — what residents get up to while you're away
// ---------------------------------------------------------------------------

export const LIFE_EVENTS: LifeEventTemplate[] = [
  { id: 'new-recipe', topics: ['food'], headline: '{name}試做了一道新料理，想找人試吃。', bond: 6,
    round: { prompt: 'I tried something new last night. Do you want to guess what’s in it?', goal: '猜測並描述你嚐到的味道。', best: 'observe', example: 'Is there ginger in it? It tastes warm.', successReply: 'Ginger and a little honey. You have a good tongue.', retryReply: '說出一種你猜的食材，再形容味道。' } },
  { id: 'market-shortage', topics: ['food', 'city'], headline: '{name}說市場今天缺貨，得換個計畫。', bond: 5,
    round: { prompt: 'No fish today. What should I cook instead?', goal: '提出替代方案並給理由。', best: 'connect', example: 'Maybe mushrooms, because they’re filling too.', successReply: 'Mushrooms it is. Good thinking.', retryReply: '提一個替代品，用 because 說明。' } },
  { id: 'trip-plan', topics: ['travel'], headline: '{name}在規劃下一趟旅程，想聽你的意見。', bond: 6,
    round: { prompt: 'Two options: mountains or the coast. Which would you pick?', goal: '做選擇並說明理由。', best: 'connect', example: 'The coast, because I sleep better near water.', successReply: 'The coast, then. You convinced me.', retryReply: '選一個，然後說為什麼。' } },
  { id: 'missed-train', topics: ['travel', 'city'], headline: '{name}錯過了末班車，正在想辦法。', bond: 7,
    round: { prompt: 'I missed the last train. What would you do in my place?', goal: '提出具體建議。', best: 'express', example: 'I’d take a taxi, or ask a friend for a spare room.', successReply: 'A taxi it is. Thanks for thinking with me.', retryReply: '給一個實際可行的做法。' } },
  { id: 'lost-item', topics: ['travel', 'city'], headline: '{name}掉了東西，想請你幫忙描述。', bond: 6,
    round: { prompt: 'I lost my notebook somewhere. How do I describe it to the lost desk?', goal: '用細節描述一個物品。', best: 'observe', example: 'Say it’s a small blue notebook with a torn cover.', successReply: 'Small, blue, torn cover. That’s exactly it.', retryReply: '加上顏色、大小或特徵。' } },
  { id: 'deadline', topics: ['work'], headline: '{name}被臨時的截止日追著跑。', bond: 6,
    round: { prompt: 'My deadline moved to tomorrow. How should I tell my client?', goal: '幫忙組出一句得體的說法。', best: 'connect', example: 'Say you need one more day to deliver it properly.', successReply: 'That’s much better than what I wrote. Thanks.', retryReply: '想一句既誠實又專業的說法。' } },
  { id: 'job-offer', topics: ['work', 'study'], headline: '{name}收到一個機會，猶豫要不要接。', bond: 8,
    round: { prompt: 'They offered me the role, but it means moving. What do you think?', goal: '同理對方並給出看法。', best: 'observe', example: 'That’s a big change. What worries you most about moving?', successReply: 'Leaving this street, honestly. You asked the right question.', retryReply: '先接住對方的心情，再問一個問題。' } },
  { id: 'presentation', topics: ['work', 'study'], headline: '{name}明天要上台，緊張到睡不著。', bond: 7,
    round: { prompt: 'I present tomorrow and I’m terrified. Say something useful.', goal: '給出鼓勵與一個具體建議。', best: 'express', example: 'You’ll be fine. Practise just the first sentence tonight.', successReply: 'Just the first sentence. I can do that.', retryReply: '一句鼓勵，加一個做得到的小動作。' } },
  { id: 'exam-result', topics: ['study'], headline: '{name}的考試成績出來了。', bond: 6,
    round: { prompt: 'I passed—but barely. Should I be happy or worried?', goal: '表達看法並給理由。', best: 'connect', example: 'Happy. You passed, and now you know what to work on.', successReply: 'You’re right. I’ll take the win.', retryReply: '選一個立場，然後說明。' } },
  { id: 'study-stuck', topics: ['study', 'tech'], headline: '{name}卡在一個問題上一整天。', bond: 5,
    round: { prompt: 'I’ve been stuck on this for hours. How do you get unstuck?', goal: '分享你的方法。', best: 'express', example: 'I walk away for ten minutes, then explain it out loud.', successReply: 'Explaining it out loud—I’ll try that.', retryReply: '講一個你自己真的會用的方法。' } },
  { id: 'new-piece', topics: ['art'], headline: '{name}完成了一件新作品。', bond: 6,
    round: { prompt: 'I finished it last night. Tell me what you see.', goal: '描述你的感受與觀察。', best: 'observe', example: 'It feels lonely, but the light in the corner is warm.', successReply: 'Lonely with warm light. That’s what I wanted.', retryReply: '講一個你「看到」的細節，再講感覺。' } },
  { id: 'creative-block', topics: ['art', 'music'], headline: '{name}最近做不出東西，有點低落。', bond: 7,
    round: { prompt: 'Nothing I make feels good lately. Does that happen to you?', goal: '同理並分享經驗。', best: 'connect', example: 'It does. When it happens, I make something small on purpose.', successReply: 'Something small. Okay. I can start there.', retryReply: '先說「我也會」，再分享做法。' } },
  { id: 'song-stuck', topics: ['music'], headline: '{name}有一首歌卡在腦裡一整天。', bond: 5,
    round: { prompt: 'This song won’t leave my head. What’s yours right now?', goal: '分享並描述一首歌。', best: 'express', example: 'Mine is an old jazz track—slow, with a lot of piano.', successReply: 'Send it to me. I need something slow today.', retryReply: '講一首歌，再形容它的感覺。' } },
  { id: 'accent-note', topics: ['music', 'study'], headline: '{name}注意到你某個字的發音。', bond: 6,
    round: { prompt: 'You stress the second syllable. Try it on the first—say “comfortable”.', goal: '跟著調整重音再說一次。', best: 'observe', example: 'COMfortable. Like that?', successReply: 'That’s it. Your ear is getting sharper.', retryReply: '把重音放在第一個音節再試一次。' } },
  { id: 'sick-day', topics: ['health'], headline: '{name}身體不太舒服。', bond: 7,
    round: { prompt: 'I’ve felt off all week. Should I see someone about it?', goal: '關心對方並給建議。', best: 'observe', example: 'A whole week is long. What exactly feels wrong?', successReply: 'Tired, mostly. Maybe I should get it checked.', retryReply: '先問清楚狀況，再給建議。' } },
  { id: 'new-habit', topics: ['health', 'sport'], headline: '{name}想開始一個新習慣。', bond: 5,
    round: { prompt: 'I want to start swimming. How do I actually keep going?', goal: '給出可執行的建議。', best: 'connect', example: 'Pick one fixed day, because a routine is easier than willpower.', successReply: 'One fixed day. That sounds doable.', retryReply: '建議一個具體做法，加上理由。' } },
  { id: 'race-day', topics: ['sport'], headline: '{name}報名了週末的比賽。', bond: 6,
    round: { prompt: 'I signed up for the 10K. Come with me?', goal: '回應邀約並說明。', best: 'express', example: 'I’d like to, but ten is a lot. Can I do the 5K?', successReply: 'Five is perfect. I’ll wait for you at the finish.', retryReply: '答應或婉拒，都要給一句理由。' } },
  { id: 'family-visit', topics: ['family'], headline: '{name}的家人要來城裡。', bond: 7,
    round: { prompt: 'My mother arrives Friday. Where should I take her?', goal: '推薦地點並說明原因。', best: 'connect', example: 'The park in the morning, because it’s quiet before ten.', successReply: 'Quiet and green. She’d love that.', retryReply: '推薦一個地方，說出為什麼合適。' } },
  { id: 'family-news', topics: ['family', 'story'], headline: '{name}收到一個家裡的消息。', bond: 8,
    round: { prompt: 'My sister had a baby last night. I don’t know what to say to her.', goal: '幫對方想出一句話。', best: 'express', example: 'Just say you’re proud of her and you’ll come soon.', successReply: 'Proud of her. Yes. That’s the one.', retryReply: '想一句真誠、簡單的話。' } },
  { id: 'old-story', topics: ['story'], headline: '{name}想起一段往事。', bond: 6,
    round: { prompt: 'This street looked completely different thirty years ago. Want to hear?', goal: '表達興趣並提問。', best: 'observe', example: 'I do. What stood where the café is now?', successReply: 'A cinema. One screen, terrible seats, wonderful films.', retryReply: '答應之後，問一個具體的問題。' } },
  { id: 'city-change', topics: ['city'], headline: '街區有了變化，{name}想聊聊。', bond: 5,
    round: { prompt: 'They’re building something on the corner. Good or bad?', goal: '表達立場並說明。', best: 'connect', example: 'Good, if it brings people. Bad, if it pushes rent up.', successReply: 'You said it better than I could.', retryReply: '給一個立場，說一個理由。' } },
  { id: 'neighbour-intro', topics: ['city'], headline: '{name}想把新鄰居介紹給你。', bond: 6,
    round: { prompt: 'Someone new moved in upstairs. Should I knock and say hello?', goal: '給建議並想一句開場白。', best: 'express', example: 'Yes—just say hello and offer to help if they need anything.', successReply: 'Simple. I’ll do it tonight.', retryReply: '建議一個做法，再給一句開場白。' } },
  { id: 'broken-thing', topics: ['tech'], headline: '{name}的東西壞了，正在客服電話上掙扎。', bond: 6,
    round: { prompt: 'The support line keeps asking me to “describe the issue”. Help.', goal: '幫忙把問題講清楚。', best: 'observe', example: 'Say it turns on, then shuts down after one minute.', successReply: 'That’s exactly what happens. Thank you.', retryReply: '把「發生什麼」講成一句具體的話。' } },
  { id: 'app-idea', topics: ['tech', 'work'], headline: '{name}有個點子想說給你聽。', bond: 6,
    round: { prompt: 'I have an idea, but I can’t explain it in one sentence. Can you help?', goal: '用一句話濃縮一個想法。', best: 'connect', example: 'It’s like a diary, but it reminds you what you forgot.', successReply: '“A diary that reminds you.” That’s it!', retryReply: '用「It’s like…, but…」的句型試試。' } },
  { id: 'rainy-day', topics: ['city', 'health'], headline: '下了一整天的雨，{name}被困在店裡。', bond: 4,
    round: { prompt: 'Rain all day. How do you get through days like this?', goal: '分享你的做法。', best: 'express', example: 'I make tea and finally read the book I keep avoiding.', successReply: 'Tea and a book. I’ll steal that idea.', retryReply: '講一件你在雨天真的會做的事。' } },
  { id: 'ask-favour', topics: ['work', 'family', 'city'], headline: '{name}想拜託你一件事。', bond: 7,
    round: { prompt: 'Can I ask you a favour? It’s a small one.', goal: '回應請求並問清楚。', best: 'observe', example: 'Of course. What do you need?', successReply: 'Just come with me on Thursday. That’s all.', retryReply: '先答應，再問清楚細節。' } },
  { id: 'celebrate', topics: ['work', 'study', 'sport', 'art'], headline: '{name}有好消息想慶祝。', bond: 7,
    round: { prompt: 'It finally happened. I got it! Say something!', goal: '表達祝賀與情緒。', best: 'express', example: 'That’s amazing—you worked so hard for this. Congratulations!', successReply: 'Thank you. I needed to hear that out loud.', retryReply: '講一句真心的祝賀，加上一個細節。' } },
  { id: 'disagree', topics: ['work', 'study', 'city'], headline: '{name}想聽聽不同的意見。', bond: 7,
    round: { prompt: 'Everyone agreed with me today. That worries me. Push back?', goal: '禮貌地表達不同意見。', best: 'connect', example: 'I see it differently—have you considered the cost?', successReply: 'No, I hadn’t. That’s why I asked you.', retryReply: '用「I see it differently」開頭，再給理由。' } },
  { id: 'goodbye-soon', topics: ['travel', 'story'], headline: '{name}說再過幾天就要離開了。', bond: 9,
    round: { prompt: 'I leave on Sunday. What should I do with my last two days here?', goal: '給建議並表達不捨。', best: 'express', example: 'Go back to the park at sunrise. And come say goodbye properly.', successReply: 'Sunrise, then goodbye. I’ll be there.', retryReply: '給一個建議，再說一句你的感受。' } },
];

// ---------------------------------------------------------------------------
// The social graph — who knows whom
// ---------------------------------------------------------------------------

export interface ResidentTie {
  a: string;
  b: string;
  /** How the two know each other, in the speaker's own framing. */
  label: string;
}

/**
 * Ties within a building make it a household; ties across buildings are what
 * turn nine separate scenarios into one city. Both residents must live in your
 * city before a tie can produce anything.
 */
export const RESIDENT_TIES: ResidentTie[] = [
  { a: 'mia', b: 'theo', label: '每天坐在窗邊那位客人' },
  { a: 'raj', b: 'nina', label: '每隔幾個月就出現一次的背包客' },
  { a: 'olga', b: 'ben', label: '在我後面廚房掌鍋的人' },
  { a: 'dana', b: 'sam', label: '總是最後一個離開的開發者' },
  { a: 'yuki', b: 'clara', label: '我的老師' },
  { a: 'noor', b: 'hugo', label: '每週三固定回診的老先生' },
  { a: 'leo', b: 'ivy', label: '幫我控音的搭檔' },
  { a: 'eli', b: 'rosa', label: '公園裡那位遛狗的太太' },
  { a: 'viv', b: 'omar', label: '我最信任的演員' },
  { a: 'mia', b: 'olga', label: '我的咖啡豆和牛奶都跟她進' },
  { a: 'theo', b: 'viv', label: '幫劇場畫海報的插畫家' },
  { a: 'sam', b: 'yuki', label: '我去學校帶過的學生' },
  { a: 'nina', b: 'leo', label: '上過我節目的旅人' },
  { a: 'ben', b: 'noor', label: '一直叫我去檢查身體的護理師' },
  { a: 'eli', b: 'raj', label: '每天在車站看到的那個人' },
  { a: 'hugo', b: 'rosa', label: '公園長椅上的老朋友' },
  { a: 'ivy', b: 'clara', label: '找我教學生發音的老師' },
  { a: 'dana', b: 'omar', label: '我介紹去試鏡的那個演員' },
];

/** Everyone this resident is tied to, with how they'd describe the other. */
export function tiesOf(residentId: string): { otherId: string; label: string }[] {
  return RESIDENT_TIES.flatMap(tie =>
    tie.a === residentId ? [{ otherId: tie.b, label: tie.label }]
    : tie.b === residentId ? [{ otherId: tie.a, label: tie.label }]
    : []);
}

// ---------------------------------------------------------------------------
// Generated events — the city referring to itself and to you
// ---------------------------------------------------------------------------

/** `{other}` is the other resident's Chinese name, `{label}` how they're known. */
interface GossipTemplate {
  id: string;
  headline: string;
  bond: number;
  /** Needs the other resident to be holding a line you said to them. */
  needsRelay?: boolean;
  round: Omit<GameRound, 'speaker'>;
}

const GOSSIP_TEMPLATES: GossipTemplate[] = [
  { id: 'asked-after-you', headline: '{name}說{other}前幾天問起你。', bond: 7,
    round: { prompt: 'Someone was asking about you the other day. Should I tell them where to find you?', goal: '做決定並說明。', best: 'express', example: 'Sure, tell them. I’d like to catch up.', successReply: 'I’ll pass it on, then.', retryReply: '答應或婉拒，都補上一句理由。' } },
  { id: 'worried-about', headline: '{name}有點擔心{other}。', bond: 8,
    round: { prompt: 'I think they’re having a hard week. Should I say something, or leave it alone?', goal: '給出有同理心的建議。', best: 'connect', example: 'Say something small—just let them know you noticed.', successReply: 'Something small. Yes. That’s better than nothing.', retryReply: '給一個建議，再說為什麼。' } },
  { id: 'fell-out', headline: '{name}跟{other}鬧得有點僵。', bond: 8,
    round: { prompt: 'We had words last week and I still think I was right. Am I being unfair?', goal: '禮貌地表達不同看法。', best: 'observe', example: 'Maybe. What do you think it looked like from their side?', successReply: 'I hadn’t thought about their side. Thank you.', retryReply: '先問一個讓對方換位思考的問題。' } },
  { id: 'introduce', headline: '{name}想把你介紹給{other}。', bond: 6,
    round: { prompt: 'You two should meet. What should I tell them about you?', goal: '用一句話介紹自己。', best: 'connect', example: 'Tell them I’m learning English and I ask a lot of questions.', successReply: 'That’s a good line. I’ll use it.', retryReply: '用一句話說出你是誰、在做什麼。' } },
  // The quoted line already carries its own punctuation, so no full stop after
  // the closing quote — otherwise every relay reads “…out loud.”.
  { id: 'relay', headline: '{other}把你說過的話轉告了{name}。', bond: 9, needsRelay: true,
    round: { prompt: 'They told me you said “{line}” — did you mean it the way it sounded?', goal: '澄清或延伸自己說過的話。', best: 'connect', example: 'I did mean it—what I was trying to say is…', successReply: 'That makes more sense now. Thanks for explaining.', retryReply: '用「What I meant was…」把那句話說得更完整。' } },
];

/** `{line}` is replaced with the learner's own remembered sentence. */
interface RecallTemplate {
  id: string;
  headline: string;
  bond: number;
  round: Omit<GameRound, 'speaker'>;
}

const RECALL_TEMPLATES: RecallTemplate[] = [
  { id: 'still-thinking', headline: '{name}還在想你上次說的那句話。', bond: 8,
    round: { prompt: 'You told me “{line}” — I’ve been thinking about it. Do you still feel that way?', goal: '回應並延伸自己說過的話。', best: 'connect', example: 'I do, but I’d say it differently now…', successReply: 'That’s an even better way to put it.', retryReply: '先回答 yes 或 no，再補一句說明。' } },
  { id: 'used-your-words', headline: '{name}把你教的說法用出去了。', bond: 8,
    round: { prompt: 'I borrowed your line—“{line}”—and it worked. Where did you learn to say it like that?', goal: '說明你怎麼學會這個說法。', best: 'express', example: 'I picked it up here, actually. I say it until it feels normal.', successReply: 'Then I’ll do the same. Say it till it’s normal.', retryReply: '講一個你自己真的用過的學習方法。' } },
  { id: 'say-it-again', headline: '{name}想聽你把那句話再說一次，換個說法。', bond: 7,
    round: { prompt: 'Last time you said “{line}” — say it again, but shorter this time.', goal: '把同樣的意思說得更精簡。', best: 'observe', example: 'Same idea, fewer words—just the important part.', successReply: 'Much tighter. That’s the one to keep.', retryReply: '砍掉不必要的字，只留重點。' } },
];

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export const SAVE_KEY = 'language_city_save_v3';

const emptyBank = (): BlockBank => ({ observe: 0, connect: 0, express: 0 });

export function freshCity(): CityState {
  return {
    version: 3,
    day: 1,
    lastSeenOn: todayISO(),
    blocks: emptyBank(),
    buildings: [],
    residents: [],
    events: [],
    seen: {},
    population: 0,
    talkCount: 0,
  };
}

export function loadCity(): CityState {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return freshCity();
    const parsed = JSON.parse(raw) as Partial<CityState>;
    const base = freshCity();
    return {
      ...base,
      ...parsed,
      version: 3,
      blocks: { ...base.blocks, ...(parsed.blocks || {}) },
      buildings: parsed.buildings || [],
      residents: (parsed.residents || []).map(r => ({ ...r, memories: r.memories || [] })),
      events: parsed.events || [],
      seen: parsed.seen || {},
    };
  } catch {
    return freshCity();
  }
}

export function saveCity(state: CityState) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    /* storage full or unavailable — the city just won't persist */
  }
}

// ---------------------------------------------------------------------------
// Building
// ---------------------------------------------------------------------------

export const hasBuilding = (state: CityState, id: string) =>
  state.buildings.some(b => b.defId === id);

export function canAfford(state: CityState, def: BuildingDef) {
  return (Object.entries(def.cost) as [GameAbility, number][])
    .every(([ability, need]) => state.blocks[ability] >= need);
}

/** Sites whose prerequisites are met and that aren't built yet. */
export function availableSites(state: CityState) {
  return BUILDING_DEFS.filter(def =>
    !hasBuilding(state, def.id) && def.requires.every(req => hasBuilding(state, req)));
}

/** Blocks still missing before a site can be raised. */
export function missingBlocks(state: CityState, def: BuildingDef): Partial<BlockBank> {
  const gap: Partial<BlockBank> = {};
  for (const [ability, need] of Object.entries(def.cost) as [GameAbility, number][]) {
    const short = need - state.blocks[ability];
    if (short > 0) gap[ability] = short;
  }
  return gap;
}

/**
 * Grid the city is drawn on. It grows with the skyline, keeping only a couple of
 * free plots visible — an empty city should read as a plot of land, not as a
 * wall of twenty dashed boxes.
 */
export function cityGrid(buildingCount: number): { cols: number; rows: number; plots: number } {
  const target = buildingCount + 2;
  const cols = Math.min(4, Math.max(2, Math.ceil(Math.sqrt(target))));
  const rows = Math.max(2, Math.ceil(target / cols));
  return { cols, rows, plots: cols * rows };
}

export function raiseBuilding(state: CityState, def: BuildingDef): CityState {
  if (hasBuilding(state, def.id)) return state;
  const blocks = { ...state.blocks };
  for (const [ability, need] of Object.entries(def.cost) as [GameAbility, number][]) {
    blocks[ability] = Math.max(0, blocks[ability] - need);
  }
  const on = todayISO();
  const newResidents: Resident[] = residentsOfBuilding(def.id).map(r => ({
    defId: r.id,
    bond: 10,
    metOn: on,
    lastTalkedOn: on,
    memories: [],
  }));
  return {
    ...state,
    blocks,
    buildings: [...state.buildings, { defId: def.id, level: 1, builtOn: on }],
    residents: [...state.residents, ...newResidents],
    population: state.population + newResidents.length,
  };
}

// ---------------------------------------------------------------------------
// Scoring — the AI coach decides what the sentence was worth
// ---------------------------------------------------------------------------

export type RoundScore = 0 | 1 | 2 | 3;

export interface RoundVerdict {
  score: RoundScore;
  blocks: Partial<BlockBank>;
  /** false when the coach was unreachable and we fell back to the offline check. */
  graded: boolean;
}

export const SCORE_LABEL: Record<RoundScore, string> = {
  0: '還沒說清楚',
  1: '勉強說出來了',
  2: '達成任務',
  3: '精準又自然',
};

/** Rubric handed to the coach. Kept next to the parser so the two stay in sync. */
export const SCORE_RUBRIC = [
  '3 = 完全達成任務，英文自然道地',
  '2 = 達成任務，但有小錯或說法不夠自然',
  '1 = 勉強看得懂，有明顯錯誤或沒完全回應任務',
  '0 = 無法理解、答非所問，或根本不是英文句子',
].join('；');

export const SCORE_MARKER_HINT =
  '回覆的最後一行必須是 <<<SCORE>>>n<<<END_SCORE>>>，n 是 0-3 的整數，不要有其他文字。';

/** Pulls the coach's grade out of the streamed reply. null when it never sent one. */
export function parseRoundScore(raw: string): RoundScore | null {
  const match = raw.match(/<<<SCORE>>>\s*([0-3])/);
  return match ? (Number(match[1]) as RoundScore) : null;
}

/** The same reply with the marker removed, safe to show the learner. */
export function stripScoreMarker(raw: string): string {
  return raw.replace(/<<<SCORE>>>[\s\S]*?(?:<<<END_SCORE>>>|$)/g, '').trim();
}

/**
 * Offline grade, used only when the coach can't be reached. It can only check
 * the shape of the sentence — `asdf qwer zxcv` passes every structural test
 * there is — so it awards minimum credit rather than pretending to judge
 * quality. Progress keeps moving, but grinding blocks with the coach offline is
 * three to five times slower than earning them honestly.
 */
export function offlineScore(text: string): RoundScore {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordy = words.filter(w => /^[A-Za-z][A-Za-z'’-]*[.,!?]?$/.test(w));
  if (wordy.length < 3) return 0;
  if (new Set(wordy.map(w => w.toLowerCase())).size < 2) return 0;
  return 1;
}

/**
 * Blocks earned for one round. The coach's grade sets the base, then the card
 * choice adds on: picking the ability the situation calls for, and playing to
 * your own talent. A zero pays nothing — the round can be retried.
 */
export function blocksForRound(
  score: RoundScore,
  card: GameCard,
  round: GameRound,
  talent: GeniusType,
): Partial<BlockBank> {
  if (score <= 0) return {};
  let amount: number = score;
  if (card.ability === round.best) amount += 1;
  if (card.talents.includes(talent)) amount += 1;
  return { [card.ability]: amount };
}

export function addBlocks(state: CityState, gain: Partial<BlockBank>): CityState {
  const blocks = { ...state.blocks };
  for (const [ability, amount] of Object.entries(gain) as [GameAbility, number][]) {
    blocks[ability] += amount;
  }
  return { ...state, blocks };
}

// ---------------------------------------------------------------------------
// The city living on its own
// ---------------------------------------------------------------------------

/** Stable index for a resident on a given day, so a reload can't reroll the feed. */
function dayHash(id: string, day: number, salt = 0): number {
  let hash = (day * 2654435761 + salt * 40503) >>> 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return hash >>> 0;
}

const speakerOf = (def: ResidentDef) => `${def.nameZh}・${def.role}`;

/** Life event: something happened to them, drawn from the shared template pool. */
function pickLifeEvent(def: ResidentDef, day: number, seen: string[]): CityEvent | null {
  const pool = LIFE_EVENTS.filter(t => t.topics.some(topic => def.topics.includes(topic)));
  if (!pool.length) return null;
  const unseen = pool.filter(t => !seen.includes(t.id));
  const candidates = unseen.length ? unseen : pool;
  const template = candidates[dayHash(def.id, day) % candidates.length];
  return {
    id: `${def.id}-${template.id}-${day}`,
    residentId: def.id,
    templateId: template.id,
    kind: 'life',
    day,
    headline: template.headline.replace('{name}', def.nameZh),
    round: { ...template.round, speaker: speakerOf(def) },
    bond: template.bond,
  };
}

/** Recall event: they quote a line you actually said to them. */
function pickRecallEvent(resident: Resident, def: ResidentDef, day: number): CityEvent | null {
  if (!resident.memories.length) return null;
  const memory = resident.memories[dayHash(def.id, day, 1) % resident.memories.length];
  const template = RECALL_TEMPLATES[dayHash(def.id, day, 2) % RECALL_TEMPLATES.length];
  const fill = (text: string) => text.replace('{line}', memory.line);
  return {
    id: `${def.id}-${template.id}-${day}`,
    residentId: def.id,
    templateId: template.id,
    kind: 'recall',
    day,
    headline: template.headline.replace('{name}', def.nameZh),
    round: {
      ...template.round,
      prompt: fill(template.round.prompt),
      speaker: speakerOf(def),
    },
    bond: template.bond,
  };
}

/**
 * Gossip event: they talk about someone they're tied to. The `relay` variant
 * carries a line you said to that other person — the city passing your own
 * words around behind your back.
 */
function pickGossipEvent(
  def: ResidentDef,
  day: number,
  residentsById: Map<string, Resident>,
): CityEvent | null {
  const ties = tiesOf(def.id).filter(tie => residentsById.has(tie.otherId));
  if (!ties.length) return null;
  const tie = ties[dayHash(def.id, day, 3) % ties.length];
  const otherDef = residentDef(tie.otherId);
  const other = residentsById.get(tie.otherId);
  if (!otherDef || !other) return null;

  const relayLine = other.memories[0]?.line;
  const pool = GOSSIP_TEMPLATES.filter(t => !t.needsRelay || relayLine);
  const template = pool[dayHash(def.id, day, 4) % pool.length];

  const fill = (text: string) =>
    text
      .replace('{name}', def.nameZh)
      .replace('{other}', otherDef.nameZh)
      .replace('{label}', tie.label)
      .replace('{line}', relayLine ?? '');

  return {
    id: `${def.id}-${template.id}-${otherDef.id}-${day}`,
    residentId: def.id,
    templateId: template.id,
    kind: 'gossip',
    aboutId: otherDef.id,
    day,
    headline: fill(template.headline),
    round: {
      ...template.round,
      prompt: fill(template.round.prompt),
      speaker: speakerOf(def),
    },
    bond: template.bond,
  };
}

/**
 * What this resident brings up today. Recall and gossip need something to draw
 * on — a memory of yours, or a neighbour who lives here — so early on the city
 * runs on life events and only starts referring to itself once it has a history.
 * Gossip stays behind a bond gate: nobody talks about their friends to a
 * stranger.
 */
function pickEvent(
  resident: Resident,
  def: ResidentDef,
  day: number,
  seen: string[],
  residentsById: Map<string, Resident>,
): CityEvent | null {
  const roll = dayHash(def.id, day, 5) % 100;
  const canRecall = resident.memories.length > 0;
  const canGossip = resident.bond >= 30;

  if (canRecall && roll < 35) {
    const event = pickRecallEvent(resident, def, day);
    if (event) return event;
  }
  if (canGossip && roll < 65) {
    const event = pickGossipEvent(def, day, residentsById);
    if (event) return event;
  }
  return pickLifeEvent(def, day, seen);
}

/**
 * Advance the city to today. Each elapsed day, residents you haven't spoken to
 * recently roll a life event and their bond decays a little — the city keeps
 * moving whether or not you showed up. Capped at MAX_TICKS so a month away
 * doesn't bury the feed.
 */
export function advanceCity(state: CityState, on = todayISO()): CityState {
  const elapsed = Math.min(daysBetween(state.lastSeenOn, on), MAX_TICKS);
  if (elapsed <= 0 || !state.residents.length) {
    return state.lastSeenOn === on ? state : { ...state, lastSeenOn: on };
  }

  let day = state.day;
  const events = [...state.events];
  const seen = { ...state.seen };
  let residents = state.residents;

  for (let tick = 0; tick < elapsed; tick++) {
    day += 1;
    residents = residents.map(r => {
      const idle = daysBetween(r.lastTalkedOn, on);
      return idle > 1 ? { ...r, bond: Math.max(0, r.bond - BOND_DECAY_PER_IDLE_DAY) } : r;
    });

    const residentsById = new Map(residents.map(r => [r.defId, r]));
    for (const resident of residents) {
      if (events.length >= MAX_ACTIVE_EVENTS) break;
      if (events.some(e => e.residentId === resident.defId)) continue;
      const def = residentDef(resident.defId);
      if (!def) continue;
      const event = pickEvent(resident, def, day, seen[def.id] || [], residentsById);
      if (!event) continue;
      events.push(event);
      // Only life events draw from the shared pool, so only they need dedup.
      if (event.kind === 'life') seen[def.id] = [...(seen[def.id] || []), event.templateId];
    }
  }

  return { ...state, day, lastSeenOn: on, events: events.slice(0, MAX_ACTIVE_EVENTS), seen, residents };
}

/** Resolve an invitation: bond up, memory kept, event cleared from the feed. */
export function resolveEvent(state: CityState, event: CityEvent, line: string, talent: GeniusType): CityState {
  const def = residentDef(event.residentId);
  const bonus = def && def.affinity === talent ? 3 : 0;
  const on = todayISO();
  return {
    ...state,
    talkCount: state.talkCount + 1,
    events: state.events.filter(e => e.id !== event.id),
    residents: state.residents.map(r => r.defId !== event.residentId ? r : {
      ...r,
      bond: Math.min(100, r.bond + event.bond + bonus),
      lastTalkedOn: on,
      memories: [{ at: on, line, gist: event.headline }, ...r.memories].slice(0, MAX_MEMORIES),
    }),
  };
}

export const BOND_TIERS = [
  { min: 80, label: '摯友', tone: '#e26a3b' },
  { min: 55, label: '朋友', tone: '#1f8a70' },
  { min: 30, label: '熟人', tone: '#3978c5' },
  { min: 0, label: '點頭之交', tone: '#8a8578' },
];

export const bondTier = (bond: number) => BOND_TIERS.find(t => bond >= t.min) || BOND_TIERS[3];

/** Cards the player may bring into a city conversation, talent cards first. */
export function cityHand(talent: GeniusType, unlockedIds: string[]): GameCard[] {
  const talentCards = GAME_CARDS.filter(c => c.talents.includes(talent));
  const commons = GAME_CARDS.filter(c => !c.talents.length);
  const extras = GAME_CARDS.filter(c => c.talents.length && !c.talents.includes(talent) && unlockedIds.includes(c.id));
  return [...talentCards, ...extras, ...commons].slice(0, 4);
}
