import { birdDef } from '../data/birds';
import { wrapAngle } from './track';
import type { Racer, RacerInput, Surface } from './types';

export const BOOST_MULTIPLIER = 1.42;
export const SPRINT_MULTIPLIER = 1.16;
/** Stamina burnt per second while sprinting. */
export const SPRINT_DRAIN = 26;
export const STAMINA_REGEN = 15;
/** Drift charge needed for the smallest boost. */
export const DRIFT_TIER = 0.75;
export const MAX_DRIFT_CHARGE = 2.4;

/** Speed ceiling and grip modifier per surface. */
const SURFACE: Record<Surface, { speed: number; grip: number }> = {
  road: { speed: 1, grip: 1 },
  kerb: { speed: 0.94, grip: 0.86 },
  rough: { speed: 0.62, grip: 0.7 },
};

export function neutralInput(): RacerInput {
  return { throttle: 0, brake: 0, steer: 0, sprint: false, drift: false };
}

/** Boost seconds granted when a drift is released at `charge`. */
export function driftReward(charge: number): number {
  if (charge < DRIFT_TIER) return 0;
  if (charge < DRIFT_TIER * 2) return 0.65;
  return charge >= MAX_DRIFT_CHARGE * 0.95 ? 1.75 : 1.15;
}

/**
 * Advances one racer by `dt`. The model is deliberately arcade: the bird
 * always moves along `moveYaw`, which chases the facing `yaw` at a rate set by
 * grip. Drifting slashes grip, so the mount slides wide while charging a
 * boost — the core risk/reward of the mode.
 */
export function stepRacer(
  racer: Racer,
  dt: number,
  surface: Surface,
  onBoost?: (seconds: number) => void,
): void {
  const bird = birdDef(racer.birdId);
  const surf = SURFACE[surface];
  const input = racer.input;

  // ── stamina & sprint ────────────────────────────────────────────────────
  const wantsSprint = input.sprint && racer.stamina > 0 && input.throttle > 0.1;
  if (wantsSprint) {
    racer.stamina = Math.max(0, racer.stamina - SPRINT_DRAIN * dt);
  } else {
    const rate = surface === 'rough' ? STAMINA_REGEN * 0.35 : STAMINA_REGEN;
    racer.stamina = Math.min(bird.stamina, racer.stamina + rate * dt);
  }

  // ── drift state ─────────────────────────────────────────────────────────
  const fastEnough = racer.speed > bird.topSpeed * 0.35;
  if (input.drift && fastEnough && Math.abs(input.steer) > 0.15) {
    if (!racer.drifting) {
      racer.drifting = true;
      racer.driftDir = input.steer > 0 ? 1 : -1;
      racer.driftCharge = 0;
    }
    // Charging only counts while still steering into the drift.
    if (Math.sign(input.steer) === racer.driftDir) {
      racer.driftCharge = Math.min(MAX_DRIFT_CHARGE, racer.driftCharge + dt * (1 + (8 - bird.grip) * 0.12));
    }
  } else if (racer.drifting) {
    const reward = driftReward(racer.driftCharge);
    if (reward > 0) {
      racer.boost = Math.max(racer.boost, reward);
      onBoost?.(reward);
    }
    racer.drifting = false;
    racer.driftDir = 0;
    racer.driftCharge = 0;
  }

  if (racer.boost > 0) racer.boost = Math.max(0, racer.boost - dt);

  // ── steering ────────────────────────────────────────────────────────────
  // Turn rate falls off with speed so top speed still feels fast and heavy.
  const speedRatio = Math.min(1, racer.speed / bird.topSpeed);
  const turnScale = (0.45 + 0.55 * Math.min(1, racer.speed / 6)) * (1 - speedRatio * 0.32);
  const driftBonus = racer.drifting ? 1.55 : 1;
  const yawRate = bird.handling * turnScale * driftBonus * surf.grip;
  // Steering right means turning towards `right`, which is a *decreasing* yaw
  // in three.js's coordinate system.
  racer.yaw = wrapAngle(racer.yaw - input.steer * yawRate * dt);

  // ── longitudinal ────────────────────────────────────────────────────────
  let top = bird.topSpeed * surf.speed;
  if (racer.boost > 0) top *= BOOST_MULTIPLIER;
  else if (wantsSprint) top *= SPRINT_MULTIPLIER;
  if (racer.drifting) top *= 0.94;
  // Fighting the slide scrubs speed, which is what keeps drifting a trade-off.
  top *= 1 - Math.min(0.3, Math.abs(racer.slip) * 0.34);

  const target = input.throttle * top;
  if (input.brake > 0) {
    racer.speed = Math.max(0, racer.speed - bird.topSpeed * 1.5 * input.brake * dt);
  }
  if (racer.speed < target) {
    const gain = bird.accel * bird.topSpeed * (racer.boost > 0 ? 1.8 : 1) * 0.55;
    racer.speed = Math.min(target, racer.speed + gain * dt);
  } else {
    // Coasting drag; stronger off-road so leaving the track really costs you.
    const drag = surface === 'rough' ? 5.5 : 2.6;
    racer.speed = Math.max(target, racer.speed - drag * dt);
  }

  // ── slide ───────────────────────────────────────────────────────────────
  const grip = bird.grip * surf.grip * (racer.drifting ? 0.28 : 1);
  const follow = 1 - Math.exp(-grip * dt);
  racer.moveYaw = wrapAngle(racer.moveYaw + wrapAngle(racer.yaw - racer.moveYaw) * follow);
  racer.slip = wrapAngle(racer.yaw - racer.moveYaw);

  racer.pos.x += Math.sin(racer.moveYaw) * racer.speed * dt;
  racer.pos.z += Math.cos(racer.moveYaw) * racer.speed * dt;

  if (racer.bumpCooldown > 0) racer.bumpCooldown = Math.max(0, racer.bumpCooldown - dt);
}

/** Nudges two overlapping racers apart and trades a little speed. */
export function resolveContact(a: Racer, b: Racer, radius = 1.5): boolean {
  const dx = b.pos.x - a.pos.x;
  const dz = b.pos.z - a.pos.z;
  const distSq = dx * dx + dz * dz;
  const min = radius * 2;
  if (distSq >= min * min || distSq < 1e-6) return false;

  const dist = Math.sqrt(distSq);
  const push = (min - dist) / 2;
  const nx = dx / dist;
  const nz = dz / dist;
  a.pos.x -= nx * push;
  a.pos.z -= nz * push;
  b.pos.x += nx * push;
  b.pos.z += nz * push;

  // The faster bird loses a little more — a bump should never be free.
  const faster = a.speed > b.speed ? a : b;
  const slower = faster === a ? b : a;
  faster.speed *= 0.965;
  slower.speed *= 0.99;
  a.bumpCooldown = 0.4;
  b.bumpCooldown = 0.4;
  return true;
}
