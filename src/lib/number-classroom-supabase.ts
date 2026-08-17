import { isSupabaseConfigured, supabase } from '@/integrations/supabase/client';
import type { ClassroomStudent } from '@/lib/number-classroom';

type CloudStudent = {
  id: string;
  name: string;
  student_code: string;
  test_group: ClassroomStudent['testGroup'];
  created_at: string;
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
  };
}

export function mergeClassroomStudents(local: ClassroomStudent[], cloud: ClassroomStudent[]) {
  const merged = new Map(cloud.map((student) => [student.studentCode.toUpperCase(), student]));
  local.forEach((student) => merged.set(student.studentCode.toUpperCase(), student));
  return [...merged.values()].sort((a, b) => a.createdAt - b.createdAt);
}

export async function loadCloudClassroom(userId: string): Promise<ClassroomStudent[]> {
  if (!isSupabaseConfigured || !userId) return [];
  const { data, error } = await supabase
    .from('number_memory_students')
    .select('id,name,student_code,test_group,created_at,number_memory_classrooms!inner(name)')
    .eq('owner_id', userId)
    .order('created_at');
  if (error) throw error;
  return ((data || []) as unknown as CloudStudent[]).map(toClassroomStudent);
}

export async function upsertCloudClassroomStudent(userId: string, student: ClassroomStudent) {
  if (!isSupabaseConfigured || !userId) return student;
  const { data: classroom, error: classroomError } = await supabase
    .from('number_memory_classrooms')
    .upsert({ owner_id: userId, name: student.className }, { onConflict: 'owner_id,name' })
    .select('id')
    .single();
  if (classroomError) throw classroomError;

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
  const merged = mergeClassroomStudents(local, cloud);
  await Promise.all(merged.map((student) => upsertCloudClassroomStudent(userId, student)));
  return loadCloudClassroom(userId);
}
