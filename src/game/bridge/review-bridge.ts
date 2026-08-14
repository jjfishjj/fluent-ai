import { loadCards, reviewCard } from '@/lib/memory-srs';
import { planFor } from '@/lib/genius-plan';
import type { GeniusType } from '@/lib/genius-type';
import type { EncounterQuestion } from '../core/encounter';
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
  seed?: number;
  size?: number;
}

export function loadDeck(req: DeckRequest): EncounterQuestion[] {
  const rng = new Rng(req.seed ?? Date.now() % 100000);
  const own = prioritiseCards(safeLoad(req.userId));
  return buildQuestions({
    cards: own,
    starter: starterDeck(req.language),
    rng: rng.next.bind(rng),
    maxTier: req.level >= 12 ? 3 : req.level >= 6 ? 2 : 1,
    size: req.size ?? 24,
  });
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
