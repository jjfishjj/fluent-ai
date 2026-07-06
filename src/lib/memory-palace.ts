// Memory palace (method of loci) — a spatial visualization surface, the
// 圖像家 / VISIONARY type's signature technique. Per-user, localStorage.
// Key: `fluent_memory_palace_<userId>`

export interface Locus {
  id: string;
  place: string;    // e.g. 門口 / 書桌
  english: string;  // the word placed here (optional until filled)
  meaning: string;
  image: string;    // vivid visual note tying the word to the place
  imageUrl?: string; // AI-generated picture for this locus
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

const key = (userId: string) => `fluent_memory_palace_${userId}`;
let seq = 0;
const uid = () => `${Date.now().toString(36)}-${(seq++).toString(36)}`;

export function newLocus(place = ''): Locus {
  return { id: uid(), place, english: '', meaning: '', image: '' };
}

export function loadPalace(userId: string): Palace | null {
  try {
    const raw = localStorage.getItem(key(userId));
    return raw ? (JSON.parse(raw) as Palace) : null;
  } catch {
    return null;
  }
}

export function savePalace(userId: string, palace: Palace): boolean {
  try {
    localStorage.setItem(key(userId), JSON.stringify(palace));
    return true;
  } catch (e) {
    // e.g. quota exceeded when many generated images are data-URIs
    console.warn('[memory-palace] save failed (quota?)', e);
    return false;
  }
}

export function clearPalace(userId: string): void {
  localStorage.removeItem(key(userId));
}

export function createPalace(name: string, placeNames: string[]): Palace {
  return {
    id: uid(),
    name: name.trim() || '我的記憶宮殿',
    loci: placeNames.map(p => newLocus(p)),
    createdAt: new Date().toISOString(),
  };
}

/** Loci that actually have a word placed — the ones a walk-through visits. */
export function filledLoci(palace: Palace): Locus[] {
  return palace.loci.filter(l => l.english.trim());
}
