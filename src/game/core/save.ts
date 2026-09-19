import { XIANXIA_PACK } from '../data/xianxia-pack';
import type { ContentPack } from './content';
import { newProfile } from './world';
import type { PlayerProfile } from './types';



interface SaveFile {
  version: 1;
  savedAt: number;
  profile: PlayerProfile;
}

/** Each campaign gets its own save slot. */
function keyFor(pack: ContentPack): string {
  return `game.save.v1.${pack.id}`;
}

function storage(): Storage | undefined {
  try {
    return typeof window !== 'undefined' ? window.localStorage : undefined;
  } catch {
    // Private browsing or a blocked origin — play without persistence.
    return undefined;
  }
}

export function saveProfile(profile: PlayerProfile, pack: ContentPack = XIANXIA_PACK) {
  const store = storage();
  if (!store) return;
  const file: SaveFile = { version: 1, savedAt: Date.now(), profile };
  try {
    store.setItem(keyFor(pack), JSON.stringify(file));
  } catch {
    /* quota exceeded — losing the save is preferable to breaking the game loop */
  }
}

export function loadProfile(pack: ContentPack = XIANXIA_PACK): PlayerProfile | undefined {
  const store = storage();
  if (!store) return undefined;
  try {
    const raw = store.getItem(keyFor(pack));
    if (!raw) return undefined;
    const file = JSON.parse(raw) as SaveFile;
    if (file?.version !== 1 || !file.profile) return undefined;
    return normalise(file.profile, pack);
  } catch {
    return undefined;
  }
}

export function clearProfile(pack: ContentPack = XIANXIA_PACK) {
  storage()?.removeItem(keyFor(pack));
}

export function hasSave(pack: ContentPack = XIANXIA_PACK): boolean {
  return !!storage()?.getItem(keyFor(pack));
}

/** Fill in anything a save from an older build might be missing. */
function normalise(p: Partial<PlayerProfile>, pack: ContentPack): PlayerProfile {
  const classId = p.classId && pack.classes[p.classId] ? p.classId : pack.defaultClass;
  const base = newProfile(p.name?.trim() || '無名俠客', classId, pack);
  return {
    ...base,
    ...p,
    classId,
    stats: { ...base.stats, ...(p.stats ?? {}) },
    equipment: { ...(p.equipment ?? {}) },
    inventory: Array.isArray(p.inventory) ? p.inventory.filter((s) => s && s.itemId && s.qty > 0) : base.inventory,
    learned: { ...(p.learned ?? base.learned) },
    quests: Array.isArray(p.quests) ? p.quests : [],
    kills: p.kills ?? {},
    pos: p.pos ?? base.pos,
    zone: p.zone ?? base.zone,
  };
}
