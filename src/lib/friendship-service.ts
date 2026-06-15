import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';

type FriendshipRow = Tables<'friendships'>;
type ProfileRow = Pick<Tables<'profiles'>, 'user_id' | 'display_name' | 'avatar_url'>;

export interface FriendshipWithProfile {
  id: string;
  friendId: string;
  friendName: string;
  friendAvatar: string | null;
  intimacyScore: number;
  title: string;
  chatBgColor: string | null;
  messageCount: number;
}

const TITLE_THRESHOLDS = [
  { min: 200, title: '靈魂語伴', color: 'linear-gradient(135deg, hsl(270, 70%, 50%), hsl(45, 90%, 55%))' },
  { min: 101, title: '摯友', color: 'hsl(25, 90%, 55%)' },
  { min: 51, title: '語伴', color: 'hsl(200, 70%, 60%)' },
  { min: 21, title: '點頭之交', color: null },
  { min: 0, title: '陌生人', color: null },
];

export function getTitleForScore(score: number) {
  const match = TITLE_THRESHOLDS.find(t => score >= t.min);
  return match || TITLE_THRESHOLDS[TITLE_THRESHOLDS.length - 1];
}

export async function getFriendships(userId: string): Promise<FriendshipWithProfile[]> {
  const { data, error } = await supabase
    .from('friendships')
    .select('*')
    .or(`user_a_id.eq.${userId},user_b_id.eq.${userId}`);

  if (error) throw error;
  if (!data) return [];

  const friendIds = data.map((f: FriendshipRow) => f.user_a_id === userId ? f.user_b_id : f.user_a_id);
  
  const { data: profiles } = await supabase
    .from('profiles')
    .select('user_id, display_name, avatar_url')
    .in('user_id', friendIds);

  const profileMap = new Map((profiles || []).map((p: ProfileRow) => [p.user_id, p]));

  return data.map((f: FriendshipRow) => {
    const friendId = f.user_a_id === userId ? f.user_b_id : f.user_a_id;
    const profile = profileMap.get(friendId);
    const titleInfo = getTitleForScore(f.intimacy_score);
    return {
      id: f.id,
      friendId,
      friendName: profile?.display_name || '匿名用戶',
      friendAvatar: profile?.avatar_url,
      intimacyScore: f.intimacy_score,
      title: titleInfo.title,
      chatBgColor: titleInfo.color,
      messageCount: f.message_count,
    };
  });
}

export async function incrementIntimacy(friendshipId: string, amount: number) {
  const { data: current } = await supabase
    .from('friendships')
    .select('intimacy_score, message_count')
    .eq('id', friendshipId)
    .single();
  
  if (!current) return;

  const newScore = current.intimacy_score + amount;
  const titleInfo = getTitleForScore(newScore);

  await supabase
    .from('friendships')
    .update({
      intimacy_score: newScore,
      message_count: current.message_count + 1,
      title: titleInfo.title,
      chat_bg_color: titleInfo.color,
    })
    .eq('id', friendshipId);
}
