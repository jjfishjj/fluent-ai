import { describe, expect, it } from 'vitest';
import { buildTrack, gridSlot, pointAt, project, wrapAngle, wrapDistance } from './track';
import { TRACKS } from '../data/tracks';

const track = buildTrack(TRACKS.britain);

describe('buildTrack', () => {
  it('resamples every course into an evenly spaced closed loop', () => {
    for (const def of Object.values(TRACKS)) {
      const built = buildTrack(def);
      expect(built.samples.length).toBeGreaterThan(100);
      expect(built.length).toBeGreaterThan(200);

      const gaps = built.samples.map((s, i) => {
        const next = built.samples[(i + 1) % built.samples.length];
        return Math.hypot(next.pos.x - s.pos.x, next.pos.z - s.pos.z);
      });
      const min = Math.min(...gaps);
      const max = Math.max(...gaps);
      // Even spacing is what makes `s` a usable arc length everywhere.
      expect(max - min).toBeLessThan(built.spacing * 0.25);
    }
  });

  it("points `right` at the driver's right hand, not their left", () => {
    // right === forward × up, with up = +Y. Getting this backwards silently
    // mirrors steering, banking and the language-gate lanes all at once.
    for (const sample of track.samples) {
      const forward = [sample.dir.x, 0, sample.dir.z];
      const cross = [
        forward[1] * 0 - forward[2] * 1,
        forward[2] * 0 - forward[0] * 0,
        forward[0] * 1 - forward[1] * 0,
      ];
      expect(sample.right.x).toBeCloseTo(cross[0], 6);
      expect(sample.right.z).toBeCloseTo(cross[2], 6);
    }
  });

  it('gives every sample a unit tangent and a perpendicular normal', () => {
    for (const sample of track.samples) {
      expect(Math.hypot(sample.dir.x, sample.dir.z)).toBeCloseTo(1, 5);
      expect(sample.dir.x * sample.right.x + sample.dir.z * sample.right.z).toBeCloseTo(0, 5);
      expect(Math.sin(sample.yaw)).toBeCloseTo(sample.dir.x, 5);
      expect(Math.cos(sample.yaw)).toBeCloseTo(sample.dir.z, 5);
    }
  });

  it('places boost pads and hazards inside the lap', () => {
    for (const pad of track.boosts) {
      expect(pad.s).toBeGreaterThanOrEqual(0);
      expect(pad.s).toBeLessThan(track.length);
    }
    for (const hazard of track.hazards) {
      expect(Math.abs(hazard.lateral)).toBeLessThan(track.def.halfWidth);
    }
  });
});

describe('project', () => {
  it('recovers the arc length of a point taken from the centre line', () => {
    for (let s = 0; s < track.length; s += 37) {
      const p = pointAt(track, s);
      const hit = project(track, p.pos.x, p.pos.z, -1);
      expect(Math.abs(wrapDistance(hit.s, s, track.length))).toBeLessThan(0.6);
      expect(Math.abs(hit.lateral)).toBeLessThan(0.6);
    }
  });

  it('reports a signed lateral offset, positive to the right of travel', () => {
    const p = pointAt(track, 120);
    const sample = track.samples[Math.round(120 / track.spacing)];
    const offset = 4;
    const right = project(track, p.pos.x + sample.right.x * offset, p.pos.z + sample.right.z * offset, -1);
    const left = project(track, p.pos.x - sample.right.x * offset, p.pos.z - sample.right.z * offset, -1);
    expect(right.lateral).toBeGreaterThan(3);
    expect(left.lateral).toBeLessThan(-3);
  });

  it('matches a full scan when the hinted window has gone stale', () => {
    const p = pointAt(track, track.length * 0.6);
    const hinted = project(track, p.pos.x, p.pos.z, 3);
    const scanned = project(track, p.pos.x, p.pos.z, -1);
    expect(hinted.index).toBe(scanned.index);
  });
});

describe('gridSlot', () => {
  it('stacks starters behind the line, alternating sides', () => {
    for (let i = 0; i < 8; i += 1) {
      const slot = gridSlot(track, i);
      const hit = project(track, slot.pos.x, slot.pos.z, -1);
      // Behind the line means near the end of the lap, never past the start.
      expect(hit.s).toBeGreaterThan(track.length * 0.9);
      expect(Math.abs(hit.lateral)).toBeLessThan(track.def.halfWidth);
      expect(Math.sign(hit.lateral)).toBe(i % 2 === 0 ? -1 : 1);
    }
  });
});

describe('wrapAngle', () => {
  it('folds any angle into (-π, π]', () => {
    expect(wrapAngle(Math.PI * 3)).toBeCloseTo(Math.PI, 5);
    expect(wrapAngle(-Math.PI * 2.5)).toBeCloseTo(-Math.PI / 2, 5);
    expect(wrapAngle(0.4)).toBeCloseTo(0.4, 5);
  });
});

describe('wrapDistance', () => {
  it('takes the short way round the loop', () => {
    expect(wrapDistance(1, 99, 100)).toBeCloseTo(2, 5);
    expect(wrapDistance(99, 1, 100)).toBeCloseTo(-2, 5);
    expect(wrapDistance(60, 40, 100)).toBeCloseTo(20, 5);
  });
});
