// Spaced-repetition memory cards, per user, in localStorage.
// The review interval schedule is type-specific (see genius-plan.ts) — this is
// what turns the "training plan" into a daily, self-scheduling loop.
// Key: `fluent_memory_cards_<userId>`

export type Grade = 'again' | 'good';

export interface ReviewLog { date: string; grade: Grade; brainState?: string; }

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
  brainState?: string,
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
  it.history.push({ date: iso(now), grade, ...(brainState && brainState !== 'neutral' ? { brainState } : {}) });
  saveCards(userId, cards);
  return cards;
}

export const BRAIN_STATE_LABEL: Record<string, string> = {
  focus: '深度專注', relaxed: '放鬆專注', creative: '創意流動', alert: '高度警覺', tired: '疲勞', neutral: '一般',
};

export interface BrainStateInsights {
  byState: { state: string; label: string; count: number; good: number; rate: number }[];
  best: { label: string; rate: number; count: number } | null;
  total: number; // reviews that carried a brain state
}

/** Retention grouped by the brain state the user was in while reviewing. */
export function brainStateInsights(cards: MemoryItem[]): BrainStateInsights {
  const logs = cards.flatMap(c => c.history || []).filter(l => l.brainState);
  const acc: Record<string, { count: number; good: number }> = {};
  logs.forEach(l => {
    const s = l.brainState as string;
    acc[s] = acc[s] || { count: 0, good: 0 };
    acc[s].count++;
    if (l.grade === 'good') acc[s].good++;
  });
  const byState = Object.entries(acc)
    .map(([state, v]) => ({ state, label: BRAIN_STATE_LABEL[state] || state, count: v.count, good: v.good, rate: v.count ? Math.round((v.good / v.count) * 100) : 0 }))
    .sort((a, b) => b.rate - a.rate || b.count - a.count);
  const eligible = byState.filter(s => s.count >= 2);
  const best = eligible.length ? { label: eligible[0].label, rate: eligible[0].rate, count: eligible[0].count } : null;
  return { byState, best, total: logs.length };
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

export interface Analytics {
  totalReviews: number;
  retention: number;      // % of reviews graded good
  streakDays: number;     // consecutive days (ending today) with ≥1 review
  reviewedToday: number;
  byDay: { date: string; count: number }[]; // last 14 days
  learning: number; mastered: number; due: number; total: number;
}

/** Aggregate review history into retention / streak / activity metrics. */
export function analytics(cards: MemoryItem[]): Analytics {
  const logs = cards.flatMap(c => c.history || []);
  const total = logs.length;
  const good = logs.filter(l => l.grade === 'good').length;
  const retention = total ? Math.round((good / total) * 100) : 0;

  // last 14 days buckets
  const byDay: { date: string; count: number }[] = [];
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    byDay.push({ date: d.toISOString().slice(0, 10), count: 0 });
  }
  const idx: Record<string, number> = {};
  byDay.forEach((d, i) => { idx[d.date] = i; });
  logs.forEach(l => {
    const k = (l.date || '').slice(0, 10);
    if (k in idx) byDay[idx[k]].count++;
  });

  const reviewedToday = byDay[byDay.length - 1].count;
  let streakDays = 0;
  for (let i = byDay.length - 1; i >= 0; i--) {
    if (byDay[i].count > 0) streakDays++;
    else break;
  }

  const s = stats(cards);
  return { totalReviews: total, retention, streakDays, reviewedToday, byDay, learning: s.learning, mastered: s.mastered, due: s.due, total: s.total };
}

export interface TimeInsights {
  byHour: number[]; // 24 review counts
  parts: { key: string; label: string; count: number; good: number; rate: number }[];
  best: { label: string; rate: number; count: number } | null;
}

/** When (time of day) the user reviews, and where they retain best. */
export function reviewTimeInsights(cards: MemoryItem[]): TimeInsights {
  const logs = cards.flatMap(c => c.history || []);
  const byHour = new Array(24).fill(0);
  const parts = [
    { key: 'morning', label: '早上 6–12', count: 0, good: 0 },
    { key: 'afternoon', label: '下午 12–18', count: 0, good: 0 },
    { key: 'evening', label: '傍晚 18–22', count: 0, good: 0 },
    { key: 'night', label: '夜間 22–6', count: 0, good: 0 },
  ];
  const partOf = (h: number) => (h >= 6 && h <= 11 ? 0 : h >= 12 && h <= 17 ? 1 : h >= 18 && h <= 21 ? 2 : 3);
  logs.forEach(l => {
    const d = new Date(l.date);
    if (isNaN(d.getTime())) return;
    const h = d.getHours();
    byHour[h]++;
    const p = parts[partOf(h)];
    p.count++;
    if (l.grade === 'good') p.good++;
  });
  const withRate = parts.map(p => ({ ...p, rate: p.count ? Math.round((p.good / p.count) * 100) : 0 }));
  const eligible = withRate.filter(p => p.count >= 2);
  const best = eligible.length
    ? (() => {
        const b = [...eligible].sort((x, y) => y.rate - x.rate || y.count - x.count)[0];
        return { label: b.label, rate: b.rate, count: b.count };
      })()
    : null;
  return { byHour, parts: withRate, best };
}

/** Human-friendly "due in" label. */
export function dueLabel(nextReviewAt: string): string {
  const diff = new Date(nextReviewAt).getTime() - Date.now();
  if (diff <= 0) return '待複習';
  const days = Math.ceil(diff / DAY);
  if (days <= 1) return '明天';
  return `${days} 天後`;
}
