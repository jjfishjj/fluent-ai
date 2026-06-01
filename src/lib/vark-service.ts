import { VARKProfile, EMPTY_VARK_PROFILE } from './vark-analyzer';

const storageKey = (userId: string) => `fluent_vark_${userId}`;

export function loadVARKProfile(userId: string): VARKProfile {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return { ...EMPTY_VARK_PROFILE, scores: { visual: 0, auditory: 0, reading: 0, kinesthetic: 0 } };
    return JSON.parse(raw) as VARKProfile;
  } catch {
    return { ...EMPTY_VARK_PROFILE, scores: { visual: 0, auditory: 0, reading: 0, kinesthetic: 0 } };
  }
}

export function saveVARKProfile(userId: string, profile: VARKProfile): void {
  localStorage.setItem(storageKey(userId), JSON.stringify(profile));
}
