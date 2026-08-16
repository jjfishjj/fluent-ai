import { describe, expect, it } from 'vitest';
import { completeScheduledRecalls, getDueRecalls, gradeScheduledRecall, scheduleWrongCodes } from './number-recall-schedule';

function memoryStorage() { let value: string | null = null; return { getItem: () => value, setItem: (_key: string, next: string) => { value = next; } }; }

describe('number recall schedule', () => {
  it('creates three delays per unique wrong code without duplicates', () => { const storage = memoryStorage(); expect(scheduleWrongCodes(['04', '18', '04'], 'a1', 1_000, storage)).toHaveLength(6); expect(scheduleWrongCodes(['04', '18'], 'a1', 1_000, storage)).toHaveLength(6); });
  it('returns only due unfinished recalls', () => { const storage = memoryStorage(); const schedule = scheduleWrongCodes(['04'], 'a1', 1_000, storage); expect(getDueRecalls(schedule, 31_000)).toHaveLength(1); expect(getDueRecalls(completeScheduledRecalls([schedule[0].id], 32_000, storage), 40_000)).toHaveLength(0); });
  it('completes a scheduled recall only after a correct answer', () => { const storage = memoryStorage(); const [item] = scheduleWrongCodes(['04'], 'a1', 1_000, storage); const graded = gradeScheduledRecall({ id: item.id, correct: true, responseMs: 2_000 }, 40_000, storage); expect(graded.schedule[0].completedAt).toBe(40_000); });
  it('shortens retry intervals after repeated wrong or slow recalls', () => { const storage = memoryStorage(); const [item] = scheduleWrongCodes(['04'], 'a1', 1_000, storage); const first = gradeScheduledRecall({ id: item.id, correct: false, responseMs: 2_000 }, 40_000, storage); expect(first.retryAfterMs).toBe(20_000); expect(first.schedule[0]).toMatchObject({ failureCount: 1, dueAt: 60_000 }); const second = gradeScheduledRecall({ id: item.id, correct: false, responseMs: 13_000 }, 70_000, storage); expect(second.retryAfterMs).toBe(10_000); expect(second.schedule[0]).toMatchObject({ failureCount: 2, dueAt: 80_000 }); });
});
