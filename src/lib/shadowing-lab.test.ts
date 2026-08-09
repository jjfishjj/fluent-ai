import { describe, expect, it } from 'vitest';
import { addPracticeDay, calculateStreak, compareTranscript } from './shadowing-lab';

describe('shadowing transcript comparison', () => {
  it('scores a perfect transcript', () => {
    expect(compareTranscript("I'm ready.", "I'm ready").score).toBe(100);
  });
  it('marks missing and replaced words', () => {
    const result = compareTranscript('we learn from useful mistakes', 'we grow from mistakes');
    expect(result.score).toBe(60);
    expect(result.compared.some(word => word.status === 'replaced')).toBe(true);
  });
});

describe('shadowing daily progress', () => {
  it('calculates consecutive practice days', () => {
    const now = new Date(2026, 7, 10, 12);
    expect(calculateStreak(['2026-08-08', '2026-08-09', '2026-08-10'], now)).toBe(3);
  });
  it('does not duplicate the same practice day', () => {
    const date = new Date(2026, 7, 10, 12);
    const initial = { practicedDates: ['2026-08-10'], totalSessions: 1 };
    expect(addPracticeDay(initial, 'test', date).practicedDates).toHaveLength(1);
  });
});
