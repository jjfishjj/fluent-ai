import { describe, expect, it } from 'vitest';
import { buildGateSet, gradeLane, laneAt, laneCenter, questionFor } from './gates';
import { buildTrack } from './track';
import { NATIONS } from '../data/nations';
import type { ChallengeKind } from '../data/nations';
import { TRACKS } from '../data/tracks';

const track = buildTrack(TRACKS.japan);
const japan = NATIONS.japan;

const KINDS: ChallengeKind[] = ['word', 'listen', 'number', 'recall', 'mixed'];

describe('buildGateSet', () => {
  it('lays the requested number of gates inside the lap', () => {
    const set = buildGateSet(track, japan, 'word', 3, 4, 1);
    expect(set.gates).toHaveLength(4);
    for (const gate of set.gates) {
      expect(gate.s).toBeGreaterThanOrEqual(0);
      expect(gate.s).toBeLessThan(track.length);
    }
    // Sorted, indexed, and spread out rather than bunched.
    const spacing = set.gates.map((g, i) => (i === 0 ? g.s : g.s - set.gates[i - 1].s)).slice(1);
    expect(Math.min(...spacing)).toBeGreaterThan(track.length * 0.1);
    expect(set.gates.map((g) => g.index)).toEqual([0, 1, 2, 3]);
  });

  it('never puts a gate on top of a boost pad', () => {
    for (const def of Object.values(NATIONS)) {
      const built = buildTrack(TRACKS[def.id]);
      const set = buildGateSet(built, def, 'word', def.laps, 4, 7);
      for (const gate of set.gates) {
        for (const pad of built.boosts) {
          expect(Math.abs(gate.s - pad.s)).toBeGreaterThan(4);
        }
      }
    }
  });

  it('writes one question per gate per lap, each with exactly one right lane', () => {
    for (const kind of KINDS) {
      const set = buildGateSet(track, japan, kind, 3, 4, 3);
      expect(set.questions).toHaveLength(3);
      for (let lap = 0; lap < 3; lap += 1) {
        for (let i = 0; i < 4; i += 1) {
          const question = questionFor(set, lap, i);
          expect(question).toBeDefined();
          expect(question!.lanes).toHaveLength(3);
          expect(question!.lanes.filter((lane) => lane.correct)).toHaveLength(1);
          // Three identical options would make the gate meaningless.
          expect(new Set(question!.lanes.map((lane) => lane.text)).size).toBe(3);
          expect(question!.prompt.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('asks for the target language on word gates and for the meaning on listening gates', () => {
    const word = questionFor(buildGateSet(track, japan, 'word', 1, 4, 5), 0, 0)!;
    const natives = japan.phrases.map((p) => p.native);
    for (const lane of word.lanes) expect(natives).toContain(lane.text);

    const listen = questionFor(buildGateSet(track, japan, 'listen', 1, 4, 5), 0, 0)!;
    const meanings = japan.phrases.map((p) => p.meaning);
    for (const lane of listen.lanes) expect(meanings).toContain(lane.text);
    // The prompt is audio, so something has to be speakable.
    expect(listen.speak).toBeTruthy();
    expect(natives).toContain(listen.speak!);
  });

  it('offers the local number words on number gates', () => {
    const set = buildGateSet(track, japan, 'number', 1, 4, 9);
    const question = questionFor(set, 0, 0)!;
    const natives = japan.numbers.map((n) => n.native);
    for (const lane of question.lanes) expect(natives).toContain(lane.text);
    expect(question.prompt).toMatch(/\d+/);
  });

  it('draws recall gates only from the memorised sequence', () => {
    const set = buildGateSet(track, japan, 'recall', 2, 4, 11);
    expect(set.memorise.length).toBeGreaterThanOrEqual(3);
    const memorised = set.memorise.map((p) => p.native);
    for (let lap = 0; lap < 2; lap += 1) {
      for (let i = 0; i < 4; i += 1) {
        const question = questionFor(set, lap, i)!;
        for (const lane of question.lanes) expect(memorised).toContain(lane.text);
        const answer = question.lanes.find((lane) => lane.correct)!;
        const position = Number(question.prompt.match(/第 (\d+) 個/)?.[1]);
        expect(set.memorise[position - 1].native).toBe(answer.text);
      }
    }
  });

  it('rotates through every challenge kind on a mixed stage', () => {
    const set = buildGateSet(track, NATIONS.russia, 'mixed', 4, 4, 13);
    const prompts = set.questions.flat().map((q) => q.prompt);
    expect(prompts.some((p) => p.includes('怎麼說'))).toBe(true);
    expect(set.questions.flat().some((q) => !!q.speak)).toBe(true);
    expect(prompts.some((p) => p.includes('記憶序列'))).toBe(true);
  });

  it('is deterministic for a seed', () => {
    const a = buildGateSet(track, japan, 'mixed', 3, 4, 99);
    const b = buildGateSet(track, japan, 'mixed', 3, 4, 99);
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
    const c = buildGateSet(track, japan, 'mixed', 3, 4, 100);
    expect(JSON.stringify(c)).not.toBe(JSON.stringify(a));
  });
});

describe('lanes', () => {
  it('maps lateral position to the lane you are driving in', () => {
    const half = 8;
    expect(laneAt(-6, half)).toBe(0);
    expect(laneAt(-3, half)).toBe(0);
    expect(laneAt(0, half)).toBe(1);
    expect(laneAt(1.5, half)).toBe(1);
    expect(laneAt(5, half)).toBe(2);
    // Driving round the outside answers nothing.
    expect(laneAt(12, half)).toBe(-1);
    expect(laneAt(-12, half)).toBe(-1);
  });

  it('puts every lane centre back inside its own lane', () => {
    const half = 7.5;
    for (const lane of [0, 1, 2]) {
      expect(laneAt(laneCenter(half, lane), half)).toBe(lane);
      expect(Math.abs(laneCenter(half, lane))).toBeLessThan(half);
    }
  });

  it('grades a pass by the lane taken', () => {
    const question = questionFor(buildGateSet(track, japan, 'word', 1, 4, 21), 0, 0)!;
    const correct = question.lanes.findIndex((lane) => lane.correct);
    expect(gradeLane(question, correct)).toBe('correct');
    expect(gradeLane(question, (correct + 1) % 3)).toBe('wrong');
    expect(gradeLane(question, -1)).toBe('missed');
  });
});
