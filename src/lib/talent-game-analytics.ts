import { isSupabaseConfigured, supabasePublishableKey, supabaseUrl } from '@/integrations/supabase/client';

export type TalentGameEventName =
  | 'session_started' | 'screen_viewed' | 'daily_reward_claimed'
  | 'scenario_started' | 'scenario_abandoned' | 'scenario_completed'
  | 'round_viewed' | 'card_selected' | 'answer_submitted'
  | 'card_upgraded' | 'analytics_preference_changed';

export interface TalentGameEvent {
  id: string;
  anonymous_id: string;
  session_id: string;
  event_name: TalentGameEventName;
  occurred_at: string;
  scenario_id?: string;
  round_index?: number;
  card_id?: string;
  talent?: string;
  properties: Record<string, string | number | boolean | null>;
}

const QUEUE_KEY = 'talent_game_analytics_queue_v1';
const DEVICE_KEY = 'talent_game_anonymous_id_v1';
const ENABLED_KEY = 'talent_game_analytics_enabled_v1';
const MAX_EVENTS = 200;
const SAFE_PROPERTY_KEYS = new Set([
  'player_level', 'app_version', 'screen', 'energy', 'streak', 'coins',
  'first_attempt', 'reason', 'elapsed_seconds', 'ability', 'talent_bonus',
  'card_level', 'valid', 'strategy_matched', 'input_method', 'word_count_bucket',
  'points', 'score', 'best_combo', 'energy_remaining', 'first_clear', 'earned_xp',
  'from_level', 'to_level', 'coin_cost', 'enabled', 'tutorial_event',
  'tutorial_step', 'tutorial_step_index', 'entry_point',
]);
const sessionId = createId();

function createId() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function getAnonymousId() {
  const existing = localStorage.getItem(DEVICE_KEY);
  if (existing) return existing;
  const id = createId();
  localStorage.setItem(DEVICE_KEY, id);
  return id;
}

export function isTalentAnalyticsEnabled() {
  return localStorage.getItem(ENABLED_KEY) !== 'false';
}

export function setTalentAnalyticsEnabled(enabled: boolean) {
  localStorage.setItem(ENABLED_KEY, String(enabled));
  if (!enabled) localStorage.removeItem(QUEUE_KEY);
  window.dispatchEvent(new CustomEvent('talent-game-analytics-change', { detail: { enabled } }));
}

export function getQueuedTalentEvents(): TalentGameEvent[] {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]') as TalentGameEvent[]; }
  catch { return []; }
}

function saveQueue(events: TalentGameEvent[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(events.slice(-MAX_EVENTS)));
}

export function trackTalentGameEvent(
  eventName: TalentGameEventName,
  context: Partial<Pick<TalentGameEvent, 'scenario_id' | 'round_index' | 'card_id' | 'talent'>> = {},
  properties: TalentGameEvent['properties'] = {},
) {
  if (!isTalentAnalyticsEnabled()) return;
  const safeProperties = Object.fromEntries(Object.entries(properties).filter(([key]) => SAFE_PROPERTY_KEYS.has(key)));
  const event: TalentGameEvent = {
    id: createId(), anonymous_id: getAnonymousId(), session_id: sessionId,
    event_name: eventName, occurred_at: new Date().toISOString(), properties: safeProperties,
    ...context,
  };
  saveQueue([...getQueuedTalentEvents(), event]);
  window.dispatchEvent(new CustomEvent('talent-game-event', { detail: event }));
  void flushTalentGameEvents();
}

let flushing = false;
export async function flushTalentGameEvents() {
  if (flushing || !isSupabaseConfigured || !navigator.onLine || !isTalentAnalyticsEnabled()) return;
  const queue = getQueuedTalentEvents();
  if (!queue.length) return;
  flushing = true;
  const batch = queue.slice(0, 25);
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/talent_game_events`, {
      method: 'POST',
      headers: {
        apikey: supabasePublishableKey,
        Authorization: `Bearer ${supabasePublishableKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(batch.map(({ id, ...event }) => ({ client_event_id: id, ...event }))),
    });
    if (response.ok) {
      const sent = new Set(batch.map(event => event.id));
      saveQueue(getQueuedTalentEvents().filter(event => !sent.has(event.id)));
    }
  } catch { /* retain queue for the next online session */ }
  finally { flushing = false; }
}

export function summarizeTalentEvents(events = getQueuedTalentEvents()) {
  const starts = events.filter(event => event.event_name === 'scenario_started').length;
  const completions = events.filter(event => event.event_name === 'scenario_completed').length;
  const answers = events.filter(event => event.event_name === 'answer_submitted');
  const cards = events.filter(event => event.event_name === 'card_selected');
  const cardCounts = cards.reduce<Record<string, number>>((counts, event) => {
    if (event.card_id) counts[event.card_id] = (counts[event.card_id] || 0) + 1;
    return counts;
  }, {});
  const mostUsedCard = Object.entries(cardCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  const tutorialEvents = events.filter(event => event.event_name === 'screen_viewed' && event.properties.screen === 'tutorial');
  const tutorialStarts = tutorialEvents.filter(event => event.properties.tutorial_event === 'started').length;
  const tutorialCompletions = tutorialEvents.filter(event => event.properties.tutorial_event === 'completed').length;
  const tutorialMisclicks = tutorialEvents.filter(event => event.properties.tutorial_event === 'misclick').length;
  const tutorialSkips = tutorialEvents.filter(event => event.properties.tutorial_event === 'skipped');
  const tutorialStepOrder = ['start', 'map', 'card', 'input', 'submit', 'feedback'];
  const tutorialStepCounts = tutorialEvents
    .filter(event => event.properties.tutorial_event === 'step_completed')
    .reduce<Record<string, number>>((counts, event) => {
      const step = event.properties.tutorial_step;
      if (typeof step === 'string') counts[step] = (counts[step] || 0) + 1;
      return counts;
    }, {});
  const skipCounts = tutorialSkips.reduce<Record<string, number>>((counts, event) => {
    const step = event.properties.tutorial_step;
    if (typeof step === 'string') counts[step] = (counts[step] || 0) + 1;
    return counts;
  }, {});
  const mostSkippedTutorialStep = Object.entries(skipCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  return {
    starts,
    completions,
    completionRate: starts ? Math.round((completions / starts) * 100) : 0,
    answers: answers.length,
    validAnswerRate: answers.length ? Math.round((answers.filter(event => event.properties.valid === true).length / answers.length) * 100) : 0,
    mostUsedCard,
    tutorialStarts,
    tutorialCompletions,
    tutorialCompletionRate: tutorialStarts ? Math.round((tutorialCompletions / tutorialStarts) * 100) : 0,
    tutorialMisclicks,
    tutorialSkips: tutorialSkips.length,
    mostSkippedTutorialStep,
    tutorialSteps: tutorialStepOrder.map(step => ({
      step,
      completions: tutorialStepCounts[step] || 0,
      rate: tutorialStarts ? Math.round(((tutorialStepCounts[step] || 0) / tutorialStarts) * 100) : 0,
    })),
  };
}
