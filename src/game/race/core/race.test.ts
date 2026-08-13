import { describe, expect, it } from 'vitest';
import { RaceSim, type RaceConfig } from './race';
import { driveRacer } from './ai';
import { driftReward, MAX_DRIFT_CHARGE, neutralInput, resolveContact, stepRacer } from './physics';
import type { Racer } from './types';
import { BIRDS } from '../data/birds';

function makeSim(overrides: Partial<RaceConfig> = {}): RaceSim {
  return new RaceSim({
    trackId: 'meadow',
    birdId: 'gold',
    riderName: '測試',
    rivals: 3,
    difficulty: 1,
    seed: 42,
    ...overrides,
  });
}

/**
 * Runs a whole race with the human seat on autopilot, so lap times reflect the
 * track and the physics rather than a test driving into the scenery.
 */
function runRace(sim: RaceSim, maxSeconds = 400, dt = 1 / 60): number {
  let elapsed = 0;
  while (sim.phase !== 'finished' && elapsed < maxSeconds) {
    const player = sim.player;
    driveRacer(sim.track, player, { time: sim.time, difficulty: 1 });
    sim.setPlayerInput(player.input);
    sim.tick(dt);
    elapsed += dt;
  }
  return elapsed;
}

describe('RaceSim setup', () => {
  it('puts every entrant on the grid with the player at the back', () => {
    const sim = makeSim({ rivals: 5 });
    expect(sim.racers).toHaveLength(6);
    expect(sim.racers.filter((r) => r.isPlayer)).toHaveLength(1);
    const player = sim.player;
    // Rows hold two, so the player shares the back row with one rival and is
    // never ahead of anybody.
    expect(player.progress).toBe(Math.min(...sim.racers.map((r) => r.progress)));
    expect(player.progress).toBeLessThan(0);
    expect(sim.racers.filter((r) => r.progress === player.progress)).toHaveLength(2);
  });

  it('clamps the rival count and never duplicates the player mount', () => {
    const sim = makeSim({ rivals: 99, birdId: 'onyx' });
    expect(sim.racers).toHaveLength(8);
    expect(sim.racers.filter((r) => !r.isPlayer).some((r) => r.birdId === 'onyx')).toBe(false);
  });

  it('holds the field still through the countdown', () => {
    const sim = makeSim();
    const before = sim.racers.map((r) => ({ ...r.pos }));
    for (let i = 0; i < 60; i += 1) {
      sim.setPlayerInput({ throttle: 1 });
      sim.tick(1 / 60);
    }
    expect(sim.phase).toBe('countdown');
    sim.racers.forEach((racer, i) => {
      expect(racer.pos.x).toBeCloseTo(before[i].x, 6);
      expect(racer.pos.z).toBeCloseTo(before[i].z, 6);
    });
  });

  it('starts the race once the countdown expires', () => {
    const sim = makeSim();
    for (let i = 0; i < 300; i += 1) sim.tick(1 / 60);
    expect(sim.phase).toBe('running');
    expect(sim.drainEvents).toBeDefined();
  });
});

describe('RaceSim race', () => {
  it('runs a full race to a finish with sane lap counts and times', () => {
    const sim = makeSim({ rivals: 3 });
    const elapsed = runRace(sim);

    expect(sim.phase).toBe('finished');
    expect(elapsed).toBeLessThan(400);
    for (const racer of sim.racers) {
      expect(racer.finished).toBe(true);
      expect(racer.lap).toBe(sim.laps);
      expect(racer.lapTimes).toHaveLength(sim.laps);
      expect(racer.finishTime).toBeGreaterThan(0);
      // A lap of this course is roughly 25s; anything wildly outside that
      // means lap counting or the physics has drifted.
      for (const lap of racer.lapTimes) {
        expect(lap).toBeGreaterThan(8);
        expect(lap).toBeLessThan(120);
      }
    }
  });

  it('awards places in finishing order', () => {
    const sim = makeSim({ rivals: 3 });
    runRace(sim);
    const byPlace = [...sim.racers].sort((a, b) => a.place - b.place);
    for (let i = 1; i < byPlace.length; i += 1) {
      expect(byPlace[i].finishTime).toBeGreaterThanOrEqual(byPlace[i - 1].finishTime);
    }
    expect(new Set(byPlace.map((r) => r.place)).size).toBe(byPlace.length);
  });

  it('keeps the AI on the road and moving forwards', () => {
    const sim = makeSim({ rivals: 5, difficulty: 2 });
    let offTrackFrames = 0;
    let frames = 0;
    for (let i = 0; i < 60 * 60; i += 1) {
      sim.setPlayerInput({ throttle: 1 });
      sim.tick(1 / 60);
      if (sim.phase !== 'running') continue;
      frames += 1;
      for (const rival of sim.racers.filter((r) => !r.isPlayer && !r.finished)) {
        if (rival.offTrack) offTrackFrames += 1;
        expect(Number.isFinite(rival.pos.x)).toBe(true);
        expect(rival.speed).toBeGreaterThanOrEqual(0);
      }
    }
    // A little kerb-hopping is fine; living in the grass is not.
    expect(offTrackFrames / Math.max(1, frames * 5)).toBeLessThan(0.2);
  });

  it('never counts a lap for driving backwards over the line', () => {
    const sim = makeSim({ rivals: 0 });
    for (let i = 0; i < 240; i += 1) sim.tick(1 / 60);
    const player = sim.player;
    player.yaw += Math.PI;
    player.moveYaw = player.yaw;
    for (let i = 0; i < 60 * 8; i += 1) {
      sim.setPlayerInput({ throttle: 1, steer: 0 });
      sim.tick(1 / 60);
    }
    expect(player.lap).toBe(0);
  });

  it('produces a snapshot the HUD can render at any point', () => {
    const sim = makeSim({ rivals: 4 });
    for (let i = 0; i < 600; i += 1) {
      sim.setPlayerInput({ throttle: 1 });
      sim.tick(1 / 60);
    }
    const snapshot = sim.snapshot(60);
    expect(snapshot.standings).toHaveLength(5);
    expect(snapshot.blips).toHaveLength(5);
    expect(snapshot.player.lap).toBeGreaterThanOrEqual(1);
    expect(snapshot.player.lap).toBeLessThanOrEqual(snapshot.laps);
    expect(snapshot.player.place).toBeGreaterThanOrEqual(1);
    expect(snapshot.standings.map((r) => r.place)).toEqual([1, 2, 3, 4, 5]);
  });

  it('is deterministic for a given seed', () => {
    const a = makeSim({ seed: 7 });
    const b = makeSim({ seed: 7 });
    for (let i = 0; i < 900; i += 1) {
      a.setPlayerInput({ throttle: 1, steer: 0.2 });
      b.setPlayerInput({ throttle: 1, steer: 0.2 });
      a.tick(1 / 60);
      b.tick(1 / 60);
    }
    expect(a.player.pos.x).toBeCloseTo(b.player.pos.x, 9);
    expect(a.racers.map((r) => r.place)).toEqual(b.racers.map((r) => r.place));
  });
});

function testRacer(birdId = 'gold'): Racer {
  return {
    id: 'r',
    name: 'r',
    birdId,
    isPlayer: true,
    pos: { x: 0, z: 0 },
    y: 0,
    yaw: 0,
    moveYaw: 0,
    speed: 20,
    stamina: BIRDS[birdId].stamina,
    boost: 0,
    drifting: false,
    driftDir: 0,
    driftCharge: 0,
    offTrack: false,
    slip: 0,
    sample: 0,
    s: 0,
    lateral: 0,
    halfWidth: 8,
    lap: 0,
    lapArmed: false,
    progress: 0,
    place: 1,
    finished: false,
    finishTime: 0,
    lapTimes: [],
    lapStart: 0,
    input: neutralInput(),
    skill: 1,
    phase: 0,
    bumpCooldown: 0,
  };
}

describe('physics', () => {
  it('spends stamina while sprinting and refills it when you stop', () => {
    const racer = testRacer();
    racer.input = { ...neutralInput(), throttle: 1, sprint: true };
    for (let i = 0; i < 60; i += 1) stepRacer(racer, 1 / 60, 'road');
    const drained = racer.stamina;
    expect(drained).toBeLessThan(BIRDS.gold.stamina);

    racer.input.sprint = false;
    for (let i = 0; i < 120; i += 1) stepRacer(racer, 1 / 60, 'road');
    expect(racer.stamina).toBeGreaterThan(drained);
    expect(racer.stamina).toBeLessThanOrEqual(BIRDS.gold.stamina);
  });

  it('caps speed harder off the road than on it', () => {
    const onRoad = testRacer();
    const offRoad = testRacer();
    onRoad.input = { ...neutralInput(), throttle: 1 };
    offRoad.input = { ...neutralInput(), throttle: 1 };
    for (let i = 0; i < 300; i += 1) {
      stepRacer(onRoad, 1 / 60, 'road');
      stepRacer(offRoad, 1 / 60, 'rough');
    }
    expect(onRoad.speed).toBeGreaterThan(offRoad.speed * 1.3);
  });

  it('pays out a boost only for a long enough drift', () => {
    expect(driftReward(0.2)).toBe(0);
    expect(driftReward(1)).toBeGreaterThan(0);
    expect(driftReward(MAX_DRIFT_CHARGE)).toBeGreaterThan(driftReward(1));

    const racer = testRacer('frost');
    racer.input = { ...neutralInput(), throttle: 1, steer: 1, drift: true };
    for (let i = 0; i < 120; i += 1) stepRacer(racer, 1 / 60, 'road');
    expect(racer.drifting).toBe(true);
    expect(racer.driftCharge).toBeGreaterThan(0);
    // The bird slides wide of its facing while drifting.
    expect(Math.abs(racer.slip)).toBeGreaterThan(0.05);

    let granted = 0;
    racer.input.drift = false;
    stepRacer(racer, 1 / 60, 'road', (seconds) => {
      granted = seconds;
    });
    expect(granted).toBeGreaterThan(0);
    // The same step also burns one frame of the boost it just granted.
    expect(racer.boost).toBeGreaterThan(granted - 0.02);
    expect(racer.boost).toBeLessThanOrEqual(granted);
    expect(racer.drifting).toBe(false);
  });

  it('pushes overlapping racers apart', () => {
    const a = testRacer();
    const b = testRacer();
    b.pos = { x: 0.5, z: 0 };
    expect(resolveContact(a, b)).toBe(true);
    const gap = Math.hypot(b.pos.x - a.pos.x, b.pos.z - a.pos.z);
    expect(gap).toBeCloseTo(3, 5);
    expect(resolveContact(a, b)).toBe(false);
  });
});
