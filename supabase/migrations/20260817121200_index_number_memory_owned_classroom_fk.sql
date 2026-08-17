-- Match the composite foreign-key column order for efficient cascades and checks.
create index number_memory_students_classroom_owner_idx
  on public.number_memory_students (classroom_id, owner_id);
