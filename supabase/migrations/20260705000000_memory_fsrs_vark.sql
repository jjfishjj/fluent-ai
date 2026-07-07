-- FSRS Memory Items + Reviews + VARK tables
-- Run this in Supabase Dashboard > SQL Editor

-- ============================================================
-- memory_items: FSRS-scheduled vocabulary cards per user
-- ============================================================
create table if not exists public.memory_items (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  content             text not null,            -- front of card (word / phrase)
  meaning             text,                     -- back of card (definition / translation)
  encoding_context    text default 'reading',   -- visual | auditory | reading | kinesthetic
  tags                text[] default '{}',
  -- FSRS v4 fields
  fsrs_stability      float8 default 0,
  fsrs_difficulty     float8 default 0,
  fsrs_state          text default 'new',       -- new | learning | review | relearning
  repetitions         int default 0,
  lapses              int default 0,
  next_review_at      timestamptz default now(),
  last_reviewed_at    timestamptz,
  created_at          timestamptz default now()
);

alter table public.memory_items enable row level security;

create policy "Users manage own memory items"
  on public.memory_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists memory_items_user_due
  on public.memory_items (user_id, next_review_at);

-- ============================================================
-- memory_reviews: log each review event for analytics
-- ============================================================
create table if not exists public.memory_reviews (
  id                  uuid primary key default gen_random_uuid(),
  memory_item_id      uuid not null references public.memory_items(id) on delete cascade,
  user_id             uuid not null references auth.users(id) on delete cascade,
  quality             int not null check (quality between 1 and 4),  -- 1=忘了 2=模糊 3=記得 4=秒答
  review_modality     text,                     -- encoding_context at review time
  eeg_engagement      float8,                   -- optional brainwave engagement 0-1
  reviewed_at         timestamptz default now()
);

alter table public.memory_reviews enable row level security;

create policy "Users manage own memory reviews"
  on public.memory_reviews for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- vark_profiles: per-user VARK quiz results (lightweight)
-- ============================================================
create table if not exists public.vark_profiles (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null unique references auth.users(id) on delete cascade,
  visual_score    int default 0,
  auditory_score  int default 0,
  reading_score   int default 0,
  kinesthetic_score int default 0,
  dominant_style  text,
  updated_at      timestamptz default now()
);

alter table public.vark_profiles enable row level security;

create policy "Users manage own vark profile"
  on public.vark_profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
