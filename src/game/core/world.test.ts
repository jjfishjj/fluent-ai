import { beforeEach, describe, expect, it } from 'vitest';
import { World, newProfile } from './world';
import { expToNext } from './formulas';
import { ZONES } from '../data/zones';
import type { Entity } from './types';

/** Runs the simulation for `seconds` in fixed 50 ms steps. */
function run(world: World, seconds: number) {
  const steps = Math.round(seconds / 0.05);
  for (let i = 0; i < steps; i++) world.tick(0.05);
}

/** Puts a fresh monster right in front of the player and targets it. */
function engage(world: World, monsterId: string): Entity {
  const mob = world.monsters().find((m) => m.monsterId === monsterId && m.state !== 'dead')!;
  mob.pos = { x: world.player.pos.x + 1.2, z: world.player.pos.z };
  world.setTarget(mob.id);
  return mob;
}

describe('world setup', () => {
  it('spawns the player, the zone NPCs and no monsters in town', () => {
    const world = new World(newProfile('測試俠', 'sword'));
    expect(world.player.name).toBe('測試俠');
    expect(world.zone.id).toBe('qingyun');
    expect(world.monsters()).toHaveLength(0);
    expect([...world.entities.values()].filter((e) => e.kind === 'npc')).toHaveLength(
      ZONES.qingyun.npcs.length,
    );
  });

  it('populates a field zone with the configured spawn counts', () => {
    const world = new World(newProfile('測試俠', 'sword'));
    world.loadZone('bamboo', { x: 0, z: 0 });
    const expected = ZONES.bamboo.spawns.reduce((sum, s) => sum + s.count, 0);
    expect(world.monsters()).toHaveLength(expected);
    expect(world.zone.id).toBe('bamboo');
  });

  it('keeps every entity inside the zone bounds', () => {
    const world = new World(newProfile('測試俠', 'sword'));
    world.loadZone('canyon', { x: 0, z: 0 });
    for (const m of world.monsters()) {
      expect(Math.abs(m.pos.x)).toBeLessThanOrEqual(ZONES.canyon.half);
      expect(Math.abs(m.pos.z)).toBeLessThanOrEqual(ZONES.canyon.half);
    }
  });
});

describe('combat', () => {
  let world: World;

  beforeEach(() => {
    world = new World(newProfile('測試俠', 'sword'), { seed: 7 });
    world.loadZone('bamboo', { x: 0, z: 0 });
  });

  it('auto-attacks the current target and eventually kills it', () => {
    const mob = engage(world, 'lingzhi');
    const startHp = mob.hp;
    run(world, 2);
    expect(mob.hp).toBeLessThan(startHp);
    // Kill it well before the 14 s respawn timer would bring it back.
    run(world, 8);
    expect(mob.state).toBe('dead');
    expect(world.profile.kills.lingzhi).toBe(1);
  });

  it('awards experience and drops loot on a kill', () => {
    engage(world, 'lingzhi');
    const beforeExp = world.profile.exp;
    const beforeSilver = world.profile.silver;
    run(world, 20);
    expect(world.profile.exp + world.profile.level * 1000).toBeGreaterThan(beforeExp);
    // Silver always drops; walking over it is what banks it.
    expect(world.drops.length + (world.profile.silver - beforeSilver)).toBeGreaterThan(0);
  });

  it('does not attack a target that is out of range', () => {
    const mob = engage(world, 'lingzhi');
    mob.pos = { x: world.player.pos.x + 40, z: world.player.pos.z };
    // Stop the player from walking into range.
    world.autoAttack = false;
    const hp = mob.hp;
    run(world, 3);
    expect(mob.hp).toBe(hp);
  });

  it('respawns a monster after its timer elapses', () => {
    const mob = engage(world, 'lingzhi');
    run(world, 8);
    expect(mob.state).toBe('dead');
    run(world, 16);
    expect(mob.state).not.toBe('dead');
    expect(mob.hp).toBe(mob.maxHp);
  });

  it('lets aggressive monsters hurt and eventually kill the player', () => {
    const mob = world.monsters().find((m) => m.monsterId === 'mistfox')!;
    mob.pos = { x: world.player.pos.x + 1, z: world.player.pos.z };
    world.autoAttack = false;
    const before = world.player.hp;
    run(world, 4);
    expect(world.player.hp).toBeLessThan(before);
  });

  it('sends the player back to town on respawn', () => {
    world.player.hp = 1;
    const mob = world.monsters().find((m) => m.monsterId === 'mistfox')!;
    mob.pos = { x: world.player.pos.x + 1, z: world.player.pos.z };
    world.autoAttack = false;
    run(world, 12);
    expect(world.player.state).toBe('dead');
    run(world, 6);
    world.respawn();
    expect(world.zone.id).toBe('qingyun');
    expect(world.player.state).toBe('idle');
    expect(world.player.hp).toBe(world.player.maxHp);
  });
});

describe('skills', () => {
  it('spends SP, starts a cooldown and damages the target', () => {
    const world = new World(newProfile('符師', 'talisman'), { seed: 3 });
    world.loadZone('bamboo', { x: 0, z: 0 });
    const mob = engage(world, 'lingzhi');
    const sp = world.player.sp;
    const hp = mob.hp;

    expect(world.castSkill('firetalisman')).toBe(true);
    expect(world.player.sp).toBeLessThan(sp);
    expect(mob.hp).toBeLessThan(hp);
    // The skill is on cooldown immediately afterwards.
    expect(world.canCast('firetalisman')).toBe(false);
    expect(world.castSkill('firetalisman')).toBe(false);
  });

  it('refuses skills that have not been learned', () => {
    const world = new World(newProfile('符師', 'talisman'));
    expect(world.skillAt('meteor')).toBeUndefined();
    expect(world.castSkill('meteor')).toBe(false);
  });

  it('applies buff skills for their duration', () => {
    const world = new World(newProfile('醫者', 'healer'), { seed: 5 });
    world.profile.level = 12;
    world.profile.skillPoints = 5;
    world.recalcPlayer();
    expect(world.learnSkill('blessing')).toBe(true);

    const before = world.derived().atk;
    expect(world.castSkill('blessing')).toBe(true);
    expect(world.derived().atk).toBeGreaterThan(before);
    expect(world.player.buffs).toHaveLength(1);

    run(world, 26);
    expect(world.player.buffs).toHaveLength(0);
  });

  it('heals the caster without exceeding the health pool', () => {
    const world = new World(newProfile('醫者', 'healer'), { seed: 11 });
    world.profile.skillPoints = 3;
    world.profile.level = 5;
    world.recalcPlayer();
    world.learnSkill('mend');
    world.player.hp = 5;
    expect(world.castSkill('mend')).toBe(true);
    expect(world.player.hp).toBeGreaterThan(5);
    expect(world.player.hp).toBeLessThanOrEqual(world.player.maxHp);
  });

  it('hits every monster inside an area skill radius', () => {
    const world = new World(newProfile('劍俠', 'sword'), { seed: 13 });
    world.loadZone('bamboo', { x: 0, z: 0 });
    world.profile.level = 8;
    world.profile.skillPoints = 3;
    world.recalcPlayer();
    world.learnSkill('whirl');

    const nearby = world.monsters().slice(0, 3);
    nearby.forEach((m, i) => {
      m.pos = { x: world.player.pos.x + i * 0.5, z: world.player.pos.z + 1 };
    });
    const before = nearby.map((m) => m.hp);
    expect(world.castSkill('whirl')).toBe(true);
    nearby.forEach((m, i) => expect(m.hp).toBeLessThan(before[i]));
  });
});

describe('progression', () => {
  it('levels up, grants points and refills vitals', () => {
    const world = new World(newProfile('測試俠', 'sword'));
    const before = world.profile.level;
    world.player.hp = 1;
    world.gainExp(expToNext(before));
    expect(world.profile.level).toBe(before + 1);
    expect(world.profile.statPoints).toBe(3);
    expect(world.profile.skillPoints).toBe(2);
    expect(world.player.hp).toBe(world.player.maxHp);
  });

  it('handles multiple level ups from a single reward', () => {
    const world = new World(newProfile('測試俠', 'sword'));
    world.gainExp(expToNext(1) + expToNext(2) + expToNext(3));
    expect(world.profile.level).toBe(4);
  });

  it('spends attribute points and raises derived stats', () => {
    const world = new World(newProfile('測試俠', 'sword'));
    world.profile.statPoints = 5;
    const before = world.derived().atk;
    expect(world.spendStatPoint('str')).toBe(true);
    expect(world.derived().atk).toBeGreaterThan(before);
    expect(world.profile.statPoints).toBe(4);
  });

  it('rejects attribute spending without enough points', () => {
    const world = new World(newProfile('測試俠', 'sword'));
    world.profile.statPoints = 0;
    expect(world.spendStatPoint('str')).toBe(false);
  });

  it('gates skills behind their required level', () => {
    const world = new World(newProfile('測試俠', 'sword'));
    world.profile.skillPoints = 5;
    expect(world.learnSkill('dragonrush')).toBe(false);
    world.profile.level = 18;
    expect(world.learnSkill('dragonrush')).toBe(true);
  });
});

describe('inventory and shop', () => {
  let world: World;

  beforeEach(() => {
    world = new World(newProfile('測試俠', 'sword'));
  });

  it('stacks and removes items', () => {
    world.addItem('spiritgrass', 3);
    expect(world.itemCount('spiritgrass')).toBe(3);
    expect(world.removeItem('spiritgrass', 2)).toBe(true);
    expect(world.itemCount('spiritgrass')).toBe(1);
    expect(world.removeItem('spiritgrass', 5)).toBe(false);
  });

  it('equips a weapon, boosting attack, and unequips it back into the bag', () => {
    world.addItem('steelblade', 1);
    const before = world.derived().atk;
    expect(world.equip('steelblade')).toBe(true);
    expect(world.profile.equipment.weapon).toBe('steelblade');
    expect(world.derived().atk).toBeGreaterThan(before);
    expect(world.itemCount('steelblade')).toBe(0);

    expect(world.equip('steelblade')).toBe(true);
    expect(world.profile.equipment.weapon).toBeUndefined();
    expect(world.itemCount('steelblade')).toBe(1);
  });

  it('consumes a potion and restores health', () => {
    world.player.hp = 10;
    expect(world.useItem('redpotion')).toBe(true);
    expect(world.player.hp).toBeGreaterThan(10);
    expect(world.itemCount('redpotion')).toBe(9);
  });

  it('buys only what the player can afford', () => {
    world.profile.silver = 100;
    expect(world.buy('redpotion')).toBe(true);
    expect(world.profile.silver).toBe(60);
    expect(world.buy('dragonplate')).toBe(false);
  });

  it('sells items back at a fraction of their price', () => {
    world.addItem('jadecore', 1);
    const before = world.profile.silver;
    expect(world.sell('jadecore')).toBe(true);
    expect(world.profile.silver).toBeGreaterThan(before);
    expect(world.itemCount('jadecore')).toBe(0);
  });

  it('picks up ground drops the player walks over', () => {
    world.loadZone('bamboo', { x: 0, z: 0 });
    const before = world.profile.silver;
    world.drops.push({
      id: 'test-drop',
      qty: 1,
      silver: 50,
      pos: { x: world.player.pos.x, z: world.player.pos.z },
      y: 0,
      bornAt: world.time,
      until: world.time + 30,
    });
    run(world, 0.2);
    expect(world.drops).toHaveLength(0);
    expect(world.profile.silver).toBe(before + 50);
  });
});

describe('quests', () => {
  it('tracks kill progress and pays out on completion', () => {
    const world = new World(newProfile('測試俠', 'sword'), { seed: 17 });
    expect(world.acceptQuest('q1')).toBe(true);
    world.loadZone('bamboo', { x: 0, z: 0 });

    const quest = () => world.profile.quests.find((q) => q.id === 'q1')!;
    expect(quest().status).toBe('active');

    // Kill the eight required 靈芝精 by dragging each one into melee range.
    for (let i = 0; i < 8; i++) {
      engage(world, 'lingzhi');
      run(world, 20);
    }
    expect(quest().progress).toBe(8);
    expect(quest().status).toBe('complete');

    const silver = world.profile.silver;
    expect(world.completeQuest('q1')).toBe(true);
    expect(quest().status).toBe('done');
    expect(world.profile.silver).toBeGreaterThan(silver);
    expect(world.itemCount('redpotion')).toBeGreaterThanOrEqual(10);
  });

  it('counts items already in the bag when a collect quest is accepted', () => {
    const world = new World(newProfile('測試俠', 'sword'));
    world.profile.level = 5;
    world.addItem('spiritgrass', 12);
    expect(world.acceptQuest('q2')).toBe(true);
    const quest = world.profile.quests.find((q) => q.id === 'q2')!;
    expect(quest.status).toBe('complete');

    expect(world.completeQuest('q2')).toBe(true);
    // The materials are handed over as part of the turn-in.
    expect(world.itemCount('spiritgrass')).toBe(0);
  });

  it('refuses quests below the required level', () => {
    const world = new World(newProfile('測試俠', 'sword'));
    expect(world.acceptQuest('q3')).toBe(false);
    expect(world.profile.quests).toHaveLength(0);
  });

  it('cannot be turned in before the objective is met', () => {
    const world = new World(newProfile('測試俠', 'sword'));
    world.acceptQuest('q1');
    expect(world.completeQuest('q1')).toBe(false);
  });
});

describe('zones', () => {
  it('teleports the player through a portal', () => {
    const world = new World(newProfile('測試俠', 'sword'));
    const portal = ZONES.qingyun.portals[0];
    world.player.pos = { x: portal.at.x, z: portal.at.z };
    run(world, 2);
    expect(world.zone.id).toBe('bamboo');
  });

  it('blocks portals the player is too low level for', () => {
    const world = new World(newProfile('測試俠', 'sword'));
    world.loadZone('bamboo', { x: 0, z: 0 });
    const gated = ZONES.bamboo.portals.find((p) => p.reqLevel)!;
    world.player.pos = { x: gated.at.x, z: gated.at.z };
    run(world, 2);
    expect(world.zone.id).toBe('bamboo');

    world.profile.level = gated.reqLevel!;
    world.player.pos = { x: gated.at.x, z: gated.at.z };
    run(world, 4);
    expect(world.zone.id).toBe('canyon');
  });
});

describe('hud snapshot', () => {
  it('reports vitals, skills and quest state for the UI', () => {
    const world = new World(newProfile('測試俠', 'archer'));
    world.acceptQuest('q1');
    const hud = world.snapshot(60);

    expect(hud.name).toBe('測試俠');
    expect(hud.classId).toBe('archer');
    expect(hud.maxHp).toBeGreaterThan(0);
    expect(hud.skills).toHaveLength(4);
    expect(hud.skills[0].level).toBe(1);
    expect(hud.skills[3].level).toBe(0);
    expect(hud.quests[0].id).toBe('q1');
    expect(hud.fps).toBe(60);
    expect(hud.playersOnline).toBe(1);
  });
});
