import { NATION_IDS, nation } from '../data/nations';
import { wrapAngle } from '../core/track';
import type { Vec2 } from '../core/types';

/**
 * 使節廣場 — the embassy hub. Eight pavilions ring a plaza, one per host
 * nation, each staffed by that nation's representative. Walking up to a
 * representative is how you enter their circuit or open a race room, so the
 * lobby is a place rather than a menu.
 *
 * This module is pure simulation: no three.js, no network. `HubRenderer` draws
 * it and `CircuitNet` fills `others` with real or simulated players.
 */

/** Radius of the ring the pavilions stand on. */
export const RING_RADIUS = 38;
/** Players cannot walk further than this from the plaza centre. */
export const PLAZA_RADIUS = 54;
/** How close you must stand to a representative to talk to them. */
export const TALK_RANGE = 6.5;
const WALK_SPEED = 9.5;
const TURN_RATE = 9;

export interface Pavilion {
  nationId: string;
  /** Centre of the building. */
  pos: Vec2;
  /** Facing, towards the plaza centre. */
  yaw: number;
  /** Where the representative stands, in front of the doors. */
  repPos: Vec2;
}

export interface HubAvatar {
  id: string;
  name: string;
  birdId: string;
  /** Diplomatic rank, shown under the name. */
  rank: string;
  pos: Vec2;
  yaw: number;
  moving: boolean;
  /** True for players arriving over the network rather than bots. */
  online: boolean;
  /** Local clock when this avatar was last updated. */
  lastSeen: number;
}

export interface HubInput {
  /** Desired movement direction in world space; magnitude 0–1. */
  x: number;
  z: number;
}

/** Pavilions are laid out clockwise from the north, in circuit order. */
export function buildPavilions(): Pavilion[] {
  return NATION_IDS.map((nationId, index) => {
    const angle = (index / NATION_IDS.length) * Math.PI * 2;
    const pos = { x: Math.sin(angle) * RING_RADIUS, z: Math.cos(angle) * RING_RADIUS };
    // Face the plaza centre.
    const yaw = wrapAngle(Math.atan2(-pos.x, -pos.z));
    return {
      nationId,
      pos,
      yaw,
      repPos: { x: pos.x * 0.82, z: pos.z * 0.82 },
    };
  });
}

export class HubWorld {
  readonly pavilions = buildPavilions();
  readonly player: HubAvatar;
  readonly others = new Map<string, HubAvatar>();
  time = 0;

  private input: HubInput = { x: 0, z: 0 };

  constructor(profile: { name: string; birdId: string; rank: string }) {
    this.player = {
      id: 'self',
      name: profile.name,
      birdId: profile.birdId,
      rank: profile.rank,
      pos: { x: 0, z: 12 },
      yaw: Math.PI,
      moving: false,
      online: false,
      lastSeen: 0,
    };
  }

  setInput(input: HubInput): void {
    const length = Math.hypot(input.x, input.z);
    // Normalise so diagonal walking is not faster than straight.
    this.input = length > 1 ? { x: input.x / length, z: input.z / length } : input;
  }

  tick(dt: number): void {
    this.time += dt;
    const player = this.player;
    const speed = Math.hypot(this.input.x, this.input.z);
    player.moving = speed > 0.01;

    if (player.moving) {
      player.pos.x += this.input.x * WALK_SPEED * dt;
      player.pos.z += this.input.z * WALK_SPEED * dt;
      const want = Math.atan2(this.input.x, this.input.z);
      player.yaw = wrapAngle(player.yaw + wrapAngle(want - player.yaw) * Math.min(1, TURN_RATE * dt));
    }

    // Keep everyone inside the plaza, and out of the pavilions themselves.
    const from = Math.hypot(player.pos.x, player.pos.z);
    if (from > PLAZA_RADIUS) {
      player.pos.x *= PLAZA_RADIUS / from;
      player.pos.z *= PLAZA_RADIUS / from;
    }
    for (const pavilion of this.pavilions) {
      this.pushOut(player, pavilion.pos, 5);
      // Stop short of the representative too, or you end up standing in them.
      this.pushOut(player, pavilion.repPos, 3.2);
    }
  }

  private pushOut(avatar: HubAvatar, from: Vec2, radius: number): void {
    const dx = avatar.pos.x - from.x;
    const dz = avatar.pos.z - from.z;
    const distance = Math.hypot(dx, dz);
    if (distance >= radius || distance < 1e-3) return;
    avatar.pos.x = from.x + (dx / distance) * radius;
    avatar.pos.z = from.z + (dz / distance) * radius;
  }

  /** The representative close enough to talk to, if any. */
  nearestRep(): { pavilion: Pavilion; distance: number } | undefined {
    let best: { pavilion: Pavilion; distance: number } | undefined;
    for (const pavilion of this.pavilions) {
      const distance = Math.hypot(
        this.player.pos.x - pavilion.repPos.x,
        this.player.pos.z - pavilion.repPos.z,
      );
      if (distance > TALK_RANGE) continue;
      if (!best || distance < best.distance) best = { pavilion, distance };
    }
    return best;
  }

  upsertOther(id: string, data: Omit<HubAvatar, 'id' | 'lastSeen' | 'moving'> & { moving?: boolean }): HubAvatar {
    const existing = this.others.get(id);
    if (existing) {
      const moved = Math.hypot(data.pos.x - existing.pos.x, data.pos.z - existing.pos.z) > 0.05;
      Object.assign(existing, data, { moving: data.moving ?? moved, lastSeen: this.time });
      return existing;
    }
    const avatar: HubAvatar = { id, moving: false, lastSeen: this.time, ...data };
    this.others.set(id, avatar);
    return avatar;
  }

  removeOther(id: string): void {
    this.others.delete(id);
  }

  /** Drops avatars that stopped reporting, so ghosts do not pile up. */
  expireOthers(maxAge = 12): void {
    for (const [id, avatar] of this.others) {
      if (avatar.online && this.time - avatar.lastSeen > maxAge) this.others.delete(id);
    }
  }

  /** Nation name of the pavilion the player is standing at, for the HUD. */
  nearestName(): string | undefined {
    const near = this.nearestRep();
    if (!near) return undefined;
    const def = nation(near.pavilion.nationId);
    return `${def.flag} ${def.name}`;
  }
}
