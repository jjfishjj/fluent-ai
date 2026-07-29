import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getQueuedTalentEvents, setTalentAnalyticsEnabled, summarizeTalentEvents, trackTalentGameEvent } from './talent-game-analytics';

describe('talent game analytics', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('records only approved anonymous properties and never raw answer text', () => {
    trackTalentGameEvent('answer_submitted', { scenario_id: 'cafe', round_index: 0, card_id: 'scene-scan', talent: 'explorer' }, {
      valid: true,
      strategy_matched: true,
      input_method: 'text',
      word_count_bucket: '3-7',
      answer: 'My private sentence',
    });

    const [event] = getQueuedTalentEvents();
    expect(event.properties).toEqual({ valid: true, strategy_matched: true, input_method: 'text', word_count_bucket: '3-7' });
    expect(JSON.stringify(event)).not.toContain('My private sentence');
  });

  it('calculates completion, answer and card usage summaries', () => {
    trackTalentGameEvent('scenario_started', { scenario_id: 'cafe' });
    trackTalentGameEvent('card_selected', { scenario_id: 'cafe', card_id: 'scene-scan' });
    trackTalentGameEvent('answer_submitted', { scenario_id: 'cafe', card_id: 'scene-scan' }, { valid: true });
    trackTalentGameEvent('scenario_completed', { scenario_id: 'cafe' });

    expect(summarizeTalentEvents()).toMatchObject({ starts: 1, completions: 1, completionRate: 100, answers: 1, validAnswerRate: 100, mostUsedCard: 'scene-scan' });
  });

  it('stops recording and clears queued events when disabled', () => {
    trackTalentGameEvent('screen_viewed', {}, { screen: 'home' });
    setTalentAnalyticsEnabled(false);
    trackTalentGameEvent('screen_viewed', {}, { screen: 'map' });
    expect(getQueuedTalentEvents()).toEqual([]);
  });
});
