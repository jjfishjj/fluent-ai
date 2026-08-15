import type { QuestDef, ZoneDef } from '../../core/types';
import { MISSIONS, MISSION_QUESTS, MISSION_ZONES } from './missions';

/**
 * The academy is the hub: one gate per country, unlocked by level. Each
 * mission supplies its own map, so this file only owns the place you come
 * back to between postings.
 */
const ACADEMY: ZoneDef = {
  id: 'academy',
  name: '通譯學院',
  subtitle: '安全區 · 各國任務出發地',
  half: 50,
  safe: true,
  palette: {
    ground: 0x7a9e6a,
    groundAlt: 0x9ec283,
    rock: 0x9a9a92,
    foliage: 0x3f7a46,
    foliageAlt: 0xd8e8a0,
    skyTop: 0x4f9fe0,
    skyBottom: 0xe4f2ff,
    fog: 0xd8ecf8,
    water: 0x4aa3c7,
    light: 0xfff6e4,
    ambient: 0xa8c0d8,
  },
  terrain: { amplitude: 1.8, frequency: 0.016, waterLevel: -1.4 },
  props: { trees: 38, rocks: 14, grass: 220, lanterns: 10, treeKind: 'pine' },
  spawns: [],
  npcs: [
    {
      id: 'mentor',
      name: '首席通譯 林教授',
      role: 'quest',
      at: { x: 0, z: 8 },
      color: 0x2f4f7f,
      lines: [
        '歡迎加入通譯團，見習生。',
        '你的記憶天才型態決定了你擅長的技法——別去學別人的路子。',
        '南門通往倫敦，西門京都，東門巴黎。等級到了，門自然會開。',
      ],
      questId: 'i1',
    },
    {
      id: 'quartermaster',
      name: '補給官 阿珍',
      role: 'shop',
      at: { x: -13, z: -3 },
      color: 0xc08a4a,
      lines: ['潤喉糖帶夠了嗎？', '口譯是體力活，別逞強。'],
    },
    {
      id: 'medic',
      name: '隨隊醫師',
      role: 'healer',
      at: { x: 13, z: -3 },
      color: 0xd06a5a,
      lines: ['坐下，讓嗓子和腦子都休息一下。'],
    },
  ],
  // One gate per mission, gated by the level that mission expects.
  portals: MISSIONS.map((m) => ({
    at: m.gate,
    toZone: m.zone.id,
    toPos: { x: 0, z: m.zone.half - 18 },
    label: `${m.flag} ${m.zone.name}`,
    reqLevel: m.reqLevel > 1 ? m.reqLevel : undefined,
  })),
};

export const INTERPRETER_ZONES: Record<string, ZoneDef> = {
  academy: ACADEMY,
  ...MISSION_ZONES,
};

/** The academy's opening assignment, then each country takes over. */
const OPENING: QuestDef = {
  id: 'i1',
  name: '第一次上場',
  giver: 'mentor',
  zone: 'academy',
  reqLevel: 1,
  kind: 'kill',
  target: 'murmur',
  count: 6,
  summary: '在倫敦會場化解 6 團含糊音',
  reward: { exp: 220, silver: 260, items: [{ itemId: 'lozenge', qty: 5 }] },
  next: 'uk1',
};

export const INTERPRETER_QUESTS: Record<string, QuestDef> = {
  i1: OPENING,
  ...MISSION_QUESTS,
};
