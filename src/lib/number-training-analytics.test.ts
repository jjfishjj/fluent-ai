import { describe, expect, it } from 'vitest';
import { codeRiskRanking, motionModeComparison, saveNumberAttempt } from './number-training-analytics';

function memoryStorage() { let value: string | null = null; return { getItem: () => value, setItem: (_key: string, next: string) => { value = next; } }; }

describe('number training analytics', () => {
  it('persists attempts once and ranks error-prone codes first', () => {
    const storage = memoryStorage();
    const attempt = { id: 'a1', student: '學生 A', completedAt: 1, correct: 1, total: 2, averageResponseMs: 3000, results: [{ code: '04', correct: false, responseMs: 5000 }, { code: '18', correct: true, responseMs: 1000 }] };
    expect(saveNumberAttempt(attempt, storage)).toHaveLength(1);
    expect(saveNumberAttempt(attempt, storage)).toHaveLength(1);
    expect(codeRiskRanking([attempt])[0].code).toBe('04');
  });

  it('compares recall accuracy and response time by animation mode', () => {
    const attempt = { id: 'a2', student: '學生 B', completedAt: 2, correct: 2, total: 3, averageResponseMs: 3000, results: [{ code: '04', correct: true, responseMs: 2000, animationEnabled: true }, { code: '31', correct: true, responseMs: 3000, animationEnabled: true }, { code: '43', correct: false, responseMs: 5000, animationEnabled: false }] };
    const [dynamicMode, staticMode] = motionModeComparison([attempt]);
    expect(dynamicMode).toMatchObject({ mode: 'dynamic', answers: 2, correctRate: 1, averageResponseMs: 2500 });
    expect(staticMode).toMatchObject({ mode: 'static', answers: 1, correctRate: 0, averageResponseMs: 5000 });
  });
});
