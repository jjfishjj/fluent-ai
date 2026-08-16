import type { RealtimeChannel } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '@/integrations/supabase/client';
import { Rng } from '../../core/rng';
import { BIRD_IDS } from '../data/birds';
import type { ChallengeKind } from '../data/nations';
import { PLAZA_RADIUS, type HubWorld } from '../hub/hubWorld';

/**
 * Multiplayer for the embassy hub and for racing together.
 *
 * With Supabase configured, everyone joins one realtime channel: presence for
 * the roster, broadcasts for avatar movement, race rooms and in-race state.
 * Without it — or if the channel will not subscribe — simulated diplomats walk
 * the plaza and rooms fill with AI, so the hub is never empty and every button
 * still does something.
 *
 * There is no authoritative server: each client runs the same seeded race and
 * publishes its own bird. That is enough for a friendly race and needs no
 * tables, no migrations and no edge functions.
 */

const CHANNEL = 'chocorace:hub';
/** How often we publish our avatar in the hub, and our bird during a race. */
const HUB_INTERVAL = 0.2;
const RACE_INTERVAL = 0.1;
/** Rooms disappear if the host stops announcing them. */
const ROOM_TTL = 8;

const BOT_NAMES = ['林亦', '柏森', 'Mira', '晴子', 'Anton', '雨柔', 'Diego', '沙里', 'Nadia', '子謙'];
const BOT_RANKS = ['見習通譯', '通譯官', '隨行外交官', '首席外交官', '特使'];
const BOT_CHATTER = [
  '德國那站的數字關真的難，七跟八老是搞混',
  '有人要跑冰河嗎？我開房',
  '記憶序列那關我都先默念三遍再起跑',
  '聽力關建議把音量開大…',
  '剛剛甩尾接加速板，超爽',
  '西班牙的長彎我每次都出界',
  '通譯官升上來了！',
  '閘門選錯就掉速，好嚴格',
];
/** Longest chat line accepted from anywhere, including ourselves. */
const CHAT_LIMIT = 120;

export type NetMode = 'offline' | 'simulated' | 'online';

export interface NetStatus {
  mode: NetMode;
  /** Real players in the hub, excluding you. */
  online: number;
}

export interface RaceRoom {
  id: string;
  hostId: string;
  hostName: string;
  nationId: string;
  challenge?: ChallengeKind;
  rivals: number;
  seed: number;
  members: { id: string; name: string; birdId: string }[];
  /** Set once the host has pressed start. */
  startAt?: number;
  /** True for the stand-in rooms shown when there is no realtime connection. */
  simulated?: boolean;
  updatedAt: number;
}

export interface ChatLine {
  id: string;
  name: string;
  text: string;
  /** Local clock when it arrived, for ordering and fading. */
  at: number;
  /** True for our own lines, so the UI can highlight them. */
  self?: boolean;
}

export interface SelfProfile {
  name: string;
  birdId: string;
  rank: string;
}

/** One bird's state on the wire, published ~10 times a second. */
export interface RacerPacket {
  roomId: string;
  id: string;
  x: number;
  z: number;
  yaw: number;
  speed: number;
  lap: number;
  progress: number;
}

interface Bot {
  id: string;
  name: string;
  rank: string;
  birdId: string;
  x: number;
  z: number;
  yaw: number;
  goalX: number;
  goalZ: number;
  pauseUntil: number;
}

export class CircuitNet {
  readonly selfId = `d_${Math.random().toString(36).slice(2, 9)}`;
  /** The room this client is in, if any. */
  room?: RaceRoom;

  private channel?: RealtimeChannel;
  private online = false;
  private rng = new Rng(90210);
  private bots: Bot[] = [];
  private roomsById = new Map<string, RaceRoom>();
  private hubAt = 0;
  private raceAt = 0;
  private time = 0;
  private profile: SelfProfile;
  private onStart?: (room: RaceRoom) => void;
  private onPacket?: (packet: RacerPacket) => void;
  private chatLog: ChatLine[] = [];
  private chatAt = 0;

  constructor(
    profile: SelfProfile,
    /**
     * `realtime: false` forces the simulated plaza even where Supabase is
     * configured — used by tests, and by anyone who wants a solo hub.
     */
    private opts: { simulate?: boolean; realtime?: boolean } = {},
  ) {
    this.profile = profile;
  }

  get status(): NetStatus {
    return {
      mode: this.online ? 'online' : this.bots.length ? 'simulated' : 'offline',
      online: this.online ? this.roomPeers().length : 0,
    };
  }

  setProfile(profile: SelfProfile): void {
    this.profile = profile;
  }

  /** Rooms currently open, newest first, with dead ones filtered out. */
  rooms(): RaceRoom[] {
    const live: RaceRoom[] = [];
    for (const [id, room] of this.roomsById) {
      if (!room.simulated && this.time - room.updatedAt > ROOM_TTL) {
        this.roomsById.delete(id);
        continue;
      }
      live.push(room);
    }
    return live.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  onRaceStart(handler: (room: RaceRoom) => void): void {
    this.onStart = handler;
  }

  onRacerPacket(handler: (packet: RacerPacket) => void): void {
    this.onPacket = handler;
  }

  /** The plaza's recent chat, oldest first. */
  chat(): ChatLine[] {
    return this.chatLog;
  }

  /** Says something in the plaza. Offline it is still echoed locally. */
  say(text: string): void {
    const trimmed = text.trim().slice(0, CHAT_LIMIT);
    if (!trimmed) return;
    this.pushChat({ id: this.selfId, name: this.profile.name, text: trimmed, at: this.time, self: true });
    if (this.online && this.channel) {
      void this.channel.send({
        type: 'broadcast',
        event: 'chat',
        payload: { id: this.selfId, name: this.profile.name, text: trimmed },
      });
    }
  }

  private pushChat(line: ChatLine): void {
    // Bounded: the plaza keeps the last few dozen lines, nothing more.
    this.chatLog = [...this.chatLog, line].slice(-40);
  }

  // ── lifecycle ────────────────────────────────────────────────────────────

  async connect(hub: HubWorld): Promise<void> {
    this.spawnBots(hub);
    if (!isSupabaseConfigured || this.opts.realtime === false) return;

    try {
      const channel = supabase.channel(CHANNEL, {
        config: { presence: { key: this.selfId }, broadcast: { self: false } },
      });

      channel.on('broadcast', { event: 'hub' }, ({ payload }) => {
        const p = payload as {
          id: string;
          name: string;
          birdId: string;
          rank: string;
          x: number;
          z: number;
          yaw: number;
        };
        if (!p?.id || p.id === this.selfId) return;
        hub.upsertOther(p.id, {
          name: p.name ?? '外交官',
          birdId: p.birdId ?? 'gold',
          rank: p.rank ?? '見習通譯',
          pos: { x: p.x ?? 0, z: p.z ?? 0 },
          yaw: p.yaw ?? 0,
          online: true,
        });
      });

      channel.on('broadcast', { event: 'room' }, ({ payload }) => {
        const room = payload as RaceRoom;
        if (!room?.id) return;
        this.roomsById.set(room.id, { ...room, updatedAt: this.time });
        // The host announced a start time: everyone in the room drops in.
        if (room.startAt && this.room?.id === room.id) {
          this.room = { ...room, updatedAt: this.time };
          this.onStart?.(this.room);
        }
      });

      channel.on('broadcast', { event: 'join' }, ({ payload }) => {
        const join = payload as { roomId: string; id: string; name: string; birdId: string };
        if (!join?.roomId || this.room?.id !== join.roomId) return;
        if (this.room.hostId !== this.selfId) return;
        if (this.room.members.some((m) => m.id === join.id)) return;
        // Only the host owns the roster; it re-announces on the next tick.
        this.room.members = [...this.room.members, { id: join.id, name: join.name, birdId: join.birdId }];
      });

      channel.on('broadcast', { event: 'chat' }, ({ payload }) => {
        const line = payload as { id: string; name: string; text: string };
        if (!line?.id || line.id === this.selfId) return;
        this.pushChat({
          id: line.id,
          name: String(line.name ?? '外交官').slice(0, 24),
          text: String(line.text ?? '').slice(0, CHAT_LIMIT),
          at: this.time,
        });
      });

      channel.on('broadcast', { event: 'racer' }, ({ payload }) => {
        const packet = payload as RacerPacket;
        if (!packet?.id || packet.id === this.selfId) return;
        if (!this.room || packet.roomId !== this.room.id) return;
        this.onPacket?.(packet);
      });

      channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
        for (const presence of leftPresences as { key?: string }[]) {
          if (presence?.key) hub.removeOther(presence.key);
        }
      });

      const status = await new Promise<string>((resolve) => {
        const timer = setTimeout(() => resolve('TIMED_OUT'), 6000);
        channel.subscribe((s) => {
          if (s === 'SUBSCRIBED' || s === 'CHANNEL_ERROR' || s === 'TIMED_OUT' || s === 'CLOSED') {
            clearTimeout(timer);
            resolve(s);
          }
        });
      });

      if (status !== 'SUBSCRIBED') {
        void supabase.removeChannel(channel);
        return;
      }

      await channel.track({ name: this.profile.name, rank: this.profile.rank });
      this.channel = channel;
      this.online = true;
      // Real diplomats are here now — send the stand-ins home.
      for (const bot of this.bots) hub.removeOther(bot.id);
      this.bots = [];
      this.roomsById.clear();
    } catch {
      // Realtime is optional; the simulated plaza keeps the hub alive.
      this.online = false;
    }
  }

  /** Steps bots and publishes our own avatar. Call once per hub frame. */
  update(dt: number, hub: HubWorld): void {
    this.time += dt;
    this.stepBots(dt, hub);
    hub.expireOthers();

    // The stand-ins chat too, so an offline plaza still has a pulse.
    if (!this.online && this.bots.length > 0 && this.time > this.chatAt) {
      this.chatAt = this.time + this.rng.range(14, 40);
      const bot = this.rng.pick(this.bots);
      this.pushChat({ id: bot.id, name: bot.name, text: this.rng.pick(BOT_CHATTER), at: this.time });
    }

    if (this.online && this.channel && this.time - this.hubAt > HUB_INTERVAL) {
      this.hubAt = this.time;
      const player = hub.player;
      void this.channel.send({
        type: 'broadcast',
        event: 'hub',
        payload: {
          id: this.selfId,
          name: this.profile.name,
          birdId: this.profile.birdId,
          rank: this.profile.rank,
          x: Math.round(player.pos.x * 100) / 100,
          z: Math.round(player.pos.z * 100) / 100,
          yaw: Math.round(player.yaw * 100) / 100,
        },
      });
    }

    // The host keeps its room alive; silence means the room closed.
    if (this.online && this.channel && this.room?.hostId === this.selfId) {
      void this.channel.send({ type: 'broadcast', event: 'room', payload: this.room });
    }
  }

  // ── rooms ────────────────────────────────────────────────────────────────

  createRoom(options: { nationId: string; challenge?: ChallengeKind; rivals: number }): RaceRoom {
    const room: RaceRoom = {
      id: `${this.selfId}_${Math.random().toString(36).slice(2, 6)}`,
      hostId: this.selfId,
      hostName: this.profile.name,
      nationId: options.nationId,
      challenge: options.challenge,
      rivals: options.rivals,
      seed: Math.floor(Math.random() * 1e6),
      members: [{ id: this.selfId, name: this.profile.name, birdId: this.profile.birdId }],
      simulated: !this.online,
      updatedAt: this.time,
    };
    this.room = room;
    this.roomsById.set(room.id, room);
    if (this.online && this.channel) {
      void this.channel.send({ type: 'broadcast', event: 'room', payload: room });
    }
    return room;
  }

  joinRoom(id: string): RaceRoom | undefined {
    const room = this.roomsById.get(id);
    if (!room) return undefined;
    this.room = room;
    if (this.online && this.channel) {
      void this.channel.send({
        type: 'broadcast',
        event: 'join',
        payload: {
          roomId: id,
          id: this.selfId,
          name: this.profile.name,
          birdId: this.profile.birdId,
        },
      });
    } else if (room.simulated && !room.members.some((m) => m.id === this.selfId)) {
      room.members = [...room.members, { id: this.selfId, name: this.profile.name, birdId: this.profile.birdId }];
    }
    return room;
  }

  leaveRoom(): void {
    if (this.room?.hostId === this.selfId) this.roomsById.delete(this.room.id);
    this.room = undefined;
  }

  /** Host only: locks the grid and tells everyone when to go. */
  startRoom(): RaceRoom | undefined {
    if (!this.room || this.room.hostId !== this.selfId) return undefined;
    const room = { ...this.room, startAt: Date.now() + 1500, updatedAt: this.time };
    this.room = room;
    this.roomsById.set(room.id, room);
    if (this.online && this.channel) {
      void this.channel.send({ type: 'broadcast', event: 'room', payload: room });
    }
    this.onStart?.(room);
    return room;
  }

  /** Publishes our bird during a race; throttled to `RACE_INTERVAL`. */
  publishRacer(state: Omit<RacerPacket, 'roomId' | 'id'>, dt: number): void {
    this.time += dt;
    if (!this.online || !this.channel || !this.room) return;
    if (this.time - this.raceAt < RACE_INTERVAL) return;
    this.raceAt = this.time;
    void this.channel.send({
      type: 'broadcast',
      event: 'racer',
      payload: {
        roomId: this.room.id,
        id: this.selfId,
        x: Math.round(state.x * 100) / 100,
        z: Math.round(state.z * 100) / 100,
        yaw: Math.round(state.yaw * 1000) / 1000,
        speed: Math.round(state.speed * 100) / 100,
        lap: state.lap,
        progress: Math.round(state.progress * 10) / 10,
      },
    });
  }

  /**
   * Everyone in our room except us — these become networked racers. Offline
   * there is nobody to send packets, so a simulated room reports no opponents
   * and the grid is filled with AI representatives instead of frozen ghosts.
   */
  roomOpponents(): { id: string; name: string; birdId: string }[] {
    if (!this.online) return [];
    return (this.room?.members ?? []).filter((member) => member.id !== this.selfId);
  }

  private roomPeers(): string[] {
    return Object.keys(this.channel?.presenceState() ?? {}).filter((key) => key !== this.selfId);
  }

  // ── simulated plaza ──────────────────────────────────────────────────────

  private spawnBots(hub: HubWorld): void {
    if (this.opts.simulate === false || this.online) return;
    for (let i = 0; i < 5; i += 1) {
      const angle = this.rng.range(0, Math.PI * 2);
      const radius = this.rng.range(8, PLAZA_RADIUS * 0.7);
      this.bots.push({
        id: `bot_${i}`,
        name: this.rng.pick(BOT_NAMES),
        rank: this.rng.pick(BOT_RANKS),
        birdId: this.rng.pick(BIRD_IDS),
        x: Math.sin(angle) * radius,
        z: Math.cos(angle) * radius,
        yaw: this.rng.range(0, Math.PI * 2),
        goalX: 0,
        goalZ: 0,
        pauseUntil: 0,
      });
    }
    for (const bot of this.bots) this.retarget(bot);
    // Put them in the plaza immediately, so the hub is populated on arrival
    // rather than one frame later.
    this.stepBots(0, hub);

    // A couple of stand-in rooms, clearly marked, so the board is never blank.
    for (let i = 0; i < 2; i += 1) {
      const id = `sim_${i}`;
      this.roomsById.set(id, {
        id,
        hostId: id,
        hostName: this.rng.pick(BOT_NAMES),
        nationId: i === 0 ? 'japan' : 'france',
        challenge: i === 0 ? 'word' : 'listen',
        rivals: 5,
        seed: 4000 + i,
        members: [{ id, name: this.rng.pick(BOT_NAMES), birdId: this.rng.pick(BIRD_IDS) }],
        simulated: true,
        updatedAt: Number.MAX_SAFE_INTEGER,
      });
    }
  }

  private retarget(bot: Bot): void {
    const angle = this.rng.range(0, Math.PI * 2);
    const radius = this.rng.range(6, PLAZA_RADIUS * 0.8);
    bot.goalX = Math.sin(angle) * radius;
    bot.goalZ = Math.cos(angle) * radius;
  }

  private stepBots(dt: number, hub: HubWorld): void {
    for (const bot of this.bots) {
      const dx = bot.goalX - bot.x;
      const dz = bot.goalZ - bot.z;
      const distance = Math.hypot(dx, dz);
      const paused = this.time < bot.pauseUntil;

      if (!paused && distance < 1.5) {
        bot.pauseUntil = this.time + this.rng.range(2, 8);
        this.retarget(bot);
      } else if (!paused) {
        const step = (6.5 * dt) / distance;
        bot.x += dx * step;
        bot.z += dz * step;
        bot.yaw = Math.atan2(dx, dz);
      }

      hub.upsertOther(bot.id, {
        name: bot.name,
        birdId: bot.birdId,
        rank: bot.rank,
        pos: { x: bot.x, z: bot.z },
        yaw: bot.yaw,
        online: false,
        moving: !paused,
      });
    }
  }

  dispose(): void {
    const channel = this.channel;
    this.channel = undefined;
    this.online = false;
    this.room = undefined;
    if (channel) void supabase.removeChannel(channel);
  }
}
