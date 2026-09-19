import type { ClassDef, ClassId } from '../core/types';

/** The four starting paths of the 青雲 sect. */
export const CLASSES: Record<ClassId, ClassDef> = {
  sword: {
    id: 'sword',
    icon: '⚔️',
    name: '劍俠',
    title: '御劍破敵',
    description: '近身劍修，血厚攻高，靠連斬與旋風掃開怪群。新手最好上手的職業。',
    color: 0x2f6fb3,
    accent: 0xd7e6ff,
    baseStats: { str: 8, agi: 5, vit: 7, int: 1, dex: 4, luk: 3 },
    hpFactor: 1.25,
    spFactor: 0.7,
    attackRange: 2.2,
    weapon: 'blade',
    skills: ['slash', 'whirl', 'ironskin', 'dragonrush'],
  },
  talisman: {
    id: 'talisman',
    icon: '🔥',
    name: '符籙師',
    title: '引雷焚山',
    description: '遠程法系，符咒範圍爆發極高，但體質脆弱，需拉開距離放招。',
    color: 0x8b4fd6,
    accent: 0xffe08a,
    baseStats: { str: 2, agi: 4, vit: 3, int: 10, dex: 6, luk: 3 },
    hpFactor: 0.8,
    spFactor: 1.6,
    attackRange: 8,
    weapon: 'talisman',
    skills: ['firetalisman', 'thunderfield', 'frostseal', 'meteor'],
  },
  archer: {
    id: 'archer',
    icon: '🏹',
    name: '御風獵手',
    title: '百步穿楊',
    description: '遠程物理，攻速與爆擊見長，機動性最好，適合放風箏打法。',
    color: 0x2f9e6b,
    accent: 0xe8f7c8,
    baseStats: { str: 4, agi: 9, vit: 4, int: 2, dex: 9, luk: 5 },
    hpFactor: 0.95,
    spFactor: 1.0,
    attackRange: 10,
    weapon: 'bow',
    skills: ['doubleshot', 'windstep', 'arrowrain', 'piercing'],
  },
  healer: {
    id: 'healer',
    icon: '✨',
    name: '丹霞醫者',
    title: '懸壺濟世',
    description: '輔助職業，自帶治療與護體神咒，續戰力最強，單體輸出偏低。',
    color: 0xd9633f,
    accent: 0xfff0d0,
    baseStats: { str: 3, agi: 4, vit: 6, int: 8, dex: 5, luk: 4 },
    hpFactor: 1.05,
    spFactor: 1.4,
    attackRange: 7,
    weapon: 'staff',
    skills: ['holystrike', 'mend', 'blessing', 'sanctuary'],
  },
};

export const CLASS_LIST: ClassDef[] = [CLASSES.sword, CLASSES.talisman, CLASSES.archer, CLASSES.healer];

export function classDef(id: ClassId): ClassDef {
  return CLASSES[id] ?? CLASSES.sword;
}
