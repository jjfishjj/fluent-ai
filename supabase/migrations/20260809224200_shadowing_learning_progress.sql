create table if not exists public.shadowing_learning_progress (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  current_streak integer not null default 0 check (current_streak >= 0),
  last_practiced_on date,
  updated_at timestamptz not null default now()
);

alter table public.shadowing_learning_progress enable row level security;

grant select, insert, update on table public.shadowing_learning_progress to authenticated;

create policy "Users can read their own shadowing progress"
on public.shadowing_learning_progress
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can insert their own shadowing progress"
on public.shadowing_learning_progress
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own shadowing progress"
on public.shadowing_learning_progress
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create index if not exists shadowing_progress_last_practiced_idx
on public.shadowing_learning_progress (last_practiced_on desc);
