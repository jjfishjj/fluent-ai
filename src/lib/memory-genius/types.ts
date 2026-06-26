export type MemoryGeniusType =
  | 'explorer' | 'architect' | 'melodist' | 'narrator'
  | 'connector' | 'analyst' | 'performer' | 'visionary';

export type MGQuadrant = 'innovation' | 'perception' | 'integration' | 'action';

export interface MGScores {
  s: number;   // sensory (X-)
  ab: number;  // abstract (X+)
  d: number;   // deep immersion (Y+)
  im: number;  // immediate reaction (Y-)
  k: number;   // kinesthetic
  a: number;   // auditory
  r: number;   // reading/writing
  v: number;   // visual
  cn: number;  // connector tendency
  pf: number;  // performer tendency
  an: number;  // analyst tendency
  na: number;  // narrative tendency
}

export interface MGOption {
  label: string;
  text: string;
  score: Partial<MGScores>;
}

export interface MGQuestion {
  id: number;
  group: 'X' | 'Y' | 'S';
  text: string;
  options: MGOption[];
}

export interface MGResult {
  primaryType: MemoryGeniusType;
  secondaryType: MemoryGeniusType | null;
  quadrant: MGQuadrant;
  xScore: number;
  yScore: number;
  scores: MGScores;
  completedAt: string;
}

export interface TypeProfile {
  type: MemoryGeniusType;
  nameZh: string;
  nameEn: string;
  emoji: string;
  color: string;
  bgColor: string;
  tagline: string;
  brainwave: string;
  bestTime: string;
  varkLabel: string;
  primaryVark: 'visual' | 'auditory' | 'reading' | 'kinesthetic';
  memoryTraits: string[];
  bestMethods: string[];
  avoidMethods: string[];
  week1to4: string;
  week5to8: string;
  week9to12: string;
  quote: string;
}
