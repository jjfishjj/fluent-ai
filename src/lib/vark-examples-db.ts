import { LearningStyle } from './learning-styles';
import { BrainState } from './brainwave/types';

export interface VARKExample {
  id: string;
  style: LearningStyle;
  skill: 'speaking' | 'listening' | 'reading' | 'writing' | 'vocabulary' | 'grammar';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  title: string;
  titleZh: string;
  description: string;
  prompt: string;       // Ready-to-use practice prompt
  duration: number;     // Estimated minutes
  bestBrainState: BrainState[];
}

export const VARK_EXAMPLES: VARKExample[] = [
  // ── VISUAL ──────────────────────────────────────────────────
  {
    id: 'v1', style: 'visual', skill: 'vocabulary', difficulty: 'beginner',
    title: 'Picture Dictionary', titleZh: '圖像單字卡',
    description: 'Describe what you see in an image to build vocabulary',
    prompt: 'I will describe an everyday scene to you. Ask me to name objects and actions in the scene, then correct my vocabulary. Let\'s start with a kitchen scene.',
    duration: 10, bestBrainState: ['alert', 'focus'],
  },
  {
    id: 'v2', style: 'visual', skill: 'grammar', difficulty: 'intermediate',
    title: 'Color-Coded Grammar', titleZh: '顏色標記文法',
    description: 'Use visual patterns to understand sentence structure',
    prompt: 'Give me 5 sentences and mark each grammatical role (subject, verb, object, modifier) with a label like [S], [V], [O], [M]. Then quiz me on building similar sentences.',
    duration: 15, bestBrainState: ['focus', 'alert'],
  },
  {
    id: 'v3', style: 'visual', skill: 'reading', difficulty: 'intermediate',
    title: 'Mind Map Reading', titleZh: '心智圖閱讀',
    description: 'After reading, create a visual mind map of key concepts',
    prompt: 'Give me a short paragraph (100 words) on an interesting topic. After I read it, guide me to create a text-based mind map with key ideas, then ask comprehension questions.',
    duration: 15, bestBrainState: ['focus', 'alert'],
  },
  {
    id: 'v4', style: 'visual', skill: 'speaking', difficulty: 'beginner',
    title: 'Photo Description', titleZh: '圖片描述練習',
    description: 'Practice speaking by describing imaginary scenes vividly',
    prompt: 'Ask me to describe what I imagine seeing in different places: a beach, a market, a forest. Correct my descriptive vocabulary and help me use spatial words (in front of, beside, above).',
    duration: 10, bestBrainState: ['alert', 'neutral'],
  },
  {
    id: 'v5', style: 'visual', skill: 'vocabulary', difficulty: 'advanced',
    title: 'Visual Metaphors', titleZh: '視覺隱喻學習',
    description: 'Learn idioms through visual imagery and association',
    prompt: 'Teach me 5 idioms by describing the visual image behind each one (e.g., "raining cats and dogs" → imagine animals falling). Then quiz me with fill-in-the-blank sentences.',
    duration: 20, bestBrainState: ['creative', 'alert'],
  },
  {
    id: 'v6', style: 'visual', skill: 'writing', difficulty: 'intermediate',
    title: 'Storyboard Writing', titleZh: '分鏡寫作',
    description: 'Structure a story visually before writing it',
    prompt: 'Help me plan a short story using 5 scene descriptions (like storyboard panels). Guide me to write: Scene 1 - Setting, Scene 2 - Character intro, Scene 3 - Problem, Scene 4 - Climax, Scene 5 - Resolution.',
    duration: 25, bestBrainState: ['creative', 'focus'],
  },

  // ── AUDITORY ─────────────────────────────────────────────────
  {
    id: 'a1', style: 'auditory', skill: 'speaking', difficulty: 'beginner',
    title: 'Rhythm Pronunciation', titleZh: '節奏發音練習',
    description: 'Use rhythm and beat to master pronunciation',
    prompt: 'Give me 10 commonly mispronounced words. For each one, break it into syllables with stress marks (e.g., "pho-TO-graph"), say the rhythm pattern, then have me type the word with syllable breaks.',
    duration: 10, bestBrainState: ['relaxed', 'neutral'],
  },
  {
    id: 'a2', style: 'auditory', skill: 'listening', difficulty: 'intermediate',
    title: 'Song Analysis', titleZh: '歌曲歌詞分析',
    description: 'Analyze lyrics to build vocabulary in context',
    prompt: 'Give me a short excerpt of famous song lyrics (10–15 lines). Explain the meaning, vocabulary, and cultural context. Then ask me comprehension and vocabulary questions about the lyrics.',
    duration: 15, bestBrainState: ['relaxed', 'creative'],
  },
  {
    id: 'a3', style: 'auditory', skill: 'vocabulary', difficulty: 'beginner',
    title: 'Rhyme & Memorize', titleZh: '押韻記憶單字',
    description: 'Build vocabulary through rhymes and sound patterns',
    prompt: 'Give me 10 new vocabulary words. For each word, create a short rhyme or memory hook using sound (e.g., "morose rhymes with dose — a dose of sadness makes you morose"). Then quiz me.',
    duration: 15, bestBrainState: ['relaxed', 'creative'],
  },
  {
    id: 'a4', style: 'auditory', skill: 'grammar', difficulty: 'intermediate',
    title: 'Grammar Dialogue', titleZh: '對話文法練習',
    description: 'Learn grammar through natural conversation patterns',
    prompt: 'Let\'s practice one grammar point (e.g., present perfect vs. past simple) through a natural conversation. Speak as if we\'re friends chatting, and correct my grammar gently within the conversation.',
    duration: 15, bestBrainState: ['relaxed', 'neutral'],
  },
  {
    id: 'a5', style: 'auditory', skill: 'speaking', difficulty: 'advanced',
    title: 'Debate Practice', titleZh: '辯論口說練習',
    description: 'Practice persuasive speaking through structured debate',
    prompt: 'Give me a debate topic and take the opposite side. After each of my arguments, counter it and point out any language weaknesses. Topics: social media, remote work, universal income.',
    duration: 20, bestBrainState: ['alert', 'focus'],
  },
  {
    id: 'a6', style: 'auditory', skill: 'listening', difficulty: 'advanced',
    title: 'Accent Awareness', titleZh: '口音辨別練習',
    description: 'Understand different regional accents and speech patterns',
    prompt: 'Explain the key features of 3 different English accents (e.g., British RP, American General, Australian). Give text examples showing pronunciation differences. Then ask me to identify which accent a phrase comes from.',
    duration: 20, bestBrainState: ['focus', 'relaxed'],
  },

  // ── READING / WRITING ────────────────────────────────────────
  {
    id: 'r1', style: 'reading', skill: 'reading', difficulty: 'beginner',
    title: 'News Summary Practice', titleZh: '新聞摘要練習',
    description: 'Read and summarize authentic news text',
    prompt: 'Give me a short news article excerpt (150 words) on a current topic. Then ask me to: 1) summarize in 3 sentences, 2) define 3 vocabulary words from context, 3) give my opinion in 2 sentences.',
    duration: 15, bestBrainState: ['focus', 'neutral'],
  },
  {
    id: 'r2', style: 'reading', skill: 'writing', difficulty: 'intermediate',
    title: 'Journal Writing', titleZh: '日記寫作練習',
    description: 'Daily writing practice with structured feedback',
    prompt: 'I\'ll write a journal entry (100–150 words) about my day. Give me detailed feedback on: grammar errors, word choice improvements, sentence variety, and overall coherence. Then suggest 3 better phrasings.',
    duration: 20, bestBrainState: ['focus', 'creative'],
  },
  {
    id: 'r3', style: 'reading', skill: 'grammar', difficulty: 'beginner',
    title: 'Grammar from Text', titleZh: '文本文法歸納',
    description: 'Discover grammar rules by analyzing authentic text',
    prompt: 'Give me a paragraph of authentic writing. Help me identify and label: verb tenses, article usage, preposition patterns. Then create 5 similar sentences for me to complete, based on the patterns I found.',
    duration: 15, bestBrainState: ['focus', 'alert'],
  },
  {
    id: 'r4', style: 'reading', skill: 'vocabulary', difficulty: 'intermediate',
    title: 'Contextual Vocabulary', titleZh: '語境詞彙推敲',
    description: 'Infer word meanings from context like a native reader',
    prompt: 'Give me 5 sentences each containing an underlined word I might not know. Ask me to guess the meaning from context before revealing the definition. Then use the word in 2 new sentences.',
    duration: 15, bestBrainState: ['focus', 'neutral'],
  },
  {
    id: 'r5', style: 'reading', skill: 'writing', difficulty: 'advanced',
    title: 'Essay Structure', titleZh: '議論文結構練習',
    description: 'Master academic writing structure and argumentation',
    prompt: 'Give me an essay prompt (e.g., "Should AI be regulated?"). Guide me to write a structured 5-paragraph essay: intro with thesis, 3 body paragraphs with evidence, conclusion. Review each section.',
    duration: 30, bestBrainState: ['focus'],
  },
  {
    id: 'r6', style: 'reading', skill: 'reading', difficulty: 'advanced',
    title: 'Critical Reading', titleZh: '批判性閱讀',
    description: 'Analyze author tone, bias, and rhetorical strategies',
    prompt: 'Give me an opinion piece (200 words). Guide me to analyze: author\'s main argument, evidence used, emotional vs. logical appeals, potential bias, and counter-arguments. Then we discuss in English.',
    duration: 25, bestBrainState: ['focus', 'alert'],
  },

  // ── KINESTHETIC ──────────────────────────────────────────────
  {
    id: 'k1', style: 'kinesthetic', skill: 'speaking', difficulty: 'beginner',
    title: 'Role-Play: Café', titleZh: '角色扮演：咖啡廳',
    description: 'Practice ordering food in a realistic café scenario',
    prompt: 'You are a barista at a busy café. I am a customer. Play the full conversation: greeting, taking my order (push back if I\'m unclear), handling payment, dealing with a small problem (wrong order). Stay in character.',
    duration: 10, bestBrainState: ['creative', 'neutral'],
  },
  {
    id: 'k2', style: 'kinesthetic', skill: 'speaking', difficulty: 'intermediate',
    title: 'Job Interview Sim', titleZh: '工作面試模擬',
    description: 'Practice job interview English in a realistic simulation',
    prompt: 'Be a hiring manager interviewing me for a position I choose. Ask real interview questions, react naturally to my answers (follow-up questions, skeptical reactions), and at the end give feedback on my English performance.',
    duration: 20, bestBrainState: ['alert', 'focus'],
  },
  {
    id: 'k3', style: 'kinesthetic', skill: 'vocabulary', difficulty: 'beginner',
    title: 'Action Vocabulary', titleZh: '動作詞彙練習',
    description: 'Learn verbs through action-based scenarios',
    prompt: 'Give me 10 action verbs. For each one, ask me to: 1) use it in a sentence about something I do daily, 2) describe a situation where this action goes wrong. Make it playful and interactive.',
    duration: 10, bestBrainState: ['creative', 'neutral'],
  },
  {
    id: 'k4', style: 'kinesthetic', skill: 'grammar', difficulty: 'intermediate',
    title: 'Grammar in Action', titleZh: '語法情境實踐',
    description: 'Practice grammar through real-life decision scenarios',
    prompt: 'Create a series of mini-scenarios where I must use a specific grammar structure to make decisions (e.g., conditional: "If you were lost in a city without GPS, what would you do?"). Correct my grammar naturally.',
    duration: 15, bestBrainState: ['creative', 'relaxed'],
  },
  {
    id: 'k5', style: 'kinesthetic', skill: 'speaking', difficulty: 'advanced',
    title: 'Conflict Resolution', titleZh: '衝突解決情境',
    description: 'Navigate difficult conversations in a second language',
    prompt: 'Play a scenario where there is an interpersonal conflict (neighbor complaint, work disagreement, customer service issue). I need to resolve it diplomatically using appropriate language. Challenge me with resistance.',
    duration: 20, bestBrainState: ['alert', 'focus'],
  },
  {
    id: 'k6', style: 'kinesthetic', skill: 'listening', difficulty: 'intermediate',
    title: 'Interactive Storytelling', titleZh: '互動式故事敘述',
    description: 'Build a story together with real choices and consequences',
    prompt: 'Start an adventure story and give me choices at each decision point. I must respond with full sentences explaining my choice. Adapt the story based on my decisions. Correct my language errors naturally in the narrative.',
    duration: 20, bestBrainState: ['creative', 'relaxed'],
  },
];

export function getExamplesForStyle(style: LearningStyle): VARKExample[] {
  return VARK_EXAMPLES.filter(e => e.style === style);
}

export function getExamplesForBrainState(state: BrainState): VARKExample[] {
  return VARK_EXAMPLES.filter(e => e.bestBrainState.includes(state));
}

export function getRecommendedExample(
  style: LearningStyle,
  brainState: BrainState,
  difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate'
): VARKExample | null {
  // First try: matches both style and brain state
  const exact = VARK_EXAMPLES.filter(
    e => e.style === style && e.bestBrainState.includes(brainState) && e.difficulty === difficulty
  );
  if (exact.length > 0) return exact[Math.floor(Math.random() * exact.length)];

  // Fallback: matches style only
  const byStyle = VARK_EXAMPLES.filter(e => e.style === style && e.difficulty === difficulty);
  if (byStyle.length > 0) return byStyle[Math.floor(Math.random() * byStyle.length)];

  return null;
}
