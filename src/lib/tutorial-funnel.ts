export const TUTORIAL_FUNNEL_STEPS = ['start', 'map', 'card', 'input', 'submit', 'feedback'] as const;

export type TutorialFunnelStep = typeof TUTORIAL_FUNNEL_STEPS[number];

export const TUTORIAL_FUNNEL_LABELS: Record<string, string> = {
  intro: '開場',
  start: '開始冒險',
  map: '選擇情境',
  card: '選擇卡牌',
  input: '輸入回答',
  submit: '送出回答',
  feedback: '查看回饋',
};

export interface TutorialFunnelAggregateRow {
  tutorial_event: string;
  tutorial_step: string | null;
  event_count: number;
  session_count: number;
  player_count: number;
}

const percent = (value: number, total: number) => total > 0 ? Math.round((value / total) * 100) : 0;

export function buildTutorialFunnel(rows: TutorialFunnelAggregateRow[]) {
  const findRow = (event: string, step?: string) => rows.find(row => row.tutorial_event === event && (step === undefined || row.tutorial_step === step));
  const startsRow = findRow('started');
  const completedRow = findRow('completed');
  const starts = startsRow?.session_count || 0;
  const completions = completedRow?.session_count || 0;
  let previousSessions = starts;

  const steps = TUTORIAL_FUNNEL_STEPS.map(step => {
    const sessions = findRow('step_completed', step)?.session_count || 0;
    const dropOff = Math.max(0, previousSessions - sessions);
    const result = {
      step,
      label: TUTORIAL_FUNNEL_LABELS[step],
      sessions,
      completionRate: percent(sessions, starts),
      dropOff,
      dropOffRate: percent(dropOff, previousSessions),
    };
    previousSessions = sessions;
    return result;
  });

  const rank = (event: string) => rows
    .filter(row => row.tutorial_event === event && row.tutorial_step)
    .map(row => ({
      step: row.tutorial_step as string,
      label: TUTORIAL_FUNNEL_LABELS[row.tutorial_step as string] || row.tutorial_step as string,
      count: row.event_count,
      sessions: row.session_count,
    }))
    .sort((a, b) => b.count - a.count);

  const misclickRanking = rank('misclick');
  const skipRanking = rank('skipped');

  return {
    starts,
    uniquePlayers: startsRow?.player_count || 0,
    completions,
    completionRate: percent(completions, starts),
    totalMisclicks: misclickRanking.reduce((total, item) => total + item.count, 0),
    totalSkips: skipRanking.reduce((total, item) => total + item.count, 0),
    steps,
    misclickRanking,
    skipRanking,
  };
}
