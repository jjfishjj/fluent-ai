import { describe, expect, it } from 'vitest';
import { buildTutorialFunnel, TutorialFunnelAggregateRow } from './tutorial-funnel';

describe('admin tutorial funnel', () => {
  it('calculates step loss, completion rate and rankings from aggregate rows', () => {
    const rows: TutorialFunnelAggregateRow[] = [
      { tutorial_event: 'started', tutorial_step: 'intro', event_count: 100, session_count: 100, player_count: 80 },
      { tutorial_event: 'step_completed', tutorial_step: 'start', event_count: 90, session_count: 90, player_count: 75 },
      { tutorial_event: 'step_completed', tutorial_step: 'map', event_count: 72, session_count: 72, player_count: 63 },
      { tutorial_event: 'step_completed', tutorial_step: 'card', event_count: 60, session_count: 60, player_count: 54 },
      { tutorial_event: 'step_completed', tutorial_step: 'input', event_count: 50, session_count: 50, player_count: 46 },
      { tutorial_event: 'step_completed', tutorial_step: 'submit', event_count: 45, session_count: 45, player_count: 42 },
      { tutorial_event: 'step_completed', tutorial_step: 'feedback', event_count: 40, session_count: 40, player_count: 38 },
      { tutorial_event: 'completed', tutorial_step: 'feedback', event_count: 40, session_count: 40, player_count: 38 },
      { tutorial_event: 'misclick', tutorial_step: 'card', event_count: 32, session_count: 18, player_count: 17 },
      { tutorial_event: 'misclick', tutorial_step: 'map', event_count: 12, session_count: 8, player_count: 8 },
      { tutorial_event: 'skipped', tutorial_step: 'input', event_count: 15, session_count: 15, player_count: 14 },
    ];

    const funnel = buildTutorialFunnel(rows);

    expect(funnel).toMatchObject({ starts: 100, uniquePlayers: 80, completions: 40, completionRate: 40, totalMisclicks: 44, totalSkips: 15 });
    expect(funnel.steps[0]).toMatchObject({ step: 'start', sessions: 90, completionRate: 90, dropOff: 10, dropOffRate: 10 });
    expect(funnel.steps[1]).toMatchObject({ step: 'map', sessions: 72, completionRate: 72, dropOff: 18, dropOffRate: 20 });
    expect(funnel.misclickRanking.map(item => item.step)).toEqual(['card', 'map']);
    expect(funnel.skipRanking[0]).toMatchObject({ step: 'input', count: 15 });
  });

  it('returns a stable empty funnel when no events exist', () => {
    const funnel = buildTutorialFunnel([]);
    expect(funnel).toMatchObject({ starts: 0, uniquePlayers: 0, completions: 0, completionRate: 0, totalMisclicks: 0, totalSkips: 0 });
    expect(funnel.steps.every(step => step.sessions === 0 && step.dropOffRate === 0)).toBe(true);
    expect(funnel.misclickRanking).toEqual([]);
  });
});
