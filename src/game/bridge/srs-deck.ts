import type { MemoryItem } from '@/lib/memory-srs';
import type { EncounterQuestion, QuestionKind, QuestionSource } from '../core/encounter';
import type { StarterEntry } from './starter-deck';

/**
 * Turns review material into encounter questions.
 *
 * The player's own SRS cards come first — answering one in a fight is a real
 * review, and `recordAnswer` writes the result back into the schedule. The
 * built-in starter deck only fills in behind them, so a visitor with an empty
 * deck still has something to play with.
 *
 * Everything here takes its input as arguments rather than reading
 * localStorage, so the deck logic is testable without a browser.
 */

export interface DeckSource {
  /** The player's own cards, already filtered to whatever is due. */
  cards: MemoryItem[];
  /** Built-in fallback material. */
  starter: StarterEntry[];
  /** 0..1 source of randomness. */
  rng: () => number;
  /** Highest starter tier to draw from; rises with the player's level. */
  maxTier?: 1 | 2 | 3;
  /** Total questions to prepare. */
  size?: number;
}

const DISTRACTOR_COUNT = 3;

/** One candidate answer, from either source. */
interface Candidate {
  cardId?: string;
  term: string;
  meaning: string;
  hint?: string;
  note?: string;
}

function fromCard(card: MemoryItem): Candidate {
  return {
    cardId: card.id,
    term: card.english,
    meaning: card.meaning,
    hint: card.encodeNote,
    note: card.encodeNote ? `你的編碼：${card.encodeNote}` : undefined,
  };
}

function fromStarter(entry: StarterEntry): Candidate {
  return { term: entry.en, meaning: entry.zh, hint: entry.hint, note: entry.note };
}

function pickDistractors(
  pool: Candidate[],
  answer: Candidate,
  field: 'term' | 'meaning',
  rng: () => number,
): string[] {
  const seen = new Set([answer[field]]);
  const out: string[] = [];
  // Sample without replacement; the pool is small so rejection is fine.
  let guard = pool.length * 6 + 24;
  while (out.length < DISTRACTOR_COUNT && guard-- > 0) {
    const candidate = pool[Math.floor(rng() * pool.length) % pool.length];
    const value = candidate?.[field];
    if (!value || seen.has(value)) continue;
    seen.add(value);
    out.push(value);
  }
  return out;
}

/**
 * Builds the question list. Cards the player owns are asked as recall (produce
 * the term from the meaning), which is the harder and more valuable direction;
 * starter material alternates so the fight has some variety.
 */
export function buildQuestions(source: DeckSource): EncounterQuestion[] {
  const { cards, starter, rng } = source;
  const maxTier = source.maxTier ?? 3;
  const size = source.size ?? 20;

  const own = cards.map(fromCard);
  const fallback = starter.filter((e) => e.tier <= maxTier).map(fromStarter);
  const pool = [...own, ...fallback];
  if (!pool.length) return [];

  // Own cards first, then starter material to fill the rest.
  const ordered: Candidate[] = [...own];
  for (const entry of fallback) {
    if (ordered.length >= size) break;
    ordered.push(entry);
  }

  return ordered.slice(0, size).map((candidate, i): EncounterQuestion => {
    // Ask the player's own cards in the recall direction; vary the rest.
    const kind: QuestionKind = candidate.cardId ? 'recall' : i % 3 === 2 ? 'recognise' : 'recall';
    const askForTerm = kind === 'recall';
    const answer = askForTerm ? candidate.term : candidate.meaning;
    const field = askForTerm ? 'term' : 'meaning';
    const options = [answer, ...pickDistractors(pool, candidate, field, rng)];

    return {
      id: `${candidate.cardId ?? 'starter'}-${i}`,
      cardId: candidate.cardId,
      kind,
      prompt: askForTerm ? candidate.meaning : candidate.term,
      hint: candidate.hint,
      answer,
      options,
      note: candidate.note,
    };
  });
}

/** Wraps a prepared list into the source the world pulls from. */
export function makeQuestionSource(questions: EncounterQuestion[]): QuestionSource {
  return (index: number) => questions[index];
}

/**
 * Serves the deck as a rolling queue rather than by absolute index.
 *
 * Encounters number their questions from zero, so an index-based source would
 * open every fight with the same word. This hands out the next unseen question
 * instead and wraps around when the deck is exhausted, which also means a
 * short deck never strands the player mid-exchange.
 */
export function makeCyclingSource(questions: EncounterQuestion[]): QuestionSource {
  let cursor = 0;
  return () => {
    if (!questions.length) return undefined;
    const question = questions[cursor % questions.length];
    cursor += 1;
    return question;
  };
}

/**
 * Sorts a card list the way the game wants to serve it: due cards first,
 * then the ones nearest to being due.
 */
export function prioritiseCards(cards: MemoryItem[], now = Date.now()): MemoryItem[] {
  return [...cards].sort((a, b) => {
    const da = Date.parse(a.nextReviewAt) || 0;
    const db = Date.parse(b.nextReviewAt) || 0;
    const aDue = da <= now ? 0 : 1;
    const bDue = db <= now ? 0 : 1;
    if (aDue !== bDue) return aDue - bDue;
    return da - db;
  });
}
