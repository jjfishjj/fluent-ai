import type { RecallGrade } from './memory-quest';

export type MemoryQuestAttempt = {
  id: string;
  userId: string;
  startedAt: number;
  completedAt: number;
  digitsLength: number;
  attempts: number;
  points: number;
  grade: RecallGrade;
};

export type MemoryQuestXpTrendPoint = {
  date: string;
  label: string;
  xp: number;
  sessions: number;
};

const HISTORY_KEY_PREFIX = 'mnemo-verse:memory-quest-history:v1';
const MAX_HISTORY = 200;

type ReadStorage = Pick<Storage, 'getItem'>;
type WriteStorage = Pick<Storage, 'getItem' | 'setItem'>;

function historyKey(userId: string) {
  return `${HISTORY_KEY_PREFIX}:${encodeURIComponent(userId || 'guest')}`;
}

export function createMemoryQuestAttemptId() {
  return globalThis.crypto?.randomUUID?.()
    || `memory-quest-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function readMemoryQuestHistory(
  userId = 'guest',
  storage: ReadStorage = localStorage,
): MemoryQuestAttempt[] {
  try {
    const parsed = JSON.parse(storage.getItem(historyKey(userId)) || '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is MemoryQuestAttempt => (
      item
      && typeof item.id === 'string'
      && typeof item.completedAt === 'number'
      && typeof item.points === 'number'
      && typeof item.attempts === 'number'
    ));
  } catch {
    return [];
  }
}

/**
 * Saves one completed quest exactly once per round ID.
 * Keeping the idempotency check here protects the score even if a UI event fires twice.
 */
export function saveMemoryQuestAttempt(
  attempt: MemoryQuestAttempt,
  userId = attempt.userId || 'guest',
  storage: WriteStorage = localStorage,
): MemoryQuestAttempt[] {
  const current = readMemoryQuestHistory(userId, storage);
  if (current.some((item) => item.id === attempt.id)) return current;
  const next = [attempt, ...current]
    .sort((a, b) => b.completedAt - a.completedAt)
    .slice(0, MAX_HISTORY);
  storage.setItem(historyKey(userId), JSON.stringify(next));
  return next;
}

export function totalMemoryQuestXp(history: MemoryQuestAttempt[]) {
  return history.reduce((sum, attempt) => sum + Math.max(0, attempt.points), 0);
}

function dayKey(timestamp: number) {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function dayLabel(timestamp: number) {
  const date = new Date(timestamp);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

export function memoryQuestXpTrend(
  history: MemoryQuestAttempt[],
  now = Date.now(),
): MemoryQuestXpTrendPoint[] {
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const points: MemoryQuestXpTrendPoint[] = [];

  for (let offset = 6; offset >= 0; offset -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - offset);
    const key = dayKey(date.getTime());
    const sessions = history.filter((attempt) => dayKey(attempt.completedAt) === key);
    points.push({
      date: key,
      label: dayLabel(date.getTime()),
      xp: sessions.reduce((sum, attempt) => sum + Math.max(0, attempt.points), 0),
      sessions: sessions.length,
    });
  }

  return points;
}

export function memoryQuestStats(history: MemoryQuestAttempt[]) {
  const totalSessions = history.length;
  const firstTrySessions = history.filter((attempt) => attempt.attempts === 0).length;
  return {
    totalXp: totalMemoryQuestXp(history),
    totalSessions,
    firstTryRate: totalSessions ? firstTrySessions / totalSessions : 0,
    bestScore: history.reduce((best, attempt) => Math.max(best, attempt.points), 0),
  };
}
