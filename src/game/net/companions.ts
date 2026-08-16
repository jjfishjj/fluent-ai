import type { RealtimeChannel } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '@/integrations/supabase/client';
import { Rng } from '../core/rng';
import { angleDelta, clamp, distance } from '../core/formulas';
import type { ClassId, Vec2 } from '../core/types';
import type { World } from '../core/world';

const BOT_NAMES = [
  '踏雪尋梅',
  '一劍飄零',
  '青衫客',
  '雲深不知',
  '小師妹',
  '醉臥沙場',
  '折竹聽風',
  '不歸人',
  '守拙',
  '南山採藥',
  '鶴歸',
  '天涯過客',
];

const BOT_CHATTER = [
  '有人組隊打樹妖王嗎？',
  '這隻狐狸掉率好低…',
  '收靈芝草，一株 20 銀',
  '新手求帶',
  '峽谷那邊的狼太痛了',
  '終於升到 20 級了！',
  '誰看到我的藥了',
  '洞窟裡真的好暗',
];

const CLASS_POOL: ClassId[] = ['sword', 'talisman', 'archer', 'healer'];

interface Bot {
  id: string;
  name: string;
  classId: ClassId;
  level: number;
  pos: Vec2;
  facing: number;
  goal: Vec2;
  speed: number;
  chatAt: number;
  pauseUntil: number;
}

export interface CompanionStatus {
  mode: 'offline' | 'simulated' | 'online';
  online: number;
}

/**
 * Populates the world with other players.
 *
 * With Supabase configured, real sessions are synchronised through a per-zone
 * realtime channel (presence for the roster, broadcast for movement and chat).
 * Without it — or if the channel fails to subscribe — believable bots wander
 * the zone instead, so the world never feels empty.
 */
export class CompanionDirector {
  private bots: Bot[] = [];
  private rng = new Rng(4242);
  private channel?: RealtimeChannel;
  private zoneId = '';
  private online = false;
  private lastBroadcast = 0;
  private remotes = new Map<string, { lastSeen: number }>();
  readonly selfId = `p_${Math.random().toString(36).slice(2, 9)}`;

  constructor(
    private world: World,
    private opts: { simulate?: boolean } = {},
  ) {}

  get status(): CompanionStatus {
    return {
      mode: this.online ? 'online' : this.bots.length ? 'simulated' : 'offline',
      online: [...this.world.entities.values()].filter((e) => e.kind === 'remote').length,
    };
  }

  /** Called on load and whenever the player changes zone. */
  enterZone(zoneId: string) {
    if (this.zoneId === zoneId) return;
    this.zoneId = zoneId;
    this.clearRemotes();
    this.spawnBots();
    void this.connect(zoneId);
  }

  private clearRemotes() {
    for (const e of [...this.world.entities.values()]) {
      if (e.kind === 'remote') this.world.removeRemote(e.id);
    }
    this.remotes.clear();
    this.bots = [];
  }

  private spawnBots() {
    if (this.opts.simulate === false || this.online) return;
    const zone = this.world.zone;
    const count = zone.safe ? 6 : 4;
    for (let i = 0; i < count; i++) {
      const pos = this.randomPoint();
      this.bots.push({
        id: `bot_${this.zoneId}_${i}`,
        name: this.rng.pick(BOT_NAMES),
        classId: this.rng.pick(CLASS_POOL),
        level: this.rng.int(Math.max(1, this.world.profile.level - 6), this.world.profile.level + 8),
        pos,
        facing: this.rng.range(0, Math.PI * 2),
        goal: this.randomPoint(),
        speed: this.rng.range(3.2, 5.4),
        chatAt: this.world.time + this.rng.range(6, 40),
        pauseUntil: 0,
      });
    }
  }

  private randomPoint(): Vec2 {
    const half = this.world.zone.half * 0.6;
    return { x: this.rng.range(-half, half), z: this.rng.range(-half, half) };
  }

  /** Steps the bots and publishes our own position when online. */
  update(dt: number) {
    const now = this.world.time;

    for (const bot of this.bots) {
      if (now < bot.pauseUntil) {
        this.world.upsertRemote(bot.id, {
          name: bot.name,
          classId: bot.classId,
          pos: bot.pos,
          level: bot.level,
          facing: bot.facing,
        });
        continue;
      }
      const d = distance(bot.pos.x, bot.pos.z, bot.goal.x, bot.goal.z);
      if (d < 1.2) {
        bot.goal = this.randomPoint();
        bot.pauseUntil = now + this.rng.range(1, 5);
      } else {
        const half = this.world.zone.half - 2;
        const step = (bot.speed * dt) / d;
        bot.pos.x = clamp(bot.pos.x + (bot.goal.x - bot.pos.x) * step, -half, half);
        bot.pos.z = clamp(bot.pos.z + (bot.goal.z - bot.pos.z) * step, -half, half);
        const want = Math.atan2(bot.goal.x - bot.pos.x, bot.goal.z - bot.pos.z);
        bot.facing += angleDelta(bot.facing, want) * Math.min(1, dt * 6);
      }

      const e = this.world.upsertRemote(bot.id, {
        name: bot.name,
        classId: bot.classId,
        pos: bot.pos,
        level: bot.level,
        facing: bot.facing,
      });
      e.state = now < bot.pauseUntil ? 'idle' : 'move';

      if (now > bot.chatAt) {
        bot.chatAt = now + this.rng.range(25, 90);
        this.world.say('world', bot.name, this.rng.pick(BOT_CHATTER));
      }
    }

    if (this.online && this.channel && now - this.lastBroadcast > 0.2) {
      this.lastBroadcast = now;
      const p = this.world.player;
      void this.channel.send({
        type: 'broadcast',
        event: 'pos',
        payload: {
          id: this.selfId,
          name: this.world.profile.name,
          classId: this.world.profile.classId,
          level: this.world.profile.level,
          x: Math.round(p.pos.x * 100) / 100,
          z: Math.round(p.pos.z * 100) / 100,
          facing: Math.round(p.facing * 100) / 100,
        },
      });
      // Drop remotes that stopped broadcasting.
      for (const [id, meta] of this.remotes) {
        if (now - meta.lastSeen > 12) {
          this.world.removeRemote(id);
          this.remotes.delete(id);
        }
      }
    }
  }

  /** Sends a chat line to the zone channel (or echoes it locally when offline). */
  sendChat(text: string) {
    const trimmed = text.trim().slice(0, 120);
    if (!trimmed) return;
    this.world.say('world', this.world.profile.name, trimmed);
    if (this.online && this.channel) {
      void this.channel.send({
        type: 'broadcast',
        event: 'chat',
        payload: { id: this.selfId, name: this.world.profile.name, text: trimmed },
      });
    }
  }

  private async connect(zoneId: string) {
    this.disconnectChannel();
    if (!isSupabaseConfigured) return;

    try {
      const channel = supabase.channel(`xianjing:${zoneId}`, {
        config: { presence: { key: this.selfId }, broadcast: { self: false } },
      });

      channel.on('broadcast', { event: 'pos' }, ({ payload }) => {
        const p = payload as {
          id: string;
          name: string;
          classId: ClassId;
          level: number;
          x: number;
          z: number;
          facing: number;
        };
        if (!p?.id || p.id === this.selfId) return;
        this.world.upsertRemote(`net_${p.id}`, {
          name: p.name ?? '俠客',
          classId: p.classId ?? 'sword',
          pos: { x: p.x, z: p.z },
          level: p.level ?? 1,
          facing: p.facing ?? 0,
        });
        this.remotes.set(`net_${p.id}`, { lastSeen: this.world.time });
      });

      channel.on('broadcast', { event: 'chat' }, ({ payload }) => {
        const p = payload as { id: string; name: string; text: string };
        if (!p?.id || p.id === this.selfId) return;
        this.world.say('world', p.name ?? '俠客', String(p.text ?? '').slice(0, 120));
      });

      channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
        for (const presence of leftPresences as { key?: string }[]) {
          const key = presence?.key;
          if (!key) continue;
          this.world.removeRemote(`net_${key}`);
          this.remotes.delete(`net_${key}`);
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

      await channel.track({
        name: this.world.profile.name,
        level: this.world.profile.level,
        classId: this.world.profile.classId,
      });

      this.channel = channel;
      this.online = true;
      // Real players are in the zone now — retire the stand-ins.
      for (const bot of this.bots) this.world.removeRemote(bot.id);
      this.bots = [];
      this.world.say('system', '系統', `已連線到 ${this.world.zone.name} 頻道`);
    } catch {
      // Realtime is optional; the simulated crowd keeps the zone alive.
      this.online = false;
    }
  }

  private disconnectChannel() {
    if (!this.channel) return;
    const channel = this.channel;
    this.channel = undefined;
    this.online = false;
    void supabase.removeChannel(channel);
  }

  dispose() {
    this.disconnectChannel();
    this.clearRemotes();
  }
}
