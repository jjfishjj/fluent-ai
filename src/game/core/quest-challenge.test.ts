import { describe, expect, it } from 'vitest';
import { World, newProfile } from './world';

describe('仙境英文情境任務', () => {
  it('答錯時維持封鎖，答對後發放通行令並開啟竹林入口', () => {
    const profile = newProfile('測試俠', 'sword');
    const world = new World(profile, { seed: 17 });

    world.player.pos = { x: 0, z: -40 };
    for (let step = 0; step < 40; step++) world.tick(0.05);
    expect(world.zone.id).toBe('qingyun');
    expect(world.chat.at(-1)?.text).toContain('道路仍封閉');

    expect(world.acceptQuest('q0')).toBe(true);
    expect(world.answerQuestChallenge('q0', 'take')).toBe('incorrect');
    expect(profile.quests.find((quest) => quest.id === 'q0')?.status).toBe('active');
    expect(profile.inventory.some((slot) => slot.itemId === 'forestpass')).toBe(false);

    expect(world.answerQuestChallenge('q0', 'bring')).toBe('correct');
    expect(profile.quests.find((quest) => quest.id === 'q0')?.status).toBe('done');
    expect(profile.inventory.find((slot) => slot.itemId === 'forestpass')?.qty).toBe(1);
    expect(profile.exp).toBe(50);
    expect(profile.silver).toBe(330);
    expect(world.answerQuestChallenge('q0', 'bring')).toBe('inactive');

    world.player.pos = { x: 0, z: -40 };
    for (let step = 0; step < 42; step++) world.tick(0.05);
    expect(world.zone.id).toBe('bamboo');
  });
});
