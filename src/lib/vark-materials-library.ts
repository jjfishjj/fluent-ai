import { LearningStyle } from './learning-styles';
import { BrainState } from './brainwave/types';

export interface PracticeMaterial {
  id: string;
  style: LearningStyle;
  category: string;
  categoryZh: string;
  title: string;
  titleZh: string;
  description: string;
  descriptionZh: string;
  resourceType: 'scenario' | 'topic' | 'exercise' | 'game' | 'project';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;           // minutes
  bestBrainStates: BrainState[];
  prompt: string;             // ready-to-use AI practice prompt
  tags: string[];
}

export const VARK_MATERIALS: PracticeMaterial[] = [

  // ══════════════════════════════════════════════
  // VISUAL 視覺型
  // ══════════════════════════════════════════════

  // Scenarios
  {
    id: 'v-s1', style: 'visual', category: 'Scenario', categoryZh: '情境練習',
    title: 'City Navigation', titleZh: '城市導航情境',
    description: 'Describe routes, landmarks, and directions using a mental map',
    descriptionZh: '使用心智地圖描述路線、地標和方向',
    resourceType: 'scenario', difficulty: 'beginner', duration: 10,
    bestBrainStates: ['alert', 'focus'],
    prompt: 'Pretend we are standing at a city center. Ask me to give directions to 5 different places, using landmarks as reference points. Correct my use of spatial prepositions (turn left at, go past, opposite of).',
    tags: ['directions', 'spatial', 'vocabulary'],
  },
  {
    id: 'v-s2', style: 'visual', category: 'Scenario', categoryZh: '情境練習',
    title: 'Product Design Pitch', titleZh: '產品設計簡報',
    description: 'Describe a product design visually — shapes, colors, layout, purpose',
    descriptionZh: '用視覺語言描述產品設計',
    resourceType: 'scenario', difficulty: 'intermediate', duration: 15,
    bestBrainStates: ['alert', 'creative'],
    prompt: 'I will pitch a product design to you (the investor). Ask me follow-up questions about the visual aspects: What does it look like? How big? What colors? What does the interface show? Correct my descriptive language.',
    tags: ['business', 'description', 'design'],
  },

  // Topics
  {
    id: 'v-t1', style: 'visual', category: 'Topic', categoryZh: '主題討論',
    title: 'Architecture & Space', titleZh: '建築與空間',
    description: 'Discuss famous buildings, interior design, urban spaces',
    descriptionZh: '討論著名建築、室內設計、城市空間',
    resourceType: 'topic', difficulty: 'intermediate', duration: 15,
    bestBrainStates: ['focus', 'alert'],
    prompt: 'Let\'s discuss architecture and design. Ask me to describe my ideal living space, my favorite building I\'ve seen, or how spaces affect mood. Use architectural vocabulary and give me corrections.',
    tags: ['culture', 'design', 'opinion'],
  },
  {
    id: 'v-t2', style: 'visual', category: 'Topic', categoryZh: '主題討論',
    title: 'Data Visualization', titleZh: '數據圖表解讀',
    description: 'Describe and interpret charts, graphs, and infographics in words',
    descriptionZh: '用語言描述和解讀圖表',
    resourceType: 'topic', difficulty: 'advanced', duration: 20,
    bestBrainStates: ['focus'],
    prompt: 'Give me a text description of a bar chart or pie chart (e.g., "Sales by quarter: Q1=30%, Q2=25%, Q3=20%, Q4=25%"). Ask me to describe trends, make comparisons, and draw conclusions using appropriate data language.',
    tags: ['business', 'analysis', 'academic'],
  },

  // Exercises
  {
    id: 'v-e1', style: 'visual', category: 'Exercise', categoryZh: '練習活動',
    title: 'Color-Coded Vocabulary', titleZh: '顏色標記詞彙',
    description: 'Learn word families with color-coded visual grouping',
    descriptionZh: '用顏色分類學習詞彙群組',
    resourceType: 'exercise', difficulty: 'beginner', duration: 10,
    bestBrainStates: ['alert', 'neutral'],
    prompt: 'Present me with 15 words and organize them into 3 color groups by category (e.g., 🔴 Emotions, 🔵 Actions, 🟢 Places). Then quiz me: give me a definition and I name the word and its color group.',
    tags: ['vocabulary', 'categorization', 'memory'],
  },
  {
    id: 'v-e2', style: 'visual', category: 'Exercise', categoryZh: '練習活動',
    title: 'Mind Map Conversation', titleZh: '心智圖對話',
    description: 'Build a text mind map while discussing a topic',
    descriptionZh: '邊討論主題邊建立文字心智圖',
    resourceType: 'exercise', difficulty: 'intermediate', duration: 15,
    bestBrainStates: ['focus', 'creative'],
    prompt: 'Choose a topic (travel, food, technology). Start with a central concept, then branch: "Central: TRAVEL → Branch 1: Transportation, Branch 2: Accommodation, Branch 3: Culture." Build the map through conversation, correcting my vocabulary as we go.',
    tags: ['vocabulary', 'structure', 'speaking'],
  },

  // Game
  {
    id: 'v-g1', style: 'visual', category: 'Game', categoryZh: '遊戲練習',
    title: '20 Questions (Visual)', titleZh: '20個問題（視覺版）',
    description: 'Guess an object by asking about its visual properties only',
    descriptionZh: '只透過視覺特徵提問來猜物品',
    resourceType: 'game', difficulty: 'beginner', duration: 10,
    bestBrainStates: ['relaxed', 'neutral'],
    prompt: 'Think of an object. I will ask up to 20 yes/no questions about its visual properties only: color, size, shape, texture, transparency, material. Correct my question grammar as we play. If I guess within 20 questions, I win!',
    tags: ['speaking', 'adjectives', 'interactive'],
  },

  // ══════════════════════════════════════════════
  // AUDITORY 聽覺型
  // ══════════════════════════════════════════════

  {
    id: 'a-s1', style: 'auditory', category: 'Scenario', categoryZh: '情境練習',
    title: 'Radio Interview', titleZh: '廣播採訪情境',
    description: 'Be interviewed on a topic as if on a live radio show',
    descriptionZh: '模擬現場廣播採訪',
    resourceType: 'scenario', difficulty: 'intermediate', duration: 15,
    bestBrainStates: ['relaxed', 'focus'],
    prompt: 'You are a radio host interviewing me on a topic I choose (my hobby, a trip I took, my job). Ask natural follow-up questions, keep the conversation flowing, and correct my grammar and vocabulary naturally during the conversation.',
    tags: ['speaking', 'fluency', 'interview'],
  },
  {
    id: 'a-s2', style: 'auditory', category: 'Scenario', categoryZh: '情境練習',
    title: 'Podcast Co-host', titleZh: '播客共同主持',
    description: 'Co-host a podcast episode on a chosen topic',
    descriptionZh: '共同主持一集播客節目',
    resourceType: 'scenario', difficulty: 'advanced', duration: 20,
    bestBrainStates: ['relaxed', 'creative'],
    prompt: 'We are co-hosting a podcast episode about [topic I choose]. Start the episode with an intro, then discuss 3 main points with me. Point out when my language sounds unnatural for a podcast context. Focus on spoken rhythm and natural fillers.',
    tags: ['speaking', 'media', 'fluency'],
  },
  {
    id: 'a-t1', style: 'auditory', category: 'Topic', categoryZh: '主題討論',
    title: 'Music & Language', titleZh: '音樂與語言',
    description: 'Explore language through music — lyrics, rhythm, rhyme',
    descriptionZh: '透過音樂探索語言：歌詞、節奏、押韻',
    resourceType: 'topic', difficulty: 'beginner', duration: 15,
    bestBrainStates: ['relaxed', 'creative'],
    prompt: 'Give me a famous song title and a few key lyrics. Discuss: what the song is about, break down difficult vocabulary, explain any idioms, then have me write a short verse using the same rhyme scheme. Correct my writing.',
    tags: ['culture', 'vocabulary', 'writing'],
  },
  {
    id: 'a-t2', style: 'auditory', category: 'Topic', categoryZh: '主題討論',
    title: 'Phonetics Focus', titleZh: '語音學重點',
    description: 'Deep-dive into pronunciation patterns and phonetic rules',
    descriptionZh: '深入探討發音規律和語音規則',
    resourceType: 'topic', difficulty: 'intermediate', duration: 20,
    bestBrainStates: ['focus', 'relaxed'],
    prompt: 'Focus on one challenging phonetic area (e.g., -ed endings, silent letters, vowel reduction in unstressed syllables). Give me 10 word examples, explain the pattern, then quiz me with new words to apply the rule.',
    tags: ['pronunciation', 'phonetics', 'grammar'],
  },
  {
    id: 'a-e1', style: 'auditory', category: 'Exercise', categoryZh: '練習活動',
    title: 'Rhyme Chain Vocabulary', titleZh: '押韻連鎖詞彙',
    description: 'Build vocabulary through rhyme associations',
    descriptionZh: '透過押韻聯想建立詞彙',
    resourceType: 'exercise', difficulty: 'beginner', duration: 10,
    bestBrainStates: ['relaxed', 'creative'],
    prompt: 'Start a rhyme chain: give me a word, I say a word that rhymes, then add a definition. Keep building the chain. If I break the chain, explain the correct pronunciation. Goal: build 20-word rhyme family groups.',
    tags: ['vocabulary', 'pronunciation', 'memory'],
  },
  {
    id: 'a-e2', style: 'auditory', category: 'Exercise', categoryZh: '練習活動',
    title: 'Minimal Pairs Drill', titleZh: '最小對比音訓練',
    description: 'Distinguish and produce minimal pairs (words differing by one sound)',
    descriptionZh: '辨別和發音最小對比詞對',
    resourceType: 'exercise', difficulty: 'intermediate', duration: 10,
    bestBrainStates: ['focus', 'alert'],
    prompt: 'Give me 10 minimal pair sets (e.g., ship/sheep, bed/bad, light/right). For each pair, explain the sound difference, give a sentence context, then quiz me by giving a sentence where I must choose the correct word from the pair.',
    tags: ['pronunciation', 'listening', 'phonetics'],
  },
  {
    id: 'a-g1', style: 'auditory', category: 'Game', categoryZh: '遊戲練習',
    title: 'Sound Bingo', titleZh: '聲音賓果',
    description: 'Identify and produce specific phonemes through a game',
    descriptionZh: '透過遊戲辨別和發音特定音素',
    resourceType: 'game', difficulty: 'beginner', duration: 10,
    bestBrainStates: ['relaxed', 'neutral'],
    prompt: 'Give me a 3x3 bingo card of phonemes (e.g., /ʃ/, /θ/, /æ/). Then give me 9 words one by one. I write the phoneme the word contains. If I get 3 in a row correct, I win. Correct any wrong answers.',
    tags: ['pronunciation', 'phonetics', 'game'],
  },

  // ══════════════════════════════════════════════
  // READING / WRITING 讀寫型
  // ══════════════════════════════════════════════

  {
    id: 'r-s1', style: 'reading', category: 'Scenario', categoryZh: '情境練習',
    title: 'Email Correspondence', titleZh: '商務郵件往來',
    description: 'Practice professional email writing in a realistic scenario',
    descriptionZh: '在真實情境中練習商務郵件寫作',
    resourceType: 'scenario', difficulty: 'intermediate', duration: 20,
    bestBrainStates: ['focus'],
    prompt: 'Give me a business situation (e.g., requesting a meeting, following up on a proposal, handling a complaint). I write the email, you critique: tone, formality level, structure (opening/body/closing/sign-off), and specific language choices.',
    tags: ['writing', 'business', 'formal'],
  },
  {
    id: 'r-s2', style: 'reading', category: 'Scenario', categoryZh: '情境練習',
    title: 'Academic Discussion', titleZh: '學術討論情境',
    description: 'Discuss a research topic using academic language',
    descriptionZh: '使用學術語言討論研究主題',
    resourceType: 'scenario', difficulty: 'advanced', duration: 25,
    bestBrainStates: ['focus', 'alert'],
    prompt: 'Choose an academic topic I\'m interested in. Give me a short text excerpt (150 words). Guide me to analyze: main argument, evidence type, author\'s stance. Then write a 100-word academic response. Correct my academic vocabulary and argumentation style.',
    tags: ['academic', 'critical thinking', 'writing'],
  },
  {
    id: 'r-t1', style: 'reading', category: 'Topic', categoryZh: '主題討論',
    title: 'Current Affairs', titleZh: '時事議題',
    description: 'Read and discuss a current news topic',
    descriptionZh: '閱讀並討論當前新聞議題',
    resourceType: 'topic', difficulty: 'intermediate', duration: 20,
    bestBrainStates: ['focus', 'neutral'],
    prompt: 'Give me a 200-word summary of a current news event. After I read it, ask: 1) Summarize in your own words. 2) What is your opinion? 3) Use 3 new vocabulary words from the text in new sentences.',
    tags: ['reading', 'vocabulary', 'opinion'],
  },
  {
    id: 'r-t2', style: 'reading', category: 'Topic', categoryZh: '主題討論',
    title: 'Grammar Deep-Dive', titleZh: '文法深度解析',
    description: 'Systematically study one grammar point through text analysis',
    descriptionZh: '透過文本分析系統學習一個文法重點',
    resourceType: 'topic', difficulty: 'intermediate', duration: 20,
    bestBrainStates: ['focus'],
    prompt: 'Choose one grammar point I want to master. Give me a systematic explanation with rules, exceptions, and 10 example sentences. Then give me a 15-question fill-in-the-blank exercise. Review all answers and explain any mistakes.',
    tags: ['grammar', 'systematic', 'writing'],
  },
  {
    id: 'r-e1', style: 'reading', category: 'Exercise', categoryZh: '練習活動',
    title: 'Vocabulary in Context', titleZh: '語境詞彙推敲',
    description: 'Infer word meanings from authentic text context',
    descriptionZh: '從真實文本語境推斷詞彙含義',
    resourceType: 'exercise', difficulty: 'intermediate', duration: 15,
    bestBrainStates: ['focus', 'neutral'],
    prompt: 'Give me 5 sentences from real articles, each with one underlined word I might not know. I guess the meaning from context, then you reveal the definition and whether I was right. Then I use each word in a new sentence.',
    tags: ['vocabulary', 'reading', 'inference'],
  },
  {
    id: 'r-e2', style: 'reading', category: 'Exercise', categoryZh: '練習活動',
    title: 'Free Writing + Feedback', titleZh: '自由寫作 + 批改',
    description: 'Write freely on a topic, receive structured feedback',
    descriptionZh: '自由寫作後接收系統性批改',
    resourceType: 'exercise', difficulty: 'intermediate', duration: 25,
    bestBrainStates: ['focus', 'creative'],
    prompt: 'Give me a writing prompt (opinion, narrative, or descriptive). I write 150-200 words. You give structured feedback: 1) Grammar errors (list each with correction), 2) Vocabulary improvements (3 alternative word choices), 3) Structure comments, 4) One thing I did well.',
    tags: ['writing', 'feedback', 'grammar'],
  },
  {
    id: 'r-g1', style: 'reading', category: 'Game', categoryZh: '遊戲練習',
    title: 'Word Origin Challenge', titleZh: '詞源挑戰遊戲',
    description: 'Guess word origins and build vocabulary through etymology',
    descriptionZh: '猜測詞源並透過詞源學建立詞彙',
    resourceType: 'game', difficulty: 'advanced', duration: 15,
    bestBrainStates: ['focus', 'alert'],
    prompt: 'Give me 10 advanced vocabulary words. For each, I try to guess the language origin (Latin, Greek, French, Anglo-Saxon, etc.) and the root meaning. You reveal the etymology and explain related words. Score: 2 points per correct origin, 1 for close.',
    tags: ['vocabulary', 'etymology', 'advanced'],
  },

  // ══════════════════════════════════════════════
  // KINESTHETIC 動覺型
  // ══════════════════════════════════════════════

  {
    id: 'k-s1', style: 'kinesthetic', category: 'Scenario', categoryZh: '情境練習',
    title: 'Travel Agent Roleplay', titleZh: '旅行社服務情境',
    description: 'Plan a real trip through conversation with a travel agent',
    descriptionZh: '與旅行社人員對話規劃真實旅程',
    resourceType: 'scenario', difficulty: 'beginner', duration: 15,
    bestBrainStates: ['creative', 'neutral'],
    prompt: 'You are a travel agent and I am planning a trip. Help me plan a 7-day trip to a destination I choose. Push back with realistic constraints (budget, seasons, visa requirements). Correct my travel vocabulary and formal request language.',
    tags: ['travel', 'practical', 'negotiation'],
  },
  {
    id: 'k-s2', style: 'kinesthetic', category: 'Scenario', categoryZh: '情境練習',
    title: 'Medical Appointment', titleZh: '就醫情境',
    description: 'Describe symptoms and understand medical advice',
    descriptionZh: '描述症狀並理解醫療建議',
    resourceType: 'scenario', difficulty: 'intermediate', duration: 15,
    bestBrainStates: ['focus', 'neutral'],
    prompt: 'You are a doctor and I am a patient describing symptoms. Ask clarifying questions (How long? How severe? Any other symptoms?). Give a realistic diagnosis explanation. Correct my medical vocabulary and help me ask better questions.',
    tags: ['health', 'practical', 'vocabulary'],
  },
  {
    id: 'k-s3', style: 'kinesthetic', category: 'Scenario', categoryZh: '情境練習',
    title: 'Apartment Rental Negotiation', titleZh: '租屋談判情境',
    description: 'Negotiate apartment terms with a landlord in a foreign language',
    descriptionZh: '用外語與房東談判租屋條件',
    resourceType: 'scenario', difficulty: 'advanced', duration: 20,
    bestBrainStates: ['alert', 'focus'],
    prompt: 'You are a landlord showing an apartment. I ask about rent, utilities, pet policy, lease length. You negotiate: some items are non-negotiable, others flexible. Focus on polite negotiation language, conditionals, and formal requests.',
    tags: ['negotiation', 'formal', 'real-world'],
  },
  {
    id: 'k-t1', style: 'kinesthetic', category: 'Topic', categoryZh: '主題討論',
    title: 'How Things Work', titleZh: '萬物運作原理',
    description: 'Explain how everyday things work — hands-on, process-based',
    descriptionZh: '解釋日常事物的運作原理',
    resourceType: 'topic', difficulty: 'intermediate', duration: 15,
    bestBrainStates: ['creative', 'focus'],
    prompt: 'Choose something you know how to do (cook a dish, fix a bike, make a craft). Explain the process step by step as if teaching someone. I ask clarifying questions. Focus on process language: first, then, while, make sure to, be careful not to.',
    tags: ['process', 'speaking', 'vocabulary'],
  },
  {
    id: 'k-t2', style: 'kinesthetic', category: 'Topic', categoryZh: '主題討論',
    title: 'Personal Experience Stories', titleZh: '個人經驗故事',
    description: 'Share personal experiences with rich narrative language',
    descriptionZh: '用豐富的敘事語言分享個人經歷',
    resourceType: 'topic', difficulty: 'intermediate', duration: 15,
    bestBrainStates: ['relaxed', 'creative'],
    prompt: 'Ask me to tell a story about a real personal experience (a challenge I overcame, an interesting trip moment, a surprising encounter). After I finish, help me retell it with: better narrative structure, richer vocabulary, and more natural past tense usage.',
    tags: ['narrative', 'past tense', 'speaking'],
  },
  {
    id: 'k-e1', style: 'kinesthetic', category: 'Exercise', categoryZh: '練習活動',
    title: 'Task Completion Language', titleZh: '任務完成語言',
    description: 'Learn language by completing real micro-tasks in English',
    descriptionZh: '透過完成真實小任務學習語言',
    resourceType: 'exercise', difficulty: 'beginner', duration: 10,
    bestBrainStates: ['creative', 'neutral'],
    prompt: 'Give me a series of micro-tasks to complete entirely in English: write a one-sentence review of your last meal, describe what you are wearing, explain what you did this morning. Grade each response on clarity and accuracy.',
    tags: ['practical', 'speaking', 'beginner-friendly'],
  },
  {
    id: 'k-g1', style: 'kinesthetic', category: 'Game', categoryZh: '遊戲練習',
    title: 'Language Scavenger Hunt', titleZh: '語言尋寶遊戲',
    description: 'Find and describe real objects around you in the target language',
    descriptionZh: '用目標語言尋找並描述身邊的真實物品',
    resourceType: 'game', difficulty: 'beginner', duration: 10,
    bestBrainStates: ['creative', 'alert'],
    prompt: 'Give me a list of 10 things to find in my environment and describe (something red, something older than you, something that makes noise). I describe each one in 2 sentences. You correct vocabulary and descriptive language.',
    tags: ['speaking', 'vocabulary', 'real-world'],
  },
];

export type MaterialCategory = 'Scenario' | 'Topic' | 'Exercise' | 'Game' | 'Project';

export function getMaterialsByStyle(style: LearningStyle): PracticeMaterial[] {
  return VARK_MATERIALS.filter(m => m.style === style);
}

export function getMaterialsByBrainState(state: BrainState): PracticeMaterial[] {
  return VARK_MATERIALS.filter(m => m.bestBrainStates.includes(state));
}

export function getOptimalMaterial(
  style: LearningStyle,
  brainState: BrainState,
  difficulty?: PracticeMaterial['difficulty']
): PracticeMaterial | null {
  let candidates = VARK_MATERIALS.filter(
    m => m.style === style && m.bestBrainStates.includes(brainState)
  );
  if (difficulty) candidates = candidates.filter(m => m.difficulty === difficulty);
  if (candidates.length === 0) {
    candidates = VARK_MATERIALS.filter(m => m.style === style);
  }
  return candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : null;
}

export function getCategories(style: LearningStyle): string[] {
  return [...new Set(VARK_MATERIALS.filter(m => m.style === style).map(m => m.category))];
}
