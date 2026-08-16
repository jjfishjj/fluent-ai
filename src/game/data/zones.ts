import type { ZoneDef } from '../core/types';

/**
 * Four hand-placed zones. Coordinates are world units with the origin at the
 * middle of each map; +Z is "north" on the minimap.
 */
export const ZONES: Record<string, ZoneDef> = {
  qingyun: {
    id: 'qingyun',
    name: '青雲村',
    subtitle: '安全區 · 新手起始地',
    half: 55,
    safe: true,
    palette: {
      ground: 0x6f9e5a,
      groundAlt: 0x8fb96e,
      rock: 0x8a8f86,
      foliage: 0x3f7a46,
      foliageAlt: 0xf0a6c0,
      skyTop: 0x4f9fe0,
      skyBottom: 0xdcefff,
      fog: 0xcfe6f5,
      water: 0x4aa3c7,
      light: 0xfff4dc,
      ambient: 0x9fb9d6,
    },
    terrain: { amplitude: 2.4, frequency: 0.018, waterLevel: -1.6 },
    props: { trees: 44, rocks: 18, grass: 240, lanterns: 14, treeKind: 'willow' },
    spawns: [],
    npcs: [
      {
        id: 'elder',
        name: '青雲長老',
        role: 'quest',
        at: { x: 0, z: 8 },
        color: 0xf0e2c0,
        lines: ['小友，山下竹林近來妖氣沖天。', '先去歷練歷練，再談拜師之事。'],
        questId: 'q1',
      },
      {
        id: 'merchant',
        name: '雜貨商 阿福',
        role: 'shop',
        at: { x: -12, z: -4 },
        color: 0xd8a55c,
        lines: ['丹藥兵器，應有盡有！', '看看要點什麼？'],
      },
      {
        id: 'medic',
        name: '丹房弟子',
        role: 'healer',
        at: { x: 12, z: -3 },
        color: 0xe07a5f,
        lines: ['站好別動，替你調息一番。'],
      },
    ],
    portals: [{ at: { x: 0, z: -40 }, toZone: 'bamboo', toPos: { x: 0, z: 44 }, label: '迷霧竹林' }],
  },

  bamboo: {
    id: 'bamboo',
    name: '迷霧竹林',
    subtitle: 'Lv.1–12 · 新手練功場',
    half: 65,
    safe: false,
    palette: {
      ground: 0x5c8a52,
      groundAlt: 0x7aa863,
      rock: 0x7f8b7a,
      foliage: 0x74a83f,
      foliageAlt: 0xbfe08a,
      skyTop: 0x6fa8c8,
      skyBottom: 0xd8ecdf,
      fog: 0xc3dcd0,
      water: 0x3f8fa8,
      light: 0xf6f2d8,
      ambient: 0x8fae9e,
    },
    terrain: { amplitude: 3.2, frequency: 0.022, waterLevel: -1.9 },
    props: { trees: 190, rocks: 26, grass: 320, lanterns: 0, treeKind: 'bamboo' },
    spawns: [
      { monsterId: 'lingzhi', count: 12, at: { x: 10, z: 18 }, spread: 22 },
      { monsterId: 'lingzhi', count: 8, at: { x: -24, z: -6 }, spread: 16 },
      { monsterId: 'bamboorat', count: 10, at: { x: -8, z: -22 }, spread: 20 },
      { monsterId: 'mistfox', count: 7, at: { x: 26, z: -28 }, spread: 18 },
    ],
    npcs: [
      {
        id: 'hunter',
        name: '獵戶 老陳',
        role: 'quest',
        at: { x: 4, z: 38 },
        color: 0xa88a5c,
        lines: ['竹林裡的靈芝精越來越多了。', '幫我摘些靈芝草回來吧。'],
        questId: 'q2',
      },
    ],
    portals: [
      { at: { x: 0, z: 52 }, toZone: 'qingyun', toPos: { x: 0, z: -34 }, label: '青雲村' },
      { at: { x: 46, z: -46 }, toZone: 'canyon', toPos: { x: -40, z: 40 }, label: '赤炎峽谷', reqLevel: 10 },
    ],
  },

  canyon: {
    id: 'canyon',
    name: '赤炎峽谷',
    subtitle: 'Lv.12–22 · 火屬性區域',
    half: 70,
    safe: false,
    palette: {
      ground: 0x8e4b32,
      groundAlt: 0xc07a45,
      rock: 0x6b3a2a,
      foliage: 0x7a4a2a,
      foliageAlt: 0xff9a4a,
      skyTop: 0xd2603a,
      skyBottom: 0xffd9a0,
      fog: 0xe0a172,
      water: 0xd45a2a,
      light: 0xffd9a8,
      ambient: 0xb06a4a,
    },
    terrain: { amplitude: 6.5, frequency: 0.026, waterLevel: -3.4 },
    props: { trees: 40, rocks: 90, grass: 60, lanterns: 0, treeKind: 'dead' },
    spawns: [
      { monsterId: 'flamewolf', count: 12, at: { x: 6, z: 6 }, spread: 28 },
      { monsterId: 'flamewolf', count: 8, at: { x: -34, z: -24 }, spread: 18 },
      { monsterId: 'emberimp', count: 9, at: { x: 34, z: -30 }, spread: 22 },
    ],
    npcs: [
      {
        id: 'blacksmith',
        name: '鑄劍師 火伯',
        role: 'quest',
        at: { x: -40, z: 34 },
        color: 0xc0562e,
        lines: ['狼牙是上好的淬火材料。', '獵些赤焰狼來，好處少不了你的。'],
        questId: 'q3',
      },
    ],
    portals: [
      { at: { x: -46, z: 48 }, toZone: 'bamboo', toPos: { x: 40, z: -40 }, label: '迷霧竹林' },
      { at: { x: 50, z: 50 }, toZone: 'abyss', toPos: { x: 0, z: 52 }, label: '幽冥洞窟', reqLevel: 20 },
    ],
  },

  abyss: {
    id: 'abyss',
    name: '幽冥洞窟',
    subtitle: 'Lv.22+ · 首領：千年樹妖王',
    half: 62,
    safe: false,
    palette: {
      ground: 0x2f3350,
      groundAlt: 0x454a70,
      rock: 0x3a3f5e,
      foliage: 0x5a4d8a,
      foliageAlt: 0x9a86ff,
      skyTop: 0x120f24,
      skyBottom: 0x3b2f5e,
      fog: 0x2a2740,
      water: 0x5a3fa8,
      light: 0xb8a8ff,
      ambient: 0x4a4470,
    },
    terrain: { amplitude: 5.0, frequency: 0.03, waterLevel: -2.8 },
    props: { trees: 34, rocks: 70, grass: 40, lanterns: 22, treeKind: 'crystal' },
    spawns: [
      { monsterId: 'wraith', count: 12, at: { x: -6, z: 10 }, spread: 26 },
      { monsterId: 'stonegolem', count: 7, at: { x: 30, z: -22 }, spread: 20 },
      { monsterId: 'treelord', count: 1, at: { x: -8, z: -44 }, spread: 0 },
    ],
    npcs: [
      {
        id: 'monk',
        name: '苦行僧',
        role: 'quest',
        at: { x: 2, z: 46 },
        color: 0xe0c07a,
        lines: ['深處的樹妖王已成氣候。', '若你有此膽識，便去斬了牠。'],
        questId: 'q4',
      },
    ],
    portals: [{ at: { x: 6, z: 54 }, toZone: 'canyon', toPos: { x: 44, z: 44 }, label: '赤炎峽谷' }],
  },
};

export const ZONE_LIST = Object.values(ZONES);

export function zoneDef(id: string): ZoneDef {
  return ZONES[id] ?? ZONES.qingyun;
}
