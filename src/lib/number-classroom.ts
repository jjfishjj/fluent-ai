export type TestGroup = 'dynamic' | 'static' | 'alternating';
export type ClassroomStudent = { id: string; className: string; name: string; studentCode: string; testGroup: TestGroup; createdAt: number; updatedAt?: number };

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

export function replaceClassroom(students: ClassroomStudent[], storage: Pick<Storage, 'setItem'> = localStorage) {
  storage.setItem(ROSTER_KEY, JSON.stringify(students));
  return students;
}

export function updateClassroomStudent(student: ClassroomStudent, storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage) {
  const students = readClassroom(storage).map((item) => item.id === student.id || item.studentCode === student.studentCode ? { ...student, updatedAt: Date.now() } : item);
  storage.setItem(ROSTER_KEY, JSON.stringify(students));
  return students;
}

export function deleteClassroomStudent(studentId: string, storage: Pick<Storage, 'getItem' | 'setItem'> = localStorage) {
  const students = readClassroom(storage).filter((item) => item.id !== studentId);
  storage.setItem(ROSTER_KEY, JSON.stringify(students));
  return students;
}

export function parseClassroomCsv(csv: string): ClassroomStudent[] {
  const rows = csv.replace(/^\uFEFF/, '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!rows.length) return [];
  const start = /班級|class/i.test(rows[0]) ? 1 : 0;
  return rows.slice(start).map((line, index) => {
    const [className, name, code, rawGroup = 'alternating'] = line.split(',').map((value) => value.trim().replace(/^"|"$/g, ''));
    const studentCode = (code || '').toUpperCase();
    const testGroup = ['dynamic', 'static', 'alternating'].includes(rawGroup) ? rawGroup as TestGroup : 'alternating';
    if (!className || !name || !/^[A-Z0-9-]{3,12}$/.test(studentCode)) throw new Error(`第 ${index + start + 1} 列格式錯誤`);
    const now = Date.now() + index;
    return { id: `csv-${now}-${studentCode}`, className, name, studentCode, testGroup, createdAt: now, updatedAt: now };
  });
}

export function setActiveStudent(student: ClassroomStudent, storage: Pick<Storage, 'setItem'> = localStorage) { storage.setItem(ACTIVE_KEY, JSON.stringify(student)); }

export function readActiveStudent(storage: Pick<Storage, 'getItem'> = localStorage): ClassroomStudent | null {
  try { const value = JSON.parse(storage.getItem(ACTIVE_KEY) || 'null'); return value?.studentCode ? value : null; } catch { return null; }
}
