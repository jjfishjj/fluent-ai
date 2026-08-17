import { isSupabaseConfigured, supabase } from '@/integrations/supabase/client';
import type { NumberTrainingAttempt } from '@/lib/number-training-analytics';

type CloudAttempt = {
  attempt_key: string;
  student_name: string;
  student_code: string | null;
  completed_at: string;
  correct: number;
  total: number;
  average_response_ms: number;
  results: NumberTrainingAttempt['results'];
};

function fromCloud(row: CloudAttempt): NumberTrainingAttempt {
  return { id: row.attempt_key, student: row.student_name, studentCode: row.student_code || undefined, completedAt: new Date(row.completed_at).getTime(), correct: row.correct, total: row.total, averageResponseMs: row.average_response_ms, results: row.results };
}

export function mergeNumberAttempts(local: NumberTrainingAttempt[], cloud: NumberTrainingAttempt[]) {
  const attempts = new Map(cloud.map((attempt) => [attempt.id, attempt]));
  local.forEach((attempt) => attempts.set(attempt.id, attempt));
  return [...attempts.values()].sort((a, b) => b.completedAt - a.completedAt).slice(0, 100);
}

export async function loadCloudNumberAttempts(userId: string) {
  if (!isSupabaseConfigured || !userId) return [];
  const { data, error } = await supabase.from('number_memory_attempts')
    .select('attempt_key,student_name,student_code,completed_at,correct,total,average_response_ms,results')
    .eq('owner_id', userId).order('completed_at', { ascending: false }).limit(100);
  if (error) throw error;
  return ((data || []) as unknown as CloudAttempt[]).map(fromCloud);
}

export async function upsertCloudNumberAttempt(userId: string, attempt: NumberTrainingAttempt) {
  if (!isSupabaseConfigured || !userId) return;
  const { error } = await supabase.from('number_memory_attempts').upsert({
    owner_id: userId,
    attempt_key: attempt.id,
    student_name: attempt.student,
    student_code: attempt.studentCode || null,
    completed_at: new Date(attempt.completedAt).toISOString(),
    correct: attempt.correct,
    total: attempt.total,
    average_response_ms: Math.round(attempt.averageResponseMs),
    results: attempt.results,
  }, { onConflict: 'owner_id,attempt_key' });
  if (error) throw error;
}

export async function syncNumberAttempts(userId: string, local: NumberTrainingAttempt[]) {
  const merged = mergeNumberAttempts(local, await loadCloudNumberAttempts(userId));
  if (merged.length) {
    const { error } = await supabase.from('number_memory_attempts').upsert(merged.map((attempt) => ({
      owner_id: userId, attempt_key: attempt.id, student_name: attempt.student, student_code: attempt.studentCode || null,
      completed_at: new Date(attempt.completedAt).toISOString(), correct: attempt.correct, total: attempt.total,
      average_response_ms: Math.round(attempt.averageResponseMs), results: attempt.results,
    })), { onConflict: 'owner_id,attempt_key' });
    if (error) throw error;
  }
  return loadCloudNumberAttempts(userId);
}

export function subscribeNumberAttempts(userId: string, onChange: () => void) {
  if (!isSupabaseConfigured || !userId) return () => undefined;
  const channel = supabase.channel(`number-attempts:${userId}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'number_memory_attempts' }, onChange)
    .subscribe();
  return () => { void supabase.removeChannel(channel); };
}
