import { describe, expect, it } from 'vitest';
import {
  defenseReduction,
  deriveStats,
  elementMultiplier,
  expReward,
  expToNext,
  maxHpFor,
  rollDamage,
  statCost,
  totalExpFor,
} from './formulas';
import { CLASSES } from '../data/classes';

/** Returns a roll function that yields the supplied values in order. */
function rolls(...values: number[]) {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
}

describe('experience curve', () => {
  it('grows monotonically with level', () => {
    for (let l = 1; l < 50; l++) {
      expect(expToNext(l + 1)).toBeGreaterThan(expToNext(l));
    }
  });

  it('caps out at the level ceiling', () => {
    expect(expToNext(60)).toBe(Infinity);
  });

  it('accumulates total experience from level 1', () => {
    expect(totalExpFor(1)).toBe(0);
    expect(totalExpFor(3)).toBe(expToNext(1) + expToNext(2));
  });

  it('shrinks rewards when heavily out-levelling a monster', () => {
    expect(expReward(100, 5, 5)).toBe(100);
    expect(expReward(100, 10, 5)).toBe(100);
    expect(expReward(100, 20, 5)).toBeLessThan(50);
    expect(expReward(100, 60, 1)).toBeGreaterThanOrEqual(1);
  });
});

describe('attribute costs and derived stats', () => {
  it('raises the price of a stat every ten points', () => {
    expect(statCost(1)).toBe(1);
    expect(statCost(10)).toBe(1);
    expect(statCost(11)).toBe(2);
    expect(statCost(21)).toBe(3);
  });

  it('maps attributes onto combat values', () => {
    const cls = CLASSES.sword;
    const weak = deriveStats(cls, 1, { str: 1, agi: 1, vit: 1, int: 1, dex: 1, luk: 1 });
    const strong = deriveStats(cls, 1, { str: 20, agi: 20, vit: 20, int: 20, dex: 20, luk: 20 });
    expect(strong.atk).toBeGreaterThan(weak.atk);
    expect(strong.matk).toBeGreaterThan(weak.matk);
    expect(strong.flee).toBeGreaterThan(weak.flee);
    expect(strong.crit).toBeGreaterThan(weak.crit);
    expect(strong.aspd).toBeLessThanOrEqual(3.2);
  });

  it('gives the swordsman a bigger health pool than the talisman user', () => {
    const stats = { str: 5, agi: 5, vit: 5, int: 5, dex: 5, luk: 5 };
    expect(maxHpFor(CLASSES.sword, 10, stats)).toBeGreaterThan(maxHpFor(CLASSES.talisman, 10, stats));
  });
});

describe('elements and armour', () => {
  it('applies the matchup table', () => {
    expect(elementMultiplier('fire', 'earth')).toBe(1.5);
    expect(elementMultiplier('water', 'fire')).toBe(1.5);
    expect(elementMultiplier('fire', 'water')).toBe(0.5);
    expect(elementMultiplier('holy', 'shadow')).toBe(1.75);
    expect(elementMultiplier('neutral', 'neutral')).toBe(1);
  });

  it('reduces damage with diminishing returns but never to zero', () => {
    expect(defenseReduction(0)).toBe(1);
    expect(defenseReduction(120)).toBeCloseTo(0.5, 5);
    expect(defenseReduction(10_000)).toBeGreaterThan(0);
    expect(defenseReduction(200)).toBeLessThan(defenseReduction(100));
  });
});

describe('rollDamage', () => {
  const base = {
    atk: 100,
    power: 100,
    defense: 0,
    attackElement: 'neutral' as const,
    defenseElement: 'neutral' as const,
    crit: 0,
    hit: 100,
    flee: 100,
  };

  it('misses when the accuracy roll fails', () => {
    // crit roll high (no crit), then accuracy roll of 1 fails an 80% chance.
    const result = rollDamage({ ...base, roll: rolls(0.99, 1) });
    expect(result.miss).toBe(true);
    expect(result.amount).toBe(0);
  });

  it('lands a hit when the accuracy roll passes', () => {
    const result = rollDamage({ ...base, roll: rolls(0.99, 0.1, 0.5) });
    expect(result.miss).toBe(false);
    expect(result.crit).toBe(false);
    expect(result.amount).toBeGreaterThan(0);
  });

  it('lets criticals bypass evasion entirely', () => {
    // A guaranteed crit with an accuracy roll that would otherwise miss.
    const result = rollDamage({ ...base, crit: 100, flee: 10_000, roll: rolls(0, 1, 0.5) });
    expect(result.miss).toBe(false);
    expect(result.crit).toBe(true);
  });

  it('hits harder on a critical than on a normal hit', () => {
    const normal = rollDamage({ ...base, defense: 100, roll: rolls(0.99, 0.1, 0.5) });
    const crit = rollDamage({ ...base, defense: 100, crit: 100, roll: rolls(0, 0.5) });
    expect(crit.amount).toBeGreaterThan(normal.amount);
  });

  it('never deals less than one damage', () => {
    const result = rollDamage({ ...base, atk: 1, power: 1, defense: 9999, roll: rolls(0.99, 0.1, 0) });
    expect(result.amount).toBeGreaterThanOrEqual(1);
  });

  it('scales with the skill power multiplier', () => {
    const weak = rollDamage({ ...base, power: 100, roll: rolls(0.99, 0.1, 0.5) });
    const strong = rollDamage({ ...base, power: 300, roll: rolls(0.99, 0.1, 0.5) });
    expect(strong.amount).toBeGreaterThan(weak.amount * 2);
  });
});
