import type { MemoryItem } from '@/lib/memory-srs';
import type { LanguageLesson, LearningRegionId, LessonLevel, TargetLanguage } from './language-lessons';

export type LessonGrade = 'again' | 'good';
export type LevelFilter = LessonLevel | 'all';
export type DailyGoal = 5 | 8 | 10;

export interface LessonReviewState {
  lastGrade?: LessonGrade;
  nextReviewAt?: string;
  lastReviewedAt?: string;
  reviewCount: number;
  intervalIndex: number;
}

export interface LearningProgress {
  version: 1;
  preferences: { targetLanguage: TargetLanguage; level: LevelFilter; dailyGoal: DailyGoal };
  completedLessonIds: Record<TargetLanguage, string[]>;
  reviews: Record<TargetLanguage, Record<string, LessonReviewState>>;
  completedDailyDates: string[];
}

export interface LearningRegion {
  id: LearningRegionId;
  name: string;
  theme: string;
  description: string;
  focus: LessonLevel | 'mixed';
}

export const LEARNING_REGIONS: LearningRegion[] = [
  { id: 'village', name: '村莊・青雲村', theme: '日常交流與生活', description: '從問候、借物到村莊日常，建立常用字彙。', focus: 'beginner' },
  { id: 'forest', name: '森林・迷霧竹林', theme: '探索與自然', description: '沿路搜尋線索、描述環境，也練習保護與行動。', focus: 'beginner' },
  { id: 'ruins', name: '遺跡・古文明', theme: '探索、線索與推論', description: '在遺跡中辨認較進階詞彙，理解語意與用法差異。', focus: 'intermediate' },
];

export const TARGET_LANGUAGE_OPTIONS: { value: TargetLanguage; label: string; detail: string }[] = [
  { value: 'en', label: '英文', detail: '初階與中階' },
  { value: 'ja', label: '日文', detail: '入門' },
];

const STORAGE_PREFIX = 'xianjing_learning_progress_v1_';
const DAY = 24 * 60 * 60 * 1000;
const DEFAULT_PROGRESS: LearningProgress = {
  version: 1,
  preferences: { targetLanguage: 'en', level: 'all', dailyGoal: 5 },
  completedLessonIds: { en: [], ja: [] },
  reviews: { en: {}, ja: {} },
  completedDailyDates: [],
};
type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

function storageKey(userId: string) { return `${STORAGE_PREFIX}${userId}`; }
function isTargetLanguage(value: unknown): value is TargetLanguage { return value === 'en' || value === 'ja'; }
function isDailyGoal(value: unknown): value is DailyGoal { return value === 5 || value === 8 || value === 10; }
function isLevelFilter(value: unknown): value is LevelFilter { return value === 'all' || value === 'beginner' || value === 'intermediate'; }

export function loadLearningProgress(userId: string, storage: StorageLike = localStorage): LearningProgress {
  try {
    const raw = storage.getItem(storageKey(userId));
    if (!raw) return structuredClone(DEFAULT_PROGRESS);
    const saved = JSON.parse(raw) as Partial<LearningProgress>;
    const preferences = saved.preferences;
    const completedLessonIds = saved.completedLessonIds;
    const reviews = saved.reviews;
    return {
      version: 1,
      preferences: {
        targetLanguage: isTargetLanguage(preferences?.targetLanguage) ? preferences.targetLanguage : 'en',
        level: isLevelFilter(preferences?.level) ? preferences.level : 'all',
        dailyGoal: isDailyGoal(preferences?.dailyGoal) ? preferences.dailyGoal : 5,
      },
      completedLessonIds: {
        en: Array.isArray(completedLessonIds?.en) ? completedLessonIds.en.filter((id): id is string => typeof id === 'string') : [],
        ja: Array.isArray(completedLessonIds?.ja) ? completedLessonIds.ja.filter((id): id is string => typeof id === 'string') : [],
      },
      reviews: {
        en: reviews?.en && typeof reviews.en === 'object' ? reviews.en : {},
        ja: reviews?.ja && typeof reviews.ja === 'object' ? reviews.ja : {},
      },
      completedDailyDates: Array.isArray(saved.completedDailyDates)
        ? saved.completedDailyDates.filter((date): date is string => typeof date === 'string')
        : [],
    };
  } catch {
    return structuredClone(DEFAULT_PROGRESS);
  }
}

function saveLearningProgress(userId: string, progress: LearningProgress, storage: StorageLike = localStorage): void {
  storage.setItem(storageKey(userId), JSON.stringify(progress));
}

export function updateLearningPreferences(
  userId: string,
  preferences: Partial<LearningProgress['preferences']>,
  storage: StorageLike = localStorage,
): LearningProgress {
  const progress = loadLearningProgress(userId, storage);
  progress.preferences = { ...progress.preferences, ...preferences };
  saveLearningProgress(userId, progress, storage);
  return progress;
}

export function markLessonCompleted(
  userId: string,
  language: TargetLanguage,
  lessonId: string,
  storage: StorageLike = localStorage,
): LearningProgress {
  const progress = loadLearningProgress(userId, storage);
  const completed = progress.completedLessonIds[language];
  if (!completed.includes(lessonId)) completed.push(lessonId);
  saveLearningProgress(userId, progress, storage);
  return progress;
}

export function recordLessonReview(
  userId: string,
  language: TargetLanguage,
  lessonId: string,
  grade: LessonGrade,
  now = Date.now(),
  storage: StorageLike = localStorage,
): LearningProgress {
  const progress = loadLearningProgress(userId, storage);
  const previous = progress.reviews[language][lessonId];
  const scheduleDays = [1, 3, 7, 14, 30];
  const intervalIndex = grade === 'good' ? (previous?.intervalIndex ?? -1) + 1 : 0;
  const waitDays = grade === 'again' ? 1 : scheduleDays[Math.min(intervalIndex, scheduleDays.length - 1)];
  progress.reviews[language][lessonId] = {
    lastGrade: grade,
    nextReviewAt: new Date(now + waitDays * DAY).toISOString(),
    lastReviewedAt: new Date(now).toISOString(),
    reviewCount: (previous?.reviewCount ?? 0) + 1,
    intervalIndex,
  };
  saveLearningProgress(userId, progress, storage);
  return progress;
}

export function mergeMemoryReviews(
  lessonReviews: Record<string, LessonReviewState>,
  cards: MemoryItem[],
): Record<string, LessonReviewState> {
  const merged = { ...lessonReviews };
  for (const card of cards) {
    const word = card.english.toLocaleLowerCase();
    const lastLog = card.history.at(-1);
    const cardState: LessonReviewState = {
      lastGrade: lastLog?.grade,
      nextReviewAt: card.nextReviewAt,
      lastReviewedAt: lastLog?.date,
      reviewCount: card.history.length,
      intervalIndex: card.intervalIndex,
    };
    const current = merged[word];
    if (!current || new Date(card.nextReviewAt).getTime() < new Date(current.nextReviewAt ?? Infinity).getTime()) {
      merged[word] = cardState;
    }
  }
  return merged;
}

export function selectDailyLessons(
  lessons: LanguageLesson[],
  reviews: Record<string, LessonReviewState>,
  requestedCount: number,
  now = Date.now(),
): LanguageLesson[] {
  const ordered = lessons.map((lesson, index) => {
    const review = reviews[lesson.id] ?? reviews[lesson.word.toLocaleLowerCase()];
    const nextAt = review?.nextReviewAt ? new Date(review.nextReviewAt).getTime() : Number.POSITIVE_INFINITY;
    const due = nextAt <= now;
    const wrong = review?.lastGrade === 'again';
    const neverSeen = !review;
    const priority = due ? 0 : wrong ? 1 : neverSeen ? 2 : 3;
    const overdueBy = due ? now - nextAt : 0;
    return { lesson, index, priority, overdueBy, nextAt };
  });
  ordered.sort((a, b) => a.priority - b.priority || b.overdueBy - a.overdueBy || a.nextAt - b.nextAt || a.index - b.index);
  return ordered.slice(0, Math.max(0, Math.min(requestedCount, lessons.length))).map(({ lesson }) => lesson);
}

export function isRegionUnlocked(
  language: TargetLanguage,
  region: LearningRegionId,
  completedIds: string[],
): boolean {
  if (region === 'village') return true;
  if (language === 'ja') return false;
  const completedLessons = new Set(completedIds);
  const villageLessons = ['meet', 'right', 'borrow', 'tell', 'bring', 'dessert'];
  const villageCount = villageLessons.filter((id) => completedLessons.has(id)).length;
  if (region === 'forest') return villageCount >= 5;
  const forestLessons = ['hear', 'lose', 'follow', 'search', 'quiet', 'protect'];
  const forestCount = forestLessons.filter((id) => completedLessons.has(id)).length;
  return villageCount >= 5 && forestCount >= 5;
}

export function filterAvailableLessons(
  lessons: LanguageLesson[],
  language: TargetLanguage,
  level: LevelFilter,
  completedIds: string[],
): LanguageLesson[] {
  return lessons.filter((lesson) =>
    lesson.targetLanguage === language
    && (level === 'all' || lesson.level === level)
    && isRegionUnlocked(language, lesson.region, completedIds),
  );
}

export function completeDailyChallenge(
  userId: string,
  dateKey: string,
  storage: StorageLike = localStorage,
): { progress: LearningProgress; streakDays: number; wasAlreadyComplete: boolean } {
  const progress = loadLearningProgress(userId, storage);
  const wasAlreadyComplete = progress.completedDailyDates.includes(dateKey);
  if (!wasAlreadyComplete) {
    progress.completedDailyDates = [...progress.completedDailyDates, dateKey].sort().slice(-120);
    saveLearningProgress(userId, progress, storage);
  }
  return { progress, streakDays: dailyStreak(progress.completedDailyDates, dateKey), wasAlreadyComplete };
}

export function dailyStreak(completedDates: string[], fromDate = localDateKey()): number {
  const set = new Set(completedDates);
  const cursor = new Date(`${fromDate}T12:00:00`);
  let streak = 0;
  while (set.has(localDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function localDateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
