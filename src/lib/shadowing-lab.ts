import { isSupabaseConfigured, supabase } from '@/integrations/supabase/client';

export type ShadowingLevel = 'beginner' | 'intermediate' | 'advanced';

export interface ShadowingMaterial {
  id: string;
  level: ShadowingLevel;
  title: string;
  context: string;
  text: string;
  focus: string;
}

export const SHADOWING_MATERIALS: ShadowingMaterial[] = [
  { id: 'morning-coffee', level: 'beginner', title: '早晨咖啡', context: '日常生活', text: "I'd like a small coffee with milk, please.", focus: '禮貌語氣與句尾降調' },
  { id: 'weekend-plan', level: 'beginner', title: '週末計畫', context: '朋友聊天', text: "I'm going to visit my family this weekend.", focus: 'going to 的自然連音' },
  { id: 'quick-intro', level: 'beginner', title: '簡短自介', context: '初次見面', text: "Hi, I'm Alex. I work in design and love learning languages.", focus: '意群停頓與清楚重音' },
  { id: 'project-ready', level: 'intermediate', title: '專案完成', context: '職場溝通', text: "I've been working on this project for three years, and it's finally ready.", focus: '完成式節奏與情緒轉折' },
  { id: 'change-mind', level: 'intermediate', title: '改變想法', context: '觀點表達', text: "At first I wasn't convinced, but the results completely changed my mind.", focus: '對比重音與弱讀' },
  { id: 'travel-delay', level: 'intermediate', title: '航班延誤', context: '旅行應變', text: "Our flight was delayed, so we had to rearrange the entire afternoon.", focus: '子句銜接與連續語流' },
  { id: 'creative-risk', level: 'advanced', title: '創意與風險', context: '演講表達', text: "Innovation rarely comes from certainty; it emerges when we are willing to question familiar assumptions.", focus: '長句意群與修辭停頓' },
  { id: 'remote-culture', level: 'advanced', title: '遠距文化', context: '商務討論', text: "A strong remote culture depends less on constant meetings and more on clarity, trust, and thoughtful documentation.", focus: '並列結構與對比語調' },
  { id: 'learning-process', level: 'advanced', title: '學習歷程', context: '深度對話', text: "The moment we treat mistakes as useful evidence rather than personal failure, the learning process becomes far more sustainable.", focus: '複句節奏與關鍵詞凸顯' },
];

export type ComparedWord = { word: string; spoken?: string; status: 'correct' | 'missed' | 'replaced' };

function words(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9'\s]/g, '').trim().split(/\s+/).filter(Boolean);
}

export function compareTranscript(reference: string, spoken: string) {
  const target = words(reference);
  const actual = words(spoken);
  const dp = Array.from({ length: target.length + 1 }, () => Array(actual.length + 1).fill(0));
  for (let i = 0; i <= target.length; i++) dp[i][0] = i;
  for (let j = 0; j <= actual.length; j++) dp[0][j] = j;
  for (let i = 1; i <= target.length; i++) {
    for (let j = 1; j <= actual.length; j++) {
      dp[i][j] = target[i - 1] === actual[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  const compared: ComparedWord[] = [];
  let i = target.length; let j = actual.length;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && target[i - 1] === actual[j - 1]) {
      compared.unshift({ word: target[i - 1], spoken: actual[j - 1], status: 'correct' }); i--; j--;
    } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
      compared.unshift({ word: target[i - 1], spoken: actual[j - 1], status: 'replaced' }); i--; j--;
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      compared.unshift({ word: target[i - 1], status: 'missed' }); i--;
    } else { j--; }
  }
  const correct = compared.filter(item => item.status === 'correct').length;
  return { compared, score: target.length ? Math.round((correct / target.length) * 100) : 0, correct, total: target.length };
}

export interface DailyProgress {
  practicedDates: string[];
  totalSessions: number;
  lastMaterialId?: string;
}

export function todayKey(date = new Date()) {
  return date.toLocaleDateString('en-CA');
}

export function addPracticeDay(progress: DailyProgress, materialId: string, date = new Date()): DailyProgress {
  const today = todayKey(date);
  return {
    practicedDates: Array.from(new Set([...progress.practicedDates, today])).sort(),
    totalSessions: progress.totalSessions + 1,
    lastMaterialId: materialId,
  };
}

export function calculateStreak(dates: string[], now = new Date()) {
  const set = new Set(dates);
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!set.has(todayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (set.has(todayKey(cursor))) { streak++; cursor.setDate(cursor.getDate() - 1); }
  return streak;
}

export async function loadCloudProgress(userId: string): Promise<DailyProgress | null> {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await (supabase as any).from('shadowing_learning_progress').select('payload').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data?.payload?.daily ?? null;
}

export async function syncCloudProgress(userId: string, daily: DailyProgress) {
  if (!isSupabaseConfigured) return { synced: false as const, reason: 'offline' as const };
  const streak = calculateStreak(daily.practicedDates);
  const { error } = await (supabase as any).from('shadowing_learning_progress').upsert({
    user_id: userId,
    payload: { daily },
    current_streak: streak,
    last_practiced_on: daily.practicedDates.at(-1) ?? null,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
  if (error) throw error;
  return { synced: true as const };
}
