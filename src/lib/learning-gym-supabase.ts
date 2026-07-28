import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';
import {
  LEARNING_GYM_ABILITY_LABELS,
  LearningGymAbility,
  LearningGymTask,
} from '@/lib/learning-gym';

export interface WeeklyTrainingInputPayload {
  weekKey: string;
  subject: string;
  rawMaterial: string;
  numbers: string;
  concepts: string;
  mistakes: string;
  geniusType?: string | null;
  talentGroup?: string | null;
}

export interface WeeklyTrainingPlanPayload {
  weekKey: string;
  weeklyTrainingInputId?: string | null;
  geniusType?: string | null;
  talentGroup?: string | null;
  themeTitle: string;
  themeFocus: string;
  taskIds: string[];
  dailyPlan: Json;
  generatedPlan: Json;
}

export interface TrainingSessionPayload {
  weeklyTrainingPlanId?: string | null;
  task: Pick<LearningGymTask, 'id' | 'title' | 'group'>;
  geniusType?: string | null;
  status?: 'started' | 'completed' | 'abandoned';
  startedAt?: string;
  completedAt?: string | null;
  durationMinutes?: number;
  completionPercent?: number;
  abilityDeltas?: Partial<Record<LearningGymAbility, number>>;
  evidence?: Json;
  notes?: string;
}

export async function upsertWeeklyTrainingInput(userId: string, payload: WeeklyTrainingInputPayload) {
  const { data, error } = await supabase
    .from('weekly_training_inputs')
    .upsert({
      user_id: userId,
      week_key: payload.weekKey,
      subject: payload.subject,
      raw_material: payload.rawMaterial,
      numbers: payload.numbers,
      concepts: payload.concepts,
      mistakes: payload.mistakes,
      genius_type: payload.geniusType || null,
      talent_group: payload.talentGroup || null,
      source: 'learning_gym_plan',
    }, { onConflict: 'user_id,week_key' })
    .select()
    .single();

  if (error) console.error('Error upserting weekly training input:', error);
  return { data, error };
}

export async function loadWeeklyTrainingInput(userId: string, weekKey: string) {
  const { data, error } = await supabase
    .from('weekly_training_inputs')
    .select('*')
    .eq('user_id', userId)
    .eq('week_key', weekKey)
    .maybeSingle();

  if (error) console.error('Error loading weekly training input:', error);
  return { data, error };
}

export async function upsertWeeklyTrainingPlan(userId: string, payload: WeeklyTrainingPlanPayload) {
  const { data, error } = await supabase
    .from('weekly_training_plans')
    .upsert({
      user_id: userId,
      week_key: payload.weekKey,
      weekly_training_input_id: payload.weeklyTrainingInputId || null,
      genius_type: payload.geniusType || null,
      talent_group: payload.talentGroup || null,
      theme_title: payload.themeTitle,
      theme_focus: payload.themeFocus,
      task_ids: payload.taskIds,
      daily_plan: payload.dailyPlan,
      generated_plan: payload.generatedPlan,
      status: 'active',
      generated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,week_key' })
    .select()
    .single();

  if (error) console.error('Error upserting weekly training plan:', error);
  return { data, error };
}

export async function loadWeeklyTrainingPlan(userId: string, weekKey: string) {
  const { data, error } = await supabase
    .from('weekly_training_plans')
    .select('*')
    .eq('user_id', userId)
    .eq('week_key', weekKey)
    .maybeSingle();

  if (error) console.error('Error loading weekly training plan:', error);
  return { data, error };
}

export async function recordTrainingSession(userId: string, payload: TrainingSessionPayload) {
  const abilityDeltas = payload.abilityDeltas || {};
  const { data, error } = await supabase
    .from('training_sessions')
    .insert({
      user_id: userId,
      weekly_training_plan_id: payload.weeklyTrainingPlanId || null,
      task_id: payload.task.id,
      task_title: payload.task.title,
      talent_group: payload.task.group,
      genius_type: payload.geniusType || null,
      status: payload.status || 'completed',
      started_at: payload.startedAt || new Date().toISOString(),
      completed_at: payload.completedAt ?? new Date().toISOString(),
      duration_minutes: payload.durationMinutes || 0,
      completion_percent: payload.completionPercent || 100,
      ability_deltas: abilityDeltas as Json,
      evidence: payload.evidence || {},
      notes: payload.notes || '',
    })
    .select()
    .single();

  if (error) {
    console.error('Error recording training session:', error);
    return { data, error };
  }

  if (data && Object.keys(abilityDeltas).length) {
    await applyAbilityDeltas(userId, abilityDeltas, data.id);
  }

  return { data, error };
}

export async function applyAbilityDeltas(
  userId: string,
  deltas: Partial<Record<LearningGymAbility, number>>,
  trainingSessionId?: string | null,
) {
  const entries = Object.entries(deltas) as [LearningGymAbility, number][];
  const results = [];

  for (const [ability, delta] of entries) {
    const { data: existing, error: loadError } = await supabase
      .from('ability_scores')
      .select('*')
      .eq('user_id', userId)
      .eq('category', 'learning_gym')
      .eq('ability_key', ability)
      .maybeSingle();

    if (loadError) {
      console.error('Error loading ability score:', loadError);
      results.push({ ability, error: loadError });
      continue;
    }

    const nextScore = Math.min(100, Number(existing?.score || 0) + delta);
    const nextEvidenceCount = Number(existing?.evidence_count || 0) + 1;

    const { data, error } = await supabase
      .from('ability_scores')
      .upsert({
        user_id: userId,
        category: 'learning_gym',
        ability_key: ability,
        ability_label: LEARNING_GYM_ABILITY_LABELS[ability],
        score: nextScore,
        last_delta: delta,
        evidence_count: nextEvidenceCount,
        last_training_session_id: trainingSessionId || null,
      }, { onConflict: 'user_id,category,ability_key' })
      .select()
      .single();

    if (error) console.error('Error upserting ability score:', error);
    results.push({ ability, data, error });
  }

  return results;
}

export async function loadAbilityScores(userId: string, category = 'learning_gym') {
  const { data, error } = await supabase
    .from('ability_scores')
    .select('*')
    .eq('user_id', userId)
    .eq('category', category)
    .order('score', { ascending: false });

  if (error) console.error('Error loading ability scores:', error);
  return { data, error };
}
