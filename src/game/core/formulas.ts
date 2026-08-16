import type { ClassDef, Derived, Element, Stats } from './types';

/** Levels beyond this stop granting stat/skill points. */
export const MAX_LEVEL = 60;

/** Attribute points granted per level up. */
export const STAT_POINTS_PER_LEVEL = 3;

/**
 * Experience needed to go from `level` to `level + 1`.
 * Tuned so the first few levels fall in seconds and level 30 is a long evening.
 */
export function expToNext(level: number): number {
  if (level >= MAX_LEVEL) return Infinity;
  return Math.round(28 * Math.pow(level, 1.75) + 22 * level + 30);
}

/** Total experience needed to reach `level` from level 1. */
export function totalExpFor(level: number): number {
  let sum = 0;
  for (let l = 1; l < level; l++) sum += expToNext(l);
  return sum;
}

/** Cost of raising an attribute from `value` to `value + 1`. */
export function statCost(value: number): number {
  return Math.max(1, Math.floor((value - 1) / 10) + 1);
}

export function emptyStats(): Stats {
  return { str: 1, agi: 1, vit: 1, int: 1, dex: 1, luk: 1 };
}

export function maxHpFor(cls: ClassDef, level: number, stats: Stats, gearDef = 0): number {
  const base = 40 + level * 13 + stats.vit * 9 + gearDef * 2;
  return Math.round(base * cls.hpFactor);
}

export function maxSpFor(cls: ClassDef, level: number, stats: Stats): number {
  const base = 20 + level * 4 + stats.int * 6;
  return Math.round(base * cls.spFactor);
}

export interface GearBonus {
  atk: number;
  matk: number;
  def: number;
}

export function deriveStats(
  cls: ClassDef,
  level: number,
  stats: Stats,
  gear: GearBonus = { atk: 0, matk: 0, def: 0 },
): Derived {
  const atk = Math.round(stats.str * 2 + stats.dex * 0.6 + level * 0.9 + gear.atk);
  const matk = Math.round(stats.int * 2.2 + level * 0.8 + gear.matk);
  const def = Math.round(stats.vit * 0.7 + level * 0.3 + gear.def);
  const hit = Math.round(80 + stats.dex * 1.2 + level * 0.8);
  const flee = Math.round(60 + stats.agi * 1.3 + level * 0.8);
  const crit = Math.min(60, 3 + stats.luk * 0.35);
  // Attacks per second: agility shortens the swing, capped so it stays readable.
  const aspd = Math.min(3.2, cls.weapon === 'bow' ? 1.0 : 0.9) + stats.agi * 0.018;
  const moveSpeed = 6.2 + stats.agi * 0.02;
  return { atk, matk, def, hit, flee, crit: Math.round(crit * 10) / 10, aspd: Math.min(3.2, aspd), moveSpeed };
}

/**
 * Elemental matchup multiplier. Fire beats wind-blown grass, water beats fire,
 * wind beats water, earth beats wind, holy and shadow oppose each other.
 */
const ELEMENT_TABLE: Record<Element, Partial<Record<Element, number>>> = {
  neutral: {},
  fire: { earth: 1.5, wind: 1.25, water: 0.5, fire: 0.5 },
  water: { fire: 1.5, earth: 1.25, wind: 0.5, water: 0.5 },
  wind: { water: 1.5, shadow: 1.15, earth: 0.5, wind: 0.5 },
  earth: { wind: 1.5, fire: 0.75, earth: 0.5 },
  holy: { shadow: 1.75, holy: 0.25 },
  shadow: { holy: 1.75, neutral: 1.15, shadow: 0.25 },
};

export function elementMultiplier(attack: Element, defense: Element): number {
  return ELEMENT_TABLE[attack]?.[defense] ?? 1;
}

/** Soft armour curve: defence has diminishing but never-zero returns. */
export function defenseReduction(def: number): number {
  return 1 - def / (def + 120);
}

export interface DamageInput {
  atk: number;
  /** Skill multiplier where 100 = a normal hit. */
  power: number;
  defense: number;
  attackElement: Element;
  defenseElement: Element;
  /** 0..100 chance of a critical hit. */
  crit: number;
  hit: number;
  flee: number;
  /** Roll source, injected so tests can be deterministic. */
  roll: () => number;
}

export interface DamageResult {
  amount: number;
  crit: boolean;
  miss: boolean;
}

export function rollDamage(input: DamageInput): DamageResult {
  const { atk, power, defense, attackElement, defenseElement, crit, hit, flee, roll } = input;

  // Hit chance: 80% baseline, shifted by the hit/flee gap, clamped to 5%..100%.
  const accuracy = Math.max(0.05, Math.min(1, 0.8 + (hit - flee) / 200));
  const isCrit = roll() * 100 < crit;
  // Critical hits bypass evasion entirely, the way they do in Ragnarok.
  if (!isCrit && roll() > accuracy) return { amount: 0, crit: false, miss: true };

  const variance = 0.9 + roll() * 0.2;
  const element = elementMultiplier(attackElement, defenseElement);
  // Criticals ignore a slice of armour on top of their multiplier.
  const reduction = defenseReduction(isCrit ? defense * 0.5 : defense);
  const raw = atk * (power / 100) * variance * element * reduction * (isCrit ? 1.6 : 1);
  return { amount: Math.max(1, Math.round(raw)), crit: isCrit, miss: false };
}

/** Experience awarded for a kill, reduced when heavily out-levelling the monster. */
export function expReward(monsterExp: number, playerLevel: number, monsterLevel: number): number {
  const gap = playerLevel - monsterLevel;
  if (gap <= 5) return monsterExp;
  const penalty = Math.max(0.1, 1 - (gap - 5) * 0.09);
  return Math.max(1, Math.round(monsterExp * penalty));
}

/** Silver dropped by a monster, scaled off its level. */
export function silverReward(monsterLevel: number, roll: () => number): number {
  return Math.round(monsterLevel * (3 + roll() * 4)) + 2;
}

export function distance(ax: number, az: number, bx: number, bz: number): number {
  const dx = ax - bx;
  const dz = az - bz;
  return Math.sqrt(dx * dx + dz * dz);
}

export function clamp(v: number, min: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

/** Shortest signed angular difference, used to turn characters smoothly. */
export function angleDelta(from: number, to: number): number {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}
