-- RLS already denies anonymous rows; revoke table privileges as defense in depth.
revoke all privileges on table public.number_memory_classrooms from anon;
revoke all privileges on table public.number_memory_students from anon;
