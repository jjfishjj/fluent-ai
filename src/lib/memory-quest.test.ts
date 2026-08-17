import { describe, expect, it } from 'vitest';
import { normalizeDigits, questLevel, scoreRecall } from './memory-quest';

describe('memory quest', () => {
  it('normalizes full-width digits and separators', () => {
    expect(normalizeDigits('５２-０１ ３１４')).toBe('5201314');
  });

  it('rewards a first-try recall more than a retry', () => {
    expect(scoreRecall('5201314', '5201314', 0)).toEqual({ correct: true, points: 30, grade: 'perfect' });
    expect(scoreRecall('5201314', '5201314', 1)).toEqual({ correct: true, points: 22, grade: 'strong' });
    expect(scoreRecall('5201314', '5201314', 2)).toEqual({ correct: true, points: 15, grade: 'steady' });
  });

  it('does not reveal credit for an incorrect answer', () => {
    expect(scoreRecall('5201314', '5201315', 0)).toEqual({ correct: false, points: 0, grade: 'retry' });
  });

  it('turns points into a gentle level curve', () => {
    expect(questLevel(0)).toBe(1);
    expect(questLevel(99)).toBe(1);
    expect(questLevel(100)).toBe(2);
    expect(questLevel(275)).toBe(3);
  });
});
