import { describe, expect, it } from 'vitest';
import { LANGUAGE_LESSONS, shuffleLessonChoices } from './language-lessons';
import { ALL_LANGUAGE_LESSONS, LANGUAGE_PACKS } from './language-packs';

describe('Qingyun language lessons', () => {
  it('keeps eight distinct flashcards for the 3D shrine', () => {
    expect(LANGUAGE_LESSONS).toHaveLength(8);
    expect(new Set(LANGUAGE_LESSONS.map((lesson) => lesson.word.toLowerCase())).size).toBe(LANGUAGE_LESSONS.length);
  });

  it('provides complete, distinct scenario cards with Traditional Chinese explanations', () => {
    expect(ALL_LANGUAGE_LESSONS.length).toBeGreaterThan(20);
    for (const lesson of ALL_LANGUAGE_LESSONS) {
      expect(lesson.meaning).toBeTruthy();
      expect(lesson.phonetic).toBeTruthy();
      expect(lesson.scene).toBeTruthy();
      expect(lesson.sentence).toContain('___');
      expect(lesson.translation).toBeTruthy();
      expect(lesson.mnemonic).toBeTruthy();
      expect(lesson.relatedWords.length).toBeGreaterThanOrEqual(1);
      expect(lesson.choices).toHaveLength(4);
      expect(lesson.choices).toContain(lesson.word);
      expect(new Set(lesson.choices).size).toBe(lesson.choices.length);
      expect(['en', 'ja']).toContain(lesson.targetLanguage);
      expect(['village', 'forest', 'ruins']).toContain(lesson.region);
    }
  });

  it('offers beginner and intermediate English packs and a selectable Japanese starter pack', () => {
    expect(LANGUAGE_PACKS.en.filter((lesson) => lesson.level === 'beginner')).toHaveLength(12);
    expect(LANGUAGE_PACKS.en.filter((lesson) => lesson.level === 'intermediate')).toHaveLength(8);
    expect(LANGUAGE_PACKS.en.filter((lesson) => lesson.region === 'village')).toHaveLength(6);
    expect(LANGUAGE_PACKS.en.filter((lesson) => lesson.region === 'forest')).toHaveLength(6);
    expect(LANGUAGE_PACKS.en.filter((lesson) => lesson.region === 'ruins')).toHaveLength(8);
    expect(LANGUAGE_PACKS.ja).toHaveLength(6);
    expect(LANGUAGE_PACKS.ja.every((lesson) => lesson.locale === 'ja-JP' && lesson.region === 'village')).toBe(true);
  });

  it('shuffles a copy of the answer choices without losing or duplicating options', () => {
    const choices = ['first', 'second', 'third', 'fourth'];
    const shuffled = shuffleLessonChoices(choices, () => 0);

    expect(shuffled).toEqual(['second', 'third', 'fourth', 'first']);
    expect([...shuffled].sort()).toEqual([...choices].sort());
    expect(choices).toEqual(['first', 'second', 'third', 'fourth']);
  });
});
