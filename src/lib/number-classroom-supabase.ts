import { isSupabaseConfigured, supabase } from '@/integrations/supabase/client';
import type { ClassroomStudent } from '@/lib/number-classroom';

type CloudStudent = {
  id: string;
  name: string;
  student_code: string;
  test_group: ClassroomStudent['testGroup'];
  created_at: string;
  updated_at: string;
  number_memory_classrooms: { name: string } | null;
};

function toClassroomStudent(row: CloudStudent): ClassroomStudent {
  return {
    id: row.id,
    className: row.number_memory_classrooms?.name || '未分類班級',
    name: row.name,
    studentCode: row.student_code,
    testGroup: row.test_group,
    createdAt: new Date(row.created_at).getTime(),
    updatedAt: new Date(row.updated_at).getTime(),
  };
}

export type ClassroomConflict = { studentCode: string; local: ClassroomStudent; cloud: ClassroomStudent; resolved: ClassroomStudent };
export class ClassroomWriteConflict extends Error { constructor() { super('REMOTE_STUDENT_CHANGED'); } }

export function resolveClassroomMerge(local: ClassroomStudent[], cloud: ClassroomStudent[]) {
  const merged = new Map(cloud.map((student) => [student.studentCode.toUpperCase(), student]));
  const conflicts: ClassroomConflict[] = [];
  local.forEach((student) => {
    const key = student.studentCode.toUpperCase();
    const remote = merged.get(key);
    if (!remote) { merged.set(key, student); return; }
    const differs = remote.name !== student.name || remote.className !== student.className || remote.testGroup !== student.testGroup;
    const resolved = (student.updatedAt || student.createdAt) > (remote.updatedAt || remote.createdAt) ? student : remote;
    if (differs) conflicts.push({ studentCode: key, local: student, cloud: remote, resolved });
    merged.set(key, resolved);
  });
  return { students: [...merged.values()].sort((a, b) => a.createdAt - b.createdAt), conflicts };
}

export function mergeClassroomStudents(local: ClassroomStudent[], cloud: ClassroomStudent[]) {
  return resolveClassroomMerge(local, cloud).students;
}

export async function loadCloudClassroom(userId: string): Promise<ClassroomStudent[]> {
  if (!isSupabaseConfigured || !userId) return [];
  const { data, error } = await supabase
    .from('number_memory_students')
    .select('id,name,student_code,test_group,created_at,updated_at,number_memory_classrooms!inner(name)')
    .eq('owner_id', userId)
    .order('created_at');
  if (error) throw error;
  return ((data || []) as unknown as CloudStudent[]).map(toClassroomStudent);
}

export async function upsertCloudClassroomStudent(userId: string, student: ClassroomStudent, expectedUpdatedAt?: number) {
  if (!isSupabaseConfigured || !userId) return student;
  const { data: classroom, error: classroomError } = await supabase
    .from('number_memory_classrooms')
    .upsert({ owner_id: userId, name: student.className }, { onConflict: 'owner_id,name' })
    .select('id')
    .single();
  if (classroomError) throw classroomError;

  if (expectedUpdatedAt) {
    const { data: current, error: currentError } = await supabase.from('number_memory_students').select('updated_at').eq('owner_id', userId).eq('student_code', student.studentCode).maybeSingle();
    if (currentError) throw currentError;
    if (current && new Date(current.updated_at).getTime() !== expectedUpdatedAt) throw new ClassroomWriteConflict();
  }

  const { error: studentError } = await supabase.from('number_memory_students').upsert({
    owner_id: userId,
    classroom_id: classroom.id,
    name: student.name,
    student_code: student.studentCode.toUpperCase(),
    test_group: student.testGroup,
  }, { onConflict: 'owner_id,student_code' });
  if (studentError) throw studentError;
  return student;
}

export async function syncClassroom(userId: string, local: ClassroomStudent[]) {
  const cloud = await loadCloudClassroom(userId);
  const { students, conflicts } = resolveClassroomMerge(local, cloud);
  await Promise.all(students.map((student) => upsertCloudClassroomStudent(userId, student)));
  return { students: await loadCloudClassroom(userId), conflicts };
}

export async function deleteCloudClassroomStudent(userId: string, student: ClassroomStudent) {
  if (!isSupabaseConfigured || !userId) return;
  const { error } = await supabase.from('number_memory_students').delete().eq('owner_id', userId).eq('student_code', student.studentCode);
  if (error) throw error;
}

export function subscribeClassroom(userId: string, onChange: () => void) {
  if (!isSupabaseConfigured || !userId) return () => undefined;
  const channel = supabase.channel(`number-classroom:${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'number_memory_students' }, onChange)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'number_memory_classrooms' }, onChange)
    .subscribe();
  return () => { void supabase.removeChannel(channel); };
}
