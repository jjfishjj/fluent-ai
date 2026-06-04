export type BrainwaveBand = 'delta' | 'theta' | 'alpha' | 'beta' | 'gamma';

export interface BandPowers {
  delta: number;  // 0.5–4 Hz: deep rest
  theta: number;  // 4–8 Hz: creative, memory consolidation
  alpha: number;  // 8–13 Hz: relaxed focus
  beta: number;   // 13–30 Hz: active thinking
  gamma: number;  // 30–50 Hz: high cognition
}

export type BrainState =
  | 'focus'     // High beta → grammar, reading
  | 'relaxed'   // High alpha → listening, music
  | 'creative'  // High theta → roleplay, stories
  | 'alert'     // High gamma → visual content
  | 'fatigued'  // High delta → rest recommended
  | 'neutral';

export interface BrainStateInfo {
  state: BrainState;
  label: string;
  labelZh: string;
  description: string;
  emoji: string;
  color: string;
  bgColor: string;
  varkMatch: string[];
  activities: string[];
}

export interface BrainwaveSnapshot {
  timestamp: number;
  bands: BandPowers;
  state: BrainState;
}

export interface DeviceStatus {
  connected: boolean;
  deviceName: string | null;
  batteryLevel: number | null;
  electrodeQuality: number[];  // 0–4 per channel (0=good, 4=bad)
  isStreaming: boolean;
}

export const BRAIN_STATE_INFO: Record<BrainState, BrainStateInfo> = {
  focus: {
    state: 'focus',
    label: 'Deep Focus',
    labelZh: '深度專注',
    description: 'High beta activity — ideal for structured learning',
    emoji: '🎯',
    color: '#3b82f6',
    bgColor: 'bg-blue-50',
    varkMatch: ['reading', 'writing'],
    activities: ['grammar exercises', 'reading comprehension', 'written composition'],
  },
  relaxed: {
    state: 'relaxed',
    label: 'Relaxed',
    labelZh: '放鬆專注',
    description: 'High alpha — brain is receptive, great for listening',
    emoji: '🌊',
    color: '#10b981',
    bgColor: 'bg-emerald-50',
    varkMatch: ['auditory'],
    activities: ['listening practice', 'pronunciation drilling', 'music-based learning'],
  },
  creative: {
    state: 'creative',
    label: 'Creative Flow',
    labelZh: '創意流動',
    description: 'High theta — memory consolidation and creative thinking',
    emoji: '✨',
    color: '#8b5cf6',
    bgColor: 'bg-violet-50',
    varkMatch: ['kinesthetic'],
    activities: ['free conversation', 'roleplay scenarios', 'storytelling'],
  },
  alert: {
    state: 'alert',
    label: 'High Alert',
    labelZh: '高度警覺',
    description: 'High gamma+beta — fast processing, great for visual input',
    emoji: '⚡',
    color: '#f59e0b',
    bgColor: 'bg-amber-50',
    varkMatch: ['visual'],
    activities: ['visual flashcards', 'image descriptions', 'video comprehension'],
  },
  fatigued: {
    state: 'fatigued',
    label: 'Fatigued',
    labelZh: '腦力疲勞',
    description: 'High delta — time for a short break',
    emoji: '😴',
    color: '#6b7280',
    bgColor: 'bg-gray-50',
    varkMatch: [],
    activities: ['light vocabulary review', 'take a 5-minute break'],
  },
  neutral: {
    state: 'neutral',
    label: 'Neutral',
    labelZh: '平衡狀態',
    description: 'Balanced brain activity',
    emoji: '🧠',
    color: '#64748b',
    bgColor: 'bg-slate-50',
    varkMatch: ['visual', 'auditory', 'reading', 'kinesthetic'],
    activities: ['any practice type'],
  },
};
