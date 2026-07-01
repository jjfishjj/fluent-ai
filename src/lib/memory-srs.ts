// Spaced-repetition memory cards, per user, in localStorage.
// The review interval schedule is type-specific (see genius-plan.ts) — this is
// what turns the "training plan" into a daily, self-scheduling loop.
// Key: `fluent_memory_cards_<userId>`

export type Grade = 'again' | 'good';

export interface ReviewLog { date: string; grade: Grade; }

export interface MemoryItem {
  id: string;
  english: string;
  meaning: string;
  encodeNote?: string;      // type-specific encoding payload (scene / frame / image …)
  intervalIndex: number;    // position in the type's schedule
  nextReviewAt: string;     // ISO — due when <= now
  status: 'learning' | 'mastered';
  createdAt: string;
  history: ReviewLog[];
}

const DAY = 86400000;
const key = (userId: string) => `fluent_memory_cards_${userId}`;
const iso = (ms: number) => new Date(ms).toISOString();

export function loadCards(userId: string): MemoryItem[] {
  try {
    const raw = localStorage.getItem(key(userId));
    if (raw) return JSON.parse(raw) as MemoryItem[];
  } catch (e) {
    console.warn('[memory-srs] failed to parse cards; resetting view (not persisting).', e);
  }
  return [];
}

export function saveCards(userId: string, cards: MemoryItem[]): void {
  localStorage.setItem(key(userId), JSON.stringify(cards));
}

export function addCard(
  userId: string,
  data: { english: string; meaning: string; encodeNote?: string },
): MemoryItem[] {
  const cards = loadCards(userId);
  const now = Date.now();
  cards.unshift({
    id: `${now}-${Math.round(now % 100000)}`,
    english: data.english.trim(),
    meaning: data.meaning.trim(),
    encodeNote: data.encodeNote?.trim() || undefined,
    intervalIndex: 0,
    nextReviewAt: iso(now),   // due immediately (first review today)
    status: 'learning',
    createdAt: iso(now),
    history: [],
  });
  saveCards(userId, cards);
  return cards;
}

export function deleteCard(userId: string, id: string): MemoryItem[] {
  const cards = loadCards(userId).filter(c => c.id !== id);
  saveCards(userId, cards);
  return cards;
}

/** Cards due for review now, oldest-due first. */
export function dueCards(cards: MemoryItem[]): MemoryItem[] {
  const now = Date.now();
  return cards
    .filter(c => new Date(c.nextReviewAt).getTime() <= now)
    .sort((a, b) => new Date(a.nextReviewAt).getTime() - new Date(b.nextReviewAt).getTime());
}

/**
 * Grade a card and reschedule using the type's spaced-repetition schedule.
 * - good: advance one interval (mastered when past the last step)
 * - again: reset to the first interval, due again tomorrow
 */
export function reviewCard(
  userId: string,
  id: string,
  grade: Grade,
  schedule: number[],
): MemoryItem[] {
  const cards = loadCards(userId);
  const it = cards.find(c => c.id === id);
  if (!it) return cards;
  const now = Date.now();

  if (grade === 'good') {
    const idx = it.intervalIndex + 1;
    it.intervalIndex = idx;
    if (idx >= schedule.length) {
      it.status = 'mastered';
      it.nextReviewAt = iso(now + schedule[schedule.length - 1] * 2 * DAY);
    } else {
      it.status = 'learning';
      it.nextReviewAt = iso(now + schedule[idx] * DAY);
    }
  } else {
    it.intervalIndex = 0;
    it.status = 'learning';
    it.nextReviewAt = iso(now + DAY);
  }
  it.history.push({ date: iso(now), grade });
  saveCards(userId, cards);
  return cards;
}

export interface SrsStats { total: number; due: number; learning: number; mastered: number; }

export function stats(cards: MemoryItem[]): SrsStats {
  return {
    total: cards.length,
    due: dueCards(cards).length,
    learning: cards.filter(c => c.status === 'learning').length,
    mastered: cards.filter(c => c.status === 'mastered').length,
  };
}

/** Human-friendly "due in" label. */
export function dueLabel(nextReviewAt: string): string {
  const diff = new Date(nextReviewAt).getTime() - Date.now();
  if (diff <= 0) return '待複習';
  const days = Math.ceil(diff / DAY);
  if (days <= 1) return '明天';
  return `${days} 天後`;
}
