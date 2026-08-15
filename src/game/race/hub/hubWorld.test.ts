import { describe, expect, it } from 'vitest';
import { HubWorld, PLAZA_RADIUS, RING_RADIUS, TALK_RANGE, buildPavilions } from './hubWorld';
import { NATION_IDS, NATIONS } from '../data/nations';

function makeHub(): HubWorld {
  return new HubWorld({ name: '你', birdId: 'gold', rank: '見習通譯' });
}

/** Walks the player for `seconds` in a fixed world-space direction. */
function walk(hub: HubWorld, x: number, z: number, seconds: number): void {
  hub.setInput({ x, z });
  for (let i = 0; i < seconds * 60; i += 1) hub.tick(1 / 60);
  hub.setInput({ x: 0, z: 0 });
}

describe('buildPavilions', () => {
  it('gives every nation a pavilion on the ring, facing the plaza', () => {
    const pavilions = buildPavilions();
    expect(pavilions).toHaveLength(NATION_IDS.length);
    for (const pavilion of pavilions) {
      expect(NATIONS[pavilion.nationId]).toBeDefined();
      expect(Math.hypot(pavilion.pos.x, pavilion.pos.z)).toBeCloseTo(RING_RADIUS, 5);
      // Facing the centre means the yaw points back at the origin.
      expect(Math.sin(pavilion.yaw)).toBeCloseTo(-pavilion.pos.x / RING_RADIUS, 5);
      expect(Math.cos(pavilion.yaw)).toBeCloseTo(-pavilion.pos.z / RING_RADIUS, 5);
      // Representatives stand between the doors and the plaza.
      expect(Math.hypot(pavilion.repPos.x, pavilion.repPos.z)).toBeLessThan(RING_RADIUS);
    }
  });

  it('spaces the pavilions evenly, with room to walk between them', () => {
    const pavilions = buildPavilions();
    const gaps = pavilions.map((p, i) => {
      const next = pavilions[(i + 1) % pavilions.length];
      return Math.hypot(next.pos.x - p.pos.x, next.pos.z - p.pos.z);
    });
    const min = Math.min(...gaps);
    const max = Math.max(...gaps);
    expect(max - min).toBeLessThan(0.5);
    expect(min).toBeGreaterThan(14);
  });
});

describe('HubWorld movement', () => {
  it('walks in the direction asked and turns to face it', () => {
    const hub = makeHub();
    const start = { ...hub.player.pos };
    walk(hub, 1, 0, 1);
    expect(hub.player.pos.x).toBeGreaterThan(start.x + 5);
    expect(Math.sin(hub.player.yaw)).toBeCloseTo(1, 1);
  });

  it('does not let a diagonal walk outrun a straight one', () => {
    const straight = makeHub();
    const diagonal = makeHub();
    walk(straight, 0, 1, 1);
    walk(diagonal, 1, 1, 1);
    const a = Math.hypot(straight.player.pos.x, straight.player.pos.z - 12);
    const b = Math.hypot(diagonal.player.pos.x, diagonal.player.pos.z - 12);
    expect(Math.abs(a - b)).toBeLessThan(0.5);
  });

  it('keeps the player inside the plaza', () => {
    const hub = makeHub();
    walk(hub, 1, 1, 20);
    expect(Math.hypot(hub.player.pos.x, hub.player.pos.z)).toBeLessThanOrEqual(PLAZA_RADIUS + 1e-6);
  });

  it('never lets the player walk through a pavilion', () => {
    const hub = makeHub();
    const target = hub.pavilions[0];
    for (let i = 0; i < 60 * 12; i += 1) {
      const dx = target.pos.x - hub.player.pos.x;
      const dz = target.pos.z - hub.player.pos.z;
      const length = Math.hypot(dx, dz) || 1;
      hub.setInput({ x: dx / length, z: dz / length });
      hub.tick(1 / 60);
      expect(Math.hypot(dx, dz)).toBeGreaterThan(0);
    }
    const distance = Math.hypot(
      hub.player.pos.x - target.pos.x,
      hub.player.pos.z - target.pos.z,
    );
    expect(distance).toBeGreaterThanOrEqual(4.9);
  });
});

describe('HubWorld interaction', () => {
  it('reports a representative only once you are standing with them', () => {
    const hub = makeHub();
    expect(hub.nearestRep()).toBeUndefined();

    const target = hub.pavilions[0];
    hub.player.pos = { x: target.repPos.x, z: target.repPos.z + TALK_RANGE - 1 };
    const near = hub.nearestRep();
    expect(near?.pavilion.nationId).toBe(target.nationId);
    expect(hub.nearestName()).toContain(NATIONS[target.nationId].name);

    hub.player.pos = { x: target.repPos.x, z: target.repPos.z + TALK_RANGE + 2 };
    expect(hub.nearestRep()).toBeUndefined();
  });

  it('picks the closest representative when two are in range', () => {
    const hub = makeHub();
    const [a, b] = hub.pavilions;
    hub.player.pos = {
      x: a.repPos.x * 0.9 + b.repPos.x * 0.1,
      z: a.repPos.z * 0.9 + b.repPos.z * 0.1,
    };
    expect(hub.nearestRep()?.pavilion.nationId).toBe(a.nationId);
  });
});

describe('HubWorld roster', () => {
  it('adds, updates and drops other diplomats', () => {
    const hub = makeHub();
    hub.upsertOther('peer', {
      name: 'Mira',
      birdId: 'azure',
      rank: '通譯官',
      pos: { x: 4, z: 4 },
      yaw: 0,
      online: true,
    });
    expect(hub.others.size).toBe(1);

    hub.upsertOther('peer', {
      name: 'Mira',
      birdId: 'azure',
      rank: '通譯官',
      pos: { x: 9, z: 4 },
      yaw: 0,
      online: true,
    });
    const peer = hub.others.get('peer')!;
    expect(peer.pos.x).toBe(9);
    // Moving between packets is what drives the walk cycle.
    expect(peer.moving).toBe(true);

    hub.removeOther('peer');
    expect(hub.others.size).toBe(0);
  });

  it('expires silent online peers but keeps local bots', () => {
    const hub = makeHub();
    hub.upsertOther('ghost', {
      name: '掉線',
      birdId: 'gold',
      rank: '通譯官',
      pos: { x: 0, z: 0 },
      yaw: 0,
      online: true,
    });
    hub.upsertOther('bot', {
      name: '模擬',
      birdId: 'gold',
      rank: '通譯官',
      pos: { x: 0, z: 0 },
      yaw: 0,
      online: false,
    });

    for (let i = 0; i < 60 * 20; i += 1) hub.tick(1 / 60);
    hub.expireOthers();
    expect(hub.others.has('ghost')).toBe(false);
    expect(hub.others.has('bot')).toBe(true);
  });
});
