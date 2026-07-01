import { MGResult } from './types';

const key = (userId: string) => `fluent_memory_genius_${userId}`;

export function saveMGResult(userId: string, result: MGResult): void {
  localStorage.setItem(key(userId), JSON.stringify(result));
}

export function loadMGResult(userId: string): MGResult | null {
  try {
    const raw = localStorage.getItem(key(userId));
    return raw ? (JSON.parse(raw) as MGResult) : null;
  } catch {
    return null;
  }
}

export function clearMGResult(userId: string): void {
  localStorage.removeItem(key(userId));
}
