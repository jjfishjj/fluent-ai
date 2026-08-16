import { describe, expect, it } from 'vitest';
import { SWIFT_WINDOW, applyAid, phaseAt, resolveAnswer, shuffleOptions } from './encounter';
import type { EncounterQuestion } from './encounter';

const question: EncounterQuestion = {
  id: 'q1',
  kind: 'recall',
  prompt: '謝謝',
  hint: '以 th 開頭',
  answer: 'thank you',
  options: ['thank you', 'thin cow', 'think you', 'thanks giving'],
  note: 'thank you 是最通用的道謝說法。',
};

const base = {
  chosen: 'thank you',
  question,
  power: 100,
  enemyAtk: 60,
  defense: 0,
  streak: 0,
  elapsed: 30,
  aids: [],
};

describe('resolveAnswer', () => {
  it('deals damage and takes none on a correct answer', () => {
    const r = resolveAnswer(base);
    expect(r.correct).toBe(true);
    expect(r.damage).toBeGreaterThan(0);
    expect(r.backlash).toBe(0);
    expect(r.streak).toBe(1);
  });

  it('takes backlash and resets the streak on a wrong answer', () => {
    const r = resolveAnswer({ ...base, chosen: 'thin cow', streak: 4 });
    expect(r.correct).toBe(false);
    expect(r.damage).toBe(0);
    expect(r.backlash).toBeGreaterThan(0);
    expect(r.streak).toBe(0);
  });

  it('ramps damage with the answer streak', () => {
    const first = resolveAnswer({ ...base, streak: 0 }).damage;
    const fourth = resolveAnswer({ ...base, streak: 3 }).damage;
    expect(fourth).toBeGreaterThan(first);
  });

  it('caps the streak bonus so a long run cannot run away', () => {
    const six = resolveAnswer({ ...base, streak: 6 }).damage;
    const twenty = resolveAnswer({ ...base, streak: 20 }).damage;
    expect(twenty).toBe(six);
  });

  it('rewards an answer given inside the swift window', () => {
    const slow = resolveAnswer({ ...base, elapsed: SWIFT_WINDOW + 1 });
    const fast = resolveAnswer({ ...base, elapsed: SWIFT_WINDOW - 1 });
    expect(slow.swift).toBe(false);
    expect(fast.swift).toBe(true);
    expect(fast.damage).toBeGreaterThan(slow.damage);
  });

  it('doubles damage when an amplify aid is queued', () => {
    const plain = resolveAnswer(base);
    const amped = resolveAnswer({
      ...base,
      aids: [{ skillId: 'story', effect: 'amplify', label: '故事串聯' }],
    });
    expect(amped.amplified).toBe(true);
    expect(amped.damage).toBe(plain.damage * 2);
  });

  it('absorbs the backlash when a shield aid is queued', () => {
    const r = resolveAnswer({
      ...base,
      chosen: 'thin cow',
      aids: [{ skillId: 'calm', effect: 'shield', label: '鎮定' }],
    });
    expect(r.correct).toBe(false);
    expect(r.shielded).toBe(true);
    expect(r.backlash).toBe(0);
  });

  it('lets defence soften the backlash', () => {
    const soft = resolveAnswer({ ...base, chosen: 'thin cow', defense: 0 }).backlash;
    const armoured = resolveAnswer({ ...base, chosen: 'thin cow', defense: 200 }).backlash;
    expect(armoured).toBeLessThan(soft);
    expect(armoured).toBeGreaterThanOrEqual(1);
  });

  it('returns the teaching note either way', () => {
    expect(resolveAnswer(base).note).toBe(question.note);
    expect(resolveAnswer({ ...base, chosen: 'thin cow' }).note).toBe(question.note);
  });
});

describe('aids', () => {
  const state = { question, options: [...question.options], hintRevealed: false };

  it('eliminate leaves the answer and exactly one distractor', () => {
    const r = applyAid(state, 'eliminate', () => 0);
    expect(r.options).toHaveLength(2);
    expect(r.options).toContain(question.answer);
  });

  it('hint reveals without touching the options', () => {
    const r = applyAid(state, 'hint', () => 0);
    expect(r.hintRevealed).toBe(true);
    expect(r.options).toHaveLength(question.options.length);
  });

  it('amplify and shield leave the question alone', () => {
    for (const effect of ['amplify', 'shield'] as const) {
      const r = applyAid(state, effect, () => 0);
      expect(r.options).toEqual(state.options);
      expect(r.hintRevealed).toBe(false);
    }
  });
});

describe('shuffleOptions', () => {
  it('keeps every option exactly once', () => {
    const shuffled = shuffleOptions(question.options, () => 0.42);
    expect([...shuffled].sort()).toEqual([...question.options].sort());
  });
});

describe('boss stages', () => {
  const phases = [
    { at: 1, name: '寒暄', line: 'a' },
    { at: 0.66, name: '正題', line: 'b', pressure: 1.2, swiftWindow: 5 },
    { at: 0.3, name: '最後通牒', line: 'c', pressure: 1.5, swiftWindow: 4, sealAids: true },
  ];

  it('advances only once the health threshold is crossed', () => {
    expect(phaseAt(phases, 1)).toBe(0);
    expect(phaseAt(phases, 0.7)).toBe(0);
    expect(phaseAt(phases, 0.66)).toBe(1);
    expect(phaseAt(phases, 0.4)).toBe(1);
    expect(phaseAt(phases, 0.3)).toBe(2);
    expect(phaseAt(phases, 0.01)).toBe(2);
  });

  it('stays at stage zero for anything without phases', () => {
    expect(phaseAt(undefined, 0.1)).toBe(0);
    expect(phaseAt([], 0.1)).toBe(0);
  });

  it('multiplies the backlash by the stage pressure', () => {
    const calm = resolveAnswer({ ...base, chosen: 'thin cow' }).backlash;
    const pressed = resolveAnswer({ ...base, chosen: 'thin cow', pressure: 1.5 }).backlash;
    expect(pressed).toBeGreaterThan(calm);
    expect(pressed).toBeCloseTo(calm * 1.5, 0);
  });

  it('tightens the speed bonus window', () => {
    // Five seconds is swift by default, but not once the window shrinks to four.
    expect(resolveAnswer({ ...base, elapsed: 5 }).swift).toBe(true);
    expect(resolveAnswer({ ...base, elapsed: 5, swiftWindow: 4 }).swift).toBe(false);
  });
});
