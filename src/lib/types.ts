// Language Types
export type Language = 'english' | 'german' | 'french' | 'spanish' | 'japanese' | 'korean' | 'hebrew';
export type EnglishVariant = 'general' | 'ielts' | 'toefl';

export interface LanguageConfig {
  id: Language;
  name: string;
  nativeName: string;
  flag: string;
  variants?: { id: string; name: string }[];
}

// Scenario Types
export type ScenarioCategory = 'daily' | 'workplace' | 'travel' | 'academic' | 'freeChat';
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
export type SpeechSpeed = 'slow' | 'normal' | 'fast';
export type ToneStyle = 'formal' | 'semi-formal' | 'casual';

export interface Scenario {
  id: string;
  category: ScenarioCategory;
  name: string;
  description: string;
  icon: string;
  subScenarios?: string[];
}

// Conversation Types
export type ConversationMode = 'practice' | 'test' | 'freeChat';

export interface ConversationSettings {
  language: Language;
  languageVariant?: string;
  scenario: string;
  difficulty: DifficultyLevel;
  speed: SpeechSpeed;
  tone: ToneStyle;
  mode: ConversationMode;
  instantCorrection: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  correction?: string;
  suggestion?: string;
  audioUrl?: string;
}

export interface Conversation {
  id: string;
  userId?: string;
  settings: ConversationSettings;
  messages: Message[];
  startedAt: Date;
  endedAt?: Date;
  score?: ConversationScore;
  isAnonymized: boolean;
}

export interface ConversationScore {
  fluency: number;
  grammar: number;
  vocabulary: number;
  logic: number;
  overall: number;
  feedback: string;
}

// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'user' | 'admin';
  createdAt: Date;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  preferredLanguage: Language;
  preferredDifficulty: DifficultyLevel;
  enableDataCollection: boolean;
}

// Admin Types
export interface AdminPreset {
  id: string;
  type: 'example' | 'error' | 'script';
  language: Language;
  scenario: string;
  difficulty: DifficultyLevel;
  title: string;
  content: string;
  sourceConversationId?: string;
  createdBy: string;
  createdAt: Date;
  isActive: boolean;
}

export interface LearningRecommendation {
  id: string;
  userId: string;
  type: 'scenario' | 'difficulty' | 'mode';
  recommendation: string;
  reason: string;
  createdAt: Date;
  isRead: boolean;
}

// Analytics Types
export interface AnalyticsData {
  totalUsers: number;
  activeUsers: {
    daily: number;
    monthly: number;
  };
  guestVsLoggedIn: {
    guests: number;
    loggedIn: number;
  };
  languageUsage: Record<Language, number>;
  scenarioUsage: Record<ScenarioCategory, number>;
  examModeUsage: {
    ielts: number;
    toefl: number;
  };
  commonErrors: { error: string; count: number }[];
  popularKeywords: { keyword: string; count: number }[];
}
