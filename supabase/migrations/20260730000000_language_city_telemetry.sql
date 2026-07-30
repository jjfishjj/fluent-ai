-- Language City telemetry
--
-- One table, one row per meaningful step, so the admin funnel can be answered
-- with plain aggregate queries rather than by unpacking jsonb:
--
--   session_start -> round (xN) -> session_done
--
-- Funnel        : count(session_start) vs count(session_done), by day
-- Drop-off step : rounds reached per session, grouped by round_index
-- Mis-click     : rounds where ability_matched = false, grouped by
--                 building_id + round_index
-- Clear rate    : session_done / session_start, grouped by building_id
--
-- Gameplay itself runs off localStorage and never waits on this table, so every
-- write is best-effort and anonymous players simply produce no rows.

create table if not exists public.city_activity_logs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,

  -- Groups the rows belonging to one dialogue run. Generated client-side.
  session_id      text not null,
  kind            text not null
    check (kind in ('session_start', 'round', 'session_done')),

  -- What the player walked into
  source          text not null check (source in ('build', 'event')),
  building_id     text,           -- set when source = 'build'
  resident_id     text,           -- set when source = 'event'
  event_kind      text            -- life / recall / gossip, when source = 'event'
    check (event_kind is null or event_kind in ('life', 'recall', 'gossip')),

  -- Per-round detail (null on session_start / session_done rows)
  round_index     int,            -- 0-based
  round_total     int,
  card_id         text,
  card_ability    text,
  best_ability    text,
  ability_matched boolean,        -- card_ability = best_ability → the mis-click signal
  talent_bonus    boolean,
  score           int check (score is null or score between 0 and 3),
  graded          boolean,        -- false = AI unreachable, offline fallback used
  retry_count     int not null default 0,
  duration_ms     int,
  blocks_earned   int,

  -- Session outcome (session_done rows)
  completed       boolean,        -- false when the player quit partway
  rounds_cleared  int,

  -- Context worth slicing by
  genius_type     text,
  city_day        int,

  created_at      timestamptz not null default now()
);

alter table public.city_activity_logs enable row level security;

create policy "Users insert own city activity"
  on public.city_activity_logs for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users read own city activity"
  on public.city_activity_logs for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Admins read all city activity"
  on public.city_activity_logs for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Dashboard scans by day, then slices by scenario and step.
create index if not exists city_activity_logs_created_at
  on public.city_activity_logs (created_at desc);

create index if not exists city_activity_logs_kind_created
  on public.city_activity_logs (kind, created_at desc);

create index if not exists city_activity_logs_building_round
  on public.city_activity_logs (building_id, round_index);

create index if not exists city_activity_logs_session
  on public.city_activity_logs (session_id);
