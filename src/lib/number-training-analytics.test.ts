import { describe, expect, it } from 'vitest';
import { codeRiskRanking, saveNumberAttempt } from './number-training-analytics';

function memoryStorage() { let value: string | null = null; return { getItem: () => value, setItem: (_key: string, next: string) => { value = next; } }; }

describe('number training analytics', () => {
  it('persists attempts once and ranks error-prone codes first', () => {
    const storage = memoryStorage();
    const attempt = { id: 'a1', student: '學生 A', completedAt: 1, correct: 1, total: 2, averageResponseMs: 3000, results: [{ code: '04', correct: false, responseMs: 5000 }, { code: '18', correct: true, responseMs: 1000 }] };
    expect(saveNumberAttempt(attempt, storage)).toHaveLength(1);
    expect(saveNumberAttempt(attempt, storage)).toHaveLength(1);
    expect(codeRiskRanking([attempt])[0].code).toBe('04');
  });
});
