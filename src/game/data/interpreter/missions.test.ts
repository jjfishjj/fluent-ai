import { describe, expect, it } from 'vitest';
import { STARTER_DECKS } from '../../bridge/starter-deck';
import { INTERPRETER_PACK } from './pack';
import { ALL_BARRIERS, MISSIONS, missionFor } from './missions';
import { INTERPRETER_QUESTS, INTERPRETER_ZONES } from './zones';

describe('mission registry', () => {
  it('gives every mission a starter deck for its language', () => {
    for (const m of MISSIONS) {
      expect(STARTER_DECKS[m.language], `${m.country} has no deck`).toBeDefined();
      expect(STARTER_DECKS[m.language].length).toBeGreaterThan(10);
    }
  });

  it('tags each mission zone with its language so encounters follow the player', () => {
    for (const m of MISSIONS) expect(m.zone.language).toBe(m.language);
    // The hub has no language of its own; the pack default covers it.
    expect(INTERPRETER_ZONES.academy.language).toBeUndefined();
    expect(INTERPRETER_PACK.language).toBeDefined();
  });

  it('opens one academy gate per mission, gated by level', () => {
    const gates = INTERPRETER_ZONES.academy.portals;
    expect(gates).toHaveLength(MISSIONS.length);
    for (const m of MISSIONS) {
      const gate = gates.find((g) => g.toZone === m.zone.id)!;
      expect(gate).toBeDefined();
      expect(gate.reqLevel ?? 1).toBe(m.reqLevel);
    }
  });

  it('lets every mission zone return to the academy', () => {
    for (const m of MISSIONS) {
      expect(m.zone.portals.some((p) => p.toZone === 'academy')).toBe(true);
    }
  });

  it('spawns only barriers the pack knows about', () => {
    for (const zone of Object.values(INTERPRETER_ZONES)) {
      for (const spawn of zone.spawns) {
        expect(ALL_BARRIERS[spawn.monsterId], `${spawn.monsterId} missing`).toBeDefined();
      }
    }
  });

  it('drops only items the pack knows about', () => {
    for (const barrier of Object.values(ALL_BARRIERS)) {
      for (const drop of barrier.drops) {
        expect(INTERPRETER_PACK.items[drop.itemId], `${drop.itemId} missing`).toBeDefined();
      }
    }
  });

  it('ramps difficulty across the postings without overlap', () => {
    const tops = MISSIONS.map((m) => m.envoy.level);
    for (let i = 1; i < tops.length; i++) expect(tops[i]).toBeGreaterThan(tops[i - 1]);
    for (const m of MISSIONS) {
      // Every obstacle in a country sits below its representative.
      for (const b of m.barriers) expect(b.level).toBeLessThan(m.envoy.level);
      // And the gate opens at or below the easiest obstacle there.
      expect(m.reqLevel).toBeLessThanOrEqual(Math.min(...m.barriers.map((b) => b.level)));
    }
  });

  it('makes each representative markedly tougher than the local obstacles', () => {
    for (const m of MISSIONS) {
      const toughest = Math.max(...m.barriers.map((b) => b.hp));
      expect(m.envoy.hp).toBeGreaterThan(toughest * 2);
      expect(m.envoy.boss).toBe(true);
    }
  });

  it('awards a distinct credential per country, dropped only by its envoy', () => {
    const credentials = MISSIONS.map((m) => m.credential);
    expect(new Set(credentials).size).toBe(MISSIONS.length);
    for (const m of MISSIONS) {
      expect(m.envoy.drops.some((d) => d.itemId === m.credential && d.chance === 1)).toBe(true);
      const others = Object.values(ALL_BARRIERS).filter((b) => b.id !== m.envoy.id);
      expect(others.some((b) => b.drops.some((d) => d.itemId === m.credential))).toBe(false);
    }
  });

  it('chains the quest line across countries without dead ends', () => {
    const quests = INTERPRETER_QUESTS;
    for (const quest of Object.values(quests)) {
      if (quest.next) expect(quests[quest.next], `${quest.id} -> ${quest.next}`).toBeDefined();
      expect(INTERPRETER_ZONES[quest.zone], `${quest.id} zone`).toBeDefined();
      // Kill targets must exist; collect targets must be real items.
      if (quest.kind === 'kill') expect(ALL_BARRIERS[quest.target]).toBeDefined();
      if (quest.kind === 'collect') expect(INTERPRETER_PACK.items[quest.target]).toBeDefined();
    }
    // The opening quest reaches the final one by following `next`.
    const visited = new Set<string>();
    let id: string | undefined = 'i1';
    while (id && !visited.has(id)) {
      visited.add(id);
      id = quests[id]?.next;
    }
    expect(visited.size).toBe(Object.keys(quests).length);
  });

  it('names each quest giver as an NPC in its own zone', () => {
    for (const quest of Object.values(INTERPRETER_QUESTS)) {
      const zone = INTERPRETER_ZONES[quest.zone];
      expect(zone.npcs.some((n) => n.id === quest.giver), `${quest.id} giver`).toBe(true);
    }
  });

  it('resolves a zone back to its mission', () => {
    expect(missionFor('kyoto')?.language).toBe('japanese');
    expect(missionFor('academy')).toBeUndefined();
  });
});

describe('starter decks', () => {
  it('covers all three tiers in every language', () => {
    for (const [language, deck] of Object.entries(STARTER_DECKS)) {
      for (const tier of [1, 2, 3] as const) {
        expect(deck.some((e) => e.tier === tier), `${language} tier ${tier}`).toBe(true);
      }
    }
  });

  it('has no duplicate terms inside a deck', () => {
    for (const [language, deck] of Object.entries(STARTER_DECKS)) {
      const terms = deck.map((e) => e.term);
      expect(new Set(terms).size, `${language} has duplicates`).toBe(terms.length);
    }
  });

  it('gives every entry a meaning and a teaching note', () => {
    for (const deck of Object.values(STARTER_DECKS)) {
      for (const entry of deck) {
        expect(entry.term.trim()).not.toBe('');
        expect(entry.meaning.trim()).not.toBe('');
        expect(entry.note?.trim()).toBeTruthy();
      }
    }
  });
});

describe('deck quality', () => {
  it('has no duplicate meanings, which would make distractors ambiguous', () => {
    for (const [language, deck] of Object.entries(STARTER_DECKS)) {
      const meanings = deck.map((e) => e.meaning);
      const dupes = meanings.filter((m, i) => meanings.indexOf(m) !== i);
      expect(dupes, `${language} duplicates: ${dupes.join(', ')}`).toHaveLength(0);
    }
  });

  it('never states a meaning identical to its own term', () => {
    for (const [language, deck] of Object.entries(STARTER_DECKS)) {
      for (const entry of deck) {
        expect(entry.meaning.trim(), `${language}: ${entry.term}`).not.toBe(entry.term.trim());
      }
    }
  });
});
