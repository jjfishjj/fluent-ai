import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { World, newProfile } from '@/game/core/world';
import { ZONES } from '@/game/data/zones';
import { NpcDialog } from './GameDialogs';

describe('守林人 NPC 情境任務', () => {
  it('在 NPC 對話中呈現英文題目、錯誤提示與解鎖回饋', () => {
    const world = new World(newProfile('測試俠', 'sword'));
    const npc = ZONES.qingyun.npcs.find((candidate) => candidate.id === 'pathkeeper')!;
    const onAcceptQuest = vi.fn((questId: string) => world.acceptQuest(questId));
    const onAnswerQuestChallenge = vi.fn((questId: string, answer: string) => world.answerQuestChallenge(questId, answer));
    const props = {
      talk: { npc },
      onClose: vi.fn(),
      onAcceptQuest,
      onCompleteQuest: vi.fn(),
      onAnswerQuestChallenge,
      onHeal: vi.fn(),
      onOpenShop: vi.fn(),
    };
    const view = render(<NpcDialog {...props} hud={world.snapshot()} />);

    fireEvent.click(screen.getByRole('button', { name: /接受任務/ }));
    view.rerender(<NpcDialog {...props} hud={world.snapshot()} />);
    expect(screen.getByText(/When you come to the shrine, ___ a lantern\./)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'take' }));
    expect(screen.getByText(/take 常從目前位置/)).toBeInTheDocument();
    expect(world.profile.quests.find((quest) => quest.id === 'q0')?.status).toBe('active');

    fireEvent.click(screen.getByRole('button', { name: 'bring' }));
    expect(onAnswerQuestChallenge).toHaveBeenLastCalledWith('q0', 'bring');
    view.rerender(<NpcDialog {...props} hud={world.snapshot()} />);
    expect(screen.getByText(/通往迷霧竹林的道路已開啟/)).toBeInTheDocument();
    expect(world.profile.inventory.find((slot) => slot.itemId === 'forestpass')?.qty).toBe(1);
  });
});
