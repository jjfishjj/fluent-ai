export type RecallDelay = '30s' | '3m' | '1d';
export type ScheduledRecall = { id: string; code: string; delay: RecallDelay; dueAt: number; createdAt: number; sourceAttemptId: string; completedAt?: number; failureCount?: number; lastAttemptAt?: number; lastResponseMs?: number; retryAfterMs?: number };
export type ScheduledRecallResult = { id: string; correct: boolean; responseMs: number };

const STORAGE_KEY = 'mnemo-verse:number-recall-schedule:v1';
export const RECALL_DELAYS: Record<RecallDelay, number> = { '30s': 30_000, '3m': 180_000, '1d': 86_400_000 };

export function readRecallSchedule(storage: Pick<Storage, 'getItem'> = localStorage): ScheduledRecall[] {
  try { const value = JSON.parse(storage.getItem(STORAGE_KEY) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; }
}

export function scheduleWrongCodes(codes: string[], sourceAttemptId: string, now = Date.now(), storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage) {
  const existing = readRecallSchedule(storage);
  const additions = [...new Set(codes)].flatMap((code) => (Object.entries(RECALL_DELAYS) as [RecallDelay, number][]).map(([delay, milliseconds]) => ({ id: `${sourceAttemptId}:${code}:${delay}`, code, delay, dueAt: now + milliseconds, createdAt: now, sourceAttemptId }))).filter((candidate) => !existing.some((item) => item.id === candidate.id));
  const result = [...existing, ...additions]; storage.setItem(STORAGE_KEY, JSON.stringify(result)); return result;
}

export function completeScheduledRecalls(ids: string[], now = Date.now(), storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage) {
  const selected = new Set(ids); const result = readRecallSchedule(storage).map((item) => selected.has(item.id) ? { ...item, completedAt: now } : item);
  storage.setItem(STORAGE_KEY, JSON.stringify(result)); return result;
}

export function gradeScheduledRecall(result: ScheduledRecallResult, now = Date.now(), storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage) {
  let retryAfterMs: number | undefined;
  const schedule = readRecallSchedule(storage).map((item) => {
    if (item.id !== result.id) return item;
    if (result.correct) return { ...item, completedAt: now, lastAttemptAt: now, lastResponseMs: result.responseMs, retryAfterMs: undefined };
    const failureCount = (item.failureCount || 0) + 1;
    const slowRecallPenalty = result.responseMs >= 12_000 ? 5_000 : result.responseMs >= 6_000 ? 2_500 : 0;
    retryAfterMs = Math.max(5_000, 25_000 - failureCount * 5_000 - slowRecallPenalty);
    return { ...item, completedAt: undefined, failureCount, lastAttemptAt: now, lastResponseMs: result.responseMs, retryAfterMs, dueAt: now + retryAfterMs };
  });
  storage.setItem(STORAGE_KEY, JSON.stringify(schedule));
  return { schedule, retryAfterMs };
}

export function getDueRecalls(schedule: ScheduledRecall[], now = Date.now()) { return schedule.filter((item) => !item.completedAt && item.dueAt <= now); }
export function formatRecallDelay(delay: RecallDelay) { return delay === '30s' ? '30 秒' : delay === '3m' ? '3 分鐘' : '次日'; }
