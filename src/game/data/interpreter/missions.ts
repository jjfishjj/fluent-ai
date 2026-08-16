import type { BossPhase, MonsterDef, QuestDef, ZoneDef } from '../../core/types';

/**
 * The countries the interpreter is posted to.
 *
 * Each mission owns its language, its map, the obstacles found there and the
 * representative at the end of it. Adding a country is adding an entry here
 * plus a starter deck — nothing in the engine needs to change.
 *
 * Obstacles are the things that actually block an interpreter in that
 * language: idioms and phrasal verbs in English, keigo and deliberate vagueness
 * in Japanese, gender and liaison in French.
 */

/** Stats are derived from level so the three countries stay on one curve. */
function barrier(spec: {
  id: string;
  name: string;
  level: number;
  shape: MonsterDef['shape'];
  color: number;
  accent: number;
  element: MonsterDef['element'];
  drops: MonsterDef['drops'];
  /** Health multiplier; elites and bosses are chunkier. */
  bulk?: number;
  /** Backlash multiplier. */
  threat?: number;
  size?: number;
  speed?: number;
  aggroRange?: number;
  boss?: boolean;
  topics?: string[];
  phases?: BossPhase[];
}): MonsterDef {
  const { level, bulk = 1, threat = 1 } = spec;
  return {
    id: spec.id,
    name: spec.name,
    level,
    hp: Math.round((100 + level * 28) * bulk),
    atk: Math.round((10 + level * 3.4) * threat),
    def: Math.round(level * 1.1),
    element: spec.element,
    exp: Math.round((18 + Math.pow(level, 1.85)) * (spec.boss ? 6 : 1)),
    speed: spec.speed ?? 2.6,
    attackRange: 2.2,
    attackSpeed: 0.8,
    aggroRange: spec.aggroRange ?? 10,
    size: spec.size ?? 1,
    shape: spec.shape,
    color: spec.color,
    accent: spec.accent,
    boss: spec.boss,
    drops: spec.drops,
    topics: spec.topics,
    phases: spec.phases,
  };
}

const COMMON_DROPS = [
  { itemId: 'glossary', chance: 0.45, min: 1, max: 2 },
  { itemId: 'lozenge', chance: 0.25 },
];

// ── 英國 ────────────────────────────────────────────────────────────────
const UK_BARRIERS: MonsterDef[] = [
  barrier({ id: 'murmur', name: '含糊音團', level: 2, shape: 'slime', color: 0x9fb4d0, accent: 0xe8f0ff, element: 'wind', aggroRange: 0, size: 0.8, drops: COMMON_DROPS }),
  barrier({ id: 'falsefriend', name: '假朋友', level: 5, shape: 'humanoid', color: 0x8f7fc0, accent: 0xffd0f0, element: 'shadow', speed: 3.4, drops: COMMON_DROPS }),
  barrier({ id: 'accentfog', name: '口音之霧', level: 8, shape: 'spirit', color: 0x7fa8c8, accent: 0xcfe8ff, element: 'water', size: 1.1, drops: [...COMMON_DROPS, { itemId: 'notebook', chance: 0.06 }] }),
  barrier({ id: 'runon', name: '長句奔流', level: 11, shape: 'beast', color: 0x6fb3a0, accent: 0xd8fff0, element: 'wind', speed: 4.2, drops: COMMON_DROPS }),
  barrier({ id: 'phrasal', name: '片語動詞纏繞', level: 14, shape: 'beast', color: 0x8a7a4a, accent: 0xffe8a8, element: 'earth', size: 1.15, topics: ['idiom'], drops: [...COMMON_DROPS, { itemId: 'shorthand', chance: 0.05 }] }),
  barrier({ id: 'idiomthicket', name: '慣用語荊棘', level: 17, shape: 'beast', color: 0x5f8a4a, accent: 0xc8ff9a, element: 'earth', size: 1.3, bulk: 1.2, topics: ['idiom'], drops: [...COMMON_DROPS, { itemId: 'blazer', chance: 0.08 }] }),
];

// ── 日本 ────────────────────────────────────────────────────────────────
const JP_BARRIERS: MonsterDef[] = [
  barrier({ id: 'keigo_maze', name: '敬語迷宮', level: 18, shape: 'humanoid', color: 0xb08a5c, accent: 0xffe0a8, element: 'earth', size: 1.2, topics: ['keigo'], drops: COMMON_DROPS }),
  barrier({ id: 'vagueness', name: '曖昧之壁', level: 21, shape: 'spirit', color: 0xc8b8d8, accent: 0xf0e8ff, element: 'shadow', size: 1.15, topics: ['vagueness'], drops: COMMON_DROPS }),
  barrier({ id: 'kanji_mirage', name: '漢字幻影', level: 24, shape: 'humanoid', color: 0x9a5a4a, accent: 0xffd0b0, element: 'fire', drops: [...COMMON_DROPS, { itemId: 'shorthand', chance: 0.08 }] }),
  barrier({ id: 'humble_storm', name: '謙讓語風暴', level: 27, shape: 'spirit', color: 0x7a90b8, accent: 0xdfeaff, element: 'wind', speed: 3.6, size: 1.2, topics: ['keigo'], drops: COMMON_DROPS }),
  barrier({ id: 'silence_gap', name: '沉默之間', level: 30, shape: 'slime', color: 0x50607a, accent: 0xb8c8e0, element: 'shadow', aggroRange: 0, size: 1.3, bulk: 1.25, topics: ['vagueness'], drops: [...COMMON_DROPS, { itemId: 'earpiece', chance: 0.06 }] }),
];

// ── 法國 ────────────────────────────────────────────────────────────────
const FR_BARRIERS: MonsterDef[] = [
  barrier({ id: 'gender_fork', name: '陰陽性歧路', level: 30, shape: 'humanoid', color: 0x5a6fc0, accent: 0xffd8e8, element: 'neutral', size: 1.2, topics: ['gender'], drops: COMMON_DROPS }),
  barrier({ id: 'liaison_fog', name: '連音之霧', level: 33, shape: 'spirit', color: 0x8fa8d8, accent: 0xe8f0ff, element: 'water', size: 1.2, drops: COMMON_DROPS }),
  barrier({ id: 'subjunctive', name: '虛擬式漩渦', level: 36, shape: 'beast', color: 0x7a5a9a, accent: 0xe0c8ff, element: 'shadow', speed: 3.8, size: 1.25, drops: [...COMMON_DROPS, { itemId: 'earpiece', chance: 0.08 }] }),
  barrier({ id: 'fauxami_fr', name: '假朋友（法）', level: 39, shape: 'humanoid', color: 0xc06a8a, accent: 0xffe0f0, element: 'shadow', size: 1.2, drops: COMMON_DROPS }),
  barrier({ id: 'langue_de_bois', name: '官話迷宮', level: 42, shape: 'beast', color: 0x6a6a58, accent: 0xd8d8b0, element: 'earth', size: 1.35, bulk: 1.25, topics: ['formal'], drops: [...COMMON_DROPS, { itemId: 'blazer', chance: 0.12 }] }),
];

const ENVOYS: MonsterDef[] = [
  barrier({
    id: 'envoy_uk',
    name: '英國代表 · Sir Whitmore',
    level: 20,
    shape: 'humanoid',
    color: 0x1f3a6e,
    accent: 0xd4af37,
    element: 'holy',
    size: 1.5,
    bulk: 4.5,
    threat: 1.35,
    aggroRange: 18,
    boss: true,
    topics: ['meeting'],
    phases: [
      {
        at: 1,
        name: '寒暄',
        line: 'Do sit down. I trust the journey was tolerable?',
        topic: 'basics',
      },
      {
        at: 0.66,
        name: '進入正題',
        line: 'Now — shall we address the substance?',
        topic: 'meeting',
        pressure: 1.2,
        swiftWindow: 5,
      },
      {
        at: 0.3,
        name: '最後通牒',
        line: 'With all due respect, I shall need a straight answer.',
        topic: 'idiom',
        pressure: 1.5,
        swiftWindow: 4,
        sealAids: true,
      },
    ],
    drops: [
      { itemId: 'credential_uk', chance: 1 },
      { itemId: 'earpiece', chance: 1 },
      { itemId: 'blazer', chance: 0.5 },
      { itemId: 'reset', chance: 1, min: 3, max: 5 },
    ],
  }),
  barrier({
    id: 'envoy_jp',
    name: '日本代表 · 佐藤大使',
    level: 34,
    shape: 'humanoid',
    color: 0x2a2a38,
    accent: 0xc8102e,
    element: 'holy',
    size: 1.5,
    bulk: 4.5,
    threat: 1.35,
    aggroRange: 18,
    boss: true,
    topics: ['keigo'],
    phases: [
      {
        at: 1,
        name: '名刺交換',
        line: 'はじめまして。佐藤と申します。',
        topic: 'basics',
      },
      {
        at: 0.66,
        name: '敬語の壁',
        line: 'では、少し崩さずにお話しできますか。',
        topic: 'keigo',
        pressure: 1.25,
        swiftWindow: 5,
      },
      {
        at: 0.3,
        name: '本音',
        line: '……前向きに検討します、と申し上げておきましょう。',
        topic: 'vagueness',
        pressure: 1.5,
        swiftWindow: 4,
        sealAids: true,
      },
    ],
    drops: [
      { itemId: 'credential_jp', chance: 1 },
      { itemId: 'shorthand', chance: 1 },
      { itemId: 'reset', chance: 1, min: 4, max: 6 },
    ],
  }),
  barrier({
    id: 'envoy_fr',
    name: '法國代表 · Mme Rousseau',
    level: 46,
    shape: 'humanoid',
    color: 0x1b3a8a,
    accent: 0xef4135,
    element: 'holy',
    size: 1.5,
    bulk: 4.5,
    threat: 1.35,
    aggroRange: 18,
    boss: true,
    topics: ['formal'],
    phases: [
      {
        at: 1,
        name: 'L’accueil',
        line: 'Soyez le bienvenu. Nous avons peu de temps.',
        topic: 'basics',
      },
      {
        at: 0.66,
        name: 'La négociation',
        line: 'Venons-en au fond du dossier.',
        topic: 'meeting',
        pressure: 1.25,
        swiftWindow: 5,
      },
      {
        at: 0.3,
        name: 'La formule',
        line: 'Sous réserve, bien entendu, de ce qui précède.',
        topic: 'formal',
        pressure: 1.6,
        swiftWindow: 4,
        sealAids: true,
      },
    ],
    drops: [
      { itemId: 'credential_fr', chance: 1 },
      { itemId: 'earpiece', chance: 1 },
      { itemId: 'reset', chance: 1, min: 5, max: 8 },
    ],
  }),
];

export interface Mission {
  id: string;
  /** Country name shown on the briefing card. */
  country: string;
  flag: string;
  language: string;
  /** Level the academy will let you depart at. */
  reqLevel: number;
  /** Where the portal in the academy sits. */
  gate: { x: number; z: number };
  zone: ZoneDef;
  barriers: MonsterDef[];
  envoy: MonsterDef;
  quests: QuestDef[];
  credential: string;
}

export const MISSIONS: Mission[] = [
  {
    id: 'london',
    country: '英國',
    flag: '🇬🇧',
    language: 'english',
    reqLevel: 1,
    gate: { x: 0, z: -36 },
    barriers: UK_BARRIERS,
    envoy: ENVOYS[0],
    credential: 'credential_uk',
    zone: {
      id: 'london',
      name: '倫敦會場',
      subtitle: '英語任務 · Lv.1–20',
      language: 'english',
      half: 62,
      safe: false,
      palette: {
        ground: 0x5f6b70, groundAlt: 0x7d8a8e, rock: 0x50595e,
        foliage: 0x4a5a4a, foliageAlt: 0x8fa08a,
        skyTop: 0x6b7e92, skyBottom: 0xc8d4dc, fog: 0xb4c2cc,
        water: 0x4a6070, light: 0xeef2f6, ambient: 0x7a8894,
      },
      terrain: { amplitude: 2.6, frequency: 0.02, waterLevel: -1.8 },
      props: { trees: 70, rocks: 34, grass: 120, lanterns: 26, treeKind: 'dead' },
      spawns: [
        { monsterId: 'murmur', count: 12, at: { x: 6, z: 16 }, spread: 20 },
        { monsterId: 'falsefriend', count: 9, at: { x: -22, z: -4 }, spread: 18 },
        { monsterId: 'accentfog', count: 9, at: { x: 24, z: -14 }, spread: 18 },
        { monsterId: 'runon', count: 7, at: { x: -8, z: -30 }, spread: 16 },
        { monsterId: 'phrasal', count: 6, at: { x: 26, z: -34 }, spread: 14 },
        { monsterId: 'idiomthicket', count: 5, at: { x: -30, z: -34 }, spread: 14 },
        { monsterId: 'envoy_uk', count: 1, at: { x: 0, z: -50 }, spread: 0 },
      ],
      npcs: [
        {
          id: 'attache_uk',
          name: '隨員 Mr. Hale',
          role: 'quest',
          at: { x: 4, z: 34 },
          color: 0x3a5a8a,
          lines: ['Sir Whitmore 不喜歡等人。', '會場裡的雜音太多了，先幫我把術語卡整理好。'],
          questId: 'uk1',
        },
      ],
      portals: [{ at: { x: 0, z: 48 }, toZone: 'academy', toPos: { x: 0, z: -28 }, label: '通譯學院' }],
    },
    quests: [
      {
        id: 'uk1',
        name: '會前準備',
        giver: 'attache_uk',
        zone: 'london',
        reqLevel: 3,
        kind: 'collect',
        target: 'glossary',
        count: 10,
        summary: '收集 10 張術語卡交給隨員',
        reward: { exp: 620, silver: 520, items: [{ itemId: 'notebook', qty: 1 }, { itemId: 'coffee', qty: 5 }] },
        next: 'uk2',
      },
      {
        id: 'uk2',
        name: '面見英國代表',
        giver: 'attache_uk',
        zone: 'london',
        reqLevel: 14,
        kind: 'kill',
        target: 'envoy_uk',
        count: 1,
        summary: '完成與 Sir Whitmore 的正式會談',
        reward: { exp: 6000, silver: 4000, items: [{ itemId: 'earpiece', qty: 1 }, { itemId: 'reset', qty: 5 }] },
        next: 'jp1',
      },
    ],
  },

  {
    id: 'kyoto',
    country: '日本',
    flag: '🇯🇵',
    language: 'japanese',
    reqLevel: 16,
    gate: { x: -30, z: -30 },
    barriers: JP_BARRIERS,
    envoy: ENVOYS[1],
    credential: 'credential_jp',
    zone: {
      id: 'kyoto',
      name: '京都 · 迎賓館',
      subtitle: '日語任務 · Lv.16–34',
      language: 'japanese',
      half: 64,
      safe: false,
      palette: {
        ground: 0x6a7a52, groundAlt: 0x8a9a63, rock: 0x7a7268,
        foliage: 0x3f6a40, foliageAlt: 0xf0a6c0,
        skyTop: 0x7ba8d0, skyBottom: 0xffe8ee, fog: 0xe6d4dc,
        water: 0x4a8fa8, light: 0xfff0e8, ambient: 0xa89aa0,
      },
      terrain: { amplitude: 3.0, frequency: 0.019, waterLevel: -1.8 },
      props: { trees: 96, rocks: 40, grass: 240, lanterns: 34, treeKind: 'willow' },
      spawns: [
        { monsterId: 'keigo_maze', count: 10, at: { x: 8, z: 18 }, spread: 20 },
        { monsterId: 'vagueness', count: 9, at: { x: -24, z: 0 }, spread: 18 },
        { monsterId: 'kanji_mirage', count: 8, at: { x: 26, z: -16 }, spread: 18 },
        { monsterId: 'humble_storm', count: 7, at: { x: -10, z: -32 }, spread: 16 },
        { monsterId: 'silence_gap', count: 6, at: { x: 28, z: -36 }, spread: 14 },
        { monsterId: 'envoy_jp', count: 1, at: { x: 0, z: -52 }, spread: 0 },
      ],
      npcs: [
        {
          id: 'attache_jp',
          name: '随員 田中さん',
          role: 'quest',
          at: { x: 4, z: 36 },
          color: 0x4a4a5a,
          lines: [
            'ようこそ。佐藤大使がお待ちです。',
            '敬語を間違えると、それだけで話が終わります。',
            'まずは迎賓館の敬語迷宮を片づけてください。',
          ],
          questId: 'jp1',
        },
      ],
      portals: [{ at: { x: 0, z: 50 }, toZone: 'academy', toPos: { x: -24, z: -22 }, label: '通譯學院' }],
    },
    quests: [
      {
        id: 'jp1',
        name: '敬語の壁',
        giver: 'attache_jp',
        zone: 'kyoto',
        reqLevel: 16,
        kind: 'kill',
        target: 'keigo_maze',
        count: 8,
        summary: '在迎賓館化解 8 座敬語迷宮',
        reward: { exp: 9000, silver: 5200, items: [{ itemId: 'shorthand', qty: 1 }, { itemId: 'reset', qty: 3 }] },
        next: 'jp2',
      },
      {
        id: 'jp2',
        name: '面見日本代表',
        giver: 'attache_jp',
        zone: 'kyoto',
        reqLevel: 28,
        kind: 'kill',
        target: 'envoy_jp',
        count: 1,
        summary: '完成與佐藤大使的正式會談',
        reward: { exp: 26000, silver: 12000, items: [{ itemId: 'earpiece', qty: 1 }, { itemId: 'reset', qty: 6 }] },
        next: 'fr1',
      },
    ],
  },

  {
    id: 'paris',
    country: '法國',
    flag: '🇫🇷',
    language: 'french',
    reqLevel: 28,
    gate: { x: 30, z: -30 },
    barriers: FR_BARRIERS,
    envoy: ENVOYS[2],
    credential: 'credential_fr',
    zone: {
      id: 'paris',
      name: '巴黎 · 外交部',
      subtitle: '法語任務 · Lv.28–46',
      language: 'french',
      half: 66,
      safe: false,
      palette: {
        ground: 0x8a8270, groundAlt: 0xb0a68a, rock: 0x9a9282,
        foliage: 0x4a6a3a, foliageAlt: 0xd8e0a0,
        skyTop: 0x5a8fd0, skyBottom: 0xffeecc, fog: 0xdcd4c0,
        water: 0x5a8098, light: 0xfff4e0, ambient: 0xb0a894,
      },
      terrain: { amplitude: 2.2, frequency: 0.017, waterLevel: -1.6 },
      props: { trees: 84, rocks: 28, grass: 200, lanterns: 30, treeKind: 'pine' },
      spawns: [
        { monsterId: 'gender_fork', count: 10, at: { x: 8, z: 18 }, spread: 20 },
        { monsterId: 'liaison_fog', count: 9, at: { x: -26, z: 0 }, spread: 18 },
        { monsterId: 'subjunctive', count: 8, at: { x: 28, z: -16 }, spread: 18 },
        { monsterId: 'fauxami_fr', count: 7, at: { x: -12, z: -34 }, spread: 16 },
        { monsterId: 'langue_de_bois', count: 6, at: { x: 30, z: -38 }, spread: 14 },
        { monsterId: 'envoy_fr', count: 1, at: { x: 0, z: -54 }, spread: 0 },
      ],
      npcs: [
        {
          id: 'attache_fr',
          name: 'Attaché M. Bertrand',
          role: 'quest',
          at: { x: 4, z: 38 },
          color: 0x2a4a8a,
          lines: [
            'Bienvenue au Quai d’Orsay.',
            'Ici, une erreur de genre suffit à vous décrédibiliser.',
            'Commencez par dégager les fourches du genre.',
          ],
          questId: 'fr1',
        },
      ],
      portals: [{ at: { x: 0, z: 52 }, toZone: 'academy', toPos: { x: 24, z: -22 }, label: '通譯學院' }],
    },
    quests: [
      {
        id: 'fr1',
        name: '陰陽性的陷阱',
        giver: 'attache_fr',
        zone: 'paris',
        reqLevel: 28,
        kind: 'kill',
        target: 'gender_fork',
        count: 8,
        summary: '在外交部化解 8 處陰陽性歧路',
        reward: { exp: 30000, silver: 14000, items: [{ itemId: 'reset', qty: 4 }] },
        next: 'fr2',
      },
      {
        id: 'fr2',
        name: '面見法國代表',
        giver: 'attache_fr',
        zone: 'paris',
        reqLevel: 40,
        kind: 'kill',
        target: 'envoy_fr',
        count: 1,
        summary: '完成與 Mme Rousseau 的正式會談',
        reward: { exp: 80000, silver: 30000, items: [{ itemId: 'reset', qty: 8 }] },
      },
    ],
  },
];

export function missionFor(zoneId: string): Mission | undefined {
  return MISSIONS.find((m) => m.zone.id === zoneId);
}

/** Every obstacle across every country, keyed by id. */
export const ALL_BARRIERS: Record<string, MonsterDef> = Object.fromEntries(
  MISSIONS.flatMap((m) => [...m.barriers, m.envoy]).map((b) => [b.id, b]),
);

/** Every mission zone, keyed by id. */
export const MISSION_ZONES: Record<string, ZoneDef> = Object.fromEntries(
  MISSIONS.map((m) => [m.zone.id, m.zone]),
);

/** Every mission quest, keyed by id. */
export const MISSION_QUESTS: Record<string, QuestDef> = Object.fromEntries(
  MISSIONS.flatMap((m) => m.quests).map((q) => [q.id, q]),
);
