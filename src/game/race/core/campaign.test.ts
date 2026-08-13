import { beforeEach, describe, expect, it } from 'vitest';
import {
  RANKS,
  STAGES,
  applyRace,
  clearProfile,
  creditsFor,
  currentStage,
  emptyProfile,
  isUnlocked,
  loadProfile,
  meetsTargets,
  nextRank,
  rankFor,
  type RaceOutcome,
} from './campaign';
import type { GateRecord } from './race';
import { NATIONS } from '../data/nations';

function outcome(over: Partial<RaceOutcome> = {}): RaceOutcome {
  return {
    nationId: 'britain',
    place: 1,
    entrants: 5,
    finishTime: 90,
    correct: 8,
    answered: 10,
    log: [],
    difficulty: 1,
    ...over,
  };
}

function miss(native: string, meaning: string): GateRecord {
  return {
    lap: 0,
    gateIndex: 0,
    outcome: 'wrong',
    prompt: 'p',
    answer: { native, meaning },
  };
}

beforeEach(() => {
  clearProfile();
});

describe('ranks', () => {
  it('holds the highest rank the credits reach', () => {
    expect(rankFor(0).id).toBe('trainee');
    expect(rankFor(139).id).toBe('trainee');
    expect(rankFor(140).id).toBe('interpreter');
    expect(rankFor(99999).id).toBe(RANKS.at(-1)!.id);
  });

  it('reports the next rank until the top', () => {
    expect(nextRank(0)?.id).toBe('interpreter');
    expect(nextRank(99999)).toBeUndefined();
  });
});

describe('stages', () => {
  it('opens the first posting and locks the rest', () => {
    const profile = emptyProfile();
    expect(isUnlocked(profile, 0)).toBe(true);
    for (let i = 1; i < STAGES.length; i += 1) expect(isUnlocked(profile, i)).toBe(false);
    expect(currentStage(profile).index).toBe(0);
  });

  it('unlocks the next posting once the previous one is cleared', () => {
    const profile = emptyProfile();
    profile.stamps.britain = { cleared: true, bestPlace: 1, bestTime: 80, bestAccuracy: 0.9, races: 1 };
    expect(isUnlocked(profile, 1)).toBe(true);
    expect(isUnlocked(profile, 2)).toBe(false);
    expect(currentStage(profile).index).toBe(1);
  });

  it('covers every stage with a real nation and escalates the challenges', () => {
    for (const stage of STAGES) expect(NATIONS[stage.nationId]).toBeDefined();
    const kinds = STAGES.map((s) => s.challenge);
    expect(kinds[0]).toBe('word');
    expect(kinds.at(-1)).toBe('mixed');
    expect(new Set(kinds).size).toBeGreaterThanOrEqual(4);
    // Targets never get easier as the circuit goes on.
    for (let i = 1; i < STAGES.length; i += 1) {
      expect(STAGES[i].targetAccuracy).toBeGreaterThanOrEqual(STAGES[i - 1].targetAccuracy);
      expect(STAGES[i].targetPlace).toBeLessThanOrEqual(STAGES[i - 1].targetPlace);
    }
  });

  it('needs both the placing and the accuracy to clear a stage', () => {
    const stage = STAGES[0];
    expect(meetsTargets(stage, outcome({ place: 1, correct: 9, answered: 10 }))).toBe(true);
    expect(meetsTargets(stage, outcome({ place: 5, correct: 9, answered: 10 }))).toBe(false);
    expect(meetsTargets(stage, outcome({ place: 1, correct: 2, answered: 10 }))).toBe(false);
  });
});

describe('credits', () => {
  it('pays more for a better finish and for better language', () => {
    const win = creditsFor(outcome({ place: 1 }), false);
    const last = creditsFor(outcome({ place: 5 }), false);
    expect(win.placement).toBeGreaterThan(last.placement);

    const fluent = creditsFor(outcome({ correct: 10, answered: 10 }), false);
    const sloppy = creditsFor(outcome({ correct: 2, answered: 10 }), false);
    expect(fluent.language).toBeGreaterThan(sloppy.language);

    // Language is worth enough that it can outweigh a place or two.
    expect(fluent.language).toBeGreaterThan(win.placement - last.placement);
    expect(creditsFor(outcome(), true).clearBonus).toBeGreaterThan(0);
  });
});

describe('applyRace', () => {
  it('stamps the passport, banks credits and persists', () => {
    const result = applyRace(emptyProfile(), outcome({ place: 1, finishTime: 88 }));
    expect(result.cleared).toBe(true);
    expect(result.credits.total).toBeGreaterThan(0);
    expect(result.profile.stamps.britain.cleared).toBe(true);
    expect(result.profile.stamps.britain.bestTime).toBe(88);
    expect(result.unlocked?.nationId).toBe(STAGES[1].nationId);
    expect(loadProfile().credits).toBe(result.profile.credits);
  });

  it('keeps the best of each stamp across attempts', () => {
    const first = applyRace(emptyProfile(), outcome({ place: 3, finishTime: 120, correct: 5, answered: 10 }));
    const second = applyRace(first.profile, outcome({ place: 1, finishTime: 95, correct: 9, answered: 10 }));
    const stamp = second.profile.stamps.britain;
    expect(stamp.bestPlace).toBe(1);
    expect(stamp.bestTime).toBe(95);
    expect(stamp.bestAccuracy).toBeCloseTo(0.9, 5);
    expect(stamp.races).toBe(2);
  });

  it('only pays the clear bonus the first time', () => {
    const first = applyRace(emptyProfile(), outcome());
    const second = applyRace(first.profile, outcome());
    expect(first.credits.clearBonus).toBeGreaterThan(0);
    expect(second.credits.clearBonus).toBe(0);
  });

  it('collects missed words and counts repeat offenders', () => {
    const log = [miss('hello', '你好'), miss('water', '水')];
    const first = applyRace(emptyProfile(), outcome({ log }));
    expect(first.missedThisRace).toHaveLength(2);
    expect(first.profile.missed).toHaveLength(2);

    const second = applyRace(first.profile, outcome({ log: [miss('hello', '你好')] }));
    const hello = second.profile.missed.find((w) => w.native === 'hello');
    expect(hello?.misses).toBe(2);
    expect(second.profile.missed).toHaveLength(2);
  });

  it('does not log a word the player got right', () => {
    const log: GateRecord[] = [
      { lap: 0, gateIndex: 0, outcome: 'correct', prompt: 'p', answer: { native: 'yes', meaning: '是' } },
      miss('no', '不'),
    ];
    const result = applyRace(emptyProfile(), outcome({ log }));
    expect(result.missedThisRace.map((p) => p.native)).toEqual(['no']);
  });

  it('reports a promotion when the race pushes past a rank threshold', () => {
    const profile = emptyProfile();
    profile.credits = RANKS[1].credits - 5;
    const result = applyRace(profile, outcome());
    expect(result.promotedTo?.id).toBeDefined();
    expect(result.promotedTo!.credits).toBeGreaterThan(RANKS[0].credits);
  });

  it('tracks career totals across races', () => {
    const first = applyRace(emptyProfile(), outcome({ correct: 6, answered: 10 }));
    const second = applyRace(first.profile, outcome({ correct: 9, answered: 10 }));
    expect(second.profile.totals).toEqual({ correct: 15, answered: 20, races: 2 });
  });
});
