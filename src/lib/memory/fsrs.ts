export type Rating = 1 | 2 | 3 | 4

export interface FSRSCard {
  stability: number
  difficulty: number
  due: Date
  lastReview: Date | null
  reps: number
  lapses: number
  state: 'new' | 'learning' | 'review' | 'relearning'
}

const W = [0.4072,1.1829,3.1262,15.4722,7.2102,0.5316,1.0651,0.0234,1.616,0.1544,1.0824,1.9813,0.0953,0.2975,2.2042,0.2407,2.9466]
const DECAY = -0.5
const FACTOR = Math.pow(0.9, 1 / DECAY) - 1
const REQUEST_RETENTION = 0.9
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x))

export function retrievability(card: FSRSCard, now: Date = new Date()): number {
  if (!card.lastReview || card.stability <= 0) return 0
  const t = (now.getTime() - card.lastReview.getTime()) / 86400_000
  return Math.pow(1 + FACTOR * t / card.stability, DECAY)
}

function nextInterval(s: number) { return Math.max(1, Math.round((s / FACTOR) * (Math.pow(REQUEST_RETENTION, 1 / DECAY) - 1))) }
function initS(r: Rating) { return Math.max(0.1, W[r - 1]) }
function initD(r: Rating) { return clamp(W[4] - Math.exp(W[5] * (r - 1)) + 1, 1, 10) }
function nextD(D: number, r: Rating) { return clamp(W[7] * initD(4) + (1 - W[7]) * (D - W[6] * (r - 3)), 1, 10) }
function nextSRecall(D: number, S: number, R: number, r: Rating) {
  return S * (1 + Math.exp(W[8]) * (11 - D) * Math.pow(S, -W[9]) * (Math.exp((1 - R) * W[10]) - 1) * (r === 2 ? W[15] : 1) * (r === 4 ? W[16] : 1))
}
function nextSForget(D: number, S: number, R: number) {
  return W[11] * Math.pow(D, -W[12]) * (Math.pow(S + 1, W[13]) - 1) * Math.exp((1 - R) * W[14])
}

export interface ReviewOpts { eegEncoding?: number; eegEngagement?: number }

export function review(card: FSRSCard, rating: Rating, now = new Date(), opts: ReviewOpts = {}): { card: FSRSCard; intervalDays: number } {
  const next: FSRSCard = { ...card, reps: card.reps + 1, lastReview: now }
  const engAdj = opts.eegEngagement != null ? (opts.eegEngagement - 0.5) * 0.1 : 0
  if (card.state === 'new') {
    next.difficulty = initD(rating); next.stability = initS(rating)
    if (opts.eegEncoding != null) next.stability *= (1 + opts.eegEncoding * 0.6)
    next.state = rating === 1 ? 'learning' : 'review'
  } else {
    const R = clamp(retrievability(card, now) + engAdj, 0, 1)
    next.difficulty = nextD(card.difficulty, rating)
    if (rating === 1) { next.stability = nextSForget(card.difficulty, card.stability, R); next.lapses += 1; next.state = 'relearning' }
    else { next.stability = nextSRecall(card.difficulty, card.stability, R, rating); next.state = 'review' }
  }
  const intervalDays = nextInterval(next.stability)
  next.due = new Date(now.getTime() + intervalDays * 86400_000)
  return { card: next, intervalDays }
}

export function toDB(card: FSRSCard) {
  return { fsrs_stability: card.stability, fsrs_difficulty: card.difficulty, fsrs_state: card.state, lapses: card.lapses, repetitions: card.reps, next_review_at: card.due.toISOString(), last_reviewed_at: card.lastReview?.toISOString() ?? null }
}

export function fromDB(row: Record<string, unknown>): FSRSCard {
  return { stability: (row.fsrs_stability as number) ?? 0, difficulty: (row.fsrs_difficulty as number) ?? 0, state: (row.fsrs_state as FSRSCard['state']) ?? 'new', lapses: (row.lapses as number) ?? 0, reps: (row.repetitions as number) ?? 0, due: new Date(row.next_review_at as string), lastReview: row.last_reviewed_at ? new Date(row.last_reviewed_at as string) : null }
}
