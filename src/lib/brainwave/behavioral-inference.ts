import { BrainState, BandPowers } from './types';

export interface BehaviorSignals {
  hourOfDay: number;            // 0–23
  sessionDurationMin: number;   // current session length
  messageCount: number;         // messages sent this session
  avgResponseChars: number;     // avg length of user messages
  recentErrorRate: number;      // 0–1 (grammar/vocab error rate)
  daysSinceLastSession: number; // days since last practice
  consecutiveDays: number;      // streak length
}

export interface InferredBrainState {
  state: BrainState;
  confidence: number;    // 0–1
  bands: BandPowers;
  reasoning: string;
  reasoningZh: string;
  nextBestTime?: string;
  nextBestTimeZh?: string;
}

// Circadian rhythm baseline: hour → expected dominant band
const CIRCADIAN_BANDS: Record<number, Partial<BandPowers>> = {
  5:  { theta: 0.30, alpha: 0.30, beta: 0.20, delta: 0.15, gamma: 0.05 }, // early morning: creative
  6:  { theta: 0.25, alpha: 0.32, beta: 0.25, delta: 0.12, gamma: 0.06 },
  7:  { alpha: 0.32, beta: 0.30, theta: 0.20, delta: 0.10, gamma: 0.08 }, // rising alertness
  8:  { beta: 0.35, alpha: 0.28, theta: 0.18, delta: 0.08, gamma: 0.11 }, // morning focus starts
  9:  { beta: 0.40, alpha: 0.25, theta: 0.15, delta: 0.07, gamma: 0.13 }, // peak morning focus
  10: { beta: 0.42, alpha: 0.24, theta: 0.14, delta: 0.07, gamma: 0.13 },
  11: { beta: 0.40, alpha: 0.26, theta: 0.14, delta: 0.07, gamma: 0.13 },
  12: { beta: 0.32, alpha: 0.30, theta: 0.20, delta: 0.10, gamma: 0.08 }, // post-lunch dip
  13: { alpha: 0.33, beta: 0.28, theta: 0.22, delta: 0.12, gamma: 0.05 }, // post-lunch alpha/theta
  14: { beta: 0.35, alpha: 0.28, theta: 0.18, delta: 0.10, gamma: 0.09 }, // afternoon recovery
  15: { beta: 0.38, alpha: 0.26, theta: 0.17, delta: 0.08, gamma: 0.11 }, // second wind
  16: { beta: 0.36, alpha: 0.27, theta: 0.17, delta: 0.09, gamma: 0.11 },
  17: { alpha: 0.32, beta: 0.30, theta: 0.20, delta: 0.10, gamma: 0.08 }, // winding down
  18: { alpha: 0.35, beta: 0.27, theta: 0.22, delta: 0.10, gamma: 0.06 }, // relaxed evening
  19: { alpha: 0.36, beta: 0.24, theta: 0.25, delta: 0.11, gamma: 0.04 },
  20: { theta: 0.30, alpha: 0.33, beta: 0.20, delta: 0.14, gamma: 0.03 }, // creative evening
  21: { theta: 0.32, alpha: 0.30, beta: 0.18, delta: 0.17, gamma: 0.03 },
  22: { delta: 0.25, theta: 0.30, alpha: 0.27, beta: 0.15, gamma: 0.03 }, // sleepy
  23: { delta: 0.32, theta: 0.28, alpha: 0.22, beta: 0.12, gamma: 0.06 },
  0:  { delta: 0.38, theta: 0.26, alpha: 0.20, beta: 0.10, gamma: 0.06 },
};

function getCircadianBands(hour: number): BandPowers {
  // Find nearest hour entry
  const key = Object.keys(CIRCADIAN_BANDS).map(Number).reduce((a, b) =>
    Math.abs(b - hour) < Math.abs(a - hour) ? b : a
  );
  const b = CIRCADIAN_BANDS[key];
  return {
    delta: b.delta ?? 0.20,
    theta: b.theta ?? 0.20,
    alpha: b.alpha ?? 0.20,
    beta:  b.beta  ?? 0.20,
    gamma: b.gamma ?? 0.20,
  };
}

export function inferBrainState(signals: BehaviorSignals): InferredBrainState {
  const base = getCircadianBands(signals.hourOfDay);
  const bands: BandPowers = { ...base };

  let confidence = 0.55; // base confidence for circadian-only

  // Modifier: long session → fatigue shifts (delta/theta up, beta down)
  if (signals.sessionDurationMin > 45) {
    bands.delta += 0.08;
    bands.theta += 0.05;
    bands.beta  -= 0.08;
    bands.alpha -= 0.05;
    confidence += 0.05;
  } else if (signals.sessionDurationMin > 20) {
    bands.beta += 0.03;
    confidence += 0.05;
  }

  // Modifier: high engagement (many messages, long responses) → more beta
  if (signals.messageCount > 10 && signals.avgResponseChars > 80) {
    bands.beta  += 0.05;
    bands.gamma += 0.03;
    bands.delta -= 0.04;
    confidence += 0.08;
  }

  // Modifier: high error rate → less gamma (struggling = less high cognition)
  if (signals.recentErrorRate > 0.4) {
    bands.gamma -= 0.04;
    bands.delta += 0.04;
    confidence += 0.05;
  }

  // Modifier: returning after a long break → lower alpha initially
  if (signals.daysSinceLastSession > 3) {
    bands.beta  -= 0.03;
    bands.alpha += 0.03;
    confidence -= 0.05;
  }

  // Normalize
  const total = Object.values(bands).reduce((a, b) => a + b, 0);
  const normalized: BandPowers = {
    delta: bands.delta / total,
    theta: bands.theta / total,
    alpha: bands.alpha / total,
    beta:  bands.beta  / total,
    gamma: bands.gamma / total,
  };

  // Determine state from bands
  const state = detectFromBands(normalized, signals);
  const { reasoning, reasoningZh } = buildReasoning(signals, state);
  const { nextBestTime, nextBestTimeZh } = suggestNextTime(signals.hourOfDay, state);

  return {
    state,
    confidence: Math.max(0.3, Math.min(0.95, confidence)),
    bands: normalized,
    reasoning,
    reasoningZh,
    nextBestTime,
    nextBestTimeZh,
  };
}

function detectFromBands(bands: BandPowers, signals: BehaviorSignals): BrainState {
  if (bands.delta > 0.35 || signals.sessionDurationMin > 60) return 'fatigued';
  const { theta, alpha, beta, gamma } = bands;
  const scores: [BrainState, number][] = [
    ['focus',    beta > 0.35 ? beta : 0],
    ['relaxed',  alpha > 0.32 ? alpha : 0],
    ['creative', theta > 0.28 && theta > alpha ? theta : 0],
    ['alert',    gamma > 0.12 && beta > 0.30 ? gamma + beta : 0],
  ];
  const best = scores.reduce((a, b) => (b[1] > a[1] ? b : a));
  return best[1] > 0 ? best[0] : 'neutral';
}

function buildReasoning(sig: BehaviorSignals, state: BrainState): { reasoning: string; reasoningZh: string } {
  const timeLabel = sig.hourOfDay < 12 ? 'morning' : sig.hourOfDay < 17 ? 'afternoon' : 'evening';
  const timeZh = sig.hourOfDay < 12 ? '上午' : sig.hourOfDay < 17 ? '下午' : '晚上';
  const parts: string[] = [`${timeLabel} (${sig.hourOfDay}:00)`];
  const partsZh: string[] = [`${timeZh} ${sig.hourOfDay}:00 時段`];

  if (sig.sessionDurationMin > 45) {
    parts.push('session over 45 min → fatigue signals');
    partsZh.push('練習超過 45 分鐘 → 疲勞訊號');
  }
  if (sig.messageCount > 10) {
    parts.push('high engagement this session');
    partsZh.push('本次對話投入度高');
  }
  if (sig.daysSinceLastSession > 3) {
    parts.push(`${sig.daysSinceLastSession} days since last session → warm-up needed`);
    partsZh.push(`已${sig.daysSinceLastSession}天未練習 → 需要暖身`);
  }
  return {
    reasoning: `Inferred from: ${parts.join(', ')}`,
    reasoningZh: `推算依據：${partsZh.join('、')}`,
  };
}

function suggestNextTime(currentHour: number, state: BrainState): { nextBestTime?: string; nextBestTimeZh?: string } {
  if (state === 'focus' || state === 'alert') return {};
  const focusHours = [9, 10, 11, 15, 16];
  const next = focusHours.find(h => h >= currentHour);
  if (!next) return {};
  return {
    nextBestTime: `Highest focus window today: ${next}:00–${next + 1}:00`,
    nextBestTimeZh: `今日最佳專注時段：${next}:00–${next + 1}:00`,
  };
}

/** Returns YYYY-MM-DD in the user's local timezone (not UTC). */
function localDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Calendar-day difference in local time.
 * Math.round (not floor) absorbs the ±1 h shift from DST transitions.
 */
function localCalendarDaysDiff(later: Date, earlier: Date): number {
  const a = new Date(later.getFullYear(),   later.getMonth(),   later.getDate());
  const b = new Date(earlier.getFullYear(), earlier.getMonth(), earlier.getDate());
  return Math.round((a.getTime() - b.getTime()) / 86400000);
}

export function getCurrentBehaviorSignals(
  sessionStartTime: number,
  messageCount: number,
  avgResponseChars: number,
  recentErrorRate = 0.15,
): BehaviorSignals {
  const now = new Date();
  const sessionDurationMin = (Date.now() - sessionStartTime) / 60000;
  const lastSessionStr = localStorage.getItem('fluent_last_session');
  const lastSession = lastSessionStr ? new Date(lastSessionStr) : null;
  const daysSinceLastSession = lastSession
    ? localCalendarDaysDiff(now, lastSession)
    : 999; // no recorded session → treat as long absence
  const streak = Number(localStorage.getItem('fluent_streak') ?? 0);

  return {
    hourOfDay: now.getHours(),
    sessionDurationMin,
    messageCount,
    avgResponseChars,
    recentErrorRate,
    daysSinceLastSession,
    consecutiveDays: streak,
  };
}

export function recordSessionEnd(): void {
  const now = new Date();
  const lastSessionStr = localStorage.getItem('fluent_last_session');
  const currentStreak = Number(localStorage.getItem('fluent_streak') ?? 0);

  let newStreak = 1;
  if (lastSessionStr) {
    const lastDate = new Date(lastSessionStr);
    const diff = localCalendarDaysDiff(now, lastDate);

    if (diff === 0) {
      newStreak = currentStreak || 1; // same local calendar day → keep streak
    } else if (diff === 1) {
      newStreak = currentStreak + 1; // consecutive local day → extend
    }
    // diff ≥ 2: gap in practice → reset to 1 (default)
  }

  localStorage.setItem('fluent_last_session', now.toISOString());
  localStorage.setItem('fluent_streak', String(newStreak));
}
