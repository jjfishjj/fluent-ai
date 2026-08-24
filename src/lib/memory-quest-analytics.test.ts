import {
  memoryQuestStats,
  memoryQuestXpTrend,
  readMemoryQuestHistory,
  saveMemoryQuestAttempt,
  type MemoryQuestAttempt,
} from './memory-quest-analytics';

function createStorage() {
  const values = new Map<string, string>();
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
  };
}

function attempt(overrides: Partial<MemoryQuestAttempt> = {}): MemoryQuestAttempt {
  return {
    id: 'round-1',
    userId: 'student-1',
    startedAt: Date.UTC(2026, 7, 18, 9),
    completedAt: Date.UTC(2026, 7, 18, 9, 5),
    digitsLength: 7,
    attempts: 0,
    points: 30,
    grade: 'perfect',
    ...overrides,
  };
}

describe('memory quest analytics', () => {
  it('persists a completed quest and ignores duplicate round settlement', () => {
    const storage = createStorage();
    const first = attempt();
    saveMemoryQuestAttempt(first, 'student-1', storage);
    const result = saveMemoryQuestAttempt({ ...first, points: 15, grade: 'steady' }, 'student-1', storage);

    expect(result).toHaveLength(1);
    expect(result[0].points).toBe(30);
    expect(readMemoryQuestHistory('student-1', storage)).toEqual(result);
  });

  it('aggregates seven calendar days with zero-filled days', () => {
    const now = Date.UTC(2026, 7, 24, 12);
    const history = [
      attempt({ id: 'a', completedAt: Date.UTC(2026, 7, 24, 9), points: 30 }),
      attempt({ id: 'b', completedAt: Date.UTC(2026, 7, 22, 9), points: 22 }),
    ];

    expect(memoryQuestXpTrend(history, now).map((point) => point.xp)).toEqual([0, 0, 0, 0, 22, 0, 30]);
  });

  it('calculates personal XP summary metrics', () => {
    const history = [
      attempt({ id: 'a', points: 30, attempts: 0 }),
      attempt({ id: 'b', points: 15, attempts: 2 }),
    ];

    expect(memoryQuestStats(history)).toEqual({
      totalXp: 45,
      totalSessions: 2,
      firstTryRate: 0.5,
      bestScore: 30,
    });
  });
});
