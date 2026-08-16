import { describe, expect, it } from 'vitest';
import { addCalibrationSample, type VoiceCalibrationProfile, type VoiceCalibrationSample } from './voice-calibration';

const sample = (rms: number, meanPitch: number): VoiceCalibrationSample => ({
  rms, meanPitch, dynamicRange: rms * 20, pitchVariation: meanPitch / 1000, recordedAt: new Date().toISOString(),
});

describe('voice calibration', () => {
  it('waits for three recordings before creating a baseline', () => {
    let profile: VoiceCalibrationProfile = { version: 1, samples: [] };
    profile = addCalibrationSample(profile, sample(0.02, 120));
    profile = addCalibrationSample(profile, sample(0.03, 140));
    expect(profile.baseline).toBeUndefined();
    profile = addCalibrationSample(profile, sample(0.5, 300));
    expect(profile.baseline).toMatchObject({ rms: 0.03, meanPitch: 140 });
  });

  it('keeps at most three calibration samples', () => {
    const profile = [1, 2, 3, 4].reduce((current, value) => addCalibrationSample(current, sample(value / 100, 100 + value)), { version: 1, samples: [] } as VoiceCalibrationProfile);
    expect(profile.samples).toHaveLength(3);
  });
});
