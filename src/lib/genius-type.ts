// Reads the user's 記憶天才類型 (Memory Genius type) from the standalone quiz.
// The quiz at /quizzes/memory-genius-quiz/ is served on the SAME origin as the
// app, so its localStorage result is readable here. Used to adapt the Practice
// AI partner to the learner's talent type.

export type GeniusType =
  | 'explorer' | 'architect' | 'melodist' | 'narrator'
  | 'connector' | 'analyst' | 'performer' | 'visionary';

export interface GeniusInfo {
  type: GeniusType;
  nameZh: string;
  nameEn: string;
  emoji: string;
  vark: string;
  brainwave: string;
}

export const GENIUS_INFO: Record<GeniusType, GeniusInfo> = {
  explorer:  { type: 'explorer',  nameZh: '探索者', nameEn: 'EXPLORER',  emoji: '🔵', vark: 'K 動覺',  brainwave: 'θ 創意波' },
  architect: { type: 'architect', nameZh: '建築師', nameEn: 'ARCHITECT', emoji: '🟣', vark: 'R 讀寫',  brainwave: 'β 專注波' },
  melodist:  { type: 'melodist',  nameZh: '旋律人', nameEn: 'MELODIST',  emoji: '🟠', vark: 'A 聽覺',  brainwave: 'α 放鬆波' },
  narrator:  { type: 'narrator',  nameZh: '敘事者', nameEn: 'NARRATOR',  emoji: '🟡', vark: 'A+K',     brainwave: 'α+θ 雙波' },
  connector: { type: 'connector', nameZh: '織網者', nameEn: 'CONNECTOR', emoji: '🟢', vark: 'A+R',     brainwave: 'α 放鬆波' },
  analyst:   { type: 'analyst',   nameZh: '分析師', nameEn: 'ANALYST',   emoji: '🔴', vark: 'R+K',     brainwave: 'β 專注波' },
  performer: { type: 'performer', nameZh: '表演者', nameEn: 'PERFORMER', emoji: '🌸', vark: 'K+A',     brainwave: 'γ 警覺波' },
  visionary: { type: 'visionary', nameZh: '圖像家', nameEn: 'VISIONARY', emoji: '🔶', vark: 'V 視覺',  brainwave: 'γ 警覺波' },
};

const VALID = new Set(Object.keys(GENIUS_INFO));

/** Primary 記憶天才類型 from the standalone quiz result, or null. */
export function loadGeniusType(): GeniusType | null {
  try {
    const raw = localStorage.getItem('memo_genius_result');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { p?: string };
    if (parsed?.p && VALID.has(parsed.p)) return parsed.p as GeniusType;
  } catch {
    /* ignore */
  }
  return null;
}

export function geniusInfo(type: GeniusType | null): GeniusInfo | null {
  return type ? GENIUS_INFO[type] : null;
}

// 8 genius types → the app's VARK LearningStyle, so one quiz drives both systems.
export type VarkStyle = 'visual' | 'auditory' | 'reading' | 'kinesthetic';
export const GENIUS_TO_VARK: Record<GeniusType, VarkStyle> = {
  explorer: 'kinesthetic',
  architect: 'reading',
  melodist: 'auditory',
  narrator: 'auditory',
  connector: 'reading',
  analyst: 'reading',
  performer: 'kinesthetic',
  visionary: 'visual',
};
const VARK_VALID = new Set<VarkStyle>(['visual', 'auditory', 'reading', 'kinesthetic']);

/**
 * VARK learning style derived from the genius quiz. Prefers the `vark` field the
 * quiz stores; falls back to the type→VARK map for older results. null if untaken.
 */
export function loadGeniusVark(): VarkStyle | null {
  try {
    const raw = localStorage.getItem('memo_genius_result');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { p?: string; vark?: string };
    if (parsed?.vark && VARK_VALID.has(parsed.vark as VarkStyle)) return parsed.vark as VarkStyle;
    if (parsed?.p && VALID.has(parsed.p)) return GENIUS_TO_VARK[parsed.p as GeniusType];
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Ingest a genius type handed off from the external lead-gen quiz (memolingua
 * GitHub Pages scale) via URL params (?genius=&vark=). Stores it as the standard
 * `memo_genius_result` so loadGeniusType()/loadGeniusVark() pick it up. Because
 * that quiz is cross-origin, localStorage can't be shared directly, so the type
 * is passed through the URL and persisted here. Call once at app startup.
 */
export function ingestGeniusFromUrl(): void {
  try {
    const params = new URLSearchParams(window.location.search);
    const g = params.get('genius');
    const v = params.get('vark');
    if (g && VALID.has(g)) {
      const payload: { p: string; vark?: string; src: string } = { p: g, src: 'scale' };
      if (v && VARK_VALID.has(v as VarkStyle)) payload.vark = v;
      localStorage.setItem('memo_genius_result', JSON.stringify(payload));
    }
  } catch {
    /* ignore */
  }
}
