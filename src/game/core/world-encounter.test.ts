import { beforeEach, describe, expect, it, vi } from 'vitest';
import { INTERPRETER_PACK } from '../data/interpreter/pack';
import type { EncounterQuestion } from './encounter';
import { World, newProfile } from './world';

/** A deterministic four-question deck. */
function deck(count = 8): EncounterQuestion[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `q${i}`,
    cardId: i % 2 === 0 ? `card${i}` : undefined,
    kind: 'recall' as const,
    prompt: `題目 ${i}`,
    hint: `提示 ${i}`,
    answer: `right${i}`,
    options: [`right${i}`, `wrong${i}a`, `wrong${i}b`, `wrong${i}c`],
    note: `說明 ${i}`,
  }));
}

function makeWorld(questions = deck(), onAnswer?: (q: EncounterQuestion, ok: boolean) => void) {
  const profile = newProfile('見習生', 'architect', INTERPRETER_PACK);
  const world = new World(profile, {
    seed: 42,
    pack: INTERPRETER_PACK,
    questions: (i) => questions[i],
    onAnswer,
  });
  world.loadZone('london', { x: 0, z: 0 });
  return world;
}

/** Drops a barrier right on top of the player. */
function barrierAt(world: World, monsterId: string) {
  const mob = world.monsters().find((m) => m.monsterId === monsterId && m.state !== 'dead')!;
  mob.pos = { x: world.player.pos.x + 0.5, z: world.player.pos.z };
  return mob;
}

describe('encounter lifecycle', () => {
  let world: World;

  beforeEach(() => {
    world = makeWorld();
  });

  it('opens on contact instead of auto-attacking', () => {
    const mob = barrierAt(world, 'murmur');
    const hp = mob.hp;
    world.tick(0.05);
    expect(world.encounter).toBeDefined();
    expect(world.encounter?.enemyId).toBe(mob.id);
    // Nothing was hit just by walking into it.
    expect(mob.hp).toBe(hp);
  });

  it('freezes the realtime world while a question is on screen', () => {
    barrierAt(world, 'murmur');
    world.tick(0.05);
    const p = world.player;
    const before = { x: p.pos.x, z: p.pos.z, hp: p.hp };
    world.setMoveInput(1, 0);
    for (let i = 0; i < 40; i++) world.tick(0.05);
    expect(p.pos.x).toBe(before.x);
    expect(p.pos.z).toBe(before.z);
    expect(p.hp).toBe(before.hp);
  });

  it('damages the barrier on a correct answer and nothing else', () => {
    const mob = barrierAt(world, 'murmur');
    world.tick(0.05);
    const hp = mob.hp;
    const playerHp = world.player.hp;

    const out = world.answerEncounter(world.encounter!.question.answer);
    expect(out?.correct).toBe(true);
    expect(mob.hp).toBeLessThan(hp);
    expect(world.player.hp).toBe(playerHp);
    expect(world.encounter?.correct).toBe(1);
  });

  it('hurts the player on a wrong answer', () => {
    const mob = barrierAt(world, 'murmur');
    world.tick(0.05);
    const hp = mob.hp;
    const playerHp = world.player.hp;

    const out = world.answerEncounter('definitely wrong');
    expect(out?.correct).toBe(false);
    expect(mob.hp).toBe(hp);
    expect(world.player.hp).toBeLessThan(playerHp);
    expect(world.encounter?.wrong).toBe(1);
  });

  it('advances to the next question and resets the hint', () => {
    barrierAt(world, 'murmur');
    world.tick(0.05);
    const first = world.encounter!.question.id;
    world.answerEncounter(world.encounter!.question.answer);
    expect(world.nextQuestion()).toBe(true);
    expect(world.encounter!.question.id).not.toBe(first);
    expect(world.encounter!.hintRevealed).toBe(false);
    expect(world.encounter!.lastResult).toBeUndefined();
  });

  it('clears the barrier, banks the exp and closes on a win', () => {
    const mob = barrierAt(world, 'murmur');
    world.tick(0.05);
    const exp = world.profile.exp;

    // Keep answering correctly until it falls over.
    for (let i = 0; i < 30 && !world.encounter?.outcome; i++) {
      world.answerEncounter(world.encounter!.question.answer);
      if (!world.encounter?.outcome) world.nextQuestion();
    }

    expect(world.encounter?.outcome).toBe('win');
    expect(mob.state).toBe('dead');
    expect(world.profile.exp).toBeGreaterThan(exp);
    expect(world.profile.kills.murmur).toBe(1);

    world.closeEncounter();
    expect(world.encounter).toBeUndefined();
  });

  it('ends in a loss when the player runs out of health', () => {
    barrierAt(world, 'murmur');
    world.tick(0.05);
    world.player.hp = 1;
    world.answerEncounter('wrong');
    expect(world.encounter?.outcome).toBe('lose');
    expect(world.player.state).toBe('dead');
  });

  it('gives up gracefully when the deck runs dry', () => {
    world = makeWorld(deck(1));
    barrierAt(world, 'murmur');
    world.tick(0.05);
    world.answerEncounter('wrong');
    expect(world.nextQuestion()).toBe(false);
    expect(world.encounter?.outcome).toBe('flee');
  });

  it('does not start an encounter without questions', () => {
    world = makeWorld([]);
    const mob = barrierAt(world, 'murmur');
    world.tick(0.05);
    expect(world.encounter).toBeUndefined();
    expect(mob.state).not.toBe('dead');
  });

  it('pushes the player clear when fleeing so contact does not re-trigger', () => {
    const mob = barrierAt(world, 'murmur');
    world.tick(0.05);
    world.fleeEncounter();
    expect(world.encounter).toBeUndefined();
    const dist = Math.hypot(world.player.pos.x - mob.pos.x, world.player.pos.z - mob.pos.z);
    expect(dist).toBeGreaterThan(mob.attackRange + 1);
    world.tick(0.05);
    expect(world.encounter).toBeUndefined();
  });
});

describe('memory techniques', () => {
  let world: World;

  beforeEach(() => {
    world = makeWorld();
    world.profile.level = 20;
    world.profile.skillPoints = 8;
    world.recalcPlayer();
    barrierAt(world, 'murmur');
    world.tick(0.05);
  });

  it('記憶宮殿 narrows the options but keeps the answer', () => {
    const enc = world.encounter!;
    expect(enc.options).toHaveLength(4);
    expect(world.useAid('palace')).toBe(true);
    expect(world.encounter!.options.length).toBeLessThan(4);
    expect(world.encounter!.options).toContain(enc.question.answer);
  });

  it('結構藍圖 reveals the hint', () => {
    world.learnSkill('blueprint');
    expect(world.encounter!.hintRevealed).toBe(false);
    expect(world.useAid('blueprint')).toBe(true);
    expect(world.encounter!.hintRevealed).toBe(true);
  });

  it('典藏調閱 doubles the next correct answer', () => {
    world.profile.learned.archive = 1;
    const plain = world.answerEncounter(world.encounter!.question.answer)!.damage;
    world.nextQuestion();

    expect(world.useAid('archive')).toBe(true);
    const amped = world.answerEncounter(world.encounter!.question.answer)!;
    expect(amped.amplified).toBe(true);
    // Streak also grows, so just assert the amplifier clearly dominates.
    expect(amped.damage).toBeGreaterThan(plain * 1.8);
  });

  it('索引檢索 absorbs one wrong answer', () => {
    world.profile.learned.index = 1;
    expect(world.useAid('index')).toBe(true);
    const hp = world.player.hp;
    const out = world.answerEncounter('wrong')!;
    expect(out.shielded).toBe(true);
    expect(world.player.hp).toBe(hp);
  });

  it('spends focus and goes on cooldown', () => {
    const sp = world.player.sp;
    world.useAid('palace');
    expect(world.player.sp).toBeLessThan(sp);
    expect(world.useAid('palace')).toBe(false);
  });

  it('refuses techniques the character has not learned', () => {
    const fresh = makeWorld();
    barrierAt(fresh, 'murmur');
    fresh.tick(0.05);
    // 建築師 starts with 記憶宮殿 only.
    expect(fresh.useAid('archive')).toBe(false);
  });

  it('cannot queue the same technique twice in one exchange', () => {
    world.profile.learned.index = 1;
    expect(world.useAid('index')).toBe(true);
    expect(world.useAid('index')).toBe(false);
  });
});

describe('review write-back', () => {
  it('reports every answer, flagging which came from a real card', () => {
    const onAnswer = vi.fn();
    const world = makeWorld(deck(), onAnswer);
    barrierAt(world, 'murmur');
    world.tick(0.05);

    world.answerEncounter(world.encounter!.question.answer);
    expect(onAnswer).toHaveBeenCalledTimes(1);
    const [question, correct] = onAnswer.mock.calls[0];
    expect(correct).toBe(true);
    expect(question.cardId).toBe('card0');

    world.nextQuestion();
    world.answerEncounter('wrong');
    expect(onAnswer).toHaveBeenCalledTimes(2);
    expect(onAnswer.mock.calls[1][1]).toBe(false);
  });
});

describe('the realtime campaign is unaffected', () => {
  it('still auto-attacks when the pack is not turn-based', () => {
    const world = new World(newProfile('俠客', 'sword'), { seed: 1 });
    world.loadZone('bamboo', { x: 0, z: 0 });
    const mob = world.monsters().find((m) => m.monsterId === 'lingzhi')!;
    mob.pos = { x: world.player.pos.x + 1, z: world.player.pos.z };
    world.setTarget(mob.id);
    const hp = mob.hp;
    for (let i = 0; i < 40; i++) world.tick(0.05);
    expect(world.encounter).toBeUndefined();
    expect(mob.hp).toBeLessThan(hp);
  });
});

describe('representative interviews', () => {
  /** Puts the boss in front of the player and opens the exchange. */
  function meetEnvoy(world: World) {
    const boss = world.monsters().find((m) => m.monsterId === 'envoy_jp')!;
    boss.pos = { x: world.player.pos.x + 0.5, z: world.player.pos.z };
    world.tick(0.05);
    return boss;
  }

  function makeBossWorld() {
    const profile = newProfile('見習生', 'architect', INTERPRETER_PACK);
    profile.level = 40;
    profile.learned = { palace: 3, blueprint: 3, index: 3, archive: 3 };
    const world = new World(profile, {
      seed: 7,
      pack: INTERPRETER_PACK,
      questions: (i) => deck(400)[i % 400],
    });
    world.loadZone('kyoto', { x: 0, z: 0 });
    world.recalcPlayer();
    // Enough health to survive the whole interview.
    world.player.maxHp = 100000;
    world.player.hp = 100000;
    world.player.maxSp = 100000;
    world.player.sp = 100000;
    return world;
  }

  it('opens on the first stage and announces it', () => {
    const world = makeBossWorld();
    meetEnvoy(world);
    const enc = world.encounter!;
    expect(enc.phase).toBe(0);
    expect(enc.stage?.name).toBe('名刺交換');
    expect(world.chat.some((l) => l.text.includes('名刺交換'))).toBe(true);
  });

  it('moves through every stage as the representative gives ground', () => {
    const world = makeBossWorld();
    const boss = meetEnvoy(world);
    const seen: string[] = [world.encounter!.stage!.name];

    for (let i = 0; i < 400 && !world.encounter?.outcome; i++) {
      const out = world.answerEncounter(world.encounter!.question.answer);
      if (out?.phaseAdvanced) seen.push(out.phaseAdvanced.name);
      if (!world.encounter?.outcome) world.nextQuestion();
    }

    expect(world.encounter?.outcome).toBe('win');
    expect(boss.state).toBe('dead');
    expect(seen).toEqual(['名刺交換', '敬語の壁', '本音']);
  });

  it('seals memory techniques in the final stage', () => {
    const world = makeBossWorld();
    const boss = meetEnvoy(world);
    // Techniques work while the interview is still cordial.
    expect(world.useAid('palace')).toBe(true);

    // Drive it down to the last stage.
    boss.hp = boss.maxHp * 0.2;
    world.answerEncounter(world.encounter!.question.answer);
    expect(world.encounter!.stage?.sealAids).toBe(true);
    // Queued aids do not survive the change, and no new one can be started.
    expect(world.encounter!.aids).toHaveLength(0);
    expect(world.useAid('index')).toBe(false);
    expect(world.chat.some((l) => l.text.includes('用不了記憶技法'))).toBe(true);
  });

  it('hits harder once the pressure rises', () => {
    const world = makeBossWorld();
    const boss = meetEnvoy(world);
    const before = world.player.hp;
    world.answerEncounter('definitely wrong');
    const calm = before - world.player.hp;

    boss.hp = boss.maxHp * 0.2;
    world.nextQuestion();
    world.answerEncounter(world.encounter!.question.answer);
    world.nextQuestion();
    const midHp = world.player.hp;
    world.answerEncounter('definitely wrong');
    const pressed = midHp - world.player.hp;

    expect(world.encounter!.stage?.pressure).toBeGreaterThan(1);
    expect(pressed).toBeGreaterThan(calm);
  });

  it('asks the topic the current stage drills', () => {
    const world = makeBossWorld();
    const boss = meetEnvoy(world);
    const asked: (string[] | undefined)[] = [];
    // Re-wire the source so we can observe the context it receives.
    (world as unknown as { questions: (i: number, c: { topics?: string[] }) => unknown }).questions =
      (i: number, c: { topics?: string[] }) => {
        asked.push(c.topics);
        return deck(400)[i % 400];
      };

    world.nextQuestion();
    expect(asked.at(-1)).toEqual(['basics']);

    boss.hp = boss.maxHp * 0.5;
    world.answerEncounter(world.encounter!.question.answer);
    world.nextQuestion();
    expect(asked.at(-1)).toEqual(['keigo']);
  });

  it('leaves ordinary obstacles without stages', () => {
    const world = makeWorld();
    barrierAt(world, 'murmur');
    world.tick(0.05);
    expect(world.encounter!.stage).toBeUndefined();
    expect(world.snapshot().encounter?.stage).toBeUndefined();
  });
});
