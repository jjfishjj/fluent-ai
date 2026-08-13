import { birdDef } from '../data/birds';
import { curvatureAhead, pointAt, wrapAngle } from './track';
import type { Racer, Track } from './types';

export interface DriveContext {
  /** Race clock, used only to de-phase the pack's wobble. */
  time: number;
  /** 0 = casual, 1 = normal, 2 = pro. */
  difficulty: number;
  /** Leader progress, for gentle rubber-banding. Omit to disable it. */
  chase?: number;
  /**
   * Lateral offset of the lane this rival has committed to at the gate ahead.
   * While set it overrides the racing line — answering beats cornering.
   */
  laneAim?: number;
}

/**
 * Writes one rival's controls for this frame. Rivals aim at a point down the
 * road, pull towards the inside of the coming corner, and lift or sprint based
 * on how sharp that corner is. Exported so tests (and any future attract mode)
 * can drive a clean lap without the renderer.
 */
export function driveRacer(track: Track, racer: Racer, ctx: DriveContext): void {
  const bird = birdDef(racer.birdId);
  const lookahead = 9 + racer.speed * 0.55;
  const upcoming = curvatureAhead(track, racer.s, lookahead * 1.6);
  const target = pointAt(track, racer.s + lookahead);
  const sample = track.samples[racer.sample];

  // Aim at the inside of the bend; a slow wobble keeps the pack from stacking
  // into a single line.
  const wobble = Math.sin(ctx.time * 0.7 + racer.phase) * (1 - racer.skill) * 6;
  // The inside of a right-hand bend (positive curvature) is the right side.
  const racingLine = Math.sign(upcoming) * Math.min(target.halfWidth * 0.6, Math.abs(upcoming) * 240);
  const offset = ctx.laneAim !== undefined ? ctx.laneAim : racingLine + wobble;
  const aimX = target.pos.x + sample.right.x * offset;
  const aimZ = target.pos.z + sample.right.z * offset;

  const desired = Math.atan2(aimX - racer.pos.x, aimZ - racer.pos.z);
  const error = wrapAngle(desired - racer.yaw);
  // Positive steer lowers yaw, so closing a positive heading error steers left.
  racer.input.steer = Math.max(-1, Math.min(1, -error * 2.2));

  // Corner speed budget. The physical limit for curvature k is sqrt(a / k), so
  // use that shape rather than a linear penalty — a linear one makes rivals
  // crawl through gentle bends they could take flat out.
  const corner = Math.abs(upcoming);
  // Lateral grip budget is per mount, so a nimble bird really does carry more
  // speed through a bend than a straight-line specialist.
  const lateral = (10 + bird.grip * 1.6 + bird.handling * 2.2) * (0.72 + racer.skill * 0.34);
  // Pace caps how much of the mount a rider actually uses on the straights.
  const pace = 0.8 + racer.skill * 0.22;
  const safe = Math.min(bird.topSpeed * pace, Math.sqrt(lateral / Math.max(corner, 1e-4)));
  const tooFast = racer.speed > safe * 1.06;
  racer.input.throttle = tooFast ? 0.4 : 1;
  racer.input.brake = racer.speed > safe * 1.3 ? 0.6 : 0;

  // Sprinting and drift-boosting are the two skills that separate the field;
  // casual rivals never do either.
  racer.input.sprint =
    racer.skill > 0.7 && !tooFast && corner < 0.012 && racer.stamina > bird.stamina * 0.3;
  racer.input.drift =
    racer.skill > 0.84 &&
    corner > 0.022 &&
    Math.abs(racer.input.steer) > 0.5 &&
    racer.speed > bird.topSpeed * 0.55;

  // Gentle rubber-banding keeps a beginner in touch without gifting the win.
  if (ctx.chase !== undefined) {
    const gap = ctx.chase - racer.progress;
    const catchUp = Math.max(-0.05, Math.min(0.06, gap * 0.0009 * (2 - ctx.difficulty)));
    racer.input.throttle = Math.max(0, Math.min(1, racer.input.throttle + catchUp));
  }
}
