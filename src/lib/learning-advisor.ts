import { BrainState, BRAIN_STATE_INFO } from './brainwave/types';
import { LearningStyle } from './learning-styles';
import { VARKProfile } from './vark-analyzer';
import { getRecommendedExample, VARKExample } from './vark-examples-db';

export interface LearningRecommendation {
  primaryMessage: string;
  primaryMessageZh: string;
  activitySuggestion: string;
  activitySuggestionZh: string;
  example: VARKExample | null;
  urgency: 'high' | 'medium' | 'low';
  emoji: string;
}

const VARK_STYLE_LABELS: Record<LearningStyle, { en: string; zh: string }> = {
  visual:      { en: 'Visual', zh: '視覺型' },
  auditory:    { en: 'Auditory', zh: '聽覺型' },
  reading:     { en: 'Reading/Writing', zh: '讀寫型' },
  kinesthetic: { en: 'Kinesthetic', zh: '動覺型' },
};

export function buildRecommendation(
  varkProfile: VARKProfile | null,
  brainState: BrainState,
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
): LearningRecommendation {
  const stateInfo = BRAIN_STATE_INFO[brainState];

  if (brainState === 'fatigued') {
    return {
      primaryMessage: 'Your brain shows fatigue signals. Take a short break first.',
      primaryMessageZh: '偵測到腦力疲勞訊號，建議先短暫休息。',
      activitySuggestion: 'Try a 5-minute break, then do light vocabulary review.',
      activitySuggestionZh: '休息 5 分鐘後，做輕鬆的詞彙複習。',
      example: null,
      urgency: 'high',
      emoji: '😴',
    };
  }

  const dominantStyle: LearningStyle = varkProfile
    ? (Object.entries(varkProfile.scores).sort(([, a], [, b]) => b - a)[0][0] as LearningStyle)
    : 'visual';

  const styleLabel = VARK_STYLE_LABELS[dominantStyle];
  const stateMatch = stateInfo.varkMatch.includes(dominantStyle);
  const example = getRecommendedExample(dominantStyle, brainState, difficulty);

  if (stateMatch) {
    return {
      primaryMessage: `Perfect alignment — your ${stateInfo.label} brain state matches your ${styleLabel.en} learning style!`,
      primaryMessageZh: `最佳時機！你的${stateInfo.labelZh}腦態與${styleLabel.zh}學習風格完美匹配。`,
      activitySuggestion: stateInfo.activities[0],
      activitySuggestionZh: `現在非常適合：${stateInfo.activities[0]}`,
      example,
      urgency: 'high',
      emoji: '🎯',
    };
  }

  // Brain state suggests different activity than VARK preference
  const recommendedActivities = stateInfo.activities;
  return {
    primaryMessage: `Your brain is in ${stateInfo.label} mode. Try adapting your ${styleLabel.en} style to: ${recommendedActivities[0]}.`,
    primaryMessageZh: `目前腦態為${stateInfo.labelZh}，建議以${styleLabel.zh}方式嘗試：${recommendedActivities[0]}`,
    activitySuggestion: recommendedActivities[0],
    activitySuggestionZh: recommendedActivities[0],
    example,
    urgency: 'medium',
    emoji: stateInfo.emoji,
  };
}

export function getDifficultyFromProfile(varkProfile: VARKProfile | null): 'beginner' | 'intermediate' | 'advanced' {
  if (!varkProfile || varkProfile.totalSignals < 10) return 'beginner';
  if (varkProfile.conversationCount < 5) return 'intermediate';
  return 'advanced';
}
