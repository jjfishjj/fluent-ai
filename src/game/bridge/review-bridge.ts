import { loadCards, reviewCard } from '@/lib/memory-srs';
import { planFor } from '@/lib/genius-plan';
import type { GeniusType } from '@/lib/genius-type';
import type { EncounterQuestion, QuestionSource } from '../core/encounter';
import { Rng } from '../core/rng';
import { buildQuestions, prioritiseCards } from './srs-deck';
import { starterDeck } from './starter-deck';

/**
 * The seam between the game and the app's real learning data.
 *
 * This is the whole point of the integration: a question answered inside a
 * fight is a genuine review, and the result moves the card along its spaced
 * repetition schedule exactly as it would in the Memory Lab.
 */

export interface DeckRequest {
  userId: string;
  language: string;
  /** Character level, used to unlock harder starter material. */
  level: number;
  /** Topics the obstacle in front of the player wants drilled. */
  topics?: string[];
  seed?: number;
  size?: number;
}

/** Harder built-in material unlocks as the interpreter gains rank. */
function tierFor(level: number): 1 | 2 | 3 {
  return level >= 12 ? 3 : level >= 6 ? 2 : 1;
}

export function loadDeck(req: DeckRequest): EncounterQuestion[] {
  const rng = new Rng(req.seed ?? Date.now() % 100000);
  const own = prioritiseCards(safeLoad(req.userId));
  return buildQuestions({
    cards: own,
    starter: starterDeck(req.language),
    rng: rng.next.bind(rng),
    maxTier: tierFor(req.level),
    topics: req.topics,
    size: req.size ?? 24,
  });
}

/**
 * A question source that follows the player between countries.
 *
 * Decks are built lazily per language and cached, each with its own cursor, so
 * flying to Kyoto swaps the vocabulary without losing your place in London.
 * A deck is rebuilt when the player's level unlocks a harder tier.
 */
export function createMissionDeck(userId: string, size = 24): QuestionSource {
  const decks = new Map<string, { questions: EncounterQuestion[]; cursor: number; key: string }>();

  return (_index, context) => {
    // A deck is identified by language, tier and the topic being drilled, so a
    // boss stage that switches to keigo gets its own list — and its own place
    // in that list, which survives going back to the general pool.
    const topics = context.topics?.length ? [...context.topics].sort() : [];
    const slot = `${context.language}|${topics.join(',')}`;
    const key = `${slot}|${tierFor(context.level)}`;

    let deck = decks.get(slot);
    if (!deck || deck.key !== key) {
      deck = {
        questions: loadDeck({
          userId,
          language: context.language,
          level: context.level,
          topics: context.topics,
          size,
        }),
        cursor: 0,
        key,
      };
      decks.set(slot, deck);
    }
    if (!deck.questions.length) return undefined;
    const question = deck.questions[deck.cursor % deck.questions.length];
    deck.cursor += 1;
    return question;
  };
}

function safeLoad(userId: string) {
  try {
    return loadCards(userId);
  } catch {
    // A corrupt or unavailable store must not stop the game from starting.
    return [];
  }
}

/**
 * Writes an in-game answer back into the review schedule. Only questions that
 * came from a real card are recorded — starter material is practice, not data.
 */
export function recordAnswer(
  userId: string,
  question: EncounterQuestion,
  correct: boolean,
  geniusType: GeniusType | null,
): boolean {
  if (!question.cardId) return false;
  try {
    reviewCard(userId, question.cardId, correct ? 'good' : 'again', planFor(geniusType).schedule, 'game');
    return true;
  } catch {
    return false;
  }
}
