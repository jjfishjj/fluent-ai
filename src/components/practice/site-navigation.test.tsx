import { cleanup, render, screen, within } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '@/App';

vi.mock('@/contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: ReactNode }) => children,
  useAuth: () => ({ user: null, profile: null, isAdmin: false, signOut: vi.fn() }),
}));

vi.mock('@/contexts/BrainwaveContext', () => ({
  BrainwaveProvider: ({ children }: { children: ReactNode }) => children,
  useBrainwave: () => ({ mode: 'balanced', updateBehaviorSignals: vi.fn() }),
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('site navigation across game and practice routes', () => {
  it('retains the site header and mobile navigation on Practice', async () => {
    window.history.replaceState({}, '', '/practice');
    const { container } = render(<App />);

    expect(await screen.findByText('LinguaAI')).toBeInTheDocument();
    const header = container.querySelector('header');
    expect(header).not.toBeNull();
    for (const label of ['Home', 'Practice', 'Shadowing', 'Friends', 'Shop', 'Brain Lab', '天賦卡牌']) {
      expect(within(header!).getByRole('button', { name: label })).toBeInTheDocument();
    }
    expect(container.querySelector('nav.fixed.bottom-0')).toBeInTheDocument();
  });

  it('hides site navigation on the Xianjing game route', async () => {
    window.history.replaceState({}, '', '/xianjing');
    const { container } = render(<App />);

    await screen.findByRole('button', { name: '開始新的旅程' });
    expect(screen.getByText(/WASD／方向鍵移動/)).toBeInTheDocument();
    expect(screen.queryByText('LinguaAI')).not.toBeInTheDocument();
    expect(container.querySelector('header')).not.toBeInTheDocument();
    expect(container.querySelector('nav.fixed.bottom-0')).not.toBeInTheDocument();
  });
});
