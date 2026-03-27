import { supabase } from '@/integrations/supabase/client';
import { ConversationSettings, Message } from '@/lib/types';

export async function createConversation(settings: ConversationSettings, userId: string) {
  const { data, error } = await supabase
    .from('conversations')
    .insert({
      user_id: userId,
      language: settings.language,
      scenario: settings.scenario,
      difficulty: settings.difficulty,
      speed: settings.speed,
      tone: settings.tone,
      mode: settings.mode,
    })
    .select('id')
    .single();

  if (error) console.error('Error creating conversation:', error);
  return data?.id;
}

export async function saveMessage(
  conversationId: string,
  message: Pick<Message, 'role' | 'content' | 'correction' | 'suggestion' | 'imageUrl'>
) {
  const { error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      role: message.role,
      content: message.content,
      correction: message.correction || null,
      suggestion: message.suggestion || null,
      image_url: message.imageUrl || null,
    });

  if (error) console.error('Error saving message:', error);
}

export async function endConversation(conversationId: string, score?: {
  fluency: number;
  grammar: number;
  vocabulary: number;
  logic: number;
  overall: number;
  feedback: string;
}) {
  const update: any = { ended_at: new Date().toISOString() };
  if (score) {
    update.score_fluency = score.fluency;
    update.score_grammar = score.grammar;
    update.score_vocabulary = score.vocabulary;
    update.score_logic = score.logic;
    update.score_overall = score.overall;
    update.score_feedback = score.feedback;
  }

  const { error } = await supabase
    .from('conversations')
    .update(update)
    .eq('id', conversationId);

  if (error) console.error('Error ending conversation:', error);
}
