const KEY = 'chocorace.records.v1';

export interface TrackRecord {
  /** Best finishing time for the full race, in seconds. */
  bestRace: number;
  /** Best single lap, in seconds. */
  bestLap: number;
  /** Best finishing position, 1 = win. */
  bestPlace: number;
  birdId: string;
  races: number;
  wins: number;
}

export type RecordBook = Record<string, TrackRecord>;

function storage(): Storage | undefined {
  try {
    return typeof window !== 'undefined' ? window.localStorage : undefined;
  } catch {
    // Private browsing or a blocked origin — play without persistence.
    return undefined;
  }
}

export function loadRecords(): RecordBook {
  const store = storage();
  if (!store) return {};
  try {
    const raw = store.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as RecordBook;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export interface RaceResult {
  trackId: string;
  birdId: string;
  place: number;
  finishTime: number;
  bestLap: number;
}

/** Merges a finished race into the record book and reports what improved. */
export function saveResult(result: RaceResult): {
  records: RecordBook;
  newRaceRecord: boolean;
  newLapRecord: boolean;
} {
  const records = loadRecords();
  const prev = records[result.trackId];
  const newRaceRecord = result.finishTime > 0 && (!prev || result.finishTime < prev.bestRace);
  const newLapRecord = result.bestLap > 0 && (!prev || prev.bestLap === 0 || result.bestLap < prev.bestLap);

  records[result.trackId] = {
    bestRace: newRaceRecord ? result.finishTime : prev?.bestRace ?? 0,
    bestLap: newLapRecord ? result.bestLap : prev?.bestLap ?? 0,
    bestPlace: prev ? Math.min(prev.bestPlace, result.place) : result.place,
    birdId: newRaceRecord ? result.birdId : prev?.birdId ?? result.birdId,
    races: (prev?.races ?? 0) + 1,
    wins: (prev?.wins ?? 0) + (result.place === 1 ? 1 : 0),
  };

  try {
    storage()?.setItem(KEY, JSON.stringify(records));
  } catch {
    /* quota exceeded — the run still counted, it just will not be remembered */
  }
  return { records, newRaceRecord, newLapRecord };
}

export function clearRecords(): void {
  storage()?.removeItem(KEY);
}

/** m:ss.mmm, the format every racing game uses for a reason. */
export function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '--:--.---';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${m}:${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
}
