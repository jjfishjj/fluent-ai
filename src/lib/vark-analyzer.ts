import { LearningStyle } from './learning-styles';
import { ConversationSettings } from './types';

export interface VARKSignal {
  style: LearningStyle;
  weight: number;
}

export interface VARKProfile {
  scores: Record<LearningStyle, number>;
  totalSignals: number;
  lastUpdated: string;
  conversationCount: number;
}

export const EMPTY_VARK_PROFILE: VARKProfile = {
  scores: { visual: 0, auditory: 0, reading: 0, kinesthetic: 0 },
  totalSignals: 0,
  lastUpdated: new Date().toISOString(),
  conversationCount: 0,
};

const VISUAL_KW = [
  'show', 'picture', 'image', 'diagram', 'chart', 'illustration', 'visual',
  '圖', '看', '展示', '顯示', '示意', '影片', '畫面',
];
const AUDITORY_KW = [
  'pronounce', 'pronunciation', 'sound', 'how do you say', 'listen', 'spoken',
  '發音', '聽', '唸', '語調', '音調', '讀出來',
];
const READING_KW = [
  'grammar', 'rule', 'explain', 'write', 'written', 'read', 'notes', 'definition',
  '文法', '規則', '解釋', '寫', '閱讀', '筆記', '說明', '例句',
];
const KINESTHETIC_KW = [
  'practice', 'try', "let's", 'roleplay', 'role play', 'real life', 'situation',
  'simulate', 'exercise',
  '練習', '試試', '讓我', '角色扮演', '情境', '實際', '體驗', '模擬',
];

export interface MessageMeta {
  hasImage?: boolean;
  hasVideo?: boolean;
  usedVoice?: boolean;
  usedAudio?: boolean;
}

export function analyzeMessage(
  content: string,
  settings: ConversationSettings,
  meta: MessageMeta = {}
): VARKSignal[] {
  const signals: VARKSignal[] = [];
  const lower = content.toLowerCase();

  // Behavioral signals (highest weight — actual feature usage)
  if (meta.hasImage) signals.push({ style: 'visual', weight: 3 });
  if (meta.hasVideo) signals.push({ style: 'visual', weight: 2 });
  if (meta.usedVoice) signals.push({ style: 'auditory', weight: 3 });
  if (meta.usedAudio) signals.push({ style: 'auditory', weight: 2 });

  // Keyword signals
  if (VISUAL_KW.some(kw => lower.includes(kw)))
    signals.push({ style: 'visual', weight: 1 });
  if (AUDITORY_KW.some(kw => lower.includes(kw)))
    signals.push({ style: 'auditory', weight: 2 });
  if (READING_KW.some(kw => lower.includes(kw)))
    signals.push({ style: 'reading', weight: 2 });
  if (KINESTHETIC_KW.some(kw => lower.includes(kw)))
    signals.push({ style: 'kinesthetic', weight: 2 });

  // Message length → reading/writing tendency
  if (content.length > 100) signals.push({ style: 'reading', weight: 1 });
  if (content.length > 250) signals.push({ style: 'reading', weight: 1 });

  // Scenario-based signals
  if (['travel', 'daily', 'dining', 'shopping'].includes(settings.scenario))
    signals.push({ style: 'kinesthetic', weight: 1 });
  if (['academic', 'business'].includes(settings.scenario))
    signals.push({ style: 'reading', weight: 1 });

  return signals;
}

export function updateProfile(
  existing: VARKProfile,
  signals: VARKSignal[],
  isNewConversation = false
): VARKProfile {
  const updated: VARKProfile = {
    scores: { ...existing.scores },
    totalSignals: existing.totalSignals + signals.length,
    lastUpdated: new Date().toISOString(),
    conversationCount: existing.conversationCount + (isNewConversation ? 1 : 0),
  };
  for (const s of signals) {
    updated.scores[s.style] += s.weight;
  }
  return updated;
}

export function getDominantStyle(profile: VARKProfile): LearningStyle {
  return (Object.entries(profile.scores) as [LearningStyle, number][])
    .sort((a, b) => b[1] - a[1])[0][0];
}

export function getStylePercentages(profile: VARKProfile): Record<LearningStyle, number> {
  const total = Object.values(profile.scores).reduce((a, b) => a + b, 0);
  if (total === 0) return { visual: 25, auditory: 25, reading: 25, kinesthetic: 25 };
  return {
    visual: Math.round((profile.scores.visual / total) * 100),
    auditory: Math.round((profile.scores.auditory / total) * 100),
    reading: Math.round((profile.scores.reading / total) * 100),
    kinesthetic: Math.round((profile.scores.kinesthetic / total) * 100),
  };
}
