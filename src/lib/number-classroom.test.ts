import { describe, expect, it } from 'vitest';
import { readActiveStudent, readClassroom, replaceClassroom, saveClassroomStudent, setActiveStudent } from './number-classroom';
import { mergeClassroomStudents } from './number-classroom-supabase';

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

  it('replaces the local cache with a synchronized roster', () => {
    const storage = memoryStorage();
    const student = { id: 'cloud-1', className: '雲端班', name: '怡君', studentCode: 'B002', testGroup: 'dynamic' as const, createdAt: 2 };
    replaceClassroom([student], storage);
    expect(readClassroom(storage)).toEqual([student]);
  });

  it('merges devices by student code and keeps the local edit for upload', () => {
    const cloud = [{ id: 'cloud-1', className: 'A 班', name: '小明', studentCode: 'A001', testGroup: 'static' as const, createdAt: 1 }];
    const local = [{ ...cloud[0], id: 'local-1', name: '小明（更新）', testGroup: 'dynamic' as const }];
    expect(mergeClassroomStudents(local, cloud)).toEqual(local);
  });
});
