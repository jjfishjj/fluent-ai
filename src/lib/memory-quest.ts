export type RecallGrade = 'perfect' | 'strong' | 'steady' | 'retry';

export type RecallResult = {
  correct: boolean;
  points: number;
  grade: RecallGrade;
};

export function normalizeDigits(value: string) {
  return value
    .replace(/[０-９]/g, (digit) => String.fromCharCode(digit.charCodeAt(0) - 0xfee0))
    .replace(/[\s-]/g, '');
}

export function scoreRecall(expected: string, answer: string, attempts: number): RecallResult {
  if (normalizeDigits(expected) !== normalizeDigits(answer)) {
    return { correct: false, points: 0, grade: 'retry' };
  }

  if (attempts <= 0) return { correct: true, points: 30, grade: 'perfect' };
  if (attempts === 1) return { correct: true, points: 22, grade: 'strong' };
  return { correct: true, points: 15, grade: 'steady' };
}

export function questLevel(points: number) {
  return Math.max(1, Math.floor(Math.max(0, points) / 100) + 1);
}
