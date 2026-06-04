import { BandPowers, BrainState } from './types';
import { smoothBands, EMPTY_BANDS } from './signal-processor';

// Simulates realistic brainwave transitions for demo mode
const STATE_PROFILES: Record<BrainState, BandPowers> = {
  focus:    { delta: 0.08, theta: 0.12, alpha: 0.20, beta: 0.45, gamma: 0.15 },
  relaxed:  { delta: 0.10, theta: 0.15, alpha: 0.45, beta: 0.20, gamma: 0.10 },
  creative: { delta: 0.10, theta: 0.35, alpha: 0.30, beta: 0.18, gamma: 0.07 },
  alert:    { delta: 0.05, theta: 0.10, alpha: 0.18, beta: 0.35, gamma: 0.32 },
  fatigued: { delta: 0.45, theta: 0.25, alpha: 0.15, beta: 0.10, gamma: 0.05 },
  neutral:  { delta: 0.20, theta: 0.20, alpha: 0.20, beta: 0.20, gamma: 0.20 },
};

export class BrainwaveSimulator {
  private current: BandPowers = { ...EMPTY_BANDS };
  private targetState: BrainState = 'neutral';
  private timer: ReturnType<typeof setInterval> | null = null;
  private stateTimer: ReturnType<typeof setInterval> | null = null;

  onBandPowers?: (bands: BandPowers) => void;

  start() {
    this.targetState = 'neutral';
    // Rotate through states every 15 seconds to demo different states
    const states: BrainState[] = ['relaxed', 'focus', 'creative', 'alert', 'focus', 'relaxed'];
    let idx = 0;
    this.stateTimer = setInterval(() => {
      idx = (idx + 1) % states.length;
      this.targetState = states[idx];
    }, 15000);

    this.timer = setInterval(() => {
      const target = STATE_PROFILES[this.targetState];
      // Add small random noise
      const noisy: BandPowers = {
        delta: target.delta + (Math.random() - 0.5) * 0.04,
        theta: target.theta + (Math.random() - 0.5) * 0.04,
        alpha: target.alpha + (Math.random() - 0.5) * 0.04,
        beta:  target.beta  + (Math.random() - 0.5) * 0.04,
        gamma: target.gamma + (Math.random() - 0.5) * 0.03,
      };
      // Normalize
      const total = Object.values(noisy).reduce((a, b) => a + b, 0);
      const normalized: BandPowers = {
        delta: noisy.delta / total,
        theta: noisy.theta / total,
        alpha: noisy.alpha / total,
        beta:  noisy.beta  / total,
        gamma: noisy.gamma / total,
      };
      this.current = smoothBands(this.current, normalized, 0.15);
      this.onBandPowers?.(this.current);
    }, 200);  // Update 5 times per second
  }

  setTargetState(state: BrainState) {
    this.targetState = state;
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    if (this.stateTimer) clearInterval(this.stateTimer);
    this.timer = null;
    this.stateTimer = null;
  }
}
