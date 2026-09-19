import type { ClassDef, ClassId, ItemDef, MonsterDef, QuestDef, SkillDef, Vec2, ZoneDef } from './types';

/**
 * Everything that makes one campaign different from another.
 *
 * The simulation in `world.ts` reads all of its content through a pack, so the
 * same engine can run the 仙境 campaign and the 通譯官 campaign side by side
 * without either knowing about the other.
 */
export interface ContentPack {
  id: string;
  name: string;
  classes: Record<string, ClassDef>;
  skills: Record<string, SkillDef>;
  monsters: Record<string, MonsterDef>;
  items: Record<string, ItemDef>;
  zones: Record<string, ZoneDef>;
  quests: Record<string, QuestDef>;
  /** Where a brand new character starts. */
  start: { zone: string; pos: Vec2 };
  /** What a brand new character carries. */
  startingKit: { itemId: string; qty: number }[];
  startingSilver: number;
  /** Fallback class for saves that name one the pack does not have. */
  defaultClass: ClassId;
  /** Currency label shown in the HUD. */
  currency: string;
  /** Item ids the campaign's merchant sells. */
  shop: string[];
  /** Fallback language when a zone does not name one. */
  language?: string;
  /** True when enemies are resolved through question-driven encounters
   *  instead of realtime auto-attacks. */
  turnBased?: boolean;
}

/** Convenience accessors that never throw on unknown ids. */
export function classOf(pack: ContentPack, id: ClassId | undefined): ClassDef {
  return pack.classes[id ?? ''] ?? pack.classes[pack.defaultClass] ?? Object.values(pack.classes)[0];
}

export function skillOf(pack: ContentPack, id: string): SkillDef | undefined {
  return pack.skills[id];
}

export function monsterOf(pack: ContentPack, id: string | undefined): MonsterDef | undefined {
  return id ? pack.monsters[id] : undefined;
}

export function itemOf(pack: ContentPack, id: string | undefined): ItemDef | undefined {
  return id ? pack.items[id] : undefined;
}

export function questOf(pack: ContentPack, id: string): QuestDef | undefined {
  return pack.quests[id];
}

export function zoneOf(pack: ContentPack, id: string): ZoneDef {
  return pack.zones[id] ?? pack.zones[pack.start.zone] ?? Object.values(pack.zones)[0];
}
