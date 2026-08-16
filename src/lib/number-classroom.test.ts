import { describe, expect, it } from 'vitest';
import { readActiveStudent, readClassroom, saveClassroomStudent, setActiveStudent } from './number-classroom';

function memoryStorage() { const values = new Map<string, string>(); return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value) }; }

describe('number classroom', () => {
  it('creates unique student codes and assigns an active test group', () => {
    const storage = memoryStorage();
    const student = { id: 's1', className: 'A 班', name: '小明', studentCode: 'A001', testGroup: 'alternating' as const, createdAt: 1 };
    expect(saveClassroomStudent(student, storage).students).toHaveLength(1);
    expect(saveClassroomStudent({ ...student, id: 's2' }, storage).error).toBe('學生代碼已存在');
    setActiveStudent(student, storage);
    expect(readClassroom(storage)[0].studentCode).toBe('A001');
    expect(readActiveStudent(storage)?.testGroup).toBe('alternating');
  });
});
