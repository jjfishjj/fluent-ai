import { describe, expect, it } from 'vitest';
import type { MemoryItem } from '@/lib/memory-srs';
import { Rng } from '../core/rng';
import { buildQuestions, makeCyclingSource, makeQuestionSource, prioritiseCards } from './srs-deck';
import { STARTER_DECK_EN } from './starter-deck';

function card(id: string, english: string, meaning: string, dueInDays = -1): MemoryItem {
  return {
    id,
    english,
    meaning,
    intervalIndex: 0,
    nextReviewAt: new Date(Date.now() + dueInDays * 86400000).toISOString(),
    status: 'learning',
    createdAt: new Date().toISOString(),
    history: [],
  };
}

const rng = () => new Rng(99).next();

describe('buildQuestions', () => {
  it('still produces a playable deck when the player has no cards', () => {
    const qs = buildQuestions({ cards: [], starter: STARTER_DECK_EN, rng: new Rng(1).next.bind(new Rng(1)) });
    expect(qs.length).toBeGreaterThan(0);
    for (const q of qs) {
      expect(q.options).toContain(q.answer);
      expect(q.prompt).toBeTruthy();
    }
  });

  it('serves the player’s own cards before the starter deck', () => {
    const r = new Rng(2);
    const qs = buildQuestions({
      cards: [card('c1', 'treaty', '條約'), card('c2', 'summit', '高峰會')],
      starter: STARTER_DECK_EN,
      rng: r.next.bind(r),
    });
    expect(qs[0].cardId).toBe('c1');
    expect(qs[1].cardId).toBe('c2');
    expect(qs[2].cardId).toBeUndefined();
  });

  it('asks own cards in the recall direction so the term must be produced', () => {
    const r = new Rng(3);
    const qs = buildQuestions({
      cards: [card('c1', 'treaty', '條約')],
      starter: STARTER_DECK_EN,
      rng: r.next.bind(r),
    });
    expect(qs[0].kind).toBe('recall');
    expect(qs[0].prompt).toBe('條約');
    expect(qs[0].answer).toBe('treaty');
  });

  it('gives every question distinct options including the answer', () => {
    const r = new Rng(4);
    const qs = buildQuestions({ cards: [], starter: STARTER_DECK_EN, rng: r.next.bind(r), size: 12 });
    for (const q of qs) {
      expect(q.options).toContain(q.answer);
      expect(new Set(q.options).size).toBe(q.options.length);
      expect(q.options.length).toBeGreaterThan(1);
    }
  });

  it('limits starter material to the allowed tier', () => {
    const r = new Rng(5);
    const easy = buildQuestions({ cards: [], starter: STARTER_DECK_EN, rng: r.next.bind(r), maxTier: 1, size: 50 });
    const tier1 = new Set(STARTER_DECK_EN.filter((e) => e.tier === 1).flatMap((e) => [e.en, e.zh]));
    for (const q of easy) expect(tier1.has(q.answer)).toBe(true);
  });

  it('honours the requested deck size', () => {
    const r = new Rng(6);
    expect(buildQuestions({ cards: [], starter: STARTER_DECK_EN, rng: r.next.bind(r), size: 5 })).toHaveLength(5);
  });

  it('returns nothing when there is no material at all', () => {
    expect(buildQuestions({ cards: [], starter: [], rng })).toHaveLength(0);
  });
});

describe('makeQuestionSource', () => {
  it('serves by index and runs out at the end', () => {
    const r = new Rng(7);
    const qs = buildQuestions({ cards: [], starter: STARTER_DECK_EN, rng: r.next.bind(r), size: 3 });
    const source = makeQuestionSource(qs);
    expect(source(0)).toBe(qs[0]);
    expect(source(2)).toBe(qs[2]);
    expect(source(3)).toBeUndefined();
  });
});

describe('prioritiseCards', () => {
  it('puts due cards ahead of ones scheduled for later', () => {
    const now = Date.now();
    const sorted = prioritiseCards(
      [card('future', 'later', '之後', 5), card('due', 'now', '現在', -2)],
      now,
    );
    expect(sorted[0].id).toBe('due');
    expect(sorted[1].id).toBe('future');
  });

  it('orders overdue cards oldest first', () => {
    const now = Date.now();
    const sorted = prioritiseCards(
      [card('a', 'a', 'a', -1), card('b', 'b', 'b', -9)],
      now,
    );
    expect(sorted[0].id).toBe('b');
  });
});

describe('makeCyclingSource', () => {
  it('hands out a different question on each call', () => {
    const r = new Rng(8);
    const qs = buildQuestions({ cards: [], starter: STARTER_DECK_EN, rng: r.next.bind(r), size: 3 });
    const source = makeCyclingSource(qs);
    expect(source(0)).toBe(qs[0]);
    // A fresh encounter also asks for index 0, but must not repeat the word.
    expect(source(0)).toBe(qs[1]);
    expect(source(1)).toBe(qs[2]);
  });

  it('wraps around instead of stranding the player mid-exchange', () => {
    const r = new Rng(9);
    const qs = buildQuestions({ cards: [], starter: STARTER_DECK_EN, rng: r.next.bind(r), size: 2 });
    const source = makeCyclingSource(qs);
    source(0);
    source(1);
    expect(source(2)).toBe(qs[0]);
  });

  it('returns nothing when the deck is empty', () => {
    expect(makeCyclingSource([])(0)).toBeUndefined();
  });
});
