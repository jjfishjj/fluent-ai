import { describe, expect, it } from 'vitest';
import { LANGUAGE_LESSONS, shuffleLessonChoices } from './language-lessons';

describe('Qingyun language lessons', () => {
  it('provides complete, distinct scenario cards', () => {
    expect(LANGUAGE_LESSONS).toHaveLength(8);
    expect(new Set(LANGUAGE_LESSONS.map((lesson) => lesson.word.toLowerCase())).size).toBe(LANGUAGE_LESSONS.length);

    for (const lesson of LANGUAGE_LESSONS) {
      expect(lesson.meaning).toBeTruthy();
      expect(lesson.phonetic).toMatch(/^\/.+\/$/);
      expect(lesson.scene).toBeTruthy();
      expect(lesson.sentence).toContain('___');
      expect(lesson.translation).toBeTruthy();
      expect(lesson.mnemonic).toBeTruthy();
      expect(lesson.relatedWords.length).toBeGreaterThanOrEqual(1);
      expect(lesson.choices).toHaveLength(4);
      expect(lesson.choices).toContain(lesson.word);
      expect(new Set(lesson.choices).size).toBe(lesson.choices.length);
    }
  });

  it('shuffles a copy of the answer choices without losing or duplicating options', () => {
    const choices = ['first', 'second', 'third', 'fourth'];
    const shuffled = shuffleLessonChoices(choices, () => 0);

    expect(shuffled).toEqual(['second', 'third', 'fourth', 'first']);
    expect([...shuffled].sort()).toEqual([...choices].sort());
    expect(choices).toEqual(['first', 'second', 'third', 'fourth']);
  });
});
