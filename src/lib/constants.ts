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
    id: 'chinese',
    name: 'Chinese',
    nativeName: '中文',
    flag: '🇨🇳',
    variants: [
      { id: 'simplified', name: '简体中文 (Simplified)' },
      { id: 'traditional', name: '繁體中文 (Traditional)' },
    ],
    supportsRomanization: true,
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
    id: 'arabic',
    name: 'Arabic',
    nativeName: 'العربية',
    flag: '🇸🇦',
    supportsRomanization: true,
  },
  {
    id: 'russian',
    name: 'Russian',
    nativeName: 'Русский',
    flag: '🇷🇺',
    supportsRomanization: true,
  },
  {
    id: 'thai',
    name: 'Thai',
    nativeName: 'ไทย',
    flag: '🇹🇭',
    supportsRomanization: true,
  },
  {
    id: 'hindi',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    flag: '🇮🇳',
    supportsRomanization: true,
  },
  {
    id: 'turkish',
    name: 'Turkish',
    nativeName: 'Türkçe',
    flag: '🇹🇷',
  },
  {
    id: 'vietnamese',
    name: 'Vietnamese',
    nativeName: 'Tiếng Việt',
    flag: '🇻🇳',
  },
  {
    id: 'indonesian',
    name: 'Indonesian',
    nativeName: 'Bahasa Indonesia',
    flag: '🇮🇩',
  },
  {
    id: 'cantonese',
    name: 'Cantonese',
    nativeName: '廣東話',
    flag: '🇭🇰',
    supportsRomanization: true,
  },
  {
    id: 'hakka',
    name: 'Hakka',
    nativeName: '客家話',
    flag: '🏔️',
    supportsRomanization: true,
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
