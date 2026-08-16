import { describe, expect, it } from 'vitest';
import { diagnoseWordPhonemes, lookupIpa } from './ipa-alignment';

describe('IPA phoneme alignment', () => {
  it('locates the changed phonemes inside a substituted word', () => {
    const [result] = diagnoseWordPhonemes([{ word: 'three', spoken: 'free', status: 'replaced' }]);
    expect(result.ipa).toBe('/θɹiː/');
    expect(result.phonemes[0]).toMatchObject({ symbol: 'θ', spoken: 'f', status: 'replaced' });
    expect(result.phonemes.slice(1).every(item => item.status === 'correct')).toBe(true);
  });

  it('flags every phoneme in an omitted word', () => {
    const [result] = diagnoseWordPhonemes([{ word: 'project', status: 'missed' }]);
    expect(result.phonemes.length).toBeGreaterThan(1);
    expect(result.phonemes.every(item => item.status === 'missed')).toBe(true);
  });

  it('does not invent IPA for unsupported custom words', () => {
    expect(lookupIpa('Codexophone')).toBeNull();
  });
});
