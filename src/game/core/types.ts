/**
 * 仙境奇俠傳 3D — core domain types.
 *
 * Everything in `src/game/core` and `src/game/data` is pure TypeScript with no
 * three.js or React imports, so the whole simulation can run (and be tested)
 * headlessly. The renderer in `src/game/render` is a read-only view of it.
 */

export interface Vec2 {
  x: number;
  z: number;
}

/** The six primary attributes, Ragnarok-style. */
export interface Stats {
  str: number;
  agi: number;
  vit: number;
  int: number;
  dex: number;
  luk: number;
}

export type Element = 'neutral' | 'fire' | 'water' | 'wind' | 'earth' | 'holy' | 'shadow';

/**
 * Campaign-defined class id. Kept open so each content pack can name its own
 * classes — 仙境 uses 劍俠/符籙師/…, 通譯官 uses the eight memory-genius types.
 */
export type ClassId = string;

export interface ClassDef {
  id: ClassId;
  name: string;
  title: string;
  description: string;
  /** Colour used for the character's robe in the 3D scene. */
  color: number;
  accent: number;
  baseStats: Stats;
  /** Multipliers applied to derived hp / sp pools. */
  hpFactor: number;
  spFactor: number;
  /** Base auto-attack range in world units. */
  attackRange: number;
  weapon: 'blade' | 'talisman' | 'bow' | 'staff';
  skills: string[];
  /** Emoji shown on the HUD portrait. */
  icon: string;
}

export type SkillKind = 'melee' | 'ranged' | 'aoe' | 'heal' | 'buff' | 'dash' | 'aid';

/**
 * What a memory-technique skill does inside a turn-based encounter.
 * Used only by packs with `turnBased` set.
 */
export type AidEffect =
  /** Remove two wrong options from the current question. */
  | 'eliminate'
  /** Reveal the question's hint. */
  | 'hint'
  /** Double the damage of the next correct answer. */
  | 'amplify'
  /** Absorb the backlash from the next wrong answer. */
  | 'shield'
  /** Skip the current question without penalty. */
  | 'skip';

export interface SkillDef {
  id: string;
  name: string;
  kind: SkillKind;
  description: string;
  element: Element;
  /** Percent of the relevant attack power, 100 = one normal hit. */
  power: number;
  spCost: number;
  cooldown: number;
  range: number;
  /** Radius for `aoe` skills. */
  radius?: number;
  /** Number of hits the skill lands. */
  hits?: number;
  /** Seconds of buff duration for `buff` skills. */
  duration?: number;
  buff?: Partial<Record<'atk' | 'def' | 'speed' | 'aspd', number>>;
  /** Uses INT/MATK instead of physical ATK. */
  magic?: boolean;
  /** Minimum character level before the skill can be learned. */
  reqLevel: number;
  icon: string;
  /** Colour of the visual effect. */
  fx: number;
  /** For `aid` skills: what it does to the current question. */
  aidEffect?: AidEffect;
  /** Short label for the technique this skill represents, e.g. 記憶宮殿. */
  technique?: string;
}

/**
 * A stage of a representative's interview. Turn-based packs only.
 *
 * Phases turn a long boss into a shape: the pressure ramps, the clock
 * tightens, and the last stage seals your memory techniques — which changes
 * how you play the whole fight, because aids have to be banked early.
 */
export interface BossPhase {
  /** Entered once the boss falls to this fraction of its health. */
  at: number;
  name: string;
  /** What the representative says on entering this stage. */
  line: string;
  /** Multiplier on the backlash a wrong answer deals. */
  pressure?: number;
  /** Seconds allowed for the speed bonus; shorter is harsher. */
  swiftWindow?: number;
  /** Memory techniques cannot be used during this stage. */
  sealAids?: boolean;
  /** Question topic this stage drills. */
  topic?: string;
}

export interface MonsterDef {
  id: string;
  name: string;
  level: number;
  hp: number;
  atk: number;
  def: number;
  element: Element;
  exp: number;
  /** World units per second. */
  speed: number;
  attackRange: number;
  attackSpeed: number;
  aggroRange: number;
  /** Body radius, also used for collision. */
  size: number;
  /** Renderer archetype. */
  shape: 'slime' | 'beast' | 'spirit' | 'humanoid' | 'boss';
  color: number;
  accent: number;
  boss?: boolean;
  drops: DropEntry[];
  /** Topics this obstacle prefers to test, in turn-based packs. */
  topics?: string[];
  /** Interview stages, highest `at` first. Bosses only. */
  phases?: BossPhase[];
}

export interface DropEntry {
  itemId: string;
  /** 0..1 chance per kill. */
  chance: number;
  min?: number;
  max?: number;
}

export type ItemKind = 'weapon' | 'armor' | 'accessory' | 'consumable' | 'material';

export interface ItemDef {
  id: string;
  name: string;
  kind: ItemKind;
  description: string;
  price: number;
  atk?: number;
  matk?: number;
  def?: number;
  /** Consumable restore amounts. */
  healHp?: number;
  healSp?: number;
  icon: string;
  rarity: 'common' | 'fine' | 'rare' | 'epic';
}

export interface SpawnRule {
  monsterId: string;
  count: number;
  /** Centre of the spawn cluster. */
  at: Vec2;
  /** Cluster radius. */
  spread: number;
}

export interface NpcDef {
  id: string;
  name: string;
  role: 'quest' | 'shop' | 'healer' | 'warp';
  at: Vec2;
  color: number;
  lines: string[];
  questId?: string;
}

export interface PortalDef {
  at: Vec2;
  toZone: string;
  toPos: Vec2;
  label: string;
  reqLevel?: number;
}

export interface ZoneDef {
  id: string;
  name: string;
  subtitle: string;
  /** Language spoken here; drives which deck an encounter draws from. */
  language?: string;
  /** Half-extent of the square playfield, in world units. */
  half: number;
  safe: boolean;
  /** Terrain colours + sky mood for the renderer. */
  palette: {
    ground: number;
    groundAlt: number;
    rock: number;
    foliage: number;
    foliageAlt: number;
    skyTop: number;
    skyBottom: number;
    fog: number;
    water: number;
    light: number;
    ambient: number;
  };
  /** Terrain shaping parameters. */
  terrain: {
    amplitude: number;
    frequency: number;
    /** Height below which terrain is treated as water. */
    waterLevel: number;
  };
  props: {
    trees: number;
    rocks: number;
    grass: number;
    lanterns: number;
    /** Renderer archetype for the zone's vegetation. */
    treeKind: 'pine' | 'bamboo' | 'willow' | 'dead' | 'crystal';
  };
  spawns: SpawnRule[];
  npcs: NpcDef[];
  portals: PortalDef[];
  bgm?: string;
}

export type QuestKind = 'kill' | 'collect' | 'reach';

export interface QuestDef {
  id: string;
  name: string;
  giver: string;
  zone: string;
  reqLevel: number;
  kind: QuestKind;
  /** Monster id for `kill`, item id for `collect`. */
  target: string;
  count: number;
  summary: string;
  reward: {
    exp: number;
    silver: number;
    items?: { itemId: string; qty: number }[];
  };
  next?: string;
}

export type QuestStatus = 'available' | 'active' | 'complete' | 'done';

export interface QuestState {
  id: string;
  status: QuestStatus;
  progress: number;
}

export type EntityKind = 'player' | 'monster' | 'npc' | 'remote';

export type ActionState = 'idle' | 'move' | 'attack' | 'cast' | 'dead' | 'hurt';

export interface Buff {
  id: string;
  name: string;
  until: number;
  atk?: number;
  def?: number;
  speed?: number;
  aspd?: number;
}

export interface Entity {
  id: string;
  kind: EntityKind;
  name: string;
  pos: Vec2;
  /** Facing angle in radians (0 = +Z). */
  facing: number;
  hp: number;
  maxHp: number;
  sp: number;
  maxSp: number;
  level: number;
  state: ActionState;
  /** Seconds remaining before the entity may attack again. */
  attackCd: number;
  /** Seconds remaining in the current cast/swing animation. */
  actionTimer: number;
  radius: number;
  speed: number;
  attackRange: number;
  attackSpeed: number;
  element: Element;
  targetId?: string;
  moveTarget?: Vec2;
  buffs: Buff[];
  /** Monsters only. */
  monsterId?: string;
  spawn?: Vec2;
  respawnAt?: number;
  aggroRange?: number;
  leash?: number;
  boss?: boolean;
  /** NPCs only. */
  npcId?: string;
  /** Players/remotes only. */
  classId?: ClassId;
  /** Set by the simulation, consumed by the renderer for hit flashes. */
  flash?: number;
  /** Last chat bubble, rendered above the head for a few seconds. */
  say?: { text: string; until: number };
}

export interface InventorySlot {
  itemId: string;
  qty: number;
}

export interface Equipment {
  weapon?: string;
  armor?: string;
  accessory?: string;
}

export interface PlayerProfile {
  name: string;
  classId: ClassId;
  level: number;
  exp: number;
  statPoints: number;
  skillPoints: number;
  stats: Stats;
  silver: number;
  inventory: InventorySlot[];
  equipment: Equipment;
  learned: Record<string, number>;
  quests: QuestState[];
  kills: Record<string, number>;
  zone: string;
  pos: Vec2;
}

export type GameEvent =
  | { type: 'damage'; targetId: string; amount: number; crit: boolean; element: Element; fromPlayer: boolean }
  | { type: 'heal'; targetId: string; amount: number }
  | { type: 'miss'; targetId: string }
  | { type: 'death'; entityId: string; monsterId?: string; boss?: boolean }
  | { type: 'levelup'; level: number }
  | { type: 'exp'; amount: number }
  | { type: 'loot'; itemId: string; qty: number }
  | { type: 'silver'; amount: number }
  | { type: 'skill'; casterId: string; skillId: string; target?: Vec2; targetId?: string }
  | { type: 'chat'; channel: ChatChannel; from: string; text: string }
  | { type: 'quest'; questId: string; status: QuestStatus }
  | { type: 'zone'; zoneId: string }
  | { type: 'respawn' };

export type ChatChannel = 'system' | 'world' | 'combat' | 'party';

export interface ChatLine {
  id: number;
  channel: ChatChannel;
  from: string;
  text: string;
  at: number;
}

/** Snapshot handed to React each frame; kept small and flat on purpose. */
export interface HudSnapshot {
  name: string;
  classId: ClassId;
  /** Class display data, so HUD components never import a campaign's tables. */
  className: string;
  classTitle: string;
  classColor: number;
  classIcon: string;
  level: number;
  exp: number;
  expToNext: number;
  hp: number;
  maxHp: number;
  sp: number;
  maxSp: number;
  silver: number;
  zoneId: string;
  zoneName: string;
  zoneSubtitle: string;
  statPoints: number;
  skillPoints: number;
  stats: Stats;
  derived: Derived;
  dead: boolean;
  respawnIn: number;
  target?: {
    name: string;
    level: number;
    hp: number;
    maxHp: number;
    element: Element;
    boss: boolean;
  };
  skills: {
    id: string;
    name: string;
    icon: string;
    level: number;
    cooldown: number;
    cooldownLeft: number;
    spCost: number;
    ready: boolean;
    description: string;
    reqLevel: number;
    /** Memory technique label, for the 通譯官 campaign. */
    technique?: string;
  }[];
  buffs: { id: string; name: string; left: number }[];
  quests: {
    id: string;
    name: string;
    summary: string;
    progress: number;
    count: number;
    status: QuestStatus;
  }[];
  /** Ids of quests already turned in, so NPCs stop offering them. */
  questsDone: string[];
  inventory: {
    itemId: string;
    qty: number;
    name: string;
    icon: string;
    kind: ItemKind;
    rarity: string;
    description: string;
  }[];
  /** Item display data keyed by id — includes equipped gear, which is not in
   *  the bag, so the UI never has to reach into a campaign's tables. */
  itemIndex: Record<string, { name: string; icon: string; kind: ItemKind; rarity: string; description: string }>;
  equipment: Equipment;
  playersOnline: number;
  fps: number;
  /** Present while a turn-based exchange is on screen. */
  encounter?: EncounterHud;
  /** Campaign labels so the HUD does not hard-code 仙境 wording. */
  currency: string;
  turnBased: boolean;
}

export interface EncounterHud {
  enemyName: string;
  enemyLevel: number;
  enemyHp: number;
  enemyMaxHp: number;
  /** Which question of the exchange this is, 1-based for display. */
  round: number;
  streak: number;
  correct: number;
  wrong: number;
  prompt: string;
  hint?: string;
  hintRevealed: boolean;
  options: string[];
  /** Set once the player has answered and is reading the result. */
  result?: {
    correct: boolean;
    chosen: string;
    answer: string;
    damage: number;
    backlash: number;
    swift: boolean;
    amplified: boolean;
    shielded: boolean;
    note?: string;
  };
  outcome?: 'win' | 'lose' | 'flee';
  /** Techniques queued for the next answer. */
  aids: { skillId: string; label: string; effect: string }[];
  /** Present when the obstacle runs staged interviews. */
  stage?: {
    name: string;
    line: string;
    /** 1-based, for display. */
    index: number;
    total: number;
    /** Techniques are unavailable this stage. */
    sealed: boolean;
    /** Seconds allowed for the speed bonus. */
    swiftWindow: number;
    /** Backlash multiplier. */
    pressure: number;
  };
  /** Set on the frame a stage change happened, for the banner. */
  stageAdvanced?: string;
}

export interface Derived {
  atk: number;
  matk: number;
  def: number;
  hit: number;
  flee: number;
  crit: number;
  aspd: number;
  moveSpeed: number;
}
