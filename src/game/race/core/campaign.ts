import type { ChallengeKind, Phrase } from '../data/nations';
import { NATIONS, nation } from '../data/nations';
import type { GateRecord } from './race';

/**
 * The circuit is a diplomatic posting: you start as a trainee interpreter and
 * work up to ambassador by racing each host nation's champion and answering
 * their language gates on the way round.
 */
export interface RankDef {
  id: string;
  name: string;
  /** Diplomatic credit needed to hold this rank. */
  credits: number;
  blurb: string;
}

export const RANKS: RankDef[] = [
  { id: 'trainee', name: '見習通譯', credits: 0, blurb: '跟在代表團後面遞資料的階段。' },
  { id: 'interpreter', name: '通譯官', credits: 140, blurb: '可以獨立擔任場邊即時口譯。' },
  { id: 'attache', name: '隨行外交官', credits: 380, blurb: '開始參與正式會談的隨行席。' },
  { id: 'chief', name: '首席外交官', credits: 720, blurb: '主導雙邊議程與翻譯團隊。' },
  { id: 'envoy', name: '特使', credits: 1200, blurb: '受命處理跨國突發狀況。' },
  { id: 'ambassador', name: '大使', credits: 1800, blurb: '巡迴賽的最高頭銜。' },
];

export function rankFor(credits: number): RankDef {
  let held = RANKS[0];
  for (const rank of RANKS) if (credits >= rank.credits) held = rank;
  return held;
}

export function nextRank(credits: number): RankDef | undefined {
  return RANKS.find((rank) => rank.credits > credits);
}

export interface Stage {
  index: number;
  nationId: string;
  challenge: ChallengeKind;
  rivals: number;
  /** AI skill band, 0–2. */
  difficulty: number;
  /** Finish at or above this place to clear the stage. */
  targetPlace: number;
  /** And answer at least this share of gates correctly. */
  targetAccuracy: number;
  /** What the posting is called on the map. */
  mission: string;
}

/**
 * Eight postings. The challenge kinds escalate — recognise, then listen, then
 * the local numbers, then pure recall — so the later countries lean on
 * fluent-ai's memory training rather than on reading alone.
 */
export const STAGES: Stage[] = [
  {
    index: 0,
    nationId: 'britain',
    challenge: 'word',
    rivals: 4,
    difficulty: 0,
    targetPlace: 3,
    targetAccuracy: 0.5,
    mission: '見習任務：跟上代表團',
  },
  {
    index: 1,
    nationId: 'japan',
    challenge: 'word',
    rivals: 5,
    difficulty: 0,
    targetPlace: 3,
    targetAccuracy: 0.6,
    mission: '花見季接待：認得招呼語',
  },
  {
    index: 2,
    nationId: 'france',
    challenge: 'listen',
    rivals: 5,
    difficulty: 1,
    targetPlace: 3,
    targetAccuracy: 0.6,
    mission: '禮賓聽譯：只靠耳朵判斷',
  },
  {
    index: 3,
    nationId: 'spain',
    challenge: 'listen',
    rivals: 6,
    difficulty: 1,
    targetPlace: 2,
    targetAccuracy: 0.65,
    mission: '海岸高峰會：長彎裡聽懂指示',
  },
  {
    index: 4,
    nationId: 'germany',
    challenge: 'number',
    rivals: 6,
    difficulty: 1,
    targetPlace: 2,
    targetAccuracy: 0.65,
    mission: '議會數據場：數字不能翻錯',
  },
  {
    index: 5,
    nationId: 'korea',
    challenge: 'recall',
    rivals: 6,
    difficulty: 2,
    targetPlace: 2,
    targetAccuracy: 0.7,
    mission: '夜間閉門會：靠記憶複述順序',
  },
  {
    index: 6,
    nationId: 'arabia',
    challenge: 'recall',
    rivals: 7,
    difficulty: 2,
    targetPlace: 2,
    targetAccuracy: 0.7,
    mission: '商路調停：沙暴中記住條款順序',
  },
  {
    index: 7,
    nationId: 'russia',
    challenge: 'mixed',
    rivals: 7,
    difficulty: 2,
    targetPlace: 1,
    targetAccuracy: 0.75,
    mission: '大使資格考：四種考驗輪流上場',
  },
];

export interface Stamp {
  cleared: boolean;
  bestPlace: number;
  bestTime: number;
  bestAccuracy: number;
  races: number;
}

/** A word the player got wrong, kept so it can become a memory card. */
export interface MissedWord {
  nationId: string;
  native: string;
  roman?: string;
  meaning: string;
  /** How many times this one has caught you out. */
  misses: number;
}

export interface DiplomatProfile {
  version: 1;
  name: string;
  credits: number;
  /** Passport stamps, keyed by nation id. */
  stamps: Record<string, Stamp>;
  missed: MissedWord[];
  /** Gate answers across the whole career, for the profile card. */
  totals: { correct: number; answered: number; races: number };
}

const KEY = 'chocorace.diplomat.v1';

function storage(): Storage | undefined {
  try {
    return typeof window !== 'undefined' ? window.localStorage : undefined;
  } catch {
    // Private browsing or a blocked origin — play without persistence.
    return undefined;
  }
}

export function emptyProfile(): DiplomatProfile {
  return {
    version: 1,
    name: '無名通譯',
    credits: 0,
    stamps: {},
    missed: [],
    totals: { correct: 0, answered: 0, races: 0 },
  };
}

export function loadProfile(): DiplomatProfile {
  const store = storage();
  if (!store) return emptyProfile();
  try {
    const raw = store.getItem(KEY);
    if (!raw) return emptyProfile();
    const parsed = JSON.parse(raw) as Partial<DiplomatProfile>;
    if (!parsed || parsed.version !== 1) return emptyProfile();
    const base = emptyProfile();
    return {
      ...base,
      ...parsed,
      stamps: parsed.stamps ?? {},
      missed: Array.isArray(parsed.missed) ? parsed.missed : [],
      totals: { ...base.totals, ...(parsed.totals ?? {}) },
    };
  } catch {
    return emptyProfile();
  }
}

export function saveProfile(profile: DiplomatProfile): void {
  try {
    storage()?.setItem(KEY, JSON.stringify(profile));
  } catch {
    /* quota exceeded — the race still counted, it just is not remembered */
  }
}

export function clearProfile(): void {
  storage()?.removeItem(KEY);
}

/** A stage is open once the one before it has been cleared. */
export function isUnlocked(profile: DiplomatProfile, index: number): boolean {
  if (index <= 0) return true;
  const previous = STAGES[index - 1];
  return !!previous && !!profile.stamps[previous.nationId]?.cleared;
}

export function currentStage(profile: DiplomatProfile): Stage {
  const open = STAGES.filter((stage) => isUnlocked(profile, stage.index));
  const unfinished = open.find((stage) => !profile.stamps[stage.nationId]?.cleared);
  return unfinished ?? open[open.length - 1] ?? STAGES[0];
}

export interface RaceOutcome {
  nationId: string;
  place: number;
  entrants: number;
  finishTime: number;
  correct: number;
  answered: number;
  /** The player's gate log, used to collect words that need review. */
  log: GateRecord[];
  difficulty: number;
}

export interface CreditBreakdown {
  placement: number;
  language: number;
  clearBonus: number;
  total: number;
}

/**
 * Placing well earns credit; answering well earns more. A podium with sloppy
 * language pays about the same as mid-pack with clean language — which is the
 * balance the mode is arguing for.
 */
export function creditsFor(outcome: RaceOutcome, cleared: boolean): CreditBreakdown {
  const field = Math.max(1, outcome.entrants - 1);
  const placement = Math.round(120 * (1 - (outcome.place - 1) / field) * (0.8 + outcome.difficulty * 0.15));
  const accuracy = outcome.answered > 0 ? outcome.correct / outcome.answered : 0;
  const language = Math.round(accuracy * 130 + outcome.correct * 6);
  const clearBonus = cleared ? 90 : 0;
  return { placement, language, clearBonus, total: placement + language + clearBonus };
}

export function stageFor(nationId: string): Stage | undefined {
  return STAGES.find((stage) => stage.nationId === nationId);
}

export function meetsTargets(stage: Stage, outcome: RaceOutcome): boolean {
  const accuracy = outcome.answered > 0 ? outcome.correct / outcome.answered : 0;
  return outcome.place <= stage.targetPlace && accuracy >= stage.targetAccuracy;
}

export interface ApplyResult {
  profile: DiplomatProfile;
  credits: CreditBreakdown;
  cleared: boolean;
  /** Set when this race pushed the player into a new rank. */
  promotedTo?: RankDef;
  /** Words answered wrongly this race, newest first. */
  missedThisRace: Phrase[];
  /** The next posting, once this one is cleared. */
  unlocked?: Stage;
}

/** Folds one finished race into the career profile and persists it. */
export function applyRace(profile: DiplomatProfile, outcome: RaceOutcome): ApplyResult {
  const stage = stageFor(outcome.nationId);
  const cleared = !!stage && meetsTargets(stage, outcome);
  const credits = creditsFor(outcome, cleared && !profile.stamps[outcome.nationId]?.cleared);
  const before = rankFor(profile.credits);

  const accuracy = outcome.answered > 0 ? outcome.correct / outcome.answered : 0;
  const previous = profile.stamps[outcome.nationId];
  const stamp: Stamp = {
    cleared: cleared || !!previous?.cleared,
    bestPlace: previous ? Math.min(previous.bestPlace, outcome.place) : outcome.place,
    bestTime:
      previous && previous.bestTime > 0
        ? Math.min(previous.bestTime, outcome.finishTime)
        : outcome.finishTime,
    bestAccuracy: Math.max(previous?.bestAccuracy ?? 0, accuracy),
    races: (previous?.races ?? 0) + 1,
  };

  const missedThisRace: Phrase[] = [];
  const missed = [...profile.missed];
  for (const record of outcome.log) {
    if (record.outcome === 'correct') continue;
    missedThisRace.push(record.answer);
    const existing = missed.find(
      (word) => word.nationId === outcome.nationId && word.native === record.answer.native,
    );
    if (existing) existing.misses += 1;
    else
      missed.unshift({
        nationId: outcome.nationId,
        native: record.answer.native,
        roman: record.answer.roman,
        meaning: record.answer.meaning,
        misses: 1,
      });
  }

  const updated: DiplomatProfile = {
    ...profile,
    credits: profile.credits + credits.total,
    stamps: { ...profile.stamps, [outcome.nationId]: stamp },
    // Bound the list; the oldest slips are the least useful to drill.
    missed: missed.slice(0, 60),
    totals: {
      correct: profile.totals.correct + outcome.correct,
      answered: profile.totals.answered + outcome.answered,
      races: profile.totals.races + 1,
    },
  };
  saveProfile(updated);

  const after = rankFor(updated.credits);
  const nextStage = stage && cleared ? STAGES[stage.index + 1] : undefined;

  return {
    profile: updated,
    credits,
    cleared,
    promotedTo: after.id !== before.id ? after : undefined,
    missedThisRace,
    unlocked: nextStage,
  };
}

/** Summary line for a nation card on the circuit map. */
export function stampLabel(profile: DiplomatProfile, nationId: string): string {
  const stamp = profile.stamps[nationId];
  if (!stamp) return '尚未出訪';
  if (!stamp.cleared) return `最佳 第 ${stamp.bestPlace} 名 · 正確率 ${Math.round(stamp.bestAccuracy * 100)}%`;
  return `已通過 · 第 ${stamp.bestPlace} 名 · 正確率 ${Math.round(stamp.bestAccuracy * 100)}%`;
}

export function nationName(nationId: string): string {
  return `${nation(nationId).flag} ${NATIONS[nationId]?.name ?? nationId}`;
}
