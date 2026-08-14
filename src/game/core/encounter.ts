import { clamp } from './formulas';
import type { AidEffect, Element } from './types';

/**
 * Turn-based encounters — the 通譯官 campaign's answer to "how does a
 * diplomat fight?". Contact with an obstacle freezes the realtime simulation
 * and opens a question exchange: a right answer lands the blow, a wrong one
 * lets the misunderstanding hit back.
 *
 * Pure logic, no rendering and no storage, so the whole loop is testable.
 */

export type QuestionKind =
  /** Show the meaning, pick the target-language word. */
  | 'recall'
  /** Show the target-language word, pick the meaning. */
  | 'recognise'
  /** Sentence with a blank. */
  | 'cloze'
  /** Pick the culturally appropriate phrasing. */
  | 'register';

export interface EncounterQuestion {
  id: string;
  /** Set when the question came from a real SRS card, so the result can be
   *  written back into the review schedule. */
  cardId?: string;
  kind: QuestionKind;
  prompt: string;
  /** Extra context, revealed by the `hint` aid. */
  hint?: string;
  answer: string;
  options: string[];
  /** Shown after answering, to teach rather than just score. */
  note?: string;
}

/** Supplies questions to an encounter; the SRS bridge implements this. */
export type QuestionSource = (index: number) => EncounterQuestion | undefined;

export interface ActiveAid {
  skillId: string;
  effect: AidEffect;
  /** Aid names shown in the encounter log. */
  label: string;
}

export interface EncounterState {
  enemyId: string;
  enemyName: string;
  enemyLevel: number;
  enemyElement: Element;
  /** Questions answered so far. */
  index: number;
  question: EncounterQuestion;
  /** Options actually offered, after any `eliminate` aid. */
  options: string[];
  hintRevealed: boolean;
  /** Consecutive correct answers; drives the damage ramp. */
  streak: number;
  correct: number;
  wrong: number;
  /** Aids queued for the current or next question. */
  aids: ActiveAid[];
  /** World time when the current question was shown, for the speed bonus. */
  askedAt: number;
  lastResult?: AnswerOutcome;
  outcome?: 'win' | 'lose' | 'flee';
}

export interface AnswerOutcome {
  correct: boolean;
  chosen: string;
  answer: string;
  /** Damage dealt to the obstacle (0 when wrong). */
  damage: number;
  /** Damage taken by the player (0 when correct or shielded). */
  backlash: number;
  /** True when the speed bonus applied. */
  swift: boolean;
  /** True when an `amplify` aid was consumed. */
  amplified: boolean;
  /** True when a `shield` aid absorbed the backlash. */
  shielded: boolean;
  streak: number;
  note?: string;
}

/** Seconds within which an answer counts as swift. */
export const SWIFT_WINDOW = 6;

export interface ResolveInput {
  chosen: string;
  question: EncounterQuestion;
  /** Attack power — the interpreter's command of the language. */
  power: number;
  /** How hard the obstacle hits back. */
  enemyAtk: number;
  /** Player's defence, softening the backlash. */
  defense: number;
  streak: number;
  /** Seconds the player took to answer. */
  elapsed: number;
  aids: ActiveAid[];
}

/**
 * Works out what a single answer does. Damage ramps with the answer streak so
 * a clean run feels like building momentum, and a speed bonus rewards recall
 * that is genuinely automatic rather than reasoned out.
 */
export function resolveAnswer(input: ResolveInput): AnswerOutcome {
  const { chosen, question, power, enemyAtk, defense, streak, elapsed, aids } = input;
  const correct = chosen === question.answer;
  const swift = correct && elapsed <= SWIFT_WINDOW;
  const amplify = aids.find((a) => a.effect === 'amplify');
  const shield = aids.find((a) => a.effect === 'shield');

  if (correct) {
    const streakBonus = 1 + Math.min(1.2, streak * 0.2);
    const speedBonus = swift ? 1.25 : 1;
    const multiplier = streakBonus * speedBonus * (amplify ? 2 : 1);
    return {
      correct: true,
      chosen,
      answer: question.answer,
      damage: Math.max(1, Math.round(power * multiplier)),
      backlash: 0,
      swift,
      amplified: !!amplify,
      shielded: false,
      streak: streak + 1,
      note: question.note,
    };
  }

  // A wrong answer lets the misunderstanding through. Defence softens it the
  // same way armour does elsewhere, and a shield aid stops it outright.
  const raw = enemyAtk * (1 - defense / (defense + 120));
  return {
    correct: false,
    chosen,
    answer: question.answer,
    damage: 0,
    backlash: shield ? 0 : Math.max(1, Math.round(raw)),
    swift: false,
    amplified: false,
    shielded: !!shield,
    streak: 0,
    note: question.note,
  };
}

/**
 * Applies an aid to the question on screen. Returns the options to offer and
 * whether the hint should now be visible; aids that act on the *next* answer
 * (amplify, shield) leave the question untouched.
 */
export function applyAid(
  state: Pick<EncounterState, 'question' | 'options' | 'hintRevealed'>,
  effect: AidEffect,
  pick: (n: number) => number,
): { options: string[]; hintRevealed: boolean } {
  if (effect === 'eliminate') {
    const wrong = state.options.filter((o) => o !== state.question.answer);
    // Keep one wrong option alongside the answer, so it stays a real choice.
    const keep = wrong.length ? wrong[clamp(pick(wrong.length), 0, wrong.length - 1)] : undefined;
    const kept = state.options.filter((o) => o === state.question.answer || o === keep);
    return { options: kept, hintRevealed: state.hintRevealed };
  }
  if (effect === 'hint') {
    return { options: state.options, hintRevealed: true };
  }
  return { options: state.options, hintRevealed: state.hintRevealed };
}

/** Shuffles the options so the answer is not always in the same slot. */
export function shuffleOptions(options: string[], next: () => number): string[] {
  const out = [...options];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
