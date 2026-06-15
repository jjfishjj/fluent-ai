import { supabase } from '@/integrations/supabase/client';
import { spendEnergy } from './energy-service';
import { Tables } from '@/integrations/supabase/types';

type DailyMatchRow = Tables<'daily_matches'>;
type UserInterestRow = Tables<'user_interests'>;

export interface MatchResult {
  matchedUserId: string;
  matchedUserName: string;
  matchedUserAvatar: string | null;
  compatibilityScore: number;
  sharedGoals: string[];
  sharedTopics: string[];
  targetLanguage: string;
}

export async function getTodayMatches(userId: string) {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('daily_matches')
    .select('*')
    .eq('user_id', userId)
    .eq('match_date', today);
  if (error) throw error;
  return data || [];
}

export async function drawMatch(userId: string): Promise<MatchResult | null> {
  const todayMatches = await getTodayMatches(userId);
  const isFree = todayMatches.length === 0;

  if (!isFree) {
    await spendEnergy(userId, 30, 'match_cost', '每日配對（第二次以上）');
  }

  // Get user's interests
  const { data: myInterests } = await supabase
    .from('user_interests')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!myInterests) throw new Error('請先設定興趣資料');

  // Get all other users' interests
  const excludeIds = [userId, ...todayMatches.map((m: DailyMatchRow) => m.matched_user_id)];
  const { data: candidates } = await supabase
    .from('user_interests')
    .select('*')
    .not('user_id', 'in', `(${excludeIds.join(',')})`);

  if (!candidates || candidates.length === 0) return null;

  // Calculate compatibility
  const scored = candidates.map((c: UserInterestRow) => {
    const langMatch = c.target_language === myInterests.target_language ? 30 : 0;
    const goalOverlap = (myInterests.learning_goals || []).filter((g: string) => (c.learning_goals || []).includes(g));
    const topicOverlap = (myInterests.interest_topics || []).filter((t: string) => (c.interest_topics || []).includes(t));
    const goalScore = Math.min(goalOverlap.length * 15, 35);
    const topicScore = Math.min(topicOverlap.length * 10, 35);
    return {
      userId: c.user_id,
      score: langMatch + goalScore + topicScore,
      sharedGoals: goalOverlap,
      sharedTopics: topicOverlap,
      targetLanguage: c.target_language,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  // Pick from top 5 randomly for variety
  const top = scored.slice(0, Math.min(5, scored.length));
  const pick = top[Math.floor(Math.random() * top.length)];

  // Get matched user's profile
  const { data: matchedProfile } = await supabase
    .from('profiles')
    .select('display_name, avatar_url')
    .eq('user_id', pick.userId)
    .single();

  // Save match record
  await supabase.from('daily_matches').insert({
    user_id: userId,
    matched_user_id: pick.userId,
    compatibility_score: pick.score,
    is_free: isFree,
    status: 'pending',
  });

  return {
    matchedUserId: pick.userId,
    matchedUserName: matchedProfile?.display_name || '匿名用戶',
    matchedUserAvatar: matchedProfile?.avatar_url,
    compatibilityScore: pick.score,
    sharedGoals: pick.sharedGoals,
    sharedTopics: pick.sharedTopics,
    targetLanguage: pick.targetLanguage,
  };
}

export async function acceptMatch(matchId: string, userId: string, matchedUserId: string) {
  await supabase.from('daily_matches').update({ status: 'accepted' }).eq('id', matchId);

  // Create friendship (ensure user_a_id < user_b_id for uniqueness)
  const [userA, userB] = [userId, matchedUserId].sort();
  const { data: existing } = await supabase
    .from('friendships')
    .select('id')
    .eq('user_a_id', userA)
    .eq('user_b_id', userB)
    .single();

  if (!existing) {
    await supabase.from('friendships').insert({
      user_a_id: userA,
      user_b_id: userB,
    });
  }
}

export async function rejectMatch(matchId: string) {
  await supabase.from('daily_matches').update({ status: 'rejected' }).eq('id', matchId);
}
