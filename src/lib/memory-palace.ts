// Memory palace (method of loci) — a spatial visualization surface.
// Per-user, localStorage. Supports multiple palaces.
// List key: `fluent_memory_palaces_<userId>`

export interface Locus {
  id: string;
  place: string;
  english: string;
  meaning: string;
  image: string;
  imageUrl?: string;
}

export interface Palace {
  id: string;
  name: string;
  loci: Locus[];
  createdAt: string;
}

export const TEMPLATES: { name: string; loci: string[] }[] = [
  { name: '我的房間', loci: ['門口', '書桌', '窗邊', '床', '衣櫃', '書架'] },
  { name: '通勤路線', loci: ['家門', '電梯', '公車站', '便利商店', '車站', '辦公室門口'] },
  { name: '常去的咖啡廳', loci: ['入口', '櫃檯', '靠窗座位', '書架', '沙發區', '洗手間'] },
];

const legacyKey = (userId: string) => `fluent_memory_palace_${userId}`;
const listKey   = (userId: string) => `fluent_memory_palaces_${userId}`;
let seq = 0;
const genId = () => `${Date.now().toString(36)}-${(seq++).toString(36)}`;

export function newLocus(place = ''): Locus {
  return { id: genId(), place, english: '', meaning: '', image: '' };
}

export function createPalace(name: string, placeNames: string[]): Palace {
  return {
    id: genId(),
    name: name.trim() || '我的記憶宮殿',
    loci: placeNames.map(p => newLocus(p)),
    createdAt: new Date().toISOString(),
  };
}

// ── Multi-palace list API ──────────────────────────────────────────────────

export function loadPalaces(userId: string): Palace[] {
  try {
    const raw = localStorage.getItem(listKey(userId));
    if (raw) return JSON.parse(raw) as Palace[];
    // migrate legacy single palace
    const legacy = localStorage.getItem(legacyKey(userId));
    if (legacy) {
      const p = JSON.parse(legacy) as Palace;
      savePalaces(userId, [p]);
      localStorage.removeItem(legacyKey(userId));
      return [p];
    }
  } catch { /* ignore */ }
  return [];
}

export function savePalaces(userId: string, palaces: Palace[]): boolean {
  try {
    localStorage.setItem(listKey(userId), JSON.stringify(palaces));
    return true;
  } catch (e) {
    console.warn('[memory-palace] save failed (quota?)', e);
    return false;
  }
}

export function upsertPalace(userId: string, palace: Palace): boolean {
  const list = loadPalaces(userId);
  const idx = list.findIndex(p => p.id === palace.id);
  if (idx >= 0) list[idx] = palace; else list.push(palace);
  return savePalaces(userId, list);
}

export function deletePalace(userId: string, palaceId: string): void {
  savePalaces(userId, loadPalaces(userId).filter(p => p.id !== palaceId));
}

// ── Backward-compat shims ──────────────────────────────────────────────────

export function loadPalace(userId: string): Palace | null {
  const list = loadPalaces(userId);
  return list.length ? list[0] : null;
}

export function savePalace(userId: string, palace: Palace): boolean {
  return upsertPalace(userId, palace);
}

export function clearPalace(userId: string): void {
  const p = loadPalace(userId);
  if (p) deletePalace(userId, p.id);
}

/** Loci that have a word placed — the ones a walk-through visits. */
export function filledLoci(palace: Palace): Locus[] {
  return palace.loci.filter(l => l.english.trim());
}
