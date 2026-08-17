-- Cross-device number-memory classroom roster owned by an authenticated teacher.
-- Explicit grants are required for new Supabase Data API tables as of 2026-05-30.

create table public.number_memory_classrooms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, name),
  unique (id, owner_id)
);

create table public.number_memory_students (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  classroom_id uuid not null,
  name text not null check (char_length(name) between 1 and 80),
  student_code text not null check (student_code ~ '^[A-Z0-9-]{3,12}$'),
  test_group text not null default 'alternating'
    check (test_group in ('dynamic', 'static', 'alternating')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, student_code),
  constraint number_memory_students_owned_classroom_fkey
    foreign key (classroom_id, owner_id)
    references public.number_memory_classrooms (id, owner_id)
    on delete cascade
);

create index number_memory_classrooms_owner_updated_idx
  on public.number_memory_classrooms (owner_id, updated_at desc);

create index number_memory_students_owner_classroom_idx
  on public.number_memory_students (owner_id, classroom_id, updated_at desc);

alter table public.number_memory_classrooms enable row level security;
alter table public.number_memory_students enable row level security;

grant select, insert, update, delete on public.number_memory_classrooms to authenticated;
grant select, insert, update, delete on public.number_memory_students to authenticated;
grant all on public.number_memory_classrooms to service_role;
grant all on public.number_memory_students to service_role;

create policy "Teachers read own number memory classrooms"
  on public.number_memory_classrooms for select to authenticated
  using ((select auth.uid()) = owner_id);
create policy "Teachers create own number memory classrooms"
  on public.number_memory_classrooms for insert to authenticated
  with check ((select auth.uid()) = owner_id);
create policy "Teachers update own number memory classrooms"
  on public.number_memory_classrooms for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy "Teachers delete own number memory classrooms"
  on public.number_memory_classrooms for delete to authenticated
  using ((select auth.uid()) = owner_id);

create policy "Teachers read own number memory students"
  on public.number_memory_students for select to authenticated
  using ((select auth.uid()) = owner_id);
create policy "Teachers create own number memory students"
  on public.number_memory_students for insert to authenticated
  with check ((select auth.uid()) = owner_id);
create policy "Teachers update own number memory students"
  on public.number_memory_students for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);
create policy "Teachers delete own number memory students"
  on public.number_memory_students for delete to authenticated
  using ((select auth.uid()) = owner_id);

create trigger update_number_memory_classrooms_updated_at
  before update on public.number_memory_classrooms
  for each row execute function public.update_updated_at_column();

create trigger update_number_memory_students_updated_at
  before update on public.number_memory_students
  for each row execute function public.update_updated_at_column();
