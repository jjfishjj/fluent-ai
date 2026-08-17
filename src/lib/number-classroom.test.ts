import { describe, expect, it } from 'vitest';
import { parseClassroomCsv, readActiveStudent, readClassroom, replaceClassroom, saveClassroomStudent, setActiveStudent } from './number-classroom';
import { mergeClassroomStudents, resolveClassroomMerge } from './number-classroom-supabase';
import { mergeNumberAttempts } from './number-training-supabase';

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
    const cloud = [{ id: 'cloud-1', className: 'A 班', name: '小明', studentCode: 'A001', testGroup: 'static' as const, createdAt: 1, updatedAt: 10 }];
    const local = [{ ...cloud[0], id: 'local-1', name: '小明（更新）', testGroup: 'dynamic' as const, updatedAt: 20 }];
    expect(mergeClassroomStudents(local, cloud)).toEqual(local);
    expect(resolveClassroomMerge(local, cloud).conflicts).toHaveLength(1);
  });

  it('parses CSV rosters and validates student codes', () => {
    const rows = parseClassroomCsv('班級,姓名,學生代碼,組別\n記憶 A 班,小華,a003,dynamic');
    expect(rows[0]).toMatchObject({ className: '記憶 A 班', name: '小華', studentCode: 'A003', testGroup: 'dynamic' });
    expect(() => parseClassroomCsv('A 班,小華,?,dynamic')).toThrow('格式錯誤');
  });

  it('deduplicates attempts received from a second device', () => {
    const attempt = { id: 'run-1', student: '小華', completedAt: 1, correct: 1, total: 1, averageResponseMs: 900, results: [{ code: '04', correct: true, responseMs: 900 }] };
    expect(mergeNumberAttempts([attempt], [{ ...attempt, student: '舊名稱' }])).toEqual([attempt]);
  });
});
