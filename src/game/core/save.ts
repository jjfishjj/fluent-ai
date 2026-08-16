import { CLASSES } from '../data/classes';
import { newProfile } from './world';
import type { PlayerProfile } from './types';

const KEY = 'xianjing.save.v1';

interface SaveFile {
  version: 1;
  savedAt: number;
  profile: PlayerProfile;
}

function storage(): Storage | undefined {
  try {
    return typeof window !== 'undefined' ? window.localStorage : undefined;
  } catch {
    // Private browsing or a blocked origin — play without persistence.
    return undefined;
  }
}

export function saveProfile(profile: PlayerProfile) {
  const store = storage();
  if (!store) return;
  const file: SaveFile = { version: 1, savedAt: Date.now(), profile };
  try {
    store.setItem(KEY, JSON.stringify(file));
  } catch {
    /* quota exceeded — losing the save is preferable to breaking the game loop */
  }
}

export function loadProfile(): PlayerProfile | undefined {
  const store = storage();
  if (!store) return undefined;
  try {
    const raw = store.getItem(KEY);
    if (!raw) return undefined;
    const file = JSON.parse(raw) as SaveFile;
    if (file?.version !== 1 || !file.profile) return undefined;
    return normalise(file.profile);
  } catch {
    return undefined;
  }
}

export function clearProfile() {
  storage()?.removeItem(KEY);
}

export function hasSave(): boolean {
  return !!storage()?.getItem(KEY);
}

/** Fill in anything a save from an older build might be missing. */
function normalise(p: Partial<PlayerProfile>): PlayerProfile {
  const classId = p.classId && CLASSES[p.classId] ? p.classId : 'sword';
  const base = newProfile(p.name?.trim() || '無名俠客', classId);
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
