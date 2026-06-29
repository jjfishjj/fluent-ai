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
