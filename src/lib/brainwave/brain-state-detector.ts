import { BandPowers, BrainState } from './types';

export function detectBrainState(bands: BandPowers): BrainState {
  const { delta, theta, alpha, beta, gamma } = bands;

  // Fatigue: dominant delta
  if (delta > 0.40) return 'fatigued';

  // Engagement ratios
  const focusRatio = beta / (alpha + theta + 0.001);
  const relaxRatio = alpha / (beta + 0.001);
  const creativeRatio = theta / (alpha + 0.001);
  const alertRatio = (gamma + beta) / (alpha + theta + 0.001);

  // Pick strongest signal
  const scores: [BrainState, number][] = [
    ['focus', focusRatio > 1.2 ? focusRatio : 0],
    ['relaxed', relaxRatio > 1.5 ? relaxRatio : 0],
    ['creative', creativeRatio > 0.8 && theta > 0.20 ? creativeRatio : 0],
    ['alert', alertRatio > 1.8 ? alertRatio : 0],
  ];

  const best = scores.reduce((a, b) => (b[1] > a[1] ? b : a));
  return best[1] > 0 ? best[0] : 'neutral';
}

export function getBrainStateScore(bands: BandPowers): Record<BrainState, number> {
  const { delta, theta, alpha, beta, gamma } = bands;
  const sum = delta + theta + alpha + beta + gamma;
  return {
    focus: beta / sum,
    relaxed: alpha / sum,
    creative: theta / sum,
    alert: gamma / sum,
    fatigued: delta / sum,
    neutral: 0,
  };
}
