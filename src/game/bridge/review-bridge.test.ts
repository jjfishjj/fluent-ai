import { beforeEach, describe, expect, it } from 'vitest';
import { addCard, loadCards } from '@/lib/memory-srs';
import type { QuestionContext } from '../core/encounter';
import { createMissionDeck, loadDeck, recordAnswer } from './review-bridge';
import { STARTER_DECKS } from './starter-deck';

const USER = 'test-user';
const en: QuestionContext = { language: 'english', level: 1 };
const ja: QuestionContext = { language: 'japanese', level: 1 };

beforeEach(() => {
  localStorage.clear();
});

describe('createMissionDeck', () => {
  it('serves the language of the country the player is standing in', () => {
    const source = createMissionDeck(USER);
    const english = new Set(STARTER_DECKS.english.flatMap((e) => [e.term, e.meaning]));
    const japanese = new Set(STARTER_DECKS.japanese.flatMap((e) => [e.term, e.meaning]));

    const first = source(0, en)!;
    expect(english.has(first.answer)).toBe(true);

    const second = source(0, ja)!;
    expect(japanese.has(second.answer)).toBe(true);
  });

  it('keeps a separate place in each country’s deck', () => {
    const source = createMissionDeck(USER);
    const a = source(0, en)!;
    source(0, ja);
    source(0, ja);
    const b = source(0, en)!;
    // Travelling to Kyoto and back must not restart the London deck.
    expect(b.id).not.toBe(a.id);
  });

  it('rebuilds a deck when the player unlocks a harder tier', () => {
    const source = createMissionDeck(USER);
    const tier1 = new Set(STARTER_DECKS.english.filter((e) => e.tier === 1).flatMap((e) => [e.term, e.meaning]));
    for (let i = 0; i < 8; i++) {
      const q = source(0, { language: 'english', level: 1 })!;
      expect(tier1.has(q.answer)).toBe(true);
    }
    // At a higher rank the same source may now serve tier 2 and 3 material.
    const seen = new Set<string>();
    for (let i = 0; i < 40; i++) seen.add(source(0, { language: 'english', level: 20 })!.answer);
    expect([...seen].some((answer) => !tier1.has(answer))).toBe(true);
  });

  it('still produces questions when the player has no cards at all', () => {
    const source = createMissionDeck(USER);
    expect(source(0, { language: 'french', level: 30 })).toBeDefined();
  });
});

describe('loadDeck', () => {
  it('puts the player’s own cards ahead of the built-in deck', () => {
    addCard(USER, { english: 'treaty', meaning: '條約', encodeNote: '兩隻手握在一起' });
    const deck = loadDeck({ userId: USER, language: 'english', level: 1, seed: 1 });
    expect(deck[0].cardId).toBeDefined();
    expect(deck[0].answer).toBe('treaty');
    expect(deck[0].hint).toBe('兩隻手握在一起');
  });
});

describe('recordAnswer', () => {
  it('advances a real card’s schedule on a correct answer', () => {
    addCard(USER, { english: 'summit', meaning: '高峰會' });
    const before = loadCards(USER)[0];
    const question = loadDeck({ userId: USER, language: 'english', level: 1, seed: 2 })[0];

    expect(recordAnswer(USER, question, true, 'architect')).toBe(true);

    const after = loadCards(USER).find((c) => c.id === before.id)!;
    expect(after.intervalIndex).toBeGreaterThan(before.intervalIndex);
    expect(Date.parse(after.nextReviewAt)).toBeGreaterThan(Date.parse(before.nextReviewAt));
    expect(after.history).toHaveLength(1);
    expect(after.history[0].grade).toBe('good');
  });

  it('sends a card back on a wrong answer', () => {
    addCard(USER, { english: 'ratify', meaning: '批准' });
    const question = loadDeck({ userId: USER, language: 'english', level: 1, seed: 3 })[0];
    // Push it forward once so there is something to lose.
    recordAnswer(USER, question, true, 'architect');
    const advanced = loadCards(USER)[0];

    expect(recordAnswer(USER, question, false, 'architect')).toBe(true);
    const after = loadCards(USER)[0];
    expect(after.intervalIndex).toBeLessThan(advanced.intervalIndex);
    expect(after.history.at(-1)?.grade).toBe('again');
  });

  it('ignores starter material, which is practice rather than data', () => {
    const question = loadDeck({ userId: USER, language: 'english', level: 1, seed: 4 })[0];
    expect(question.cardId).toBeUndefined();
    expect(recordAnswer(USER, question, true, null)).toBe(false);
    expect(loadCards(USER)).toHaveLength(0);
  });
});
