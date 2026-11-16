import { describe, expect, it } from 'vitest';
import type { LanguageLesson } from './language-lessons';
import {
  completeDailyChallenge,
  dailyStreak,
  filterAvailableLessons,
  isRegionUnlocked,
  loadLearningProgress,
  markLessonCompleted,
  recordLessonReview,
  selectDailyLessons,
  updateLearningPreferences,
} from './language-learning-progress';
import { LANGUAGE_PACKS } from './language-packs';

function makeStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  };
}

const miniLesson = (id: string): LanguageLesson => ({
  id, word: id, phonetic: '/a/', meaning: '意思', scene: '情境', sentence: '___ here.',
  translation: '翻譯', relatedWords: [{ word: 'near', meaning: '接近', relation: '比較' }],
  mnemonic: '提示', choices: [id, 'b', 'c', 'd'], targetLanguage: 'en', locale: 'en-US', level: 'beginner', region: 'village',
});

const NOW = new Date('2026-11-15T08:00:00.000Z').getTime();

describe('daily Xianjing language practice', () => {
  it('stores language, level and five-to-ten-question goal preferences', () => {
    const storage = makeStorage();
    updateLearningPreferences('guest', { targetLanguage: 'ja', level: 'beginner', dailyGoal: 8 }, storage);
    expect(loadLearningProgress('guest', storage).preferences).toEqual({ targetLanguage: 'ja', level: 'beginner', dailyGoal: 8 });
  });

  it('prioritizes overdue and recently missed words, then caps the daily plan', () => {
    const lessons = ['new-a', 'due-old', 'wrong', 'due-recent', 'new-b'].map(miniLesson);
    const reviews = {
      'due-old': { nextReviewAt: new Date(NOW - 3 * 86_400_000).toISOString(), lastGrade: 'good' as const, reviewCount: 3, intervalIndex: 2 },
      'due-recent': { nextReviewAt: new Date(NOW - 86_400_000).toISOString(), lastGrade: 'good' as const, reviewCount: 1, intervalIndex: 0 },
      wrong: { nextReviewAt: new Date(NOW + 86_400_000).toISOString(), lastGrade: 'again' as const, reviewCount: 1, intervalIndex: 0 },
    };
    expect(selectDailyLessons(lessons, reviews, 4, NOW).map((lesson) => lesson.id)).toEqual(['due-old', 'due-recent', 'wrong', 'new-a']);
    expect(selectDailyLessons(lessons, reviews, 10, NOW)).toHaveLength(5);
  });

  it('unlocks forest and ruins only as each themed word set is completed', () => {
    expect(isRegionUnlocked('en', 'village', [])).toBe(true);
    expect(isRegionUnlocked('en', 'forest', ['meet', 'right', 'borrow', 'tell'])).toBe(false);
    const village = ['meet', 'right', 'borrow', 'tell', 'bring'];
    expect(isRegionUnlocked('en', 'forest', village)).toBe(true);
    expect(isRegionUnlocked('en', 'ruins', [...village, 'hear', 'lose', 'follow', 'search'])).toBe(false);
    expect(isRegionUnlocked('en', 'ruins', [...village, 'hear', 'lose', 'follow', 'search', 'quiet'])).toBe(true);
    expect(isRegionUnlocked('ja', 'forest', ['ja-arigatou', 'ja-sumimasen', 'ja-mizu', 'ja-neko', 'ja-tabemasu'])).toBe(false);
  });

  it('filters daily cards by chosen language, level and unlocked regions', () => {
    const available = filterAvailableLessons(LANGUAGE_PACKS.en, 'en', 'beginner', ['meet', 'right', 'borrow', 'tell', 'bring']);
    expect(available).toHaveLength(12);
    expect(available.every((lesson) => lesson.level === 'beginner')).toBe(true);
    expect(available.some((lesson) => lesson.region === 'forest')).toBe(true);
    expect(filterAvailableLessons(LANGUAGE_PACKS.ja, 'ja', 'intermediate', []).length).toBe(0);
  });

  it('persists correct/missed review dates and records one daily streak completion', () => {
    const storage = makeStorage();
    markLessonCompleted('guest', 'en', 'meet', storage);
    recordLessonReview('guest', 'en', 'meet', 'again', NOW, storage);
    expect(loadLearningProgress('guest', storage).reviews.en.meet.lastGrade).toBe('again');
    expect(new Date(loadLearningProgress('guest', storage).reviews.en.meet.nextReviewAt ?? '').getTime()).toBe(NOW + 86_400_000);
    const day = '2026-11-15';
    expect(completeDailyChallenge('guest', day, storage).streakDays).toBe(1);
    expect(completeDailyChallenge('guest', day, storage).wasAlreadyComplete).toBe(true);
    expect(dailyStreak(['2026-11-13', '2026-11-14', '2026-11-15'], day)).toBe(3);
  });
});
