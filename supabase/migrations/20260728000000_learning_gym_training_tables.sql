-- Learning Gym weekly planner + training telemetry
-- Stores weekly user materials, generated weekly plans, per-session results,
-- and current VARK / talent ability scores.

-- ============================================================
-- weekly_training_inputs: user-provided weekly materials
-- ============================================================
create table if not exists public.weekly_training_inputs (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  week_key        text not null, -- e.g. 2026-W31
  subject         text not null default '',
  raw_material    text not null default '',
  numbers         text not null default '',
  concepts        text not null default '',
  mistakes        text not null default '',
  genius_type     text,
  talent_group    text,
  source          text not null default 'learning_gym_plan',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id, week_key)
);

alter table public.weekly_training_inputs enable row level security;

create policy "Users manage own weekly training inputs"
  on public.weekly_training_inputs for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists weekly_training_inputs_user_week
  on public.weekly_training_inputs (user_id, week_key desc);

create trigger update_weekly_training_inputs_updated_at
  before update on public.weekly_training_inputs
  for each row execute function public.update_updated_at_column();

-- ============================================================
-- weekly_training_plans: generated weekly schedules and tasks
-- ============================================================
create table if not exists public.weekly_training_plans (
  id                        uuid primary key default gen_random_uuid(),
  user_id                   uuid not null references auth.users(id) on delete cascade,
  weekly_training_input_id  uuid references public.weekly_training_inputs(id) on delete set null,
  week_key                  text not null,
  genius_type               text,
  talent_group              text,
  theme_title               text not null default '',
  theme_focus               text not null default '',
  task_ids                  text[] not null default '{}',
  daily_plan                jsonb not null default '[]'::jsonb,
  generated_plan            jsonb not null default '{}'::jsonb,
  status                    text not null default 'active'
    check (status in ('draft', 'active', 'completed', 'archived')),
  generated_at              timestamptz not null default now(),
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  unique (user_id, week_key)
);

alter table public.weekly_training_plans enable row level security;

create policy "Users manage own weekly training plans"
  on public.weekly_training_plans for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists weekly_training_plans_user_week
  on public.weekly_training_plans (user_id, week_key desc);

create index if not exists weekly_training_plans_task_ids
  on public.weekly_training_plans using gin (task_ids);

create trigger update_weekly_training_plans_updated_at
  before update on public.weekly_training_plans
  for each row execute function public.update_updated_at_column();

-- ============================================================
-- training_sessions: individual Learning Gym practice sessions
-- ============================================================
create table if not exists public.training_sessions (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references auth.users(id) on delete cascade,
  weekly_training_plan_id  uuid references public.weekly_training_plans(id) on delete set null,
  task_id                  text not null,
  task_title               text not null default '',
  talent_group             text,
  genius_type              text,
  status                   text not null default 'completed'
    check (status in ('started', 'completed', 'abandoned')),
  started_at               timestamptz not null default now(),
  completed_at             timestamptz,
  duration_minutes         numeric default 0,
  completion_percent       int not null default 0 check (completion_percent between 0 and 100),
  ability_deltas           jsonb not null default '{}'::jsonb,
  evidence                 jsonb not null default '{}'::jsonb,
  notes                    text not null default '',
  created_at               timestamptz not null default now()
);

alter table public.training_sessions enable row level security;

create policy "Users manage own training sessions"
  on public.training_sessions for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists training_sessions_user_time
  on public.training_sessions (user_id, started_at desc);

create index if not exists training_sessions_user_task
  on public.training_sessions (user_id, task_id, started_at desc);

-- ============================================================
-- ability_scores: current VARK / talent ability values per user
-- ============================================================
create table if not exists public.ability_scores (
  id                       uuid primary key default gen_random_uuid(),
  user_id                  uuid not null references auth.users(id) on delete cascade,
  category                 text not null
    check (category in ('vark', 'talent', 'learning_gym')),
  ability_key              text not null,
  ability_label            text not null default '',
  score                    numeric not null default 0,
  last_delta               numeric not null default 0,
  evidence_count           int not null default 0,
  last_training_session_id uuid references public.training_sessions(id) on delete set null,
  updated_at               timestamptz not null default now(),
  created_at               timestamptz not null default now(),
  unique (user_id, category, ability_key)
);

alter table public.ability_scores enable row level security;

create policy "Users manage own ability scores"
  on public.ability_scores for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists ability_scores_user_category
  on public.ability_scores (user_id, category, score desc);

create trigger update_ability_scores_updated_at
  before update on public.ability_scores
  for each row execute function public.update_updated_at_column();
