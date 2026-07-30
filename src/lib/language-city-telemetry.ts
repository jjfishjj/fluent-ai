// Telemetry for 語言城市 — the raw material for the admin funnel dashboard.
//
// Every write is fire-and-forget: gameplay runs off localStorage and must never
// wait on, or be broken by, a logging call. Anonymous players produce no rows
// (the table is keyed on auth.users), which is why each helper takes the user id
// and quietly does nothing without one.

import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { GameAbility } from '@/lib/talent-card-game';
import { CityEventKind } from '@/lib/language-city';

type ActivityRow = Database['public']['Tables']['city_activity_logs']['Insert'];
/** Everything but the caller-supplied user id. */
type Row = Omit<ActivityRow, 'user_id'>;

export type ActivitySource = 'build' | 'event';

export interface SessionContext {
  sessionId: string;
  source: ActivitySource;
  buildingId?: string;
  residentId?: string;
  eventKind?: CityEventKind;
  geniusType: string;
  cityDay: number;
}

export interface RoundLog {
  roundIndex: number;
  roundTotal: number;
  cardId: string;
  cardAbility: GameAbility;
  bestAbility: GameAbility;
  talentBonus: boolean;
  score: number;
  graded: boolean;
  retryCount: number;
  durationMs: number;
  blocksEarned: number;
}

export interface SessionDoneLog {
  completed: boolean;
  roundsCleared: number;
  roundTotal: number;
}

/** Correlates the rows of one dialogue run. */
export const newSessionId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/**
 * Best-effort insert. Failures are logged to the console and swallowed —
 * a telemetry outage must not surface to the player or block a round.
 */
async function write(userId: string | null | undefined, row: Row) {
  if (!userId) return;
  try {
    const { error } = await supabase.from('city_activity_logs').insert({ user_id: userId, ...row });
    if (error) console.warn('city telemetry insert failed:', error.message);
  } catch (e) {
    console.warn('city telemetry insert threw:', e);
  }
}

const context = (ctx: SessionContext) => ({
  session_id: ctx.sessionId,
  source: ctx.source,
  building_id: ctx.buildingId ?? null,
  resident_id: ctx.residentId ?? null,
  event_kind: ctx.eventKind ?? null,
  genius_type: ctx.geniusType,
  city_day: ctx.cityDay,
});

/** Player entered a scenario — the top of the funnel. */
export function logSessionStart(userId: string | null | undefined, ctx: SessionContext, roundTotal: number) {
  void write(userId, { ...context(ctx), kind: 'session_start', round_total: roundTotal });
}

/** One graded round. `ability_matched` is the mis-click signal. */
export function logRound(userId: string | null | undefined, ctx: SessionContext, round: RoundLog) {
  void write(userId, {
    ...context(ctx),
    kind: 'round',
    round_index: round.roundIndex,
    round_total: round.roundTotal,
    card_id: round.cardId,
    card_ability: round.cardAbility,
    best_ability: round.bestAbility,
    ability_matched: round.cardAbility === round.bestAbility,
    talent_bonus: round.talentBonus,
    score: round.score,
    graded: round.graded,
    retry_count: round.retryCount,
    duration_ms: round.durationMs,
    blocks_earned: round.blocksEarned,
  });
}

/** Scenario finished or abandoned — the bottom of the funnel. */
export function logSessionDone(userId: string | null | undefined, ctx: SessionContext, done: SessionDoneLog) {
  void write(userId, {
    ...context(ctx),
    kind: 'session_done',
    completed: done.completed,
    rounds_cleared: done.roundsCleared,
    round_total: done.roundTotal,
  });
}
