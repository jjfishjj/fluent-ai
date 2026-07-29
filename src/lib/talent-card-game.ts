import { GeniusType } from './genius-type';

export type GameAbility = 'observe' | 'connect' | 'express';

export interface GameCard {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  ability: GameAbility;
  talents: GeniusType[];
  sentence: string;
  effect: string;
  rarity: 'common' | 'rare' | 'epic';
}

export interface GameRound {
  speaker: string;
  prompt: string;
  goal: string;
  best: GameAbility;
  example: string;
  successReply: string;
  retryReply: string;
}

export interface GameScenario {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  unlockLevel: number;
  reward: number;
  rounds: GameRound[];
}

export interface GameBadge {
  id: string;
  title: string;
  detail: string;
  icon: string;
  tone: string;
}

export const ABILITY_LABEL: Record<GameAbility, string> = {
  observe: '觀察力', connect: '連結力', express: '表達力',
};

export const ABILITY_COLOR: Record<GameAbility, string> = {
  observe: '#1f8a70', connect: '#e26a3b', express: '#6d5bd0',
};

export const TALENT_TAGLINES: Record<GeniusType, string> = {
  explorer: '用行動試出一句話', architect: '用結構搭好語言骨架', melodist: '用聲音抓住語感', narrator: '用故事讓句子活起來',
  connector: '把新句子連回已知', analyst: '拆規則、找出精準表達', performer: '勇敢開口，邊演邊學', visionary: '把語言變成腦中畫面',
};

export const GAME_CARDS: GameCard[] = [
  { id: 'scene-scan', title: '情境掃描', subtitle: '先看人物、地點與線索', icon: '👀', ability: 'observe', talents: ['explorer'], sentence: 'Let me make sure I understand.', effect: '觀察 +2・壓力 -1', rarity: 'rare' },
  { id: 'action-probe', title: '行動探路', subtitle: '先試一小步再調整', icon: '🧭', ability: 'express', talents: ['explorer'], sentence: 'Let me give it a try.', effect: '表達 +2・勇氣 +1', rarity: 'epic' },
  { id: 'sentence-frame', title: '句型骨架', subtitle: '把需求放進清楚結構', icon: '🧱', ability: 'connect', talents: ['architect'], sentence: 'I’d like ___, because ___.', effect: '連結 +2・精準 +1', rarity: 'rare' },
  { id: 'rule-map', title: '規則藍圖', subtitle: '先找出句子的運作規則', icon: '📐', ability: 'observe', talents: ['architect'], sentence: 'The pattern I notice is…', effect: '觀察 +2・結構 +1', rarity: 'epic' },
  { id: 'sound-loop', title: '聲音迴圈', subtitle: '跟著節奏複誦關鍵句', icon: '🎧', ability: 'express', talents: ['melodist'], sentence: 'Could you say that one more time?', effect: '表達 +2・記憶 +1', rarity: 'rare' },
  { id: 'rhythm-hook', title: '節奏鉤子', subtitle: '用重音記住自然說法', icon: '🎵', ability: 'observe', talents: ['melodist'], sentence: 'Which word should I stress?', effect: '觀察 +2・語感 +1', rarity: 'epic' },
  { id: 'story-bridge', title: '故事橋接', subtitle: '用一個小故事延伸對話', icon: '🌉', ability: 'connect', talents: ['narrator'], sentence: 'That reminds me of a time when…', effect: '連結 +2・好感 +1', rarity: 'rare' },
  { id: 'emotion-line', title: '情緒台詞', subtitle: '把感受放進句子裡', icon: '💛', ability: 'express', talents: ['narrator'], sentence: 'I felt surprised because…', effect: '表達 +2・共鳴 +1', rarity: 'epic' },
  { id: 'idea-web', title: '概念織網', subtitle: '把新表達連到熟悉概念', icon: '🕸️', ability: 'connect', talents: ['connector'], sentence: 'It’s similar to…, but…', effect: '連結 +2・遷移 +1', rarity: 'rare' },
  { id: 'analogy-link', title: '跨域類比', subtitle: '用比喻快速說清想法', icon: '🔗', ability: 'express', talents: ['connector'], sentence: 'Think of it like this…', effect: '表達 +2・理解 +1', rarity: 'epic' },
  { id: 'logic-lens', title: '邏輯透鏡', subtitle: '拆出原因、結果與例外', icon: '🔍', ability: 'observe', talents: ['analyst'], sentence: 'The main reason is…, so…', effect: '觀察 +2・推理 +1', rarity: 'rare' },
  { id: 'error-debug', title: '錯誤除錯', subtitle: '修正後說出更精準版本', icon: '🛠️', ability: 'connect', talents: ['analyst'], sentence: 'Let me correct that: I mean…', effect: '連結 +2・精準 +1', rarity: 'epic' },
  { id: 'brave-move', title: '勇敢出招', subtitle: '先說再修正，不讓回合停住', icon: '⚡', ability: 'express', talents: ['performer'], sentence: 'What I’m trying to say is…', effect: '表達 +2・勇氣 +1', rarity: 'rare' },
  { id: 'role-switch', title: '角色切換', subtitle: '換個角色即興回應', icon: '🎭', ability: 'connect', talents: ['performer'], sentence: 'If I were you, I would…', effect: '連結 +2・互動 +1', rarity: 'epic' },
  { id: 'picture-anchor', title: '圖像錨點', subtitle: '把關鍵字綁在鮮明畫面', icon: '🖼️', ability: 'observe', talents: ['visionary'], sentence: 'I picture it like this…', effect: '觀察 +2・記憶 +1', rarity: 'rare' },
  { id: 'memory-room', title: '空間定位', subtitle: '把句子放進想像空間', icon: '🏛️', ability: 'connect', talents: ['visionary'], sentence: 'On the left, I can see…', effect: '連結 +2・畫面 +1', rarity: 'epic' },
  { id: 'clarify', title: '確認意思', subtitle: '用問題確認理解', icon: '❓', ability: 'observe', talents: [], sentence: 'Do you mean that…?', effect: '觀察 +1', rarity: 'common' },
  { id: 'keep-going', title: '繼續對話', subtitle: '把話題自然交回對方', icon: '💬', ability: 'express', talents: [], sentence: 'How about you?', effect: '表達 +1', rarity: 'common' },
];

export const GAME_SCENARIOS: GameScenario[] = [
  { id: 'cafe', title: '城市咖啡店', subtitle: '點餐、確認選項、輕鬆寒暄', icon: '☕', color: '#1f8a70', unlockLevel: 1, reward: 80, rounds: [
    { speaker: 'MIA・咖啡師', prompt: 'Hi! What can I get started for you?', goal: '看懂菜單線索並選擇飲料。', best: 'observe', example: 'I’d like an iced latte, please.', successReply: 'Great choice! Would you like that hot or iced?', retryReply: 'No worries—take another look at the menu.' },
    { speaker: 'MIA・咖啡師', prompt: 'We have oat, soy, and regular milk. Which one works for you?', goal: '說出偏好與簡短原因。', best: 'connect', example: 'Oat milk, please, because I prefer the taste.', successReply: 'Absolutely. Oat milk goes really well with that.', retryReply: 'You can tell me which milk you prefer.' },
    { speaker: '等待中的旅客', prompt: 'That drink looks good. What did you order?', goal: '主動回應並延續對話。', best: 'express', example: 'It’s an iced oat latte. How about you?', successReply: 'Nice! I might try that next time.', retryReply: 'Try telling me the drink’s name.' },
  ]},
  { id: 'travel', title: '旅行轉運站', subtitle: '問路、改票、處理突發狀況', icon: '✈️', color: '#3978c5', unlockLevel: 1, reward: 100, rounds: [
    { speaker: '車站服務員', prompt: 'Where are you trying to go?', goal: '清楚說出目的地與時間。', best: 'express', example: 'I’m trying to get to Oxford before noon.', successReply: 'Platform six is your fastest option.', retryReply: 'Tell me your destination first.' },
    { speaker: '車站服務員', prompt: 'Your train was cancelled. Would you like the next one?', goal: '理解變動並確認新方案。', best: 'observe', example: 'Yes. What time does the next train leave?', successReply: 'It leaves at 11:20 from platform four.', retryReply: 'Ask me about the next available train.' },
    { speaker: '同行旅客', prompt: 'I’m a little lost. Is this platform four?', goal: '根據線索協助對方。', best: 'connect', example: 'I think so—the sign says platform four.', successReply: 'Thanks! That sign was easy to miss.', retryReply: 'Look for a sign you can use as evidence.' },
  ]},
  { id: 'interview', title: '職涯面試室', subtitle: '自我介紹、舉例、反問公司', icon: '💼', color: '#6d5bd0', unlockLevel: 2, reward: 140, rounds: [
    { speaker: '招募經理', prompt: 'Could you tell me about yourself?', goal: '用結構化方式介紹自己。', best: 'connect', example: 'I’m a product designer with three years of experience in learning apps.', successReply: 'That’s a clear overview. Tell me about one project.', retryReply: 'Start with your role, experience, and focus.' },
    { speaker: '招募經理', prompt: 'Tell me about a difficult problem you solved.', goal: '觀察問題並說明具體行動。', best: 'observe', example: 'Users were leaving early, so I studied the data and simplified onboarding.', successReply: 'Good. What changed after your solution?', retryReply: 'Describe the problem before the solution.' },
    { speaker: '招募經理', prompt: 'Do you have any questions for us?', goal: '主動提出有深度的問題。', best: 'express', example: 'How does the team measure success in the first six months?', successReply: 'Excellent question. We use three product metrics.', retryReply: 'Ask about the role, team, or success criteria.' },
  ]},
  { id: 'campus', title: '國際校園', subtitle: '加入小組、課堂討論、請求協助', icon: '🎓', color: '#d18a29', unlockLevel: 2, reward: 120, rounds: [
    { speaker: '同組同學', prompt: 'We need to choose a topic. Any ideas?', goal: '提出想法並邀請回饋。', best: 'express', example: 'How about AI in education? What do you think?', successReply: 'I like it. We can compare different tools.', retryReply: 'Offer one clear topic idea.' },
    { speaker: '教授', prompt: 'Why do you agree with this argument?', goal: '連結理由與例子。', best: 'connect', example: 'I agree because it gives students faster feedback.', successReply: 'Good connection. Can you add an example?', retryReply: 'Use because to connect your reason.' },
    { speaker: '圖書館員', prompt: 'What kind of source are you looking for?', goal: '辨認需求並具體描述資料。', best: 'observe', example: 'I need a recent research paper about language learning.', successReply: 'Try the education database on this page.', retryReply: 'Mention the format, topic, or date you need.' },
  ]},
  { id: 'social', title: '週末交流會', subtitle: '認識朋友、分享興趣、自然告別', icon: '🎉', color: '#d85f78', unlockLevel: 3, reward: 160, rounds: [
    { speaker: '新朋友 ALEX', prompt: 'Hi, I don’t think we’ve met. I’m Alex.', goal: '自然自介並開啟話題。', best: 'express', example: 'Nice to meet you, Alex. I’m Jay. How do you know the host?', successReply: 'We used to work together. What about you?', retryReply: 'Introduce yourself and ask one easy question.' },
    { speaker: 'ALEX', prompt: 'What do you like to do on weekends?', goal: '用細節分享興趣。', best: 'connect', example: 'I enjoy hiking because it helps me reset after work.', successReply: 'Same here! Do you have a favorite trail?', retryReply: 'Connect your hobby with a reason or story.' },
    { speaker: 'ALEX', prompt: 'I’m going to get some food.', goal: '看懂告別訊號並保持友善。', best: 'observe', example: 'Sure! It was nice meeting you. See you around.', successReply: 'You too! I’ll catch you later.', retryReply: 'A short friendly closing works here.' },
  ]},
];

export const GAME_BADGES: GameBadge[] = [
  { id: 'first-clear', title: '初次通關', detail: '完成第一個情境關卡。', icon: '✨', tone: '#1f8a70' },
  { id: 'map-runner', title: '地圖探險者', detail: '完成 3 個不同情境。', icon: '🧭', tone: '#3978c5' },
  { id: 'world-clear', title: '世界通關', detail: '完成全部 5 個情境。', icon: '🏆', tone: '#d18a29' },
  { id: 'combo-three', title: '三連精準', detail: '單局達成 3 次連續命中。', icon: '🔥', tone: '#e26a3b' },
  { id: 'high-score', title: '高分表達者', detail: '單局分數達到 360 XP。', icon: '⭐', tone: '#6d5bd0' },
  { id: 'collector', title: '牌庫收藏家', detail: '解鎖 8 張以上策略卡。', icon: '🎴', tone: '#d85f78' },
];
