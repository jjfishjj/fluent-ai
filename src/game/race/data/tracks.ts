import type { TrackDef } from '../core/types';
import { NATIONS, nationTrack } from './nations';

/**
 * Courses are nations: every entry is one host country's circuit, built from a
 * shared layout plus that nation's palette. Keeping this map means the racing
 * core never has to know about languages or the campaign.
 */
export const TRACKS: Record<string, TrackDef> = Object.fromEntries(
  Object.values(NATIONS).map((def) => [def.id, nationTrack(def)]),
);

export const TRACK_IDS = Object.keys(TRACKS);

export function trackDef(id: string): TrackDef {
  return TRACKS[id] ?? TRACKS.britain;
}
