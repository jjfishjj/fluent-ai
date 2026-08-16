export type TestGroup = 'dynamic' | 'static' | 'alternating';
export type ClassroomStudent = { id: string; className: string; name: string; studentCode: string; testGroup: TestGroup; createdAt: number };

const ROSTER_KEY = 'mnemo-verse:number-classroom:v1';
const ACTIVE_KEY = 'mnemo-verse:number-active-student:v1';

export function readClassroom(storage: Pick<Storage, 'getItem'> = localStorage): ClassroomStudent[] {
  try { const value = JSON.parse(storage.getItem(ROSTER_KEY) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; }
}

export function saveClassroomStudent(student: ClassroomStudent, storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage) {
  const current = readClassroom(storage);
  if (current.some((item) => item.studentCode.toLowerCase() === student.studentCode.toLowerCase())) return { students: current, error: '學生代碼已存在' };
  const students = [...current, student]; storage.setItem(ROSTER_KEY, JSON.stringify(students)); return { students, error: '' };
}

export function setActiveStudent(student: ClassroomStudent, storage: Pick<Storage, 'setItem'> = localStorage) { storage.setItem(ACTIVE_KEY, JSON.stringify(student)); }

export function readActiveStudent(storage: Pick<Storage, 'getItem'> = localStorage): ClassroomStudent | null {
  try { const value = JSON.parse(storage.getItem(ACTIVE_KEY) || 'null'); return value?.studentCode ? value : null; } catch { return null; }
}
