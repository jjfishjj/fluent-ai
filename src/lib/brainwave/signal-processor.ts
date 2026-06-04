import { BandPowers } from './types';

// Cooley-Tukey in-place FFT (power of 2 only)
function fft(re: number[], im: number[]): void {
  const n = re.length;
  // Bit-reversal permutation
  let j = 0;
  for (let i = 1; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  // Butterfly passes
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len >> 1; k++) {
        const ur = re[i + k], ui = im[i + k];
        const vr = re[i + k + (len >> 1)] * cr - im[i + k + (len >> 1)] * ci;
        const vi = re[i + k + (len >> 1)] * ci + im[i + k + (len >> 1)] * cr;
        re[i + k] = ur + vr; im[i + k] = ui + vi;
        re[i + k + (len >> 1)] = ur - vr; im[i + k + (len >> 1)] = ui - vi;
        const ncr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr; cr = ncr;
      }
    }
  }
}

function hannWindow(samples: number[]): number[] {
  const n = samples.length;
  return samples.map((s, i) => s * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1))));
}

export function computeBandPowers(samples: number[], sampleRate = 256): BandPowers {
  // Pad or trim to next power of 2
  const n = Math.pow(2, Math.floor(Math.log2(samples.length)));
  const windowed = hannWindow(samples.slice(0, n));
  const re = [...windowed];
  const im = new Array(n).fill(0);
  fft(re, im);

  const psd = re.map((r, i) => (r * r + im[i] * im[i]) / n);
  const freqRes = sampleRate / n;

  const bandSum = (low: number, high: number): number => {
    let sum = 0;
    const lo = Math.max(1, Math.floor(low / freqRes));
    const hi = Math.min(n / 2 - 1, Math.ceil(high / freqRes));
    for (let i = lo; i <= hi; i++) sum += psd[i];
    return sum;
  };

  const delta = bandSum(0.5, 4);
  const theta = bandSum(4, 8);
  const alpha = bandSum(8, 13);
  const beta = bandSum(13, 30);
  const gamma = bandSum(30, 50);
  const total = delta + theta + alpha + beta + gamma || 1;

  return {
    delta: delta / total,
    theta: theta / total,
    alpha: alpha / total,
    beta: beta / total,
    gamma: gamma / total,
  };
}

// Exponential moving average for smooth display
export function smoothBands(prev: BandPowers, next: BandPowers, alpha = 0.3): BandPowers {
  return {
    delta: prev.delta * (1 - alpha) + next.delta * alpha,
    theta: prev.theta * (1 - alpha) + next.theta * alpha,
    alpha: prev.alpha * (1 - alpha) + next.alpha * alpha,
    beta: prev.beta * (1 - alpha) + next.beta * alpha,
    gamma: prev.gamma * (1 - alpha) + next.gamma * alpha,
  };
}

export const EMPTY_BANDS: BandPowers = {
  delta: 0.2, theta: 0.2, alpha: 0.2, beta: 0.2, gamma: 0.2,
};
