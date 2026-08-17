create table public.number_memory_attempts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  attempt_key text not null check (char_length(attempt_key) between 1 and 120),
  student_name text not null check (char_length(student_name) between 1 and 120),
  student_code text,
  completed_at timestamptz not null,
  correct integer not null check (correct >= 0),
  total integer not null check (total > 0 and correct <= total),
  average_response_ms integer not null check (average_response_ms >= 0),
  results jsonb not null check (jsonb_typeof(results) = 'array'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, attempt_key)
);

create index number_memory_attempts_owner_completed_idx
  on public.number_memory_attempts (owner_id, completed_at desc);
create index number_memory_attempts_owner_student_idx
  on public.number_memory_attempts (owner_id, student_code, completed_at desc)
  where student_code is not null;

alter table public.number_memory_attempts enable row level security;
grant select, insert, update, delete on public.number_memory_attempts to authenticated;
revoke all privileges on table public.number_memory_attempts from anon;

create policy "Teachers read own number memory attempts"
  on public.number_memory_attempts for select to authenticated
  using ((select auth.uid()) = owner_id);
create policy "Teachers create own number memory attempts"
  on public.number_memory_attempts for insert to authenticated
  with check ((select auth.uid()) = owner_id);
create policy "Teachers update own number memory attempts"
  on public.number_memory_attempts for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy "Teachers delete own number memory attempts"
  on public.number_memory_attempts for delete to authenticated
  using ((select auth.uid()) = owner_id);

create trigger update_number_memory_attempts_updated_at
  before update on public.number_memory_attempts
  for each row execute function public.update_updated_at_column();

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'number_memory_attempts'
  ) then
    alter publication supabase_realtime add table public.number_memory_attempts;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'number_memory_students'
  ) then
    alter publication supabase_realtime add table public.number_memory_students;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'number_memory_classrooms'
  ) then
    alter publication supabase_realtime add table public.number_memory_classrooms;
  end if;
end $$;
