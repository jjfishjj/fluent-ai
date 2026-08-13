import { describe, expect, it } from 'vitest';
import { buildReferenceContours, extractAcousticFeatures, scorePronunciation } from './pronunciation-analysis';

function syntheticVoice(seconds = 2, sampleRate = 16000) {
  return Float32Array.from({ length: seconds * sampleRate }, (_, i) => {
    const t = i / sampleRate;
    const envelope = 0.04 + 0.15 * Math.max(0, Math.sin(Math.PI * 4 * t));
    return envelope * Math.sin(2 * Math.PI * (150 + 18 * Math.sin(t * 3)) * t);
  });
}

describe('pronunciation acoustic analysis', () => {
  it('extracts usable voice features and scores all dimensions', () => {
    const features = extractAcousticFeatures(syntheticVoice(), 16000);
    const scores = scorePronunciation(features, 88, 12);
    expect(features.durationSeconds).toBe(2);
    expect(scores.phoneme).toBeGreaterThan(0);
    expect(scores.stress).toBeGreaterThan(0);
    expect(scores.intonation).toBeGreaterThan(0);
    expect(features.energyContour.length).toBeGreaterThan(10);
    expect(features.pitchContour.length).toBe(features.energyContour.length);
    expect(['phoneme', 'stress', 'intonation']).toContain(scores.weakest);
  });

  it('rejects silent recordings instead of inventing a score', () => {
    const features = extractAcousticFeatures(new Float32Array(16000), 16000);
    expect(() => scorePronunciation(features, 100, 5)).toThrow('audio-too-short-or-quiet');
  });

  it('builds an equally sized reference prosody track', () => {
    const reference = buildReferenceContours('This is a statement.', 48);
    expect(reference.energy).toHaveLength(48);
    expect(reference.pitch).toHaveLength(48);
    expect(reference.pitch.at(-1)).toBeLessThan(reference.pitch[30]);
  });
});
