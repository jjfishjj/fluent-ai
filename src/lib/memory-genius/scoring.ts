import { MGScores, MGResult, MemoryGeniusType, MGQuadrant } from './types';
import { QUESTIONS } from './quiz-data';
import { TrainingRecord } from '@/lib/brain-training/training-history';

const EMPTY_SCORES: MGScores = { s:0,ab:0,d:0,im:0,k:0,a:0,r:0,v:0,cn:0,pf:0,an:0,na:0 };

export function computeScores(answers: number[]): MGScores {
  const scores: MGScores = { ...EMPTY_SCORES };
  QUESTIONS.forEach((q, qi) => {
    const optionIdx = answers[qi];
    if (optionIdx == null || optionIdx < 0) return;
    const option = q.options[optionIdx];
    if (!option) return;
    (Object.keys(option.score) as (keyof MGScores)[]).forEach(k => {
      scores[k] += option.score[k] ?? 0;
    });
  });
  return scores;
}

/** Adjust scores using Brain Lab training history (reaction time, N-back accuracy). */
export function calibrate(scores: MGScores, history: TrainingRecord[]): MGScores {
  const out = { ...scores };

  const attn = history.filter(r => r.game === 'attention');
  if (attn.length > 0) {
    const avgRt = attn.reduce((s, r) => s + (r.detail.avgReactionMs ?? 1000), 0) / attn.length;
    if (avgRt < 700) out.im += 2;
    else if (avgRt > 1100) out.d += 2;
  }

  const nback = history.filter(r => r.game === 'nback');
  if (nback.length > 0) {
    const avgAcc = nback.reduce((s, r) => s + r.accuracy, 0) / nback.length;
    if (avgAcc > 80) out.ab += 1;
  }

  const speed = history.filter(r => r.game === 'speed');
  if (speed.length > 0) {
    const avgSpd = speed.reduce((s, r) => s + (r.detail.avgSpeedMs ?? 2000), 0) / speed.length;
    if (avgSpd < 900) out.im += 1;
  }

  return out;
}

function quadrant(xScore: number, yScore: number): MGQuadrant {
  if (xScore <= 0 && yScore >= 0) return 'innovation';  // 感官 + 深度
  if (xScore > 0  && yScore >= 0) return 'perception';  // 抽象 + 深度
  if (xScore <= 0 && yScore < 0)  return 'integration'; // 感官 + 即時
  return 'action';                                        // 抽象 + 即時
}

function typeFromQuadrant(
  q: MGQuadrant,
  sc: MGScores,
): { primary: MemoryGeniusType; secondary: MemoryGeniusType } {
  switch (q) {
    case 'innovation':
      return sc.k >= sc.a
        ? { primary: 'explorer',   secondary: 'melodist' }
        : { primary: 'melodist',   secondary: 'explorer' };
    case 'perception':
      return (sc.r + sc.an) >= (sc.na + sc.a)
        ? { primary: 'architect',  secondary: 'narrator' }
        : { primary: 'narrator',   secondary: 'architect' };
    case 'integration':
      return sc.cn >= sc.pf
        ? { primary: 'connector',  secondary: 'performer' }
        : { primary: 'performer',  secondary: 'connector' };
    case 'action':
      return sc.an >= sc.v
        ? { primary: 'analyst',    secondary: 'visionary' }
        : { primary: 'visionary',  secondary: 'analyst' };
  }
}

export function computeResult(
  answers: number[],
  history: TrainingRecord[] = [],
): MGResult {
  const raw = computeScores(answers);
  const sc  = calibrate(raw, history);

  const xScore = sc.ab - sc.s;
  const yScore = sc.d  - sc.im;
  const q      = quadrant(xScore, yScore);
  const { primary, secondary } = typeFromQuadrant(q, sc);

  return {
    primaryType: primary,
    secondaryType: secondary,
    quadrant: q,
    xScore,
    yScore,
    scores: sc,
    completedAt: new Date().toISOString(),
  };
}
