/** Deterministic RNG so combat rolls and world layout can be reproduced in tests. */
export class Rng {
  private s: number;

  constructor(seed = 20260809) {
    // Avoid the degenerate zero state.
    this.s = seed >>> 0 || 1;
  }

  /** mulberry32 — small, fast, good enough for gameplay rolls. */
  next(): number {
    this.s = (this.s + 0x6d2b79f5) >>> 0;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Float in [min, max). */
  range(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number {
    return Math.floor(this.range(min, max + 1));
  }

  chance(p: number): boolean {
    return this.next() < p;
  }

  pick<T>(items: readonly T[]): T {
    return items[Math.floor(this.next() * items.length) % items.length];
  }
}

/** Cheap value noise used for terrain height; deterministic for a given seed. */
export function hashNoise(x: number, z: number, seed = 1337): number {
  const n = Math.sin(x * 127.1 + z * 311.7 + seed * 0.017) * 43758.5453;
  return n - Math.floor(n);
}

function smooth(t: number): number {
  return t * t * (3 - 2 * t);
}

/** Bilinearly interpolated value noise in [-1, 1]. */
export function valueNoise2D(x: number, z: number, seed = 1337): number {
  const xi = Math.floor(x);
  const zi = Math.floor(z);
  const xf = smooth(x - xi);
  const zf = smooth(z - zi);
  const a = hashNoise(xi, zi, seed);
  const b = hashNoise(xi + 1, zi, seed);
  const c = hashNoise(xi, zi + 1, seed);
  const d = hashNoise(xi + 1, zi + 1, seed);
  const top = a + (b - a) * xf;
  const bottom = c + (d - c) * xf;
  return (top + (bottom - top) * zf) * 2 - 1;
}

/** Layered noise — three octaves is plenty for readable terrain. */
export function fbm(x: number, z: number, seed = 1337): number {
  return (
    valueNoise2D(x, z, seed) * 0.6 +
    valueNoise2D(x * 2.13, z * 2.13, seed + 11) * 0.28 +
    valueNoise2D(x * 4.37, z * 4.37, seed + 23) * 0.12
  );
}
