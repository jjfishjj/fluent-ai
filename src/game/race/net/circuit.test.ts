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

describe('CircuitNet chat', () => {
  it('echoes your own line even with nobody to send it to', async () => {
    const { hub, net } = setup();
    await net.connect(hub);
    net.say('大家好');

    const log = net.chat();
    expect(log).toHaveLength(1);
    expect(log[0].text).toBe('大家好');
    expect(log[0].self).toBe(true);
    net.dispose();
  });

  it('ignores blank lines and trims very long ones', async () => {
    const { hub, net } = setup();
    await net.connect(hub);
    net.say('   ');
    net.say('\n');
    expect(net.chat()).toHaveLength(0);

    net.say('字'.repeat(400));
    expect(net.chat()[0].text.length).toBeLessThanOrEqual(120);
    net.dispose();
  });

  it('lets the simulated diplomats chatter, and bounds the log', async () => {
    const { hub, net } = setup();
    await net.connect(hub);
    for (let i = 0; i < 60 * 60 * 30; i += 1) net.update(1 / 60, hub);

    const log = net.chat();
    expect(log.length).toBeGreaterThan(1);
    // Bounded, and none of it attributed to us.
    expect(log.length).toBeLessThanOrEqual(40);
    expect(log.some((line) => line.self)).toBe(false);
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
  /** Runs the countdown out, then `seconds` of racing. */
  function race(sim: RaceSim, seconds: number) {
    for (let i = 0; i < 240; i += 1) sim.tick(1 / 60);
    for (let i = 0; i < seconds * 60; i += 1) {
      sim.setPlayerInput({ throttle: 1 });
      sim.tick(1 / 60);
    }
  }

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
    race(sim, 6);

    const peer = sim.racers.find((r) => r.id === 'peer1')!;
    const before = { ...peer.pos };
    const reported = peer.remote!.progress + 40;
    expect(
      sim.applyRemote('peer1', {
        x: before.x + 30,
        z: before.z,
        yaw: Math.PI / 2,
        speed: 24,
        lap: 0,
        progress: reported,
      }),
    ).toBe(true);
    race(sim, 1);

    expect(peer.pos.x).toBeGreaterThan(before.x + 10);
    expect(peer.speed).toBeCloseTo(24, 5);
    expect(peer.progress).toBeGreaterThan(reported);
    // Their own client owns their answers, so we never grade them here.
    expect(peer.gates.correct + peer.gates.wrong + peer.gates.missed).toBe(0);
  });

  it('ranks networked racers from the progress they report', () => {
    const sim = multiplayerSim();
    race(sim, 40);
    const peer = sim.racers.find((r) => r.id === 'peer1')!;
    const leader = Math.max(...sim.racers.map((r) => r.progress));

    expect(
      sim.applyRemote('peer1', {
        x: peer.pos.x,
        z: peer.pos.z,
        yaw: peer.yaw,
        speed: 26,
        lap: peer.lap + 1,
        progress: leader + 120,
      }),
    ).toBe(true);
    sim.tick(1 / 60);
    expect(peer.place).toBe(1);
  });

  it('finishes a networked racer when their client says they crossed the line', () => {
    const sim = multiplayerSim();
    race(sim, 60);
    const peer2 = sim.racers.find((r) => r.id === 'peer2')!;
    expect(
      sim.applyRemote('peer2', {
        x: peer2.pos.x,
        z: peer2.pos.z,
        yaw: peer2.yaw,
        speed: 0,
        lap: sim.laps,
        progress: peer2.remote!.progress + 200,
      }),
    ).toBe(true);
    sim.tick(1 / 60);

    const peer = sim.racers.find((r) => r.id === 'peer2')!;
    expect(peer.finished).toBe(true);
    expect(peer.finishTime).toBeGreaterThan(0);
    expect(sim.snapshot().standings.find((r) => r.id === 'peer2')?.finished).toBe(true);
  });

  it('rejects packets that could not be real', () => {
    const sim = multiplayerSim();
    race(sim, 6);
    const peer = sim.racers.find((r) => r.id === 'peer1')!;
    const plausible = peer.remote!.progress + 30;

    // A plausible packet is accepted, and becomes the baseline.
    expect(sim.applyRemote('peer1', { x: 5, z: 5, yaw: 0, speed: 20, lap: 0, progress: plausible })).toBe(true);

    // Teleporting up the order, running backwards, impossible speed, NaN and
    // positions off the map are all dropped.
    const bad = (over: Record<string, number>) =>
      sim.applyRemote('peer1', { x: 5, z: 5, yaw: 0, speed: 20, lap: 0, progress: plausible, ...over });

    expect(bad({ progress: 9000 })).toBe(false);
    expect(bad({ progress: plausible - 400 })).toBe(false);
    expect(bad({ speed: 400 })).toBe(false);
    expect(bad({ speed: -5 })).toBe(false);
    expect(bad({ x: NaN })).toBe(false);
    expect(bad({ x: 1e9 })).toBe(false);
    expect(bad({ lap: 99 })).toBe(false);

    // The rejected packets left the last good state in place.
    expect(peer.remote?.lap).toBe(0);
    expect(peer.remote!.progress).toBeLessThan(plausible + 60);
  });

  it('accepts the first packet from a grid slot behind the start line', () => {
    const sim = multiplayerSim();
    const peer = sim.racers.find((r) => r.id === 'peer1')!;
    expect(peer.remote!.progress).toBeLessThan(0);
    // Their client reports the same negative progress before the lights go out.
    expect(
      sim.applyRemote('peer1', {
        x: peer.pos.x,
        z: peer.pos.z,
        yaw: peer.yaw,
        speed: 0,
        lap: 0,
        progress: peer.remote!.progress,
      }),
    ).toBe(true);
  });

  it('ignores packets for racers that are not networked', () => {
    const sim = multiplayerSim();
    const player = sim.player;
    const before = { ...player.pos };
    expect(sim.applyRemote('player', { x: 99, z: 99, yaw: 0, speed: 20, lap: 1, progress: 999 })).toBe(false);
    expect(player.pos).toEqual(before);
  });
});
