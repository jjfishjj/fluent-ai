import { GENIUS_INFO, type GeniusType } from '@/lib/genius-type';
import type { ClassDef } from '../../core/types';

/**
 * The eight classes are the app's eight memory-genius types.
 *
 * The player does not choose one in the game — it is read from the quiz result
 * they already have. Your character *is* your learning profile, which is what
 * makes this a fluent-ai mode rather than a game that happens to live here.
 */

function hex(color: string): number {
  return parseInt(color.replace('#', ''), 16);
}

interface Blueprint {
  title: string;
  description: string;
  /** Leans physical (fast recall) or mental (deep encoding). */
  stats: ClassDef['baseStats'];
  hpFactor: number;
  spFactor: number;
  skills: string[];
  accent: number;
  weapon: ClassDef['weapon'];
}

const BLUEPRINTS: Record<GeniusType, Blueprint> = {
  explorer: {
    title: '走過就記得',
    description: '動覺型。靠移動與體驗記憶，續航力強，適合長時間的實地談判。',
    stats: { str: 6, agi: 8, vit: 7, int: 5, dex: 6, luk: 4 },
    hpFactor: 1.2,
    spFactor: 0.9,
    skills: ['fieldnote', 'pace', 'muscle', 'immersion'],
    accent: 0xbfd8ff,
    weapon: 'blade',
  },
  architect: {
    title: '記憶宮殿的主人',
    description: '讀寫型。擅長把資訊放進空間結構，排除干擾的能力最強。',
    stats: { str: 3, agi: 5, vit: 5, int: 10, dex: 7, luk: 4 },
    hpFactor: 0.95,
    spFactor: 1.5,
    skills: ['palace', 'blueprint', 'index', 'archive'],
    accent: 0xd9c8ff,
    weapon: 'staff',
  },
  melodist: {
    title: '聽見語言的節奏',
    description: '聽覺型。用聲音與韻律記憶，對發音與語調的直覺最準。',
    stats: { str: 4, agi: 7, vit: 5, int: 8, dex: 6, luk: 5 },
    hpFactor: 1.0,
    spFactor: 1.3,
    skills: ['rhyme', 'cadence', 'echo', 'chorus'],
    accent: 0xffd8a8,
    weapon: 'talisman',
  },
  narrator: {
    title: '把單字串成故事',
    description: '聽覺＋動覺。用敘事串接零散資訊，連續答對時爆發力最高。',
    stats: { str: 5, agi: 6, vit: 6, int: 8, dex: 5, luk: 5 },
    hpFactor: 1.05,
    spFactor: 1.25,
    skills: ['story', 'thread', 'cliffhanger', 'epilogue'],
    accent: 0xfff0a8,
    weapon: 'talisman',
  },
  connector: {
    title: '看見字與字的關係',
    description: '聽覺＋讀寫。靠語源與詞族連結記憶，最擅長舉一反三。',
    stats: { str: 4, agi: 6, vit: 6, int: 9, dex: 6, luk: 4 },
    hpFactor: 1.0,
    spFactor: 1.35,
    skills: ['etymology', 'web', 'cognate', 'synthesis'],
    accent: 0xb8f0c8,
    weapon: 'staff',
  },
  analyst: {
    title: '拆解到最小單位',
    description: '讀寫＋動覺。用規則與結構分析語言，抗壓性與防禦最好。',
    stats: { str: 6, agi: 5, vit: 8, int: 8, dex: 6, luk: 3 },
    hpFactor: 1.15,
    spFactor: 1.15,
    skills: ['parse', 'rule', 'contrast', 'proof'],
    accent: 0xffc0c0,
    weapon: 'blade',
  },
  performer: {
    title: '用身體記住語言',
    description: '動覺＋聽覺。靠演練與模仿記憶，反應速度最快。',
    stats: { str: 6, agi: 9, vit: 6, int: 6, dex: 7, luk: 5 },
    hpFactor: 1.1,
    spFactor: 1.0,
    skills: ['shadowing', 'gesture', 'improv', 'standing'],
    accent: 0xffc8e0,
    weapon: 'bow',
  },
  visionary: {
    title: '把字變成畫面',
    description: '視覺型。以圖像編碼記憶，看穿選項陷阱的能力最強。',
    stats: { str: 4, agi: 6, vit: 5, int: 9, dex: 8, luk: 5 },
    hpFactor: 0.95,
    spFactor: 1.4,
    skills: ['imagery', 'colourcode', 'snapshot', 'panorama'],
    accent: 0xffd0a0,
    weapon: 'bow',
  },
};

export const INTERPRETER_CLASSES: Record<string, ClassDef> = Object.fromEntries(
  (Object.keys(BLUEPRINTS) as GeniusType[]).map((type) => {
    const info = GENIUS_INFO[type];
    const bp = BLUEPRINTS[type];
    return [
      type,
      {
        id: type,
        name: info.nameZh,
        title: bp.title,
        description: `${bp.description}（${info.vark}・${info.brainwave}）`,
        color: hex(info.color),
        accent: bp.accent,
        baseStats: bp.stats,
        hpFactor: bp.hpFactor,
        spFactor: bp.spFactor,
        // Turn-based packs never auto-attack, but the renderer still uses this
        // to decide how close the character stands.
        attackRange: 2.4,
        weapon: bp.weapon,
        skills: bp.skills,
        icon: info.emoji,
      } satisfies ClassDef,
    ];
  }),
);

export const INTERPRETER_CLASS_LIST = Object.values(INTERPRETER_CLASSES);

/** The emoji shown on the HUD portrait for each type. */
export function geniusEmoji(type: string): string {
  return GENIUS_INFO[type as GeniusType]?.emoji ?? '🎧';
}
