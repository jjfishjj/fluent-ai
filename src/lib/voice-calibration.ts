import type { AcousticFeatures } from './pronunciation-analysis';

export const VOICE_CALIBRATION_KEY = 'memo_shadowing_voice_calibration_v1';
export const CALIBRATION_PROMPT = 'Today I will speak clearly, naturally, and with confidence.';

export interface VoiceCalibrationSample {
  rms: number;
  dynamicRange: number;
  pitchVariation: number;
  meanPitch: number;
  recordedAt: string;
}

export interface VoiceCalibrationProfile {
  version: 1;
  samples: VoiceCalibrationSample[];
  baseline?: Omit<VoiceCalibrationSample, 'recordedAt'>;
  completedAt?: string;
}

const median = (values: number[]) => {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};

export function sampleFromFeatures(features: AcousticFeatures): VoiceCalibrationSample {
  return {
    rms: features.rms,
    dynamicRange: features.dynamicRange,
    pitchVariation: features.pitchVariation,
    meanPitch: features.meanPitch,
    recordedAt: new Date().toISOString(),
  };
}

export function addCalibrationSample(profile: VoiceCalibrationProfile, sample: VoiceCalibrationSample): VoiceCalibrationProfile {
  const samples = [...profile.samples, sample].slice(0, 3);
  if (samples.length < 3) return { version: 1, samples };
  return {
    version: 1,
    samples,
    baseline: {
      rms: median(samples.map(item => item.rms)),
      dynamicRange: median(samples.map(item => item.dynamicRange)),
      pitchVariation: median(samples.map(item => item.pitchVariation)),
      meanPitch: median(samples.map(item => item.meanPitch)),
    },
    completedAt: new Date().toISOString(),
  };
}

export function loadVoiceCalibration(): VoiceCalibrationProfile {
  try {
    const saved = JSON.parse(localStorage.getItem(VOICE_CALIBRATION_KEY) || 'null');
    if (saved?.version === 1 && Array.isArray(saved.samples)) return saved;
  } catch { /* ignore invalid local data */ }
  return { version: 1, samples: [] };
}

export function saveVoiceCalibration(profile: VoiceCalibrationProfile) {
  localStorage.setItem(VOICE_CALIBRATION_KEY, JSON.stringify(profile));
}
