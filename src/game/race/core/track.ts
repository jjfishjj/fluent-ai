import type { Track, TrackDef, TrackPoint, TrackSample, Vec2 } from './types';

/** Even spacing between resampled centre-line points, in world units. */
const SPACING = 1.6;
/** Subdivisions per control-point segment while measuring the raw spline. */
const SUB = 32;

function catmull(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    0.5 *
    (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3)
  );
}

function at(points: readonly TrackPoint[], i: number): TrackPoint {
  const n = points.length;
  return points[((i % n) + n) % n];
}

/** Point on the closed Catmull-Rom spline; `u` is a control-point index space. */
function splineAt(points: readonly TrackPoint[], u: number): { x: number; z: number; y: number; w: number } {
  const i = Math.floor(u);
  const t = u - i;
  const p0 = at(points, i - 1);
  const p1 = at(points, i);
  const p2 = at(points, i + 1);
  const p3 = at(points, i + 2);
  return {
    x: catmull(p0.x, p1.x, p2.x, p3.x, t),
    z: catmull(p0.z, p1.z, p2.z, p3.z, t),
    y: catmull(p0.y ?? 0, p1.y ?? 0, p2.y ?? 0, p3.y ?? 0, t),
    w: catmull(p0.w ?? 1, p1.w ?? 1, p2.w ?? 1, p3.w ?? 1, t),
  };
}

/**
 * Turns a handful of control points into an evenly spaced, closed centre line
 * with tangents, curvature and banking baked in. Everything downstream — the
 * road mesh, projection, AI racing lines — reads these samples.
 */
export function buildTrack(def: TrackDef): Track {
  const n = def.points.length;

  // Walk the spline finely once to measure arc length, then resample evenly.
  const raw: { x: number; z: number; y: number; w: number; s: number }[] = [];
  let total = 0;
  let prev = splineAt(def.points, 0);
  raw.push({ ...prev, s: 0 });
  for (let step = 1; step <= n * SUB; step += 1) {
    const u = (step / SUB) % n;
    const p = splineAt(def.points, u);
    total += Math.hypot(p.x - prev.x, p.z - prev.z);
    raw.push({ ...p, s: total });
    prev = p;
  }

  const count = Math.max(16, Math.round(total / SPACING));
  const spacing = total / count;
  const samples: TrackSample[] = [];
  let cursor = 0;
  for (let i = 0; i < count; i += 1) {
    const s = i * spacing;
    while (cursor < raw.length - 2 && raw[cursor + 1].s < s) cursor += 1;
    const a = raw[cursor];
    const b = raw[cursor + 1] ?? raw[cursor];
    const span = b.s - a.s;
    const t = span > 1e-6 ? (s - a.s) / span : 0;
    samples.push({
      pos: { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t },
      y: a.y + (b.y - a.y) * t,
      dir: { x: 0, z: 1 },
      right: { x: 1, z: 0 },
      yaw: 0,
      curvature: 0,
      bank: 0,
      halfWidth: def.halfWidth * (a.w + (b.w - a.w) * t),
      s,
    });
  }

  // Central differences give a smooth tangent even on the closing seam.
  for (let i = 0; i < count; i += 1) {
    const prevP = samples[(i - 1 + count) % count].pos;
    const nextP = samples[(i + 1) % count].pos;
    const dx = nextP.x - prevP.x;
    const dz = nextP.z - prevP.z;
    const len = Math.hypot(dx, dz) || 1;
    const sample = samples[i];
    sample.dir = { x: dx / len, z: dz / len };
    sample.right = { x: sample.dir.z, z: -sample.dir.x };
    sample.yaw = Math.atan2(sample.dir.x, sample.dir.z);
  }

  for (let i = 0; i < count; i += 1) {
    const a = samples[(i - 1 + count) % count].yaw;
    const b = samples[(i + 1) % count].yaw;
    // Signed turn per unit length: positive when the track bends right.
    const delta = wrapAngle(b - a);
    samples[i].curvature = delta / (2 * spacing);
    samples[i].bank = Math.max(-0.16, Math.min(0.16, samples[i].curvature * 9));
  }

  const track: Track = {
    def,
    samples,
    length: total,
    spacing,
    boosts: def.boosts.map((f) => ({ s: f * total, halfWidth: 2.6 })),
    hazards: def.hazards.map((h) => ({ s: h.at * total, lateral: h.side * def.halfWidth * 0.55, radius: 3.4 })),
  };
  return track;
}

/** Shortest signed difference between two angles, in (-π, π]. */
export function wrapAngle(a: number): number {
  let v = a;
  while (v > Math.PI) v -= Math.PI * 2;
  while (v <= -Math.PI) v += Math.PI * 2;
  return v;
}

export function sampleAt(track: Track, s: number): TrackSample {
  const count = track.samples.length;
  const i = Math.floor(((s / track.spacing) % count + count) % count);
  return track.samples[i];
}

/** Interpolated centre-line position at arc length `s`. */
export function pointAt(track: Track, s: number): { pos: Vec2; y: number; yaw: number; halfWidth: number } {
  const count = track.samples.length;
  const raw = ((s / track.spacing) % count + count) % count;
  const i = Math.floor(raw);
  const t = raw - i;
  const a = track.samples[i];
  const b = track.samples[(i + 1) % count];
  return {
    pos: { x: a.pos.x + (b.pos.x - a.pos.x) * t, z: a.pos.z + (b.pos.z - a.pos.z) * t },
    y: a.y + (b.y - a.y) * t,
    yaw: a.yaw + wrapAngle(b.yaw - a.yaw) * t,
    halfWidth: a.halfWidth + (b.halfWidth - a.halfWidth) * t,
  };
}

export interface Projection {
  /** Index of the nearest sample; feed it back as the next `hint`. */
  index: number;
  s: number;
  /** Signed offset from the centre line, positive to the right of travel. */
  lateral: number;
  halfWidth: number;
  y: number;
  yaw: number;
  curvature: number;
}

/**
 * Finds where a world position sits on the track. Searching a window around
 * `hint` keeps this O(1) per racer per frame; pass `hint = -1` for a full scan.
 */
export function project(track: Track, x: number, z: number, hint = -1, window = 14): Projection {
  const samples = track.samples;
  const count = samples.length;
  let best = 0;
  let bestDist = Infinity;

  const scan = (i: number) => {
    const idx = ((i % count) + count) % count;
    const p = samples[idx].pos;
    const d = (p.x - x) * (p.x - x) + (p.z - z) * (p.z - z);
    if (d < bestDist) {
      bestDist = d;
      best = idx;
    }
  };

  if (hint < 0) {
    for (let i = 0; i < count; i += 1) scan(i);
  } else {
    for (let i = hint - window; i <= hint + window; i += 1) scan(i);
    // A teleport or a very fast frame can leave the window; fall back to a
    // full scan rather than silently reporting a wrong lap position.
    if (Math.sqrt(bestDist) > track.spacing * window * 0.5) {
      bestDist = Infinity;
      for (let i = 0; i < count; i += 1) scan(i);
    }
  }

  const sample = samples[best];
  const dx = x - sample.pos.x;
  const dz = z - sample.pos.z;
  // Project onto the tangent so `s` stays smooth between samples.
  const along = dx * sample.dir.x + dz * sample.dir.z;
  const lateral = dx * sample.right.x + dz * sample.right.z;
  const s = (sample.s + along + track.length) % track.length;

  return {
    index: best,
    s,
    lateral,
    halfWidth: sample.halfWidth,
    y: sample.y,
    yaw: sample.yaw,
    curvature: sample.curvature,
  };
}

/** Largest |curvature| over the next `ahead` units — the AI's braking cue. */
export function curvatureAhead(track: Track, s: number, ahead: number): number {
  const steps = Math.max(1, Math.round(ahead / track.spacing));
  const count = track.samples.length;
  const start = Math.floor(s / track.spacing);
  let worst = 0;
  for (let i = 1; i <= steps; i += 1) {
    const c = track.samples[(start + i) % count].curvature;
    if (Math.abs(c) > Math.abs(worst)) worst = c;
  }
  return worst;
}

/** Grid slots: rows of two, staggered behind the start line. */
export function gridSlot(track: Track, index: number): { pos: Vec2; y: number; yaw: number } {
  const row = Math.floor(index / 2);
  const side = index % 2 === 0 ? -1 : 1;
  const s = (track.length - 6 - row * 5.5 + track.length) % track.length;
  const p = pointAt(track, s);
  const sample = sampleAt(track, s);
  const offset = side * Math.min(3.2, p.halfWidth * 0.45);
  return {
    pos: { x: p.pos.x + sample.right.x * offset, z: p.pos.z + sample.right.z * offset },
    y: p.y,
    yaw: p.yaw,
  };
}

export function isHazardAt(track: Track, s: number, lateral: number): boolean {
  return track.hazards.some((h) => {
    const d = Math.abs(wrapDistance(s, h.s, track.length));
    return d < h.radius && Math.abs(lateral - h.lateral) < h.radius;
  });
}

/** Signed distance from `b` to `a` around the loop, in (-length/2, length/2]. */
export function wrapDistance(a: number, b: number, length: number): number {
  let d = a - b;
  while (d > length / 2) d -= length;
  while (d <= -length / 2) d += length;
  return d;
}
