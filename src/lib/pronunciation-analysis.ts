export interface AcousticFeatures {
  durationSeconds: number;
  rms: number;
  dynamicRange: number;
  voicedRatio: number;
  rhythmPeaks: number;
  pitchVariation: number;
  endingSlope: number;
  meanPitch: number;
  energyContour: number[];
  pitchContour: number[];
}

export interface PronunciationScores {
  phoneme: number;
  stress: number;
  intonation: number;
  overall: number;
  weakest: 'phoneme' | 'stress' | 'intonation';
  advice: string;
  features: AcousticFeatures;
  personalized: boolean;
}

export interface PronunciationBaseline {
  rms: number;
  dynamicRange: number;
  pitchVariation: number;
  meanPitch: number;
}

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

function estimatePitch(frame: Float32Array, sampleRate: number) {
  let bestLag = 0;
  let bestCorrelation = 0;
  const minLag = Math.floor(sampleRate / 350);
  const maxLag = Math.min(Math.floor(sampleRate / 75), frame.length - 1);
  for (let lag = minLag; lag <= maxLag; lag += 2) {
    let correlation = 0;
    let energyA = 0;
    let energyB = 0;
    for (let i = 0; i < frame.length - lag; i += 2) {
      const a = frame[i]; const b = frame[i + lag];
      correlation += a * b; energyA += a * a; energyB += b * b;
    }
    const normalized = correlation / Math.sqrt(energyA * energyB || 1);
    if (normalized > bestCorrelation) { bestCorrelation = normalized; bestLag = lag; }
  }
  return bestCorrelation > 0.32 && bestLag ? sampleRate / bestLag : 0;
}

export function extractAcousticFeatures(samples: Float32Array, sampleRate: number): AcousticFeatures {
  const frameSize = Math.max(256, Math.floor(sampleRate * 0.04));
  const hop = Math.max(128, Math.floor(frameSize / 2));
  const energy: number[] = [];
  const pitchFrames: number[] = [];
  const pitches: number[] = [];
  let totalSquare = 0;
  for (let i = 0; i < samples.length; i++) totalSquare += samples[i] * samples[i];
  for (let start = 0; start + frameSize <= samples.length; start += hop) {
    const frame = samples.subarray(start, start + frameSize);
    let square = 0;
    for (let i = 0; i < frame.length; i++) square += frame[i] * frame[i];
    const frameRms = Math.sqrt(square / frame.length);
    energy.push(frameRms);
    if (frameRms > 0.012) {
      const pitch = estimatePitch(frame, sampleRate);
      if (pitch) pitches.push(pitch);
      pitchFrames.push(pitch);
    } else {
      pitchFrames.push(0);
    }
  }
  const sortedEnergy = [...energy].sort((a, b) => a - b);
  const percentile = (p: number) => sortedEnergy[Math.min(sortedEnergy.length - 1, Math.floor(sortedEnergy.length * p))] || 0;
  const threshold = Math.max(0.012, percentile(0.35));
  let rhythmPeaks = 0;
  for (let i = 1; i < energy.length - 1; i++) {
    if (energy[i] > threshold * 1.35 && energy[i] > energy[i - 1] && energy[i] >= energy[i + 1]) rhythmPeaks++;
  }
  const meanPitch = pitches.reduce((sum, value) => sum + value, 0) / (pitches.length || 1);
  const pitchDeviation = Math.sqrt(pitches.reduce((sum, value) => sum + (value - meanPitch) ** 2, 0) / (pitches.length || 1));
  const tail = pitches.slice(-Math.max(2, Math.floor(pitches.length * 0.25)));
  const endingSlope = tail.length > 1 ? (tail.at(-1)! - tail[0]) / Math.max(meanPitch, 1) : 0;
  return {
    durationSeconds: samples.length / sampleRate,
    rms: Math.sqrt(totalSquare / Math.max(samples.length, 1)),
    dynamicRange: percentile(0.9) / Math.max(percentile(0.2), 0.004),
    voicedRatio: pitches.length / Math.max(energy.length, 1),
    rhythmPeaks,
    pitchVariation: pitchDeviation / Math.max(meanPitch, 1),
    endingSlope,
    meanPitch,
    energyContour: energy.map(value => clamp(value / Math.max(percentile(0.95), 0.001), 0, 1)),
    pitchContour: pitchFrames.map(value => value ? clamp((value - 75) / 275, 0, 1) : 0),
  };
}

export function buildReferenceContours(text: string, points: number) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const count = Math.max(points, 2);
  const energy = Array.from({ length: count }, (_, index) => {
    const progress = index / (count - 1);
    const wordIndex = Math.min(words.length - 1, Math.floor(progress * words.length));
    const word = words[wordIndex]?.replace(/[^a-z]/gi, '') ?? '';
    const stressed = word.length >= 6 || /^(project|three|years|finally|ready|first|results|changed|flight|delayed|entire)$/i.test(word);
    return clamp(0.25 + (stressed ? 0.52 : 0.25) * Math.sin(Math.PI * ((progress * words.length) % 1)), 0, 1);
  });
  const isQuestion = /\?\s*$/.test(text);
  const pitch = Array.from({ length: count }, (_, index) => {
    const progress = index / (count - 1);
    const phraseMotion = 0.5 + 0.12 * Math.sin(progress * Math.PI * Math.max(2, words.length / 2));
    const ending = progress > 0.72 ? (progress - 0.72) / 0.28 * (isQuestion ? 0.22 : -0.22) : 0;
    return clamp(phraseMotion + ending, 0, 1);
  });
  return { energy, pitch };
}

export function scorePronunciation(features: AcousticFeatures, transcriptScore: number | null, expectedWords: number, baseline?: PronunciationBaseline): PronunciationScores {
  if (features.durationSeconds < 0.8 || features.rms < 0.006) throw new Error('audio-too-short-or-quiet');
  const lexical = transcriptScore ?? 65;
  const phoneme = Math.round(clamp(lexical * 0.78 + clamp(features.voicedRatio * 120) * 0.22));
  const expectedPeaks = Math.max(2, Math.round(expectedWords * 0.35));
  const peakFit = clamp(100 - (Math.abs(features.rhythmPeaks - expectedPeaks) / expectedPeaks) * 70);
  const rangeTarget = baseline?.dynamicRange ?? 3.5;
  const rangeFit = clamp(100 - Math.abs(features.dynamicRange - rangeTarget) / Math.max(rangeTarget, 1) * 55);
  const loudnessFit = baseline ? clamp(100 - Math.abs(features.rms - baseline.rms) / Math.max(baseline.rms, 0.006) * 45) : 80;
  const stress = Math.round(peakFit * 0.6 + rangeFit * 0.25 + loudnessFit * 0.15);
  const pitchTarget = baseline?.pitchVariation ?? 0.16;
  const variationFit = clamp(100 - Math.abs(features.pitchVariation - pitchTarget) / Math.max(pitchTarget, 0.05) * 55);
  const endingFit = clamp(85 - Math.abs(features.endingSlope + 0.08) * 180);
  const intonation = Math.round(variationFit * 0.7 + endingFit * 0.3);
  const values = { phoneme, stress, intonation };
  const weakest = (Object.entries(values).sort((a, b) => a[1] - b[1])[0][0]) as PronunciationScores['weakest'];
  const advice = weakest === 'phoneme'
    ? '下一輪先降到 0.75×，逐詞校準容易被替換或遺漏的聲音。'
    : weakest === 'stress'
      ? '下一輪用手指打拍，只凸顯內容詞，功能詞快速帶過。'
      : '下一輪誇張模仿音高起伏，尤其注意句尾的下降收束。';
  return { phoneme, stress, intonation, overall: Math.round(phoneme * 0.45 + stress * 0.3 + intonation * 0.25), weakest, advice, features, personalized: Boolean(baseline) };
}

export async function analyzeAudioBlob(blob: Blob, transcriptScore: number | null, expectedWords: number, baseline?: PronunciationBaseline) {
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) throw new Error('audio-context-unsupported');
  const context = new AudioContextClass();
  try {
    const buffer = await context.decodeAudioData(await blob.arrayBuffer());
    const features = extractAcousticFeatures(buffer.getChannelData(0), buffer.sampleRate);
    return scorePronunciation(features, transcriptScore, expectedWords, baseline);
  } finally { await context.close(); }
}
