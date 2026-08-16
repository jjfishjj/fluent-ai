export type NumberTrainingAttempt = {
  id: string;
  student: string;
  completedAt: number;
  correct: number;
  total: number;
  averageResponseMs: number;
  results: Array<{ code: string; correct: boolean; responseMs: number; animationEnabled?: boolean }>;
};

export type MotionModeSummary = { mode: 'dynamic' | 'static'; answers: number; correctRate: number; averageResponseMs: number };

const KEY = 'mnemo-verse:number-training-attempts:v1';

export function readNumberAttempts(storage: Pick<Storage, 'getItem'> = localStorage): NumberTrainingAttempt[] {
  try { const parsed = JSON.parse(storage.getItem(KEY) || '[]'); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
}

export function saveNumberAttempt(attempt: NumberTrainingAttempt, storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage) {
  const current = readNumberAttempts(storage);
  if (current.some((item) => item.id === attempt.id)) return current;
  const next = [attempt, ...current].slice(0, 100);
  storage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function codeRiskRanking(attempts: NumberTrainingAttempt[]) {
  const map = new Map<string, { code: string; attempts: number; errors: number; responseMs: number }>();
  attempts.forEach((attempt) => attempt.results.forEach((result) => {
    const value = map.get(result.code) || { code: result.code, attempts: 0, errors: 0, responseMs: 0 };
    value.attempts += 1; value.errors += result.correct ? 0 : 1; value.responseMs += result.responseMs; map.set(result.code, value);
  }));
  return [...map.values()].map((item) => ({ ...item, errorRate: item.errors / item.attempts, averageResponseMs: item.responseMs / item.attempts, riskScore: item.errors / item.attempts * .72 + Math.min(1, item.responseMs / item.attempts / 10_000) * .28 })).sort((a, b) => b.riskScore - a.riskScore);
}

export function motionModeComparison(attempts: NumberTrainingAttempt[]): MotionModeSummary[] {
  const summarize = (animationEnabled: boolean): MotionModeSummary => {
    const results = attempts.flatMap((attempt) => attempt.results).filter((result) => (result.animationEnabled ?? true) === animationEnabled);
    return {
      mode: animationEnabled ? 'dynamic' : 'static',
      answers: results.length,
      correctRate: results.length ? results.filter((result) => result.correct).length / results.length : 0,
      averageResponseMs: results.length ? results.reduce((sum, result) => sum + result.responseMs, 0) / results.length : 0,
    };
  };
  return [summarize(true), summarize(false)];
}
