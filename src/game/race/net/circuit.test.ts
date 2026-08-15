import { describe, expect, it } from 'vitest';
import { CircuitNet } from './circuit';
import { HubWorld, PLAZA_RADIUS } from '../hub/hubWorld';
import { RaceSim } from '../core/race';

/**
 * These run without Supabase configured, which is exactly the fallback path a
 * public build takes: simulated diplomats in the plaza and stand-in rooms.
 */
function setup() {
  const hub = new HubWorld({ name: '你', birdId: 'gold', rank: '見習通譯' });
  // `realtime: false` pins these tests to the fallback path regardless of
  // whether the checkout happens to carry Supabase credentials.
  const net = new CircuitNet({ name: '你', birdId: 'gold', rank: '見習通譯' }, { realtime: false });
  return { hub, net };
}

describe('CircuitNet offline fallback', () => {
  it('fills the plaza with simulated diplomats rather than leaving it empty', async () => {
    const { hub, net } = setup();
    await net.connect(hub);
    net.update(1 / 60, hub);

    expect(net.status.mode).toBe('simulated');
    expect(net.status.online).toBe(0);
    expect(hub.others.size).toBeGreaterThan(0);
    for (const avatar of hub.others.values()) expect(avatar.online).toBe(false);
    net.dispose();
  });

  it('walks the simulated diplomats around inside the plaza', async () => {
    const { hub, net } = setup();
    await net.connect(hub);
    const first = [...hub.others.values()][0];
    const start = { ...first.pos };

    for (let i = 0; i < 60 * 12; i += 1) net.update(1 / 60, hub);

    const moved = Math.hypot(first.pos.x - start.x, first.pos.z - start.z);
    expect(moved).toBeGreaterThan(1);
    for (const avatar of hub.others.values()) {
      expect(Math.hypot(avatar.pos.x, avatar.pos.z)).toBeLessThan(PLAZA_RADIUS + 5);
    }
    net.dispose();
  });

  it('offers stand-in rooms, clearly marked as simulated', async () => {
    const { hub, net } = setup();
    await net.connect(hub);
    const rooms = net.rooms();
    expect(rooms.length).toBeGreaterThan(0);
    for (const room of rooms) expect(room.simulated).toBe(true);
    net.dispose();
  });
});

describe('CircuitNet rooms', () => {
  it('creates a room hosted by this client, with itself on the grid', async () => {
    const { hub, net } = setup();
    await net.connect(hub);
    const room = net.createRoom({ nationId: 'japan', challenge: 'word', rivals: 5 });

    expect(room.hostId).toBe(net.selfId);
    expect(room.members.map((m) => m.id)).toEqual([net.selfId]);
    expect(net.rooms().some((r) => r.id === room.id)).toBe(true);
    expect(net.roomOpponents()).toHaveLength(0);
    net.dispose();
  });

  it('joins a room and adds itself to the grid', async () => {
    const { hub, net } = setup();
    await net.connect(hub);
    const target = net.rooms().find((r) => r.simulated)!;
    const joined = net.joinRoom(target.id);

    expect(joined?.id).toBe(target.id);
    expect(joined?.members.some((m) => m.id === net.selfId)).toBe(true);
    // Nobody is actually on the other end of a simulated room, so the race
    // fills with AI rather than with birds that would never move.
    expect(net.roomOpponents()).toHaveLength(0);
    net.dispose();
  });

  it('only lets the host start, and reports the start once', async () => {
    const { hub, net } = setup();
    await net.connect(hub);
    let started = 0;
    net.onRaceStart(() => {
      started += 1;
    });

    const guest = net.joinRoom(net.rooms()[0].id)!;
    expect(guest.hostId).not.toBe(net.selfId);
    expect(net.startRoom()).toBeUndefined();
    expect(started).toBe(0);

    net.leaveRoom();
    net.createRoom({ nationId: 'france', rivals: 4 });
    const start = net.startRoom();
    expect(start?.startAt).toBeGreaterThan(0);
    expect(started).toBe(1);
    net.dispose();
  });

  it('drops the room when the host leaves', async () => {
    const { hub, net } = setup();
    await net.connect(hub);
    const room = net.createRoom({ nationId: 'spain', rivals: 3 });
    net.leaveRoom();
    expect(net.room).toBeUndefined();
    expect(net.rooms().some((r) => r.id === room.id)).toBe(false);
    net.dispose();
  });

  it('publishing a bird offline is a no-op rather than an error', async () => {
    const { hub, net } = setup();
    await net.connect(hub);
    net.createRoom({ nationId: 'japan', rivals: 2 });
    expect(() =>
      net.publishRacer({ x: 1, z: 2, yaw: 0.3, speed: 20, lap: 1, progress: 400 }, 1 / 60),
    ).not.toThrow();
    net.dispose();
  });
});

describe('networked racers in the sim', () => {
  function multiplayerSim() {
    return new RaceSim({
      trackId: 'japan',
      birdId: 'gold',
      riderName: '你',
      rivals: 3,
      difficulty: 1,
      seed: 11,
      remotes: [
        { id: 'peer1', name: 'Mira', birdId: 'azure' },
        { id: 'peer2', name: 'Anton', birdId: 'onyx' },
      ],
    });
  }

  it('seats humans before the AI and keeps the grid at eight', () => {
    const sim = multiplayerSim();
    expect(sim.racers.filter((r) => r.control === 'remote')).toHaveLength(2);
    expect(sim.racers.filter((r) => r.control === 'ai')).toHaveLength(3);
    expect(sim.racers.filter((r) => r.isPlayer)).toHaveLength(1);

    const full = new RaceSim({
      trackId: 'japan',
      birdId: 'gold',
      riderName: '你',
      rivals: 7,
      difficulty: 1,
      remotes: Array.from({ length: 7 }, (_, i) => ({ id: `p${i}`, name: `P${i}`, birdId: 'gold' })),
    });
    expect(full.racers).toHaveLength(8);
    expect(full.racers.filter((r) => r.control === 'ai')).toHaveLength(0);
  });

  it('moves a networked racer towards the packets it receives', () => {
    const sim = multiplayerSim();
    for (let i = 0; i < 240; i += 1) sim.tick(1 / 60);

    const peer = sim.racers.find((r) => r.id === 'peer1')!;
    const before = { ...peer.pos };
    sim.applyRemote('peer1', {
      x: before.x + 30,
      z: before.z,
      yaw: Math.PI / 2,
      speed: 24,
      lap: 0,
      progress: 260,
    });
    for (let i = 0; i < 60; i += 1) {
      sim.setPlayerInput({ throttle: 1 });
      sim.tick(1 / 60);
    }

    expect(peer.pos.x).toBeGreaterThan(before.x + 10);
    expect(peer.speed).toBeCloseTo(24, 5);
    expect(peer.progress).toBeGreaterThan(260);
    // Their own client owns their answers, so we never grade them here.
    expect(peer.gates.correct + peer.gates.wrong + peer.gates.missed).toBe(0);
  });

  it('ranks networked racers from the progress they report', () => {
    const sim = multiplayerSim();
    for (let i = 0; i < 240; i += 1) sim.tick(1 / 60);
    sim.applyRemote('peer1', { x: 0, z: 0, yaw: 0, speed: 0, lap: 2, progress: 5000 });
    sim.tick(1 / 60);
    expect(sim.racers.find((r) => r.id === 'peer1')!.place).toBe(1);
  });

  it('finishes a networked racer when their client says they crossed the line', () => {
    const sim = multiplayerSim();
    for (let i = 0; i < 240; i += 1) sim.tick(1 / 60);
    sim.applyRemote('peer2', { x: 0, z: 0, yaw: 0, speed: 0, lap: sim.laps, progress: 9999 });
    sim.tick(1 / 60);

    const peer = sim.racers.find((r) => r.id === 'peer2')!;
    expect(peer.finished).toBe(true);
    expect(peer.finishTime).toBeGreaterThan(0);
    expect(sim.snapshot().standings.find((r) => r.id === 'peer2')?.finished).toBe(true);
  });

  it('ignores packets for racers that are not networked', () => {
    const sim = multiplayerSim();
    const player = sim.player;
    const before = { ...player.pos };
    sim.applyRemote('player', { x: 999, z: 999, yaw: 0, speed: 50, lap: 3, progress: 9999 });
    expect(player.pos).toEqual(before);
  });
});
