/**
 * Stores completed material IDs and progress per user.
 * Key: `fluent_material_progress_<userId>`
 */

export interface MaterialProgress {
  completed: string[];      // material IDs
  lastUsed: Record<string, string>; // materialId → ISO date
}

function storageKey(userId: string) {
  return `fluent_material_progress_${userId}`;
}

export function loadProgress(userId: string): MaterialProgress {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('[material-progress] Failed to parse stored progress; resetting.', e);
    // Do NOT write back here — let the caller decide whether to persist
  }
  return { completed: [], lastUsed: {} };
}

export function saveProgress(userId: string, progress: MaterialProgress): void {
  localStorage.setItem(storageKey(userId), JSON.stringify(progress));
}

export function markCompleted(userId: string, materialId: string): MaterialProgress {
  const prog = loadProgress(userId);
  if (!prog.completed.includes(materialId)) {
    prog.completed.push(materialId);
  }
  prog.lastUsed[materialId] = new Date().toISOString();
  saveProgress(userId, prog);
  return prog;
}

export function markUsed(userId: string, materialId: string): void {
  const prog = loadProgress(userId);
  prog.lastUsed[materialId] = new Date().toISOString();
  saveProgress(userId, prog);
}

