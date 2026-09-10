import { describe, expect, it } from 'vitest';
import { CODE_WORDS, NUMBER_CODEBOOK } from './number-codebook';

describe('number codebook spreadsheet integration', () => {
  it('contains one complete bilingual, teen-relevant entry for every code', () => {
    expect(NUMBER_CODEBOOK).toHaveLength(100);
    expect(new Set(NUMBER_CODEBOOK.map((entry) => entry.code)).size).toBe(100);
    NUMBER_CODEBOOK.forEach((entry, index) => {
      expect(entry.code).toBe(String(index).padStart(2, '0'));
      expect(entry.original.trim()).not.toBe('');
      expect(entry.association.trim()).not.toBe('');
      expect(entry.english.trim()).not.toBe('');
      expect(entry.teenTopic.trim()).not.toBe('');
    });
  });

  it('uses the spreadsheet custom association as the story-game default', () => {
    expect(CODE_WORDS[7]).toBe('007');
    expect(CODE_WORDS[19]).toBe('救護車');
    expect(CODE_WORDS[23]).toBe('和尚');
    expect(NUMBER_CODEBOOK[23].english).toContain('basketball');
    expect(NUMBER_CODEBOOK[77].teenTopic).toContain('AI');
  });
});
