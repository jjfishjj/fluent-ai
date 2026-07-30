import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminTutorialFunnelTab } from './AdminTutorialFunnelTab';

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { rpc },
}));

const rows = [
  { tutorial_event: 'started', tutorial_step: 'intro', event_count: 100, session_count: 100, player_count: 80 },
  { tutorial_event: 'step_completed', tutorial_step: 'start', event_count: 90, session_count: 90, player_count: 75 },
  { tutorial_event: 'step_completed', tutorial_step: 'map', event_count: 72, session_count: 72, player_count: 63 },
  { tutorial_event: 'completed', tutorial_step: 'feedback', event_count: 40, session_count: 40, player_count: 38 },
  { tutorial_event: 'misclick', tutorial_step: 'card', event_count: 32, session_count: 18, player_count: 17 },
  { tutorial_event: 'skipped', tutorial_step: 'input', event_count: 15, session_count: 15, player_count: 14 },
];

describe('admin tutorial funnel tab', () => {
  beforeEach(() => rpc.mockReset());

  it('renders aggregate metrics, step loss and rankings and changes date presets', async () => {
    rpc.mockResolvedValue({ data: rows, error: null });
    render(<AdminTutorialFunnelTab />);

    expect(await screen.findByText('誤點步驟排行')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument();
    expect(screen.getByText('流失 18（20%）')).toBeInTheDocument();
    expect(screen.getByText('32 次・18 工作階段')).toBeInTheDocument();
    expect(screen.getByText('15 次・15 工作階段')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '近 7 天' }));
    await waitFor(() => expect(rpc).toHaveBeenCalledTimes(2));
    expect(rpc).toHaveBeenLastCalledWith('get_talent_tutorial_funnel', expect.objectContaining({ p_start_at: expect.any(String), p_end_at: expect.any(String) }));
  });

  it('shows a safe error state when the aggregate RPC is unavailable', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'permission denied' } });
    render(<AdminTutorialFunnelTab />);
    expect(await screen.findByRole('alert')).toHaveTextContent('目前無法讀取教學漏斗');
    expect(screen.queryByText('誤點步驟排行')).not.toBeInTheDocument();
  });
});
