import type { TrackPoint } from '../core/types';

/**
 * Reusable circuit shapes. A nation picks a layout and dresses it with its own
 * palette, weather and lap count, so a new country costs one palette rather
 * than a whole hand-drawn course.
 *
 * Control points run as a closed loop — the last point must not repeat the
 * first. `w` scales the road width locally; drop it below 1 to make a corner
 * scary.
 */
export interface TrackLayout {
  id: string;
  /** How the shape reads, for the course card. */
  shape: string;
  points: readonly TrackPoint[];
  halfWidth: number;
  /** Boost pads, as fractions of a lap in [0, 1). */
  boosts: readonly number[];
  hazards: readonly { at: number; side: -1 | 0 | 1 }[];
}

export const LAYOUTS: Record<string, TrackLayout> = {
  // Wide, fast and forgiving — the shape every beginner course uses.
  openRing: {
    id: 'openRing',
    shape: '寬闊高速',
    halfWidth: 8.5,
    points: [
      { x: 0, z: 128 },
      { x: 62, z: 118, y: 1.5 },
      { x: 104, z: 78, y: 3 },
      { x: 116, z: 20, y: 2 },
      { x: 96, z: -38 },
      { x: 52, z: -66, y: -1.5 },
      { x: 8, z: -58, y: -2, w: 0.78 },
      { x: -34, z: -84, y: -1 },
      { x: -88, z: -76 },
      { x: -118, z: -22, y: 2.5 },
      { x: -112, z: 38, y: 3 },
      { x: -74, z: 92, y: 1 },
      { x: -34, z: 122 },
    ],
    boosts: [0.12, 0.46, 0.78],
    hazards: [
      { at: 0.3, side: 1 },
      { at: 0.62, side: -1 },
    ],
  },

  // Narrow, technical, with two near-hairpins.
  gorge: {
    id: 'gorge',
    shape: '窄彎與髮夾',
    halfWidth: 7.2,
    points: [
      { x: 0, z: 110 },
      { x: 54, z: 104, y: 2 },
      { x: 92, z: 66, y: 5 },
      { x: 86, z: 30, y: 4, w: 0.78 },
      { x: 106, z: -14, y: 2 },
      { x: 96, z: -62 },
      { x: 44, z: -88, y: -2 },
      { x: -4, z: -78, y: -3, w: 0.76 },
      { x: -46, z: -96, y: -2 },
      { x: -96, z: -70, y: 1 },
      { x: -104, z: -14, y: 4 },
      { x: -76, z: 20, y: 5, w: 0.74 },
      { x: -96, z: 58, y: 3 },
      { x: -62, z: 100, y: 1 },
    ],
    boosts: [0.08, 0.35, 0.55, 0.86],
    hazards: [
      { at: 0.2, side: -1 },
      { at: 0.44, side: 1 },
      { at: 0.72, side: 1 },
      { at: 0.92, side: -1 },
    ],
  },

  // Big elevation change and a long descending sweep.
  highland: {
    id: 'highland',
    shape: '起伏長彎',
    halfWidth: 7.8,
    points: [
      { x: 0, z: 122 },
      { x: 58, z: 112, y: 3 },
      { x: 108, z: 82, y: 7 },
      { x: 122, z: 26, y: 9 },
      { x: 96, z: -20, y: 5, w: 0.78 },
      { x: 100, z: -66, y: 1 },
      { x: 50, z: -102, y: -2 },
      { x: -6, z: -92, y: -3 },
      { x: -36, z: -60, y: -1, w: 0.74 },
      { x: -74, z: -66, y: 1 },
      { x: -116, z: -34, y: 4 },
      { x: -122, z: 26, y: 7 },
      { x: -92, z: 76, y: 4 },
      { x: -44, z: 116, y: 1 },
    ],
    boosts: [0.05, 0.28, 0.5, 0.68, 0.88],
    hazards: [
      { at: 0.16, side: 1 },
      { at: 0.36, side: -1 },
      { at: 0.58, side: 0 },
      { at: 0.79, side: 1 },
    ],
  },

  // A city circuit: long straights joined by square, late-braking corners.
  boulevard: {
    id: 'boulevard',
    shape: '長直線與方角彎',
    halfWidth: 8,
    points: [
      { x: 0, z: 116 },
      { x: 70, z: 112 },
      { x: 112, z: 84, y: 1 },
      { x: 118, z: 30, y: 1 },
      { x: 90, z: 2, y: 0, w: 0.8 },
      { x: 108, z: -46 },
      { x: 66, z: -92, y: -1 },
      { x: 4, z: -96, y: -1 },
      { x: -56, z: -92 },
      { x: -104, z: -58, y: 1 },
      { x: -110, z: -4, y: 2 },
      { x: -84, z: 36, y: 2, w: 0.82 },
      { x: -104, z: 76, y: 1 },
      { x: -60, z: 110 },
    ],
    boosts: [0.1, 0.32, 0.6, 0.84],
    hazards: [
      { at: 0.24, side: -1 },
      { at: 0.52, side: 1 },
      { at: 0.76, side: -1 },
    ],
  },

  // A coast road: one very long sweeper against a tight inland section.
  coastline: {
    id: 'coastline',
    shape: '長海岸線',
    halfWidth: 7.6,
    points: [
      { x: 0, z: 132 },
      { x: 66, z: 124, y: 2 },
      { x: 118, z: 92, y: 4 },
      { x: 134, z: 34, y: 3 },
      { x: 118, z: -26, y: 1 },
      { x: 74, z: -70, y: -1 },
      { x: 16, z: -86, y: -2 },
      { x: -40, z: -74, y: -1, w: 0.8 },
      { x: -62, z: -34, y: 1, w: 0.72 },
      { x: -98, z: -46, y: 2 },
      { x: -126, z: 6, y: 4 },
      { x: -116, z: 62, y: 3 },
      { x: -78, z: 104, y: 1 },
      { x: -36, z: 128 },
    ],
    boosts: [0.06, 0.3, 0.52, 0.8],
    hazards: [
      { at: 0.18, side: 1 },
      { at: 0.46, side: -1 },
      { at: 0.68, side: 1 },
    ],
  },

  // Forest loop: relentless medium-speed corners, almost no rest.
  woodland: {
    id: 'woodland',
    shape: '連續中速彎',
    halfWidth: 7,
    points: [
      { x: 0, z: 104 },
      { x: 48, z: 110, y: 2 },
      { x: 88, z: 80, y: 4 },
      { x: 76, z: 40, y: 3, w: 0.8 },
      { x: 104, z: 6, y: 2 },
      { x: 88, z: -46, y: 0 },
      { x: 40, z: -70, y: -2 },
      { x: -10, z: -52, y: -2, w: 0.78 },
      { x: -40, z: -84, y: -1 },
      { x: -88, z: -62, y: 1 },
      { x: -108, z: -12, y: 3 },
      { x: -80, z: 28, y: 4, w: 0.76 },
      { x: -102, z: 68, y: 2 },
      { x: -54, z: 96, y: 1 },
    ],
    boosts: [0.14, 0.4, 0.66, 0.9],
    hazards: [
      { at: 0.26, side: -1 },
      { at: 0.5, side: 1 },
      { at: 0.72, side: -1 },
      { at: 0.94, side: 1 },
    ],
  },
};

export function layout(id: string): TrackLayout {
  return LAYOUTS[id] ?? LAYOUTS.openRing;
}
