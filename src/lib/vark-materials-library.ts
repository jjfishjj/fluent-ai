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
  // ── VISUAL: 6 additional ─────────────────────────────────────────

  {
    id: 'v-s3', style: 'visual', category: 'Scenario', categoryZh: '情境練習',
    title: 'Art Gallery Curator', titleZh: '美術館策展人',
    description: 'Describe and contextualise artworks to a visiting patron',
    descriptionZh: '向參觀者描述並詮釋藝術作品',
    resourceType: 'scenario', difficulty: 'advanced', duration: 20,
    bestBrainStates: ['alert', 'creative'],
    prompt: 'You are a patron visiting my gallery. I am the curator. Ask me about 4 works: what the artist intended, the historical context, the visual techniques used, and whether you should buy one. Correct my descriptive and persuasive language as we talk.',
    tags: ['art', 'description', 'culture'],
  },
  {
    id: 'v-t3', style: 'visual', category: 'Topic', categoryZh: '主題討論',
    title: 'Movie Scene Analysis', titleZh: '電影場景分析',
    description: 'Describe and analyse a memorable film scene using visual language',
    descriptionZh: '用視覺語言描述並分析難忘的電影場景',
    resourceType: 'topic', difficulty: 'intermediate', duration: 15,
    bestBrainStates: ['relaxed', 'creative'],
    prompt: 'Ask me to describe a memorable movie scene in detail: camera angle, lighting, colour palette, actors\' positions, what is in the background. Then ask what mood these visual choices create and why the director might have chosen them. Correct my cinematic vocabulary.',
    tags: ['culture', 'film', 'description'],
  },
  {
    id: 'v-e3', style: 'visual', category: 'Exercise', categoryZh: '練習活動',
    title: 'Colour Idioms & Expressions', titleZh: '顏色慣用語',
    description: 'Master idioms built on colour words (green with envy, in the red…)',
    descriptionZh: '掌握以顏色構成的慣用語',
    resourceType: 'exercise', difficulty: 'intermediate', duration: 12,
    bestBrainStates: ['focus', 'neutral'],
    prompt: 'Give me 12 colour idioms (e.g. "caught red-handed", "green thumb", "out of the blue"). For each: tell me the colour, I guess the meaning. If I\'m wrong, explain it with an example sentence. Then quiz me with 5 fill-in-the-blank sentences.',
    tags: ['idioms', 'vocabulary', 'visual'],
  },
  {
    id: 'v-e4', style: 'visual', category: 'Exercise', categoryZh: '練習活動',
    title: 'Infographic in Words', titleZh: '用文字做簡報',
    description: 'Explain complex information as if designing an infographic — structured, visual, concise',
    descriptionZh: '像設計資訊圖表一樣用語言表達複雜資訊',
    resourceType: 'exercise', difficulty: 'intermediate', duration: 15,
    bestBrainStates: ['focus', 'alert'],
    prompt: 'Give me a complex topic (e.g. climate change, sleep cycles, how vaccines work). I describe it as if I\'m creating an infographic: main title, 3 key stats, 2 visual metaphors, and a one-line takeaway. Correct my precision language and suggest stronger vocabulary.',
    tags: ['academic', 'structure', 'vocabulary'],
  },
  {
    id: 'v-g2', style: 'visual', category: 'Game', categoryZh: '遊戲練習',
    title: 'Taboo — No Visual Words', titleZh: '禁忌詞：不准用視覺字',
    description: 'Describe a place or object without using any visual/colour words',
    descriptionZh: '描述地點或物品，但不能用任何視覺或顏色字',
    resourceType: 'game', difficulty: 'advanced', duration: 10,
    bestBrainStates: ['alert', 'creative'],
    prompt: 'Give me 8 famous places or objects to describe. I must describe each without using: see, look, colour, shape, or any colour words. I can only use sound, smell, texture, temperature, emotion, function. You guess what I\'m describing. Correct my vocabulary when I struggle.',
    tags: ['speaking', 'vocabulary', 'game'],
  },
  {
    id: 'v-p1', style: 'visual', category: 'Exercise', categoryZh: '練習活動',
    title: 'Visual Travel Journal', titleZh: '視覺旅遊日誌',
    description: 'Write vivid visual diary entries describing places you\'ve visited',
    descriptionZh: '撰寫生動描繪曾到訪地點的視覺日記',
    resourceType: 'exercise', difficulty: 'beginner', duration: 15,
    bestBrainStates: ['creative', 'relaxed'],
    prompt: 'Ask me to describe a place I\'ve visited as if writing a travel diary: what I first saw, the most striking visual detail, colours, light, and scale. Give me three entries over 3 different destinations. For each entry, suggest 2 more vivid word choices.',
    tags: ['writing', 'travel', 'description'],
  },

  // ── AUDITORY: 6 additional ────────────────────────────────────────

  {
    id: 'a-s3', style: 'auditory', category: 'Scenario', categoryZh: '情境練習',
    title: 'Phone Customer Service', titleZh: '電話客服情境',
    description: 'Handle a customer complaint entirely over the phone',
    descriptionZh: '純粹透過電話處理顧客投訴',
    resourceType: 'scenario', difficulty: 'intermediate', duration: 15,
    bestBrainStates: ['focus', 'alert'],
    prompt: 'You are an upset customer calling about a delayed order. I am the customer service representative. Be persistent but realistic. Focus on: polite de-escalation phrases, expressing empathy, offering solutions, using telephone etiquette ("Could you hold for a moment?", "I\'m so sorry to hear that"). Correct my telephone register.',
    tags: ['business', 'practical', 'politeness'],
  },
  {
    id: 'a-t3', style: 'auditory', category: 'Topic', categoryZh: '主題討論',
    title: 'News Anchor Practice', titleZh: '新聞主播練習',
    description: 'Read and deliver news headlines with correct stress and pacing',
    descriptionZh: '以正確重音和節奏朗讀並播報新聞標題',
    resourceType: 'topic', difficulty: 'intermediate', duration: 15,
    bestBrainStates: ['focus', 'alert'],
    prompt: 'Give me 5 short news items (2–3 sentences each). I read them aloud in text form, focusing on: sentence stress, pausing at commas, rising/falling intonation at sentence end. After each item, give phonetic feedback on which words I should emphasise differently.',
    tags: ['pronunciation', 'news', 'intonation'],
  },
  {
    id: 'a-e3', style: 'auditory', category: 'Exercise', categoryZh: '練習活動',
    title: 'Tongue Twister Challenge', titleZh: '繞口令挑戰',
    description: 'Master difficult sound combinations through tongue twisters',
    descriptionZh: '透過繞口令掌握困難音素組合',
    resourceType: 'exercise', difficulty: 'beginner', duration: 10,
    bestBrainStates: ['creative', 'relaxed'],
    prompt: 'Give me 6 tongue twisters targeting different problem sounds (e.g. /θ/ vs /s/, /r/ vs /l/, /v/ vs /b/). For each: tell me the target sound, give me the twister, then explain why this sound is tricky for non-native speakers. I practice and you give tips.',
    tags: ['pronunciation', 'phonetics', 'fun'],
  },
  {
    id: 'a-g2', style: 'auditory', category: 'Game', categoryZh: '遊戲練習',
    title: 'Collaborative Story with Beat', titleZh: '節奏接龍故事',
    description: 'Build a story together where each sentence must end with a rhyming word',
    descriptionZh: '共同創作故事，每句結尾必須押韻',
    resourceType: 'game', difficulty: 'intermediate', duration: 12,
    bestBrainStates: ['creative', 'relaxed'],
    prompt: 'We build a story together. You give me the first sentence. I continue it with a sentence that ends with a rhyming word. We alternate. If I break the rhyme scheme or make a grammar error, note it but keep playing. After 10 rounds, review all my sentences for accuracy.',
    tags: ['speaking', 'creativity', 'rhyme'],
  },
  {
    id: 'a-s4', style: 'auditory', category: 'Scenario', categoryZh: '情境練習',
    title: 'Debate Practice', titleZh: '辯論練習',
    description: 'Argue and defend a position on a controversial topic',
    descriptionZh: '就爭議性議題表達並捍衛立場',
    resourceType: 'scenario', difficulty: 'advanced', duration: 20,
    bestBrainStates: ['alert', 'focus'],
    prompt: 'Give me a debate topic. I argue one side (you choose which). You argue the other side. After 4 exchanges each, switch sides. Focus on: signposting language ("Firstly… Furthermore… In conclusion…"), counter-argument phrases ("While I understand your point…"), and persuasive tone. Correct my argumentation vocabulary.',
    tags: ['speaking', 'argumentation', 'advanced'],
  },
  {
    id: 'a-t4', style: 'auditory', category: 'Topic', categoryZh: '主題討論',
    title: 'Music Across Cultures', titleZh: '音樂與跨文化',
    description: 'Compare music styles, discuss how language shapes song structure',
    descriptionZh: '比較音樂風格，討論語言如何影響歌曲結構',
    resourceType: 'topic', difficulty: 'intermediate', duration: 15,
    bestBrainStates: ['relaxed', 'creative'],
    prompt: 'Discuss music from two different cultures I choose. Ask me: How does the rhythm of the language affect the melody? What emotions does each style express? Can you hear the language in the music even without understanding words? Teach me 5 music-related vocabulary words in context.',
    tags: ['culture', 'music', 'vocabulary'],
  },

  // ── READING/WRITING: 6 additional ────────────────────────────────

  {
    id: 'r-s3', style: 'reading', category: 'Scenario', categoryZh: '情境練習',
    title: 'Cover Letter Writing', titleZh: '求職信寫作',
    description: 'Write a professional cover letter for a real or invented job',
    descriptionZh: '為真實或虛構的職位撰寫專業求職信',
    resourceType: 'scenario', difficulty: 'advanced', duration: 25,
    bestBrainStates: ['focus'],
    prompt: 'Give me a job description (2–3 sentences). I write a cover letter (200 words). You critique: Does the opening grab attention? Is the tone right? Are key skills highlighted? Give me a rewrite of one weak paragraph and explain what makes the revised version stronger.',
    tags: ['writing', 'business', 'career'],
  },
  {
    id: 'r-t3', style: 'reading', category: 'Topic', categoryZh: '主題討論',
    title: 'Short Story Book Club', titleZh: '短篇小說讀書會',
    description: 'Analyse and discuss a short prose passage as a reading group',
    descriptionZh: '以讀書會形式分析並討論短篇散文',
    resourceType: 'topic', difficulty: 'advanced', duration: 20,
    bestBrainStates: ['focus', 'creative'],
    prompt: 'Give me a 150-word prose excerpt (classic or contemporary). Guide a book club discussion: What is the narrative voice? What mood does the writer create? Identify one metaphor and one piece of foreshadowing. Then ask me to write a 60-word "next paragraph" that continues the style.',
    tags: ['literature', 'reading', 'analysis'],
  },
  {
    id: 'r-e3', style: 'reading', category: 'Exercise', categoryZh: '練習活動',
    title: 'Error Hunt', titleZh: '錯誤偵查練習',
    description: 'Find and correct deliberate grammar and vocabulary errors in a paragraph',
    descriptionZh: '找出並改正段落中刻意植入的文法和詞彙錯誤',
    resourceType: 'exercise', difficulty: 'intermediate', duration: 12,
    bestBrainStates: ['focus', 'alert'],
    prompt: 'Give me 3 short paragraphs (60–80 words each), each containing exactly 5 deliberate errors (grammar, word choice, punctuation, or register). I find and correct all errors. You reveal which I missed and explain why each error was wrong and what the rule is.',
    tags: ['grammar', 'editing', 'accuracy'],
  },
  {
    id: 'r-e4', style: 'reading', category: 'Exercise', categoryZh: '練習活動',
    title: 'Sentence Transformation', titleZh: '句型轉換練習',
    description: 'Transform sentences between structures without changing meaning',
    descriptionZh: '在不改變語意的前提下轉換句子結構',
    resourceType: 'exercise', difficulty: 'intermediate', duration: 15,
    bestBrainStates: ['focus'],
    prompt: 'Give me 12 sentences to transform. Mix of: active → passive, direct → reported speech, positive → negative question, comparative → superlative. I rewrite each. You correct mistakes and explain the structural rule behind each transformation type.',
    tags: ['grammar', 'structure', 'transformation'],
  },
  {
    id: 'r-g2', style: 'reading', category: 'Game', categoryZh: '遊戲練習',
    title: 'Dictionary Detective', titleZh: '字典偵探遊戲',
    description: 'Guess the real definition of obscure words from fake alternatives',
    descriptionZh: '從假選項中猜出冷僻詞彙的真實定義',
    resourceType: 'game', difficulty: 'intermediate', duration: 12,
    bestBrainStates: ['relaxed', 'creative'],
    prompt: 'Give me 8 rare or advanced English words. For each, give me 3 definitions: one real, two plausible-sounding fakes. I choose which is real and explain why. Keep score (1 point per correct answer). After the game, I use each real word in a new sentence.',
    tags: ['vocabulary', 'advanced', 'game'],
  },
  {
    id: 'r-p1', style: 'reading', category: 'Exercise', categoryZh: '練習活動',
    title: 'Précis Writing', titleZh: '精縮寫作練習',
    description: 'Summarise a 250-word passage into 80 words without losing key information',
    descriptionZh: '將250字段落精縮至80字而不遺漏關鍵資訊',
    resourceType: 'exercise', difficulty: 'advanced', duration: 20,
    bestBrainStates: ['focus'],
    prompt: 'Give me a 250-word informational passage on any topic. I summarise it in exactly 80 words. You assess: Is the main idea preserved? Are any key points lost? Was anything added that wasn\'t in the original? Give me a score out of 10 and specific feedback on what to improve.',
    tags: ['writing', 'summarisation', 'academic'],
  },

  // ── KINESTHETIC: 6 additional ─────────────────────────────────────

  {
    id: 'k-s4', style: 'kinesthetic', category: 'Scenario', categoryZh: '情境練習',
    title: 'Job Interview', titleZh: '求職面試情境',
    description: 'Practice a real job interview from opening to closing questions',
    descriptionZh: '練習從開場到結尾的完整求職面試',
    resourceType: 'scenario', difficulty: 'intermediate', duration: 20,
    bestBrainStates: ['focus', 'alert'],
    prompt: 'You are a hiring manager interviewing me for a role I describe. Ask 6 realistic questions including: Tell me about yourself, a challenge you overcame, and a question I ask you. Focus on: confident language, specific examples (STAR method), avoiding filler words. Give me a mini-debrief after each answer.',
    tags: ['career', 'speaking', 'practical'],
  },
  {
    id: 'k-t3', style: 'kinesthetic', category: 'Topic', categoryZh: '主題討論',
    title: 'Cooking Class', titleZh: '烹飪課情境',
    description: 'Give or follow step-by-step cooking instructions in real time',
    descriptionZh: '即時給予或跟隨分步烹飪指示',
    resourceType: 'topic', difficulty: 'beginner', duration: 15,
    bestBrainStates: ['creative', 'neutral'],
    prompt: 'I\'m teaching you to cook one of my favourite dishes. You ask clarifying questions at each step like a real cooking student: How much exactly? What should it look/smell like? What if I don\'t have that ingredient? Correct my measurement language, cooking verbs, and sequencing expressions.',
    tags: ['food', 'process', 'practical'],
  },
  {
    id: 'k-e2', style: 'kinesthetic', category: 'Exercise', categoryZh: '練習活動',
    title: 'Emergency Scenarios', titleZh: '緊急情況語言練習',
    description: 'Practice essential language for emergencies and urgent situations',
    descriptionZh: '練習緊急和突發狀況的必備語言',
    resourceType: 'exercise', difficulty: 'intermediate', duration: 15,
    bestBrainStates: ['focus', 'neutral'],
    prompt: 'Present me with 4 emergency scenarios one by one (e.g. calling 999/911, reporting a fire, asking for medical help, describing an accident to police). I respond to each in the target language. Focus on clarity, urgency vocabulary, and giving key information first. Correct any unclear or dangerous phrasing.',
    tags: ['practical', 'safety', 'vocabulary'],
  },
  {
    id: 'k-g2', style: 'kinesthetic', category: 'Game', categoryZh: '遊戲練習',
    title: 'Language Survival Challenge', titleZh: '語言生存挑戰',
    description: 'Complete 5 real-world mini-tasks entirely in the target language',
    descriptionZh: '完全用目標語言完成5個真實世界小任務',
    resourceType: 'game', difficulty: 'beginner', duration: 15,
    bestBrainStates: ['creative', 'alert'],
    prompt: 'Give me 5 survival tasks to complete in the target language: (1) order food for 2 people with one dietary restriction, (2) ask for directions to the station, (3) buy a train ticket for tomorrow morning, (4) report a lost phone, (5) make a doctor\'s appointment. I role-play each; you play the other person. Score on task completion and language accuracy.',
    tags: ['practical', 'speaking', 'real-world'],
  },
  {
    id: 'k-s5', style: 'kinesthetic', category: 'Scenario', categoryZh: '情境練習',
    title: 'Tour Guide', titleZh: '導遊情境',
    description: 'Lead a tour of your city or hometown for foreign visitors',
    descriptionZh: '為外國遊客帶領參觀你的城市或家鄉',
    resourceType: 'scenario', difficulty: 'intermediate', duration: 15,
    bestBrainStates: ['creative', 'relaxed'],
    prompt: 'I am a tour guide leading you around my city/hometown. You are a curious tourist who asks follow-up questions about history, food, customs, and what to do. After the "tour", give me feedback on: Did I use engaging language? Were my explanations clear? Suggest 3 phrases that would make the tour feel more professional.',
    tags: ['travel', 'culture', 'speaking'],
  },
  {
    id: 'k-t4', style: 'kinesthetic', category: 'Topic', categoryZh: '主題討論',
    title: 'Sports Commentary', titleZh: '現場運動解說',
    description: 'Narrate a live sports moment with energy, tense, and vocabulary',
    descriptionZh: '用活力、時態和詞彙即時解說運動場面',
    resourceType: 'topic', difficulty: 'intermediate', duration: 12,
    bestBrainStates: ['alert', 'creative'],
    prompt: 'Describe a sport you know. Give me a match situation (score, time, key players). I do a 60-second live commentary as if on radio. You play a co-commentator who asks questions mid-commentary. Correct my: use of present simple for live action, sports vocabulary, and dramatic emphasis words.',
    tags: ['sports', 'speaking', 'present-tense'],
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

export function getRecommendedMaterials(
  style: LearningStyle,
  brainState: BrainState,
  completedIds: string[],
  limit = 3,
): PracticeMaterial[] {
  const pending = VARK_MATERIALS.filter(
    m => m.style === style && !completedIds.includes(m.id)
  );
  // prioritise brain-state match
  const matched = pending.filter(m => m.bestBrainStates.includes(brainState));
  const rest = pending.filter(m => !m.bestBrainStates.includes(brainState));
  return [...matched, ...rest].slice(0, limit);
}

