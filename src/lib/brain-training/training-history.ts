/**
 * Persists brain-training session results per user and provides
 * quantified analytics (trends, per-game stats, brain-state correlation).
 * Key: `fluent_training_history_<userId>`
 */

import { BrainState, BandPowers } from '@/lib/brainwave/types';

export type TrainingGame = 'nback' | 'attention' | 'speed';

export interface TrainingRecord {
  game: TrainingGame;
  accuracy: number;                 // 0–100, comparable across games
  detail: Record<string, number>;   // game-specific metrics (reactionMs, etc.)
  brainState: BrainState;           // inferred/measured state at play time
  bands: BandPowers;                // band-power snapshot at play time
  timestamp: string;                // ISO
}

const MAX_RECORDS = 200;

function storageKey(userId: string) {
  return `fluent_training_history_${userId}`;
}

export function loadHistory(userId: string): TrainingRecord[] {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('[training-history] Failed to parse stored history; resetting.', e);
  }
  return [];
}

export function saveRecord(userId: string, record: TrainingRecord): TrainingRecord[] {
  const history = loadHistory(userId);
  history.push(record);
  const trimmed = history.length > MAX_RECORDS ? history.slice(-MAX_RECORDS) : history;
  localStorage.setItem(storageKey(userId), JSON.stringify(trimmed));
  return trimmed;
}

export function clearHistory(userId: string): void {
  localStorage.removeItem(storageKey(userId));
}

export interface GameStats {
  count: number;
  best: number;
  average: number;
  latest: number;
  /** latest − first (improvement over time), null if < 2 sessions */
  trend: number | null;
}

export function getGameStats(history: TrainingRecord[], game: TrainingGame): GameStats {
  const rows = history.filter(r => r.game === game);
  if (rows.length === 0) {
    return { count: 0, best: 0, average: 0, latest: 0, trend: null };
  }
  const accuracies = rows.map(r => r.accuracy);
  const sum = accuracies.reduce((a, b) => a + b, 0);
  return {
    count: rows.length,
    best: Math.max(...accuracies),
    average: Math.round(sum / rows.length),
    latest: accuracies[accuracies.length - 1],
    trend: rows.length >= 2 ? accuracies[accuracies.length - 1] - accuracies[0] : null,
  };
}

export interface BrainStateBreakdown {
  state: BrainState;
  count: number;
  avgAccuracy: number;
}

/**
 * Average training accuracy grouped by the brain state recorded at play time.
 * Surfaces which brain state yields the strongest cognitive performance.
 */
export function getBrainStateBreakdown(history: TrainingRecord[]): BrainStateBreakdown[] {
  const groups = new Map<BrainState, number[]>();
  for (const r of history) {
    const arr = groups.get(r.brainState) ?? [];
    arr.push(r.accuracy);
    groups.set(r.brainState, arr);
  }
  return [...groups.entries()]
    .map(([state, accs]) => ({
      state,
      count: accs.length,
      avgAccuracy: Math.round(accs.reduce((a, b) => a + b, 0) / accs.length),
    }))
    .sort((a, b) => b.avgAccuracy - a.avgAccuracy);
}

/**
 * Quantified focus index from band powers: beta-driven engagement relative to
 * relaxed/drowsy bands. Range roughly 0–100 (higher = more focused/alert).
 */
export function getFocusIndex(bands: BandPowers): number {
  const denom = bands.alpha + bands.theta + bands.delta;
  if (denom <= 0) return 0;
  const ratio = (bands.beta + bands.gamma) / denom;
  return Math.round(Math.min(100, ratio * 100));
}

const GAME_LABELS: Record<TrainingGame, string> = {
  nback: '工作記憶',
  attention: '注意力',
  speed: '處理速度',
};

export function gameLabel(game: TrainingGame): string {
  return GAME_LABELS[game];
}
