import { LanguageConfig, Scenario } from './types';

export const LANGUAGES: LanguageConfig[] = [
  {
    id: 'english',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧',
    variants: [
      { id: 'general', name: 'General English' },
      { id: 'ielts', name: 'IELTS Preparation' },
      { id: 'toefl', name: 'TOEFL Preparation' },
    ],
  },
  {
    id: 'german',
    name: 'German',
    nativeName: 'Deutsch',
    flag: '🇩🇪',
  },
  {
    id: 'french',
    name: 'French',
    nativeName: 'Français',
    flag: '🇫🇷',
  },
  {
    id: 'spanish',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸',
  },
  {
    id: 'japanese',
    name: 'Japanese',
    nativeName: '日本語',
    flag: '🇯🇵',
  },
  {
    id: 'korean',
    name: 'Korean',
    nativeName: '한국어',
    flag: '🇰🇷',
  },
  {
    id: 'hebrew',
    name: 'Hebrew',
    nativeName: 'עברית',
    flag: '🇮🇱',
  },
];

export const SCENARIOS: Scenario[] = [
  {
    id: 'daily',
    category: 'daily',
    name: 'Daily Life',
    description: 'Practice everyday conversations',
    icon: '🏠',
    subScenarios: ['Ordering Food', 'Shopping', 'Renting', 'Doctor Visit', 'Banking'],
  },
  {
    id: 'workplace',
    category: 'workplace',
    name: 'Workplace',
    description: 'Professional communication skills',
    icon: '💼',
    subScenarios: ['Job Interview', 'Meetings', 'Presentations', 'Email Writing', 'Negotiation'],
  },
  {
    id: 'travel',
    category: 'travel',
    name: 'Travel',
    description: 'Navigate travel situations',
    icon: '✈️',
    subScenarios: ['Asking Directions', 'Hotel Check-in', 'Airport', 'Public Transport', 'Emergencies'],
  },
  {
    id: 'academic',
    category: 'academic',
    name: 'Academic',
    description: 'Academic and exam preparation',
    icon: '📚',
    subScenarios: ['Classroom Discussion', 'Research Presentation', 'Study Group', 'Office Hours'],
  },
  {
    id: 'freeChat',
    category: 'freeChat',
    name: 'Free Chat',
    description: 'Open conversation practice',
    icon: '💬',
  },
];

export const DIFFICULTY_LABELS = {
  beginner: { label: 'Beginner', color: 'success' },
  intermediate: { label: 'Intermediate', color: 'warning' },
  advanced: { label: 'Advanced', color: 'destructive' },
} as const;

export const SPEED_LABELS = {
  slow: { label: 'Slow', description: '0.75x speed' },
  normal: { label: 'Normal', description: '1x speed' },
  fast: { label: 'Fast', description: '1.25x speed' },
} as const;

export const TONE_LABELS = {
  formal: { label: 'Formal', description: 'Professional tone' },
  'semi-formal': { label: 'Semi-formal', description: 'Balanced tone' },
  casual: { label: 'Casual', description: 'Relaxed tone' },
} as const;

export const MODE_INFO = {
  practice: {
    name: 'Practice Mode',
    description: 'AI-guided conversation with real-time corrections and suggestions',
    icon: '🎯',
  },
  test: {
    name: 'Test Mode',
    description: 'Timed responses with scoring on fluency, grammar, vocabulary, and logic',
    icon: '📝',
  },
  freeChat: {
    name: 'Free Chat',
    description: 'Open conversation without scripts or guidance',
    icon: '💭',
  },
} as const;
