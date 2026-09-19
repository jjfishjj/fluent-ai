import { XIANXIA_PACK } from '../data/xianxia-pack';
import { ContentPack, classOf, itemOf, monsterOf, questOf, skillOf, zoneOf } from './content';
import {
  MAX_LEVEL,
  STAT_POINTS_PER_LEVEL,
  angleDelta,
  clamp,
  deriveStats,
  distance,
  expReward,
  expToNext,
  maxHpFor,
  maxSpFor,
  rollDamage,
  silverReward,
  statCost,
} from './formulas';
import {
  ActiveAid,
  AnswerOutcome,
  EncounterQuestion,
  EncounterState,
  QuestionContext,
  QuestionSource,
  SWIFT_WINDOW,
  applyAid,
  phaseAt,
  resolveAnswer,
  shuffleOptions,
} from './encounter';
import { Rng } from './rng';
import { blockers, terrainHeight } from './terrain';
import type {
  ChatChannel,
  ChatLine,
  Derived,
  Element,
  EncounterHud,
  Entity,
  GameEvent,
  HudSnapshot,
  PlayerProfile,
  QuestState,
  SkillDef,
  Stats,
  Vec2,
  ZoneDef,
} from './types';

export const MAX_SKILL_LEVEL = 5;

/** Distance at which dropped loot is vacuumed up. */
const PICKUP_RANGE = 2.0;
const DROP_LIFETIME = 45;
const MONSTER_RESPAWN = 14;
const BOSS_RESPAWN = 90;
/** Seconds after the last hit before out-of-combat regeneration kicks in. */
const COMBAT_TAG = 6;

export interface Drop {
  id: string;
  itemId?: string;
  qty: number;
  silver?: number;
  pos: Vec2;
  y: number;
  bornAt: number;
  until: number;
}

export interface CastFx {
  id: string;
  skillId: string;
  from: Vec2;
  to: Vec2;
  bornAt: number;
  ttl: number;
  radius: number;
  color: number;
  kind: SkillDef['kind'];
}

export interface WorldOptions {
  seed?: number;
  /** Injected so tests can drive time deterministically. */
  now?: () => number;
  /** Campaign content; defaults to the 仙境 pack. */
  pack?: ContentPack;
  /** Supplies encounter questions in turn-based packs. */
  questions?: QuestionSource;
  /** Called after every answer so the SRS schedule can be updated. */
  onAnswer?: (question: EncounterQuestion, correct: boolean) => void;
}

let uid = 0;
const nextId = (prefix: string) => `${prefix}_${(uid++).toString(36)}`;

export function newProfile(
  name: string,
  classId: PlayerProfile['classId'],
  pack: ContentPack = XIANXIA_PACK,
): PlayerProfile {
  const cls = classOf(pack, classId);
  return {
    name,
    classId,
    level: 1,
    exp: 0,
    statPoints: 0,
    skillPoints: 1,
    stats: { ...cls.baseStats },
    silver: pack.startingSilver,
    inventory: pack.startingKit.map((s) => ({ ...s })),
    equipment: {},
    learned: { [cls.skills[0]]: 1 },
    quests: [],
    kills: {},
    zone: pack.start.zone,
    pos: { ...pack.start.pos },
  };
}

/**
 * The authoritative game simulation. Pure TypeScript — no rendering, no DOM —
 * so it can be stepped in tests with a fixed seed and a fake clock.
 */
export class World {
  readonly pack: ContentPack;
  profile: PlayerProfile;
  zone: ZoneDef;
  entities = new Map<string, Entity>();
  drops: Drop[] = [];
  casts: CastFx[] = [];
  events: GameEvent[] = [];
  chat: ChatLine[] = [];
  time = 0;
  playerId = 'player';
  /** Cooldown expiry times keyed by skill id. */
  cooldowns: Record<string, number> = {};
  /** Player-issued keyboard direction, normalised. */
  moveInput: Vec2 = { x: 0, z: 0 };
  autoAttack = true;
  paused = false;
  respawnAt = 0;
  /** Active turn-based exchange; the realtime sim is frozen while set. */
  encounter?: EncounterState;
  private questions?: QuestionSource;
  private onAnswer?: (question: EncounterQuestion, correct: boolean) => void;
  private rng: Rng;
  private chatSeq = 0;
  private lastCombatAt = -999;
  private regenTimer = 0;
  private zoneCooldown = 0;

  constructor(profile: PlayerProfile, opts: WorldOptions = {}) {
    this.pack = opts.pack ?? XIANXIA_PACK;
    this.questions = opts.questions;
    this.onAnswer = opts.onAnswer;
    this.profile = profile;
    this.rng = new Rng(opts.seed ?? 20260809);
    this.zone = zoneOf(this.pack, profile.zone);
    this.spawnPlayer();
    this.loadZone(profile.zone, profile.pos, true);
  }

  // ── entity helpers ────────────────────────────────────────────────────

  get player(): Entity {
    return this.entities.get(this.playerId)!;
  }

  entity(id?: string): Entity | undefined {
    return id ? this.entities.get(id) : undefined;
  }

  get target(): Entity | undefined {
    return this.entity(this.player.targetId);
  }

  monsters(): Entity[] {
    const out: Entity[] = [];
    for (const e of this.entities.values()) if (e.kind === 'monster') out.push(e);
    return out;
  }

  private spawnPlayer() {
    const cls = classOf(this.pack, this.profile.classId);
    const gear = this.gearBonus();
    const maxHp = maxHpFor(cls, this.profile.level, this.profile.stats, gear.def);
    const maxSp = maxSpFor(cls, this.profile.level, this.profile.stats);
    const d = deriveStats(cls, this.profile.level, this.profile.stats, gear);
    this.entities.set(this.playerId, {
      id: this.playerId,
      kind: 'player',
      name: this.profile.name,
      pos: { ...this.profile.pos },
      facing: 0,
      hp: maxHp,
      maxHp,
      sp: maxSp,
      maxSp,
      level: this.profile.level,
      state: 'idle',
      attackCd: 0,
      actionTimer: 0,
      radius: 0.5,
      speed: d.moveSpeed,
      attackRange: cls.attackRange,
      attackSpeed: d.aspd,
      element: 'neutral',
      buffs: [],
      classId: this.profile.classId,
    });
  }

  // ── zone management ───────────────────────────────────────────────────

  loadZone(zoneId: string, at?: Vec2, silent = false) {
    const zone = zoneOf(this.pack, zoneId);
    this.zone = zone;
    this.profile.zone = zone.id;

    // Keep the player and any remote players; everything else is rebuilt.
    for (const [id, e] of [...this.entities]) {
      if (e.kind === 'monster' || e.kind === 'npc') this.entities.delete(id);
    }
    this.drops = [];
    this.casts = [];

    for (const npc of zone.npcs) {
      this.entities.set(`npc_${zone.id}_${npc.id}`, {
        id: `npc_${zone.id}_${npc.id}`,
        kind: 'npc',
        name: npc.name,
        pos: { ...npc.at },
        facing: Math.PI,
        hp: 1,
        maxHp: 1,
        sp: 0,
        maxSp: 0,
        level: 1,
        state: 'idle',
        attackCd: 0,
        actionTimer: 0,
        radius: 0.6,
        speed: 0,
        attackRange: 0,
        attackSpeed: 0,
        element: 'holy',
        buffs: [],
        npcId: npc.id,
      });
    }

    for (const rule of zone.spawns) {
      for (let i = 0; i < rule.count; i++) {
        const angle = this.rng.range(0, Math.PI * 2);
        const dist = rule.spread * Math.sqrt(this.rng.next());
        const pos = {
          x: clamp(rule.at.x + Math.cos(angle) * dist, -zone.half + 2, zone.half - 2),
          z: clamp(rule.at.z + Math.sin(angle) * dist, -zone.half + 2, zone.half - 2),
        };
        this.spawnMonster(rule.monsterId, pos);
      }
    }

    const p = this.player;
    if (at) p.pos = { ...at };
    p.targetId = undefined;
    p.moveTarget = undefined;
    this.zoneCooldown = 1.2;
    this.profile.pos = { ...p.pos };
    if (!silent) {
      this.events.push({ type: 'zone', zoneId: zone.id });
      this.say('system', '系統', `進入 ${zone.name} — ${zone.subtitle}`);
    }
  }

  private spawnMonster(monsterId: string, pos: Vec2) {
    const def = monsterOf(this.pack, monsterId);
    if (!def) return;
    const id = nextId('mob');
    this.entities.set(id, {
      id,
      kind: 'monster',
      name: def.name,
      pos: { ...pos },
      facing: this.rng.range(0, Math.PI * 2),
      hp: def.hp,
      maxHp: def.hp,
      sp: 0,
      maxSp: 0,
      level: def.level,
      state: 'idle',
      attackCd: 0,
      actionTimer: 0,
      radius: def.size,
      speed: def.speed,
      attackRange: def.attackRange,
      attackSpeed: def.attackSpeed,
      element: def.element,
      buffs: [],
      monsterId,
      spawn: { ...pos },
      aggroRange: def.aggroRange,
      leash: def.boss ? 34 : 22,
      boss: def.boss,
    });
  }

  // ── player commands ───────────────────────────────────────────────────

  moveTo(pos: Vec2) {
    const p = this.player;
    if (p.state === 'dead') return;
    p.moveTarget = { ...pos };
  }

  setMoveInput(x: number, z: number) {
    const len = Math.hypot(x, z);
    this.moveInput = len > 0 ? { x: x / len, z: z / len } : { x: 0, z: 0 };
    if (len > 0) this.player.moveTarget = undefined;
  }

  setTarget(id?: string) {
    const e = this.entity(id);
    if (id && (!e || e.kind === 'npc' || e.state === 'dead')) return;
    this.player.targetId = id;
  }

  /** Pick the nearest living monster in front of the player — the Tab key. */
  cycleTarget() {
    const p = this.player;
    const mobs = this.monsters()
      .filter((m) => m.state !== 'dead' && distance(p.pos.x, p.pos.z, m.pos.x, m.pos.z) < 26)
      .sort(
        (a, b) =>
          distance(p.pos.x, p.pos.z, a.pos.x, a.pos.z) - distance(p.pos.x, p.pos.z, b.pos.x, b.pos.z),
      );
    if (!mobs.length) return;
    const idx = mobs.findIndex((m) => m.id === p.targetId);
    p.targetId = mobs[(idx + 1) % mobs.length].id;
  }

  /** Effective skill definition at the player's learned level. */
  skillAt(skillId: string): (SkillDef & { power: number; spCost: number; skillLevel: number }) | undefined {
    const def = skillOf(this.pack, skillId);
    if (!def) return undefined;
    const lvl = this.profile.learned[skillId] ?? 0;
    if (lvl <= 0) return undefined;
    return {
      ...def,
      skillLevel: lvl,
      power: Math.round(def.power * (1 + (lvl - 1) * 0.18)),
      spCost: Math.round(def.spCost * (1 + (lvl - 1) * 0.12)),
    };
  }

  canCast(skillId: string): boolean {
    const s = this.skillAt(skillId);
    if (!s) return false;
    const p = this.player;
    return p.state !== 'dead' && p.sp >= s.spCost && (this.cooldowns[skillId] ?? 0) <= this.time;
  }

  /**
   * Cast a skill. `aim` is the ground point under the cursor and is only used
   * by area skills when nothing is targeted.
   */
  castSkill(skillId: string, aim?: Vec2): boolean {
    const s = this.skillAt(skillId);
    const p = this.player;
    if (!s || p.state === 'dead') return false;
    if ((this.cooldowns[skillId] ?? 0) > this.time) return false;
    if (p.sp < s.spCost) {
      this.say('system', '系統', '靈力不足');
      return false;
    }

    const target = this.target;
    const needsTarget = s.kind === 'melee' || s.kind === 'ranged' || s.kind === 'dash';
    if (needsTarget) {
      if (!target || target.state === 'dead') {
        this.say('system', '系統', '需要先選定目標');
        return false;
      }
      const d = distance(p.pos.x, p.pos.z, target.pos.x, target.pos.z) - target.radius;
      if (d > s.range) {
        this.say('system', '系統', '距離太遠');
        return false;
      }
    }

    p.sp -= s.spCost;
    this.cooldowns[skillId] = this.time + s.cooldown;
    p.actionTimer = 0.45;
    p.state = 'cast';

    const derived = this.derived();
    const atk = s.magic ? derived.matk : derived.atk;
    const center: Vec2 = target ? { ...target.pos } : aim ? { ...aim } : { ...p.pos };
    if (target) p.facing = Math.atan2(target.pos.x - p.pos.x, target.pos.z - p.pos.z);

    switch (s.kind) {
      case 'melee':
      case 'ranged': {
        this.hitEntity(target!, atk, s.power, s.element, s.hits ?? 1);
        break;
      }
      case 'dash': {
        // Land just short of the target, then strike.
        const dx = target!.pos.x - p.pos.x;
        const dz = target!.pos.z - p.pos.z;
        const len = Math.hypot(dx, dz) || 1;
        const stop = Math.max(0.1, len - (target!.radius + p.radius + 0.4));
        p.pos.x += (dx / len) * stop;
        p.pos.z += (dz / len) * stop;
        p.moveTarget = undefined;
        this.hitEntity(target!, atk, s.power, s.element, s.hits ?? 1);
        break;
      }
      case 'aoe': {
        const origin = s.range > 0 ? center : { ...p.pos };
        const radius = s.radius ?? 4;
        for (const m of this.monsters()) {
          if (m.state === 'dead') continue;
          if (distance(origin.x, origin.z, m.pos.x, m.pos.z) - m.radius > radius) continue;
          this.hitEntity(m, atk, s.power, s.element, s.hits ?? 1);
        }
        if (skillId === 'sanctuary') this.healPlayer(Math.round(atk * 1.2));
        this.pushCast(s, p.pos, origin, radius);
        return true;
      }
      case 'heal': {
        this.healPlayer(Math.round((atk * s.power) / 100));
        break;
      }
      case 'buff': {
        if (s.buff) {
          p.buffs = p.buffs.filter((b) => b.id !== s.id);
          p.buffs.push({
            id: s.id,
            name: s.name,
            until: this.time + (s.duration ?? 15),
            ...s.buff,
          });
        }
        break;
      }
    }

    this.pushCast(s, p.pos, center, s.radius ?? 0);
    return true;
  }

  private pushCast(s: SkillDef, from: Vec2, to: Vec2, radius: number) {
    this.casts.push({
      id: nextId('fx'),
      skillId: s.id,
      from: { ...from },
      to: { ...to },
      bornAt: this.time,
      ttl: s.kind === 'buff' || s.kind === 'heal' ? 1.0 : 0.75,
      radius,
      color: s.fx,
      kind: s.kind,
    });
    this.events.push({ type: 'skill', casterId: this.playerId, skillId: s.id, target: { ...to } });
  }

  useItem(itemId: string): boolean {
    const def = itemOf(this.pack, itemId);
    const slot = this.profile.inventory.find((s) => s.itemId === itemId);
    if (!def || !slot || slot.qty <= 0) return false;
    if (def.kind !== 'consumable') return this.equip(itemId);
    const p = this.player;
    if (p.state === 'dead') return false;
    if (def.healHp) this.healPlayer(def.healHp);
    if (def.healSp) {
      p.sp = Math.min(p.maxSp, p.sp + def.healSp);
    }
    slot.qty -= 1;
    if (slot.qty <= 0) this.profile.inventory = this.profile.inventory.filter((s) => s !== slot);
    return true;
  }

  equip(itemId: string): boolean {
    const def = itemOf(this.pack, itemId);
    if (!def) return false;
    if (def.kind !== 'weapon' && def.kind !== 'armor' && def.kind !== 'accessory') return false;
    const eq = this.profile.equipment;
    const prev = eq[def.kind];
    if (prev === itemId) {
      eq[def.kind] = undefined;
      this.addItem(itemId, 1);
    } else {
      if (!this.removeItem(itemId, 1)) return false;
      if (prev) this.addItem(prev, 1);
      eq[def.kind] = itemId;
    }
    this.recalcPlayer(true);
    return true;
  }

  spendStatPoint(stat: keyof Stats): boolean {
    const cost = statCost(this.profile.stats[stat]);
    if (this.profile.statPoints < cost) return false;
    this.profile.statPoints -= cost;
    this.profile.stats[stat] += 1;
    this.recalcPlayer(true);
    return true;
  }

  learnSkill(skillId: string): boolean {
    const def = skillOf(this.pack, skillId);
    if (!def) return false;
    const cls = classOf(this.pack, this.profile.classId);
    if (!cls.skills.includes(skillId)) return false;
    if (this.profile.level < def.reqLevel) return false;
    const lvl = this.profile.learned[skillId] ?? 0;
    if (lvl >= MAX_SKILL_LEVEL) return false;
    if (this.profile.skillPoints < 1) return false;
    this.profile.skillPoints -= 1;
    this.profile.learned[skillId] = lvl + 1;
    this.say('system', '系統', `習得 ${def.name} Lv.${lvl + 1}`);
    return true;
  }

  acceptQuest(questId: string): boolean {
    const def = questOf(this.pack, questId);
    if (!def) return false;
    if (this.profile.level < def.reqLevel) {
      this.say('system', '系統', `需要 Lv.${def.reqLevel} 才能接取此任務`);
      return false;
    }
    if (this.profile.quests.some((q) => q.id === questId)) return false;
    const state: QuestState = { id: questId, status: 'active', progress: 0 };
    // Collect quests count what is already in the bag.
    if (def.kind === 'collect') state.progress = this.itemCount(def.target);
    if (state.progress >= def.count) state.status = 'complete';
    this.profile.quests.push(state);
    this.events.push({ type: 'quest', questId, status: state.status });
    this.say('system', '任務', `接受任務：${def.name}`);
    return true;
  }

  completeQuest(questId: string): boolean {
    const def = questOf(this.pack, questId);
    const state = this.profile.quests.find((q) => q.id === questId);
    if (!def || !state || state.status !== 'complete') return false;
    if (def.kind === 'collect' && !this.removeItem(def.target, def.count)) return false;
    state.status = 'done';
    this.gainExp(def.reward.exp);
    this.profile.silver += def.reward.silver;
    this.events.push({ type: 'silver', amount: def.reward.silver });
    for (const it of def.reward.items ?? []) this.addItem(it.itemId, it.qty);
    this.events.push({ type: 'quest', questId, status: 'done' });
    this.say('system', '任務', `完成任務：${def.name}`);
    if (def.next) {
      const nd = questOf(this.pack, def.next);
      if (nd && this.profile.level >= nd.reqLevel) this.acceptQuest(def.next);
    }
    return true;
  }

  /** Talk to the NPC the player is standing next to. */
  interact(): { npcId: string; name: string; lines: string[] } | undefined {
    const p = this.player;
    for (const e of this.entities.values()) {
      if (e.kind !== 'npc') continue;
      if (distance(p.pos.x, p.pos.z, e.pos.x, e.pos.z) > 3.5) continue;
      const def = this.zone.npcs.find((n) => n.id === e.npcId);
      if (!def) continue;
      return { npcId: def.id, name: def.name, lines: def.lines };
    }
    return undefined;
  }

  // ── turn-based encounters ─────────────────────────────────────────────

  /**
   * Opens a question exchange with an obstacle. Returns false when the pack is
   * realtime, the source has no questions left, or one is already running.
   */
  startEncounter(enemyId: string): boolean {
    if (!this.pack.turnBased || this.encounter) return false;
    const enemy = this.entity(enemyId);
    if (!enemy || enemy.kind !== 'monster' || enemy.state === 'dead') return false;
    const question = this.questions?.(0, this.questionContext());
    if (!question) return false;

    const p = this.player;
    p.moveTarget = undefined;
    p.targetId = enemy.id;
    this.moveInput = { x: 0, z: 0 };
    p.facing = Math.atan2(enemy.pos.x - p.pos.x, enemy.pos.z - p.pos.z);

    this.encounter = {
      enemyId: enemy.id,
      enemyName: enemy.name,
      enemyLevel: enemy.level,
      enemyElement: enemy.element,
      index: 0,
      question,
      options: shuffleOptions(question.options, () => this.rng.next()),
      hintRevealed: false,
      streak: 0,
      correct: 0,
      wrong: 0,
      aids: [],
      askedAt: this.time,
      phase: 0,
      stage: monsterOf(this.pack, enemy.monsterId)?.phases?.[0],
    };
    const opening = this.encounter.stage;
    this.say('system', '遭遇', `${enemy.name} 擋住了去路。`);
    if (opening) this.say('system', enemy.name, `【${opening.name}】${opening.line}`);
    return true;
  }

  private questionContext(): QuestionContext {
    const enc = this.encounter;
    const def = enc ? monsterOf(this.pack, this.entity(enc.enemyId)?.monsterId) : undefined;
    // A boss stage narrows the topic further than the obstacle's own bias.
    const stageTopic = enc?.stage?.topic;
    return {
      language: this.zone.language ?? this.pack.language ?? 'english',
      level: this.profile.level,
      topics: stageTopic ? [stageTopic] : def?.topics,
    };
  }

  /** Answers the current question and advances or ends the encounter. */
  answerEncounter(chosen: string): AnswerOutcome | undefined {
    const enc = this.encounter;
    if (!enc || enc.outcome) return undefined;
    const enemy = this.entity(enc.enemyId);
    if (!enemy) {
      this.encounter = undefined;
      return undefined;
    }

    const def = monsterOf(this.pack, enemy.monsterId);
    const d = this.derived();
    const outcome = resolveAnswer({
      chosen,
      question: enc.question,
      power: d.matk + d.atk * 0.35,
      enemyAtk: def?.atk ?? 10,
      defense: d.def,
      streak: enc.streak,
      elapsed: this.time - enc.askedAt,
      aids: enc.aids,
      swiftWindow: enc.stage?.swiftWindow,
      pressure: enc.stage?.pressure,
    });

    this.onAnswer?.(enc.question, outcome.correct);
    enc.lastResult = outcome;
    enc.streak = outcome.streak;
    // Aids that act on an answer are spent whether or not they were needed.
    enc.aids = enc.aids.filter((a) => a.effect !== 'amplify' && a.effect !== 'shield');

    if (outcome.correct) {
      enc.correct += 1;
      enemy.hp -= outcome.damage;
      enemy.flash = 0.18;
      this.events.push({
        type: 'damage',
        targetId: enemy.id,
        amount: outcome.damage,
        crit: outcome.swift || outcome.amplified,
        element: 'holy',
        fromPlayer: true,
      });
    } else {
      enc.wrong += 1;
      if (outcome.backlash > 0) {
        const p = this.player;
        p.hp -= outcome.backlash;
        p.flash = 0.18;
        this.events.push({
          type: 'damage',
          targetId: p.id,
          amount: outcome.backlash,
          crit: false,
          element: enemy.element,
          fromPlayer: false,
        });
      }
    }
    this.lastCombatAt = this.time;

    // A boss moves through its interview stages as its resolve drops.
    if (def?.phases?.length && enemy.hp > 0) {
      const next = phaseAt(def.phases, enemy.hp / enemy.maxHp);
      if (next > enc.phase) {
        enc.phase = next;
        enc.stage = def.phases[next];
        outcome.phaseAdvanced = enc.stage;
        // Techniques queued for the next answer do not survive a stage change.
        if (enc.stage.sealAids) enc.aids = [];
        this.say('system', enemy.name, `【${enc.stage.name}】${enc.stage.line}`);
      }
    }

    if (enemy.hp <= 0) {
      this.killMonster(enemy);
      enc.outcome = 'win';
      this.say('system', '遭遇', `溝通成功，${enemy.name} 消散了。`);
      return outcome;
    }
    if (this.player.hp <= 0) {
      enc.outcome = 'lose';
      this.killPlayer();
      return outcome;
    }
    return outcome;
  }

  /** Moves on to the next question after the player has read the result. */
  nextQuestion(): boolean {
    const enc = this.encounter;
    if (!enc || enc.outcome) return false;
    const question = this.questions?.(enc.index + 1, this.questionContext());
    if (!question) {
      // Out of material — let the player disengage rather than soft-lock.
      enc.outcome = 'flee';
      this.say('system', '遭遇', '沒有可用的記憶卡了，先撤退吧。');
      return false;
    }
    enc.index += 1;
    enc.question = question;
    enc.options = shuffleOptions(question.options, () => this.rng.next());
    enc.hintRevealed = false;
    enc.lastResult = undefined;
    enc.askedAt = this.time;
    return true;
  }

  /** Spends SP to apply a memory technique to the exchange. */
  useAid(skillId: string): boolean {
    const enc = this.encounter;
    const skill = this.skillAt(skillId);
    if (!enc || enc.outcome || !skill || skill.kind !== 'aid' || !skill.aidEffect) return false;
    if (enc.stage?.sealAids) {
      this.say('system', '系統', '對方步步進逼，這個階段用不了記憶技法。');
      return false;
    }
    if ((this.cooldowns[skillId] ?? 0) > this.time) return false;
    if (this.player.sp < skill.spCost) {
      this.say('system', '系統', '專注力不足');
      return false;
    }
    // Only one copy of a given technique may be queued at a time.
    if (enc.aids.some((a) => a.skillId === skillId)) return false;

    this.player.sp -= skill.spCost;
    this.cooldowns[skillId] = this.time + skill.cooldown;

    if (skill.aidEffect === 'skip') {
      this.say('system', '遭遇', `${skill.name}：跳過這題。`);
      this.nextQuestion();
      return true;
    }

    const aid: ActiveAid = { skillId, effect: skill.aidEffect, label: skill.name };
    const applied = applyAid(enc, skill.aidEffect, (n) => this.rng.int(0, n - 1));
    enc.options = applied.options;
    enc.hintRevealed = applied.hintRevealed;
    if (skill.aidEffect === 'amplify' || skill.aidEffect === 'shield') enc.aids.push(aid);
    this.say('system', '遭遇', `施展 ${skill.name}`);
    return true;
  }

  /** Backs out of an encounter, losing the streak and a little ground. */
  fleeEncounter() {
    const enc = this.encounter;
    if (!enc) return;
    enc.outcome = enc.outcome ?? 'flee';
    this.closeEncounter();
  }

  /** Clears the encounter and returns control to the realtime world. */
  closeEncounter() {
    const enc = this.encounter;
    if (!enc) return;
    const enemy = this.entity(enc.enemyId);
    if (enc.outcome === 'flee' && enemy && enemy.state !== 'dead') {
      // Step back so contact does not immediately re-trigger.
      const p = this.player;
      const dx = p.pos.x - enemy.pos.x;
      const dz = p.pos.z - enemy.pos.z;
      const len = Math.hypot(dx, dz) || 1;
      // Must clear the contact radius, otherwise the next tick walks straight
      // back into the same exchange. Passive barriers have no aggro range, so
      // the contact distance — not aggro — is what sets the floor here.
      const push = Math.max(
        enemy.radius + enemy.attackRange + 2.5,
        (enemy.aggroRange ?? 0) + 2,
      );
      p.pos.x = clamp(enemy.pos.x + (dx / len) * push, -this.zone.half + 2, this.zone.half - 2);
      p.pos.z = clamp(enemy.pos.z + (dz / len) * push, -this.zone.half + 2, this.zone.half - 2);
      enemy.targetId = undefined;
    }
    this.player.targetId = undefined;
    this.encounter = undefined;
  }

  /** Used by the village healer NPC. */
  fullRestore() {
    const p = this.player;
    if (p.state === 'dead') return;
    this.healPlayer(p.maxHp - p.hp);
    p.sp = p.maxSp;
  }

  respawn() {
    const p = this.player;
    if (p.state !== 'dead') return;
    this.loadZone('qingyun', { x: 0, z: -4 });
    this.recalcPlayer(true);
    p.state = 'idle';
    p.hp = p.maxHp;
    p.sp = p.maxSp;
    p.targetId = undefined;
    this.events.push({ type: 'respawn' });
    this.say('system', '系統', '你在青雲村醒來。');
  }

  // ── inventory ─────────────────────────────────────────────────────────

  itemCount(itemId: string): number {
    return this.profile.inventory.find((s) => s.itemId === itemId)?.qty ?? 0;
  }

  addItem(itemId: string, qty = 1) {
    if (!this.pack.items[itemId]) return;
    const slot = this.profile.inventory.find((s) => s.itemId === itemId);
    if (slot) slot.qty += qty;
    else this.profile.inventory.push({ itemId, qty });
    this.bumpCollectQuests(itemId);
  }

  removeItem(itemId: string, qty = 1): boolean {
    const slot = this.profile.inventory.find((s) => s.itemId === itemId);
    if (!slot || slot.qty < qty) return false;
    slot.qty -= qty;
    if (slot.qty <= 0) this.profile.inventory = this.profile.inventory.filter((s) => s !== slot);
    return true;
  }

  buy(itemId: string): boolean {
    const def = itemOf(this.pack, itemId);
    if (!def || this.profile.silver < def.price) return false;
    this.profile.silver -= def.price;
    this.addItem(itemId, 1);
    return true;
  }

  sell(itemId: string): boolean {
    const def = itemOf(this.pack, itemId);
    if (!def || !this.removeItem(itemId, 1)) return false;
    const gain = Math.max(1, Math.floor(def.price * 0.4));
    this.profile.silver += gain;
    return true;
  }

  // ── progression ───────────────────────────────────────────────────────

  gearBonus() {
    const eq = this.profile.equipment;
    const sum = { atk: 0, matk: 0, def: 0 };
    for (const id of [eq.weapon, eq.armor, eq.accessory]) {
      const d = id ? itemOf(this.pack, id) : undefined;
      if (!d) continue;
      sum.atk += d.atk ?? 0;
      sum.matk += d.matk ?? 0;
      sum.def += d.def ?? 0;
    }
    return sum;
  }

  derived(): Derived {
    const cls = classOf(this.pack, this.profile.classId);
    const d = deriveStats(cls, this.profile.level, this.profile.stats, this.gearBonus());
    const p = this.player;
    for (const b of p.buffs) {
      d.atk += b.atk ?? 0;
      d.matk += Math.round((b.atk ?? 0) * 0.8);
      d.def += b.def ?? 0;
      d.moveSpeed += b.speed ?? 0;
      d.aspd += b.aspd ?? 0;
    }
    return d;
  }

  /** Recompute pools after a stat/gear/level change. `heal` refills them. */
  recalcPlayer(keepRatio = false) {
    const cls = classOf(this.pack, this.profile.classId);
    const p = this.player;
    const gear = this.gearBonus();
    const hpRatio = p.maxHp > 0 ? p.hp / p.maxHp : 1;
    const spRatio = p.maxSp > 0 ? p.sp / p.maxSp : 1;
    p.maxHp = maxHpFor(cls, this.profile.level, this.profile.stats, gear.def);
    p.maxSp = maxSpFor(cls, this.profile.level, this.profile.stats);
    p.level = this.profile.level;
    const d = this.derived();
    p.speed = d.moveSpeed;
    p.attackSpeed = d.aspd;
    p.attackRange = cls.attackRange;
    if (keepRatio) {
      p.hp = Math.max(1, Math.round(p.maxHp * hpRatio));
      p.sp = Math.round(p.maxSp * spRatio);
    }
  }

  gainExp(amount: number) {
    if (this.profile.level >= MAX_LEVEL) return;
    this.profile.exp += amount;
    this.events.push({ type: 'exp', amount });
    let need = expToNext(this.profile.level);
    while (this.profile.exp >= need && this.profile.level < MAX_LEVEL) {
      this.profile.exp -= need;
      this.profile.level += 1;
      this.profile.statPoints += STAT_POINTS_PER_LEVEL;
      this.profile.skillPoints += 1;
      this.recalcPlayer(false);
      const p = this.player;
      p.hp = p.maxHp;
      p.sp = p.maxSp;
      this.events.push({ type: 'levelup', level: this.profile.level });
      this.say('system', '系統', `升級了！等級 ${this.profile.level}`);
      need = expToNext(this.profile.level);
    }
    if (this.profile.level >= MAX_LEVEL) this.profile.exp = 0;
  }

  // ── combat ────────────────────────────────────────────────────────────

  private healPlayer(amount: number) {
    const p = this.player;
    const healed = Math.min(amount, p.maxHp - p.hp);
    if (healed <= 0) return;
    p.hp += healed;
    this.events.push({ type: 'heal', targetId: p.id, amount: healed });
  }

  private hitEntity(target: Entity, atk: number, power: number, element: Element, hits: number) {
    if (target.state === 'dead') return;
    const def = target.monsterId ? monsterOf(this.pack, target.monsterId) : undefined;
    const d = this.derived();
    for (let i = 0; i < hits; i++) {
      const result = rollDamage({
        atk,
        power: power / hits,
        defense: def?.def ?? 0,
        attackElement: element,
        defenseElement: target.element,
        crit: d.crit,
        hit: d.hit,
        flee: 40 + target.level * 1.4,
        roll: () => this.rng.next(),
      });
      if (result.miss) {
        this.events.push({ type: 'miss', targetId: target.id });
        continue;
      }
      target.hp -= result.amount;
      target.flash = 0.18;
      this.events.push({
        type: 'damage',
        targetId: target.id,
        amount: result.amount,
        crit: result.crit,
        element,
        fromPlayer: true,
      });
    }
    this.lastCombatAt = this.time;
    // Aggro the monster and anything close to it.
    if (target.kind === 'monster') {
      target.targetId = this.playerId;
      if (target.hp <= 0) this.killMonster(target);
    }
  }

  private killMonster(m: Entity) {
    m.hp = 0;
    m.state = 'dead';
    m.targetId = undefined;
    m.moveTarget = undefined;
    const def = m.monsterId ? monsterOf(this.pack, m.monsterId) : undefined;
    m.respawnAt = this.time + (def?.boss ? BOSS_RESPAWN : MONSTER_RESPAWN);
    this.events.push({ type: 'death', entityId: m.id, monsterId: m.monsterId, boss: m.boss });
    if (!def) return;

    this.profile.kills[def.id] = (this.profile.kills[def.id] ?? 0) + 1;
    this.gainExp(expReward(def.exp, this.profile.level, def.level));

    const silver = silverReward(def.level, () => this.rng.next());
    this.spawnDrop(m.pos, { silver });
    for (const d of def.drops) {
      if (!this.rng.chance(d.chance)) continue;
      const qty = d.min && d.max ? this.rng.int(d.min, d.max) : 1;
      this.spawnDrop(m.pos, { itemId: d.itemId, qty });
    }
    this.bumpKillQuests(def.id);
    if (def.boss) this.say('world', '系統', `${this.profile.name} 討伐了 ${def.name}！`);
  }

  private spawnDrop(at: Vec2, payload: { itemId?: string; qty?: number; silver?: number }) {
    const pos = {
      x: at.x + this.rng.range(-1.2, 1.2),
      z: at.z + this.rng.range(-1.2, 1.2),
    };
    this.drops.push({
      id: nextId('drop'),
      itemId: payload.itemId,
      qty: payload.qty ?? 1,
      silver: payload.silver,
      pos,
      y: terrainHeight(this.zone, pos.x, pos.z),
      bornAt: this.time,
      until: this.time + DROP_LIFETIME,
    });
  }

  private bumpKillQuests(monsterId: string) {
    for (const q of this.profile.quests) {
      if (q.status !== 'active') continue;
      const def = this.pack.quests[q.id];
      if (!def || def.kind !== 'kill' || def.target !== monsterId) continue;
      q.progress = Math.min(def.count, q.progress + 1);
      if (q.progress >= def.count) {
        q.status = 'complete';
        this.events.push({ type: 'quest', questId: q.id, status: 'complete' });
        this.say('system', '任務', `${def.name} 目標已達成，回去覆命吧。`);
      }
    }
  }

  private bumpCollectQuests(itemId: string) {
    for (const q of this.profile.quests) {
      if (q.status !== 'active') continue;
      const def = this.pack.quests[q.id];
      if (!def || def.kind !== 'collect' || def.target !== itemId) continue;
      q.progress = Math.min(def.count, this.itemCount(itemId));
      if (q.progress >= def.count) {
        q.status = 'complete';
        this.events.push({ type: 'quest', questId: q.id, status: 'complete' });
        this.say('system', '任務', `${def.name} 材料已備齊。`);
      }
    }
  }

  private monsterAttack(m: Entity, p: Entity) {
    const def = m.monsterId ? monsterOf(this.pack, m.monsterId) : undefined;
    if (!def) return;
    const d = this.derived();
    const result = rollDamage({
      atk: def.atk,
      power: 100,
      defense: d.def,
      attackElement: def.element,
      defenseElement: 'neutral',
      crit: 5,
      hit: 80 + def.level * 1.5,
      flee: d.flee,
      roll: () => this.rng.next(),
    });
    if (result.miss) {
      this.events.push({ type: 'miss', targetId: p.id });
      return;
    }
    p.hp -= result.amount;
    p.flash = 0.18;
    this.lastCombatAt = this.time;
    this.events.push({
      type: 'damage',
      targetId: p.id,
      amount: result.amount,
      crit: result.crit,
      element: def.element,
      fromPlayer: false,
    });
    if (p.hp <= 0) this.killPlayer();
  }

  private killPlayer() {
    const p = this.player;
    p.hp = 0;
    p.state = 'dead';
    p.moveTarget = undefined;
    p.targetId = undefined;
    p.buffs = [];
    this.respawnAt = this.time + 5;
    const lost = Math.floor(this.profile.exp * 0.05);
    this.profile.exp -= lost;
    this.events.push({ type: 'death', entityId: p.id });
    this.say('system', '系統', `你被擊倒了${lost > 0 ? `，損失 ${lost} 經驗` : ''}。`);
  }

  // ── chat ──────────────────────────────────────────────────────────────

  say(channel: ChatChannel, from: string, text: string) {
    this.chat.push({ id: this.chatSeq++, channel, from, text, at: this.time });
    if (this.chat.length > 120) this.chat.splice(0, this.chat.length - 120);
    this.events.push({ type: 'chat', channel, from, text });
  }

  // ── remote / simulated players ────────────────────────────────────────

  upsertRemote(id: string, data: { name: string; classId: PlayerProfile['classId']; pos: Vec2; level: number; facing?: number }) {
    const existing = this.entities.get(id);
    if (existing) {
      existing.pos = { ...data.pos };
      existing.name = data.name;
      existing.level = data.level;
      if (data.facing !== undefined) existing.facing = data.facing;
      return existing;
    }
    const e: Entity = {
      id,
      kind: 'remote',
      name: data.name,
      pos: { ...data.pos },
      facing: data.facing ?? 0,
      hp: 100,
      maxHp: 100,
      sp: 0,
      maxSp: 0,
      level: data.level,
      state: 'idle',
      attackCd: 0,
      actionTimer: 0,
      radius: 0.5,
      speed: 5,
      attackRange: 2,
      attackSpeed: 1,
      element: 'neutral',
      buffs: [],
      classId: data.classId,
    };
    this.entities.set(id, e);
    return e;
  }

  removeRemote(id: string) {
    const e = this.entities.get(id);
    if (e?.kind === 'remote') this.entities.delete(id);
  }

  // ── simulation ────────────────────────────────────────────────────────

  tick(dtRaw: number) {
    if (this.paused) return;
    // Clamp so a backgrounded tab doesn't teleport everything on return.
    const dt = clamp(dtRaw, 0, 0.1);
    this.time += dt;
    this.zoneCooldown = Math.max(0, this.zoneCooldown - dt);

    const p = this.player;
    p.flash = Math.max(0, (p.flash ?? 0) - dt);
    p.actionTimer = Math.max(0, p.actionTimer - dt);
    p.attackCd = Math.max(0, p.attackCd - dt);
    p.buffs = p.buffs.filter((b) => b.until > this.time);

    // A turn-based exchange owns the clock: nothing chases or swings while the
    // player is reading a question.
    if (this.encounter && !this.encounter.outcome) {
      this.casts = this.casts.filter((c) => this.time - c.bornAt < c.ttl);
      return;
    }

    if (p.state === 'dead') {
      this.tickDrops();
      this.flushProfilePos();
      return;
    }

    this.tickPlayerMovement(dt);
    this.tickPlayerCombat();
    this.tickMonsters(dt);
    this.tickDrops();
    this.tickRegen(dt);
    this.tickPortals();
    this.casts = this.casts.filter((c) => this.time - c.bornAt < c.ttl);
    this.flushProfilePos();
  }

  private flushProfilePos() {
    this.profile.pos = { ...this.player.pos };
  }

  private tickPlayerMovement(dt: number) {
    const p = this.player;
    const d = this.derived();
    p.speed = d.moveSpeed;
    p.attackSpeed = d.aspd;

    let dx = 0;
    let dz = 0;
    if (this.moveInput.x !== 0 || this.moveInput.z !== 0) {
      dx = this.moveInput.x;
      dz = this.moveInput.z;
    } else if (p.moveTarget) {
      const gx = p.moveTarget.x - p.pos.x;
      const gz = p.moveTarget.z - p.pos.z;
      const dist = Math.hypot(gx, gz);
      if (dist < 0.35) {
        p.moveTarget = undefined;
      } else {
        dx = gx / dist;
        dz = gz / dist;
      }
    } else if (p.targetId && this.autoAttack) {
      // Walk into range of the current target.
      const t = this.target;
      if (t && t.state !== 'dead') {
        const gx = t.pos.x - p.pos.x;
        const gz = t.pos.z - p.pos.z;
        const dist = Math.hypot(gx, gz);
        const want = p.attackRange + t.radius - 0.35;
        if (dist > want) {
          dx = gx / dist;
          dz = gz / dist;
        }
      }
    }

    const moving = dx !== 0 || dz !== 0;
    if (moving) {
      const step = p.speed * dt;
      this.moveWithCollision(p, dx * step, dz * step);
      const want = Math.atan2(dx, dz);
      p.facing += angleDelta(p.facing, want) * Math.min(1, dt * 14);
      if (p.actionTimer <= 0) p.state = 'move';
    } else if (p.actionTimer <= 0) {
      p.state = 'idle';
    }
  }

  private moveWithCollision(e: Entity, dx: number, dz: number) {
    const half = this.zone.half - 1.5;
    let nx = clamp(e.pos.x + dx, -half, half);
    let nz = clamp(e.pos.z + dz, -half, half);

    for (const b of blockers(this.zone)) {
      const r = b.block * b.scale + e.radius;
      const ox = nx - b.x;
      const oz = nz - b.z;
      const dist = Math.hypot(ox, oz);
      if (dist < r && dist > 0.0001) {
        nx = b.x + (ox / dist) * r;
        nz = b.z + (oz / dist) * r;
      }
    }
    e.pos.x = clamp(nx, -half, half);
    e.pos.z = clamp(nz, -half, half);
  }

  private tickPlayerCombat() {
    const p = this.player;

    // Turn-based packs never trade blows in realtime — walking into an
    // obstacle opens a question exchange instead.
    if (this.pack.turnBased) {
      if (this.encounter) return;
      for (const m of this.entities.values()) {
        if (m.kind !== 'monster' || m.state === 'dead') continue;
        if (distance(p.pos.x, p.pos.z, m.pos.x, m.pos.z) - m.radius > m.attackRange + 0.4) continue;
        this.startEncounter(m.id);
        return;
      }
      return;
    }

    if (!this.autoAttack) return;
    const t = this.target;
    if (!t || t.kind === 'npc') return;
    if (t.state === 'dead') {
      p.targetId = undefined;
      return;
    }
    const dist = distance(p.pos.x, p.pos.z, t.pos.x, t.pos.z) - t.radius;
    if (dist > p.attackRange) return;
    if (p.attackCd > 0) return;

    p.facing = Math.atan2(t.pos.x - p.pos.x, t.pos.z - p.pos.z);
    p.attackCd = 1 / Math.max(0.3, p.attackSpeed);
    p.actionTimer = Math.min(0.35, p.attackCd * 0.6);
    p.state = 'attack';
    const cls = classOf(this.pack, this.profile.classId);
    const d = this.derived();
    const magic = cls.weapon === 'talisman' || cls.weapon === 'staff';
    this.hitEntity(t, magic ? d.matk : d.atk, 100, 'neutral', 1);
  }

  private tickMonsters(dt: number) {
    const p = this.player;
    for (const m of this.entities.values()) {
      if (m.kind !== 'monster') continue;
      m.flash = Math.max(0, (m.flash ?? 0) - dt);
      m.actionTimer = Math.max(0, m.actionTimer - dt);
      m.attackCd = Math.max(0, m.attackCd - dt);

      if (m.state === 'dead') {
        if (m.respawnAt !== undefined && this.time >= m.respawnAt) {
          const def = monsterOf(this.pack, m.monsterId!)!;
          m.hp = def.hp;
          m.state = 'idle';
          m.pos = { ...(m.spawn ?? m.pos) };
          m.respawnAt = undefined;
        }
        continue;
      }

      const distToPlayer = distance(m.pos.x, m.pos.z, p.pos.x, p.pos.z);
      const spawn = m.spawn ?? m.pos;
      const fromSpawn = distance(m.pos.x, m.pos.z, spawn.x, spawn.z);

      // Leash: give up and walk home if dragged too far.
      if (m.targetId && (fromSpawn > (m.leash ?? 22) || p.state === 'dead')) {
        m.targetId = undefined;
      }
      // Aggro on proximity (0 aggroRange = passive until attacked).
      if (!m.targetId && (m.aggroRange ?? 0) > 0 && distToPlayer < (m.aggroRange ?? 0) && p.state !== 'dead') {
        m.targetId = this.playerId;
      }

      if (m.targetId === this.playerId) {
        const want = m.attackRange + p.radius - 0.2;
        if (distToPlayer > want) {
          const dx = (p.pos.x - m.pos.x) / distToPlayer;
          const dz = (p.pos.z - m.pos.z) / distToPlayer;
          this.moveWithCollision(m, dx * m.speed * dt, dz * m.speed * dt);
          m.facing += angleDelta(m.facing, Math.atan2(dx, dz)) * Math.min(1, dt * 8);
          if (m.actionTimer <= 0) m.state = 'move';
        } else {
          m.facing = Math.atan2(p.pos.x - m.pos.x, p.pos.z - m.pos.z);
          if (m.attackCd <= 0) {
            m.attackCd = 1 / Math.max(0.2, m.attackSpeed);
            m.actionTimer = 0.3;
            m.state = 'attack';
            this.monsterAttack(m, p);
          } else if (m.actionTimer <= 0) {
            m.state = 'idle';
          }
        }
      } else if (fromSpawn > 1.2) {
        // Wander home.
        const dx = (spawn.x - m.pos.x) / fromSpawn;
        const dz = (spawn.z - m.pos.z) / fromSpawn;
        this.moveWithCollision(m, dx * m.speed * 0.6 * dt, dz * m.speed * 0.6 * dt);
        m.facing += angleDelta(m.facing, Math.atan2(dx, dz)) * Math.min(1, dt * 6);
        if (m.actionTimer <= 0) m.state = 'move';
        // Regenerate while disengaged.
        const def = monsterOf(this.pack, m.monsterId!)!;
        m.hp = Math.min(m.maxHp, m.hp + def.hp * 0.12 * dt);
      } else if (m.actionTimer <= 0) {
        m.state = 'idle';
      }
    }
  }

  private tickDrops() {
    const p = this.player;
    const keep: Drop[] = [];
    for (const d of this.drops) {
      if (this.time > d.until) continue;
      if (p.state !== 'dead' && distance(p.pos.x, p.pos.z, d.pos.x, d.pos.z) < PICKUP_RANGE) {
        if (d.silver) {
          this.profile.silver += d.silver;
          this.events.push({ type: 'silver', amount: d.silver });
        } else if (d.itemId) {
          this.addItem(d.itemId, d.qty);
          this.events.push({ type: 'loot', itemId: d.itemId, qty: d.qty });
        }
        continue;
      }
      keep.push(d);
    }
    this.drops = keep;
  }

  private tickRegen(dt: number) {
    const p = this.player;
    this.regenTimer += dt;
    if (this.regenTimer < 1) return;
    this.regenTimer = 0;
    const inCombat = this.time - this.lastCombatAt < COMBAT_TAG;
    const rate = inCombat ? 0.004 : this.zone.safe ? 0.08 : 0.02;
    p.hp = Math.min(p.maxHp, p.hp + Math.max(1, Math.round(p.maxHp * rate)));
    p.sp = Math.min(p.maxSp, p.sp + Math.max(1, Math.round(p.maxSp * (rate + 0.01))));
  }

  private tickPortals() {
    if (this.zoneCooldown > 0) return;
    const p = this.player;
    for (const portal of this.zone.portals) {
      if (distance(p.pos.x, p.pos.z, portal.at.x, portal.at.z) > 2.6) continue;
      if (portal.reqLevel && this.profile.level < portal.reqLevel) {
        this.say('system', '系統', `需要 Lv.${portal.reqLevel} 才能進入${portal.label}`);
        this.zoneCooldown = 2;
        return;
      }
      this.loadZone(portal.toZone, portal.toPos);
      return;
    }
  }

  // ── HUD ───────────────────────────────────────────────────────────────

  snapshot(fps = 0): HudSnapshot {
    const p = this.player;
    const cls = classOf(this.pack, this.profile.classId);
    const t = this.target;
    const d = this.derived();
    return {
      name: this.profile.name,
      classId: this.profile.classId,
      className: cls.name,
      classTitle: cls.title,
      classColor: cls.color,
      classIcon: cls.icon,
      level: this.profile.level,
      exp: this.profile.exp,
      expToNext: expToNext(this.profile.level),
      hp: Math.max(0, Math.round(p.hp)),
      maxHp: p.maxHp,
      sp: Math.max(0, Math.round(p.sp)),
      maxSp: p.maxSp,
      silver: this.profile.silver,
      zoneId: this.zone.id,
      zoneName: this.zone.name,
      zoneSubtitle: this.zone.subtitle,
      statPoints: this.profile.statPoints,
      skillPoints: this.profile.skillPoints,
      stats: { ...this.profile.stats },
      derived: d,
      dead: p.state === 'dead',
      respawnIn: Math.max(0, Math.ceil(this.respawnAt - this.time)),
      target:
        t && t.kind !== 'npc'
          ? {
              name: t.name,
              level: t.level,
              hp: Math.max(0, Math.round(t.hp)),
              maxHp: t.maxHp,
              element: t.element,
              boss: !!t.boss,
            }
          : undefined,
      skills: cls.skills.map((id) => {
        const def = this.pack.skills[id];
        const lvl = this.profile.learned[id] ?? 0;
        const scaled = this.skillAt(id);
        const left = Math.max(0, (this.cooldowns[id] ?? 0) - this.time);
        return {
          id,
          name: def.name,
          icon: def.icon,
          level: lvl,
          cooldown: def.cooldown,
          cooldownLeft: left,
          spCost: scaled?.spCost ?? def.spCost,
          ready: lvl > 0 && left <= 0 && p.sp >= (scaled?.spCost ?? def.spCost) && p.state !== 'dead',
          description: def.description,
          reqLevel: def.reqLevel,
          technique: def.technique,
        };
      }),
      buffs: p.buffs.map((b) => ({ id: b.id, name: b.name, left: Math.max(0, b.until - this.time) })),
      quests: this.profile.quests
        .filter((q) => q.status !== 'done')
        .map((q) => {
          const def = this.pack.quests[q.id];
          return {
            id: q.id,
            name: def?.name ?? q.id,
            summary: def?.summary ?? '',
            progress: q.progress,
            count: def?.count ?? 0,
            status: q.status,
          };
        }),
      questsDone: this.profile.quests.filter((q) => q.status === 'done').map((q) => q.id),
      inventory: this.profile.inventory.map((s) => {
        const def = this.pack.items[s.itemId];
        return {
          itemId: s.itemId,
          qty: s.qty,
          name: def?.name ?? s.itemId,
          icon: def?.icon ?? '❔',
          kind: def?.kind ?? 'material',
          rarity: def?.rarity ?? 'common',
          description: def?.description ?? '',
        };
      }),
      itemIndex: this.itemIndex(),
      equipment: { ...this.profile.equipment },
      playersOnline: [...this.entities.values()].filter((e) => e.kind === 'remote').length + 1,
      fps,
      currency: this.pack.currency,
      turnBased: !!this.pack.turnBased,
      encounter: this.encounterHud(),
    };
  }

  /** Display data for everything the player is carrying or wearing. */
  private itemIndex(): HudSnapshot['itemIndex'] {
    const ids = new Set<string>(this.profile.inventory.map((s) => s.itemId));
    for (const id of Object.values(this.profile.equipment)) if (id) ids.add(id);
    const out: HudSnapshot['itemIndex'] = {};
    for (const id of ids) {
      const def = this.pack.items[id];
      out[id] = {
        name: def?.name ?? id,
        icon: def?.icon ?? '❔',
        kind: def?.kind ?? 'material',
        rarity: def?.rarity ?? 'common',
        description: def?.description ?? '',
      };
    }
    return out;
  }

  private encounterHud(): EncounterHud | undefined {
    const enc = this.encounter;
    if (!enc) return undefined;
    const enemy = this.entity(enc.enemyId);
    const r = enc.lastResult;
    return {
      enemyName: enc.enemyName,
      enemyLevel: enc.enemyLevel,
      enemyHp: Math.max(0, Math.round(enemy?.hp ?? 0)),
      enemyMaxHp: enemy?.maxHp ?? 1,
      round: enc.index + 1,
      streak: enc.streak,
      correct: enc.correct,
      wrong: enc.wrong,
      prompt: enc.question.prompt,
      hint: enc.question.hint,
      hintRevealed: enc.hintRevealed,
      options: [...enc.options],
      result: r
        ? {
            correct: r.correct,
            chosen: r.chosen,
            answer: r.answer,
            damage: r.damage,
            backlash: r.backlash,
            swift: r.swift,
            amplified: r.amplified,
            shielded: r.shielded,
            note: r.note,
          }
        : undefined,
      outcome: enc.outcome,
      aids: enc.aids.map((a) => ({ skillId: a.skillId, label: a.label, effect: a.effect })),
      stage: enc.stage
        ? {
            name: enc.stage.name,
            line: enc.stage.line,
            index: enc.phase + 1,
            total: monsterOf(this.pack, enemy?.monsterId)?.phases?.length ?? 1,
            sealed: !!enc.stage.sealAids,
            swiftWindow: enc.stage.swiftWindow ?? SWIFT_WINDOW,
            pressure: enc.stage.pressure ?? 1,
          }
        : undefined,
      stageAdvanced: r?.phaseAdvanced?.name,
    };
  }

  /** Drain queued events; the renderer and HUD consume them once per frame. */
  drainEvents(): GameEvent[] {
    const out = this.events;
    this.events = [];
    return out;
  }
}
