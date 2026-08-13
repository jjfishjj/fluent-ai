import { Rng } from '../../core/rng';
import type { ChallengeKind, NationDef, Phrase } from '../data/nations';
import type { Track } from './types';

/**
 * Roadside gates are how fluent-ai's learning loop rides inside the racing
 * loop: three lanes span the road, each labelled with a candidate answer, and
 * the lane you drive through *is* your answer. Right lane → boost, wrong lane
 * → you bleed speed. No pausing, no pop-up quiz.
 */
export interface GateLane {
  text: string;
  /** Romanisation or gloss printed under the main label. */
  sub?: string;
  correct: boolean;
}

export interface GateQuestion {
  prompt: string;
  hint?: string;
  /** Spoken through speech synthesis on listening gates. */
  speak?: string;
  lanes: GateLane[];
  /** The phrase being tested, kept for the post-race review and memory cards. */
  answer: Phrase;
}

export interface Gate {
  index: number;
  /** Arc length along the lap where the gate stands. */
  s: number;
}

export interface GateSet {
  kind: ChallengeKind;
  gates: Gate[];
  /** Words shown before the lights on recall stages; empty otherwise. */
  memorise: Phrase[];
  /** questions[lap][gateIndex] — a fresh question each time round. */
  questions: GateQuestion[][];
  nationId: string;
  speechLang: string;
}

export type GateOutcome = 'correct' | 'wrong' | 'missed';

/** Lane centres as a fraction of the road half-width, left to right. */
const LANE_OFFSET = [-0.5, 0, 0.5];
/** Half-width of a lane's catchment, again as a fraction of the road. */
const LANE_EDGE = 0.25;

export function laneCenter(halfWidth: number, lane: number): number {
  return LANE_OFFSET[Math.max(0, Math.min(2, lane))] * halfWidth;
}

/** The two lateral offsets where one lane's catchment becomes the next. */
export function laneBoundaries(halfWidth: number): [number, number] {
  return [-halfWidth * LANE_EDGE, halfWidth * LANE_EDGE];
}

/**
 * Which lane a racer is in. Returns -1 when they are off the road entirely —
 * driving around the gate is neither right nor wrong, it just wastes the gate.
 */
export function laneAt(lateral: number, halfWidth: number): number {
  if (Math.abs(lateral) > halfWidth + 1.2) return -1;
  if (lateral < -halfWidth * LANE_EDGE) return 0;
  if (lateral > halfWidth * LANE_EDGE) return 2;
  return 1;
}

/** Picks `count` distinct entries, always including `must`. */
function sample<T>(rng: Rng, pool: readonly T[], count: number, must: T): T[] {
  const rest = pool.filter((item) => item !== must);
  const picked = [must];
  while (picked.length < count && rest.length > 0) {
    const index = rng.int(0, rest.length - 1);
    picked.push(rest.splice(index, 1)[0]);
  }
  return picked;
}

function shuffle<T>(rng: Rng, items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = rng.int(0, i);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function laneSet(rng: Rng, options: { text: string; sub?: string }[], correctIndex: number): GateLane[] {
  const marked = options.map((option, i) => ({ ...option, correct: i === correctIndex }));
  return shuffle(rng, marked);
}

function wordQuestion(rng: Rng, def: NationDef): GateQuestion {
  const answer = rng.pick(def.phrases);
  const choices = sample(rng, def.phrases, 3, answer);
  return {
    prompt: `「${answer.meaning}」怎麼說？`,
    hint: def.name,
    lanes: laneSet(
      rng,
      choices.map((p) => ({ text: p.native, sub: p.roman })),
      0,
    ),
    answer,
  };
}

function listenQuestion(rng: Rng, def: NationDef): GateQuestion {
  const answer = rng.pick(def.phrases);
  const choices = sample(rng, def.phrases, 3, answer);
  return {
    prompt: '🔊 這句話是什麼意思？',
    hint: answer.roman ? `${def.name} · ${answer.roman}` : def.name,
    speak: answer.native,
    lanes: laneSet(
      rng,
      choices.map((p) => ({ text: p.meaning })),
      0,
    ),
    answer,
  };
}

function numberQuestion(rng: Rng, def: NationDef): GateQuestion {
  const answer = rng.pick(def.numbers);
  const choices = sample(rng, def.numbers, 3, answer);
  return {
    prompt: `${answer.value} 用${def.name}話怎麼念？`,
    hint: '數字轉碼',
    lanes: laneSet(
      rng,
      choices.map((n) => ({ text: n.native, sub: n.roman })),
      0,
    ),
    answer: { native: answer.native, roman: answer.roman, meaning: `數字 ${answer.value}` },
  };
}

function recallQuestion(rng: Rng, def: NationDef, memorise: Phrase[]): GateQuestion {
  const position = rng.int(1, memorise.length);
  const answer = memorise[position - 1];
  const choices = sample(rng, memorise, Math.min(3, memorise.length), answer);
  return {
    prompt: `記憶序列第 ${position} 個是？`,
    hint: `${def.name} · 起跑前記下的順序`,
    lanes: laneSet(
      rng,
      choices.map((p) => ({ text: p.native, sub: p.meaning })),
      0,
    ),
    answer,
  };
}

/**
 * Lays gates round the lap and writes every question up front from a seed, so
 * a replayed race asks the same things and tests stay deterministic.
 */
export function buildGateSet(
  track: Track,
  def: NationDef,
  kind: ChallengeKind,
  laps: number,
  count = 4,
  seed = 20260813,
): GateSet {
  const rng = new Rng(seed ^ (def.id.length * 7919));

  // Space the gates evenly, then nudge any that landed on a boost pad — the two
  // rewards should never be collectable with one steering decision.
  const gates: Gate[] = [];
  for (let i = 0; i < count; i += 1) {
    let s = ((i + 0.6) / count) * track.length;
    for (const pad of track.boosts) {
      if (Math.abs(s - pad.s) < 10) s = (pad.s + 16) % track.length;
    }
    gates.push({ index: i, s });
  }
  gates.sort((a, b) => a.s - b.s);
  gates.forEach((gate, i) => {
    gate.index = i;
  });

  const needsMemory = kind === 'recall' || kind === 'mixed';
  const memorise = needsMemory ? shuffle(rng, [...def.phrases]).slice(0, 4) : [];

  const order: ChallengeKind[] = ['word', 'listen', 'number', 'recall'];
  const questions: GateQuestion[][] = [];
  for (let lap = 0; lap < laps; lap += 1) {
    const row: GateQuestion[] = [];
    for (let i = 0; i < gates.length; i += 1) {
      const active = kind === 'mixed' ? order[(lap * gates.length + i) % order.length] : kind;
      if (active === 'listen') row.push(listenQuestion(rng, def));
      else if (active === 'number') row.push(numberQuestion(rng, def));
      else if (active === 'recall' && memorise.length >= 2) row.push(recallQuestion(rng, def, memorise));
      else row.push(wordQuestion(rng, def));
    }
    questions.push(row);
  }

  return { kind, gates, memorise, questions, nationId: def.id, speechLang: def.speechLang };
}

export function questionFor(set: GateSet, lap: number, gateIndex: number): GateQuestion | undefined {
  return set.questions[Math.min(lap, set.questions.length - 1)]?.[gateIndex];
}

/** Grades a pass through a gate from the racer's lane. */
export function gradeLane(question: GateQuestion, lane: number): GateOutcome {
  if (lane < 0 || lane >= question.lanes.length) return 'missed';
  return question.lanes[lane].correct ? 'correct' : 'wrong';
}
