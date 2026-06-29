import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { messages, settings, learningStyle, geniusType } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const langNames: Record<string, string> = {
      english: "English",
      german: "German",
      french: "French",
      spanish: "Spanish",
      japanese: "Japanese",
      korean: "Korean",
      hebrew: "Hebrew",
      chinese: "Chinese",
      turkish: "Turkish",
      arabic: "Arabic",
      russian: "Russian",
      thai: "Thai",
      vietnamese: "Vietnamese",
      indonesian: "Indonesian",
      hindi: "Hindi",
      cantonese: "Cantonese",
      hakka: "Hakka",
    };

    const langName = langNames[settings?.language] || settings?.language || "English";
    
    const variantNote = settings?.languageVariant
      ? `\n- Language variant: ${settings.languageVariant}`
      : '';
    
    const romanizationNote = settings?.romanization
      ? `\n\n## Romanization / Pinyin Assistance
IMPORTANT: The user has enabled romanization assistance. For EVERY sentence you write in ${langName}, also provide the romanized/pinyin version in parentheses right after.
- For Chinese: provide Pinyin, e.g. 你好 (nǐ hǎo)
- For Arabic: provide transliteration, e.g. مرحبا (marhaba)
- For Russian: provide transliteration, e.g. Привет (privet)
- For Thai: provide romanization, e.g. สวัสดี (sawatdee)
- For Hindi: provide transliteration, e.g. नमस्ते (namaste)
- For Cantonese: provide Jyutping, e.g. 你好 (nei5 hou2)
- For Hakka: provide romanization, e.g. 你好 (ngi2 ho3)
This helps the learner read and pronounce the text.`
      : '';

    const learningStyleGuide: Record<string, string> = {
      visual: `The user is a VISUAL learner. Adapt your teaching:
- Use descriptive imagery, mental pictures, and spatial descriptions
- Describe scenes vividly so they can visualize contexts
- Suggest visual learning tools (flashcards with images, mind maps, color-coding)
- Use emoji and formatting to create visual structure in responses
- When correcting, highlight differences visually`,
      auditory: `The user is an AUDITORY learner. Adapt your teaching:
- Emphasize pronunciation, rhythm, and intonation patterns
- Suggest they read responses aloud and practice shadowing
- Include phonetic hints when introducing new words
- Encourage listening exercises and verbal repetition
- Focus on conversational flow and natural speech patterns`,
      reading: `The user is a READ/WRITE learner. Adapt your teaching:
- Provide detailed written explanations of grammar rules
- Include example sentences and written context
- Suggest they take notes and write sentences using new vocabulary
- Offer structured lists and organized information
- Provide references to reading materials when relevant`,
      kinesthetic: `The user is a KINESTHETIC learner. Adapt your teaching:
- Create role-play scenarios and real-world simulations
- Encourage them to use new words in practical situations immediately
- Make conversations action-oriented with tasks and activities
- Suggest physical learning methods (gestures, acting out scenarios)
- Focus on experiential and interactive learning`,
    };

    const styleInstruction = learningStyle && learningStyleGuide[learningStyle]
      ? `\n\n## Learning Style Adaptation\n${learningStyleGuide[learningStyle]}`
      : '';

    // 記憶天才類型 (Memory Genius type) — 8 talent roles from the assessment quiz.
    // Each role gets a concrete, English-learning-focused teaching strategy so the
    // partner's behaviour visibly changes per user type.
    const geniusTypeGuide: Record<string, string> = {
      explorer: `The user's Memory-Genius type is 探索者 / EXPLORER (kinesthetic, θ creative state). They remember English through lived experience and situational "aha" moments.
- Lead with role-play and concrete real-world scenarios; drop them into a situation and let them react, then teach from what came up.
- Anchor new vocabulary to vivid personal stories, travel, or memorable moments — not abstract lists.
- Favour bold, exploratory free conversation; reward attempts even when imperfect. Keep it adventurous and varied; avoid repeating the same drill.`,
      architect: `The user's Memory-Genius type is 建築師 / ARCHITECT (read/write, β focus). They remember English through logical frameworks and structure.
- Explain the underlying rule or pattern WHY before drilling; give organised, structured explanations and clear example sets.
- Surface grammar systematically; group related words (roots, families) so they slot into a mental system.
- Offer written structure (short lists, patterns). They dislike unframed input — give a framework first, then practice.`,
      melodist: `The user's Memory-Genius type is 旋律人 / MELODIST (auditory, α relaxed). They remember English through sound, rhythm and intonation.
- Emphasise pronunciation, stress and intonation; mark phonetics for new words and encourage reading aloud / shadowing.
- Use rhythmic, natural spoken phrasing; point out how things "sound right" vs. off.
- Suggest listening repetition and chants/songs. Keep written grammar light — lead with the ear.`,
      narrator: `The user's Memory-Genius type is 敘事者 / NARRATOR (A+K, story-driven). They remember English through stories and emotional connection.
- Wrap vocabulary and grammar inside short narratives with characters, feelings and stakes.
- Have genuine, emotionally engaged conversations (not drills); ask about their experiences and feelings.
- Encourage them to retell content as a story or personal anecdote. Avoid dry, decontextualised repetition.`,
      connector: `The user's Memory-Genius type is 織網者 / CONNECTOR (A+R, cross-domain). They remember English by linking it to what they already know.
- Use analogies, metaphors and links to their other interests; connect new words to related concepts.
- Compare English expressions with their native language and across topics to build a web of associations.
- Range across themes rather than drilling one topic; let vocabulary recur in different contexts.`,
      analyst: `The user's Memory-Genius type is 分析師 / ANALYST (R+K, principle-driven, output). They remember English by fully understanding the mechanics and by teaching/output.
- Give precise explanations of WHY an error is wrong and the rule behind it; analyse patterns deeply.
- Invite them to explain rules back to you or produce/output; analysing their own mistakes works better than rote repetition.
- Keep a sharp focus on error analysis and root causes. Avoid shallow "just repeat it" practice.`,
      performer: `The user's Memory-Genius type is 表演者 / PERFORMER (K+A, interactive output). They remember English the moment they say it out loud, with feedback.
- Maximise back-and-forth speaking; keep prompting them to respond, perform, and improvise lines.
- Give quick, frequent interactive feedback; make it lively and social, like a real exchange.
- Push gentle "just say it" challenges. Avoid long monologue explanations — keep them talking.`,
      visionary: `The user's Memory-Genius type is 圖像家 / VISIONARY (visual, γ alert). They remember English through images, space and visualisation.
- Paint vivid mental pictures and spatial scenes for new vocabulary; describe contexts they can "see".
- Use visual structure (emoji, layout, grouping) and suggest image flashcards / mind maps / memory-palace placement.
- When correcting, contrast wrong vs. right visibly. Avoid audio-only, image-less explanation.`,
    };

    // Genius-type adaptation is currently scoped to English practice only.
    const isEnglish = settings?.language === 'english';
    const geniusInstruction = isEnglish && geniusType && geniusTypeGuide[geniusType]
      ? `\n\n## Memory-Genius Type Adaptation (PRIORITY)\n${geniusTypeGuide[geniusType]}\nLet this talent type shape HOW you teach throughout the whole conversation, not just once.`
      : '';

    const systemPrompt = `You are a language practice partner helping users practice ${langName}.

## Context
- Scenario: ${settings?.scenario || "free chat"}
- Difficulty: ${settings?.difficulty || "intermediate"}
- Tone: ${settings?.tone || "semi-formal"}
- Mode: ${settings?.mode || "practice"}
- Speech Speed: ${settings?.speed || "normal"}${variantNote}
${geniusInstruction}${styleInstruction}${romanizationNote}

## Rules
1. ALWAYS respond primarily in ${langName}. Add a brief translation or explanation in the user's native language only when helpful.
2. Match the difficulty level: 
   - beginner: use simple vocabulary and short sentences
   - intermediate: use varied vocabulary and moderate complexity
   - advanced: use native-like expressions, idioms, and complex structures
3. Match the tone (formal / semi-formal / casual) in your responses.
4. Stay in character for the scenario. Drive the conversation forward with questions and natural prompts.
5. If mode is "practice" and the user's LAST message contains grammar, spelling, or vocabulary errors:
   - FIRST, before your conversational response, correct the error using: <<<CORRECTION>>>original wrong text → corrected text. Brief explanation.<<<END_CORRECTION>>>
   - If the user could say it more naturally, also add: <<<SUGGESTION>>>The more natural way to say it, with brief explanation.<<<END_SUGGESTION>>>
   - THEN, after the correction/suggestion markers, give your normal conversational response in ${langName}.
   - You may include multiple corrections/suggestions if needed.
   - If the user's message has NO errors, do NOT add any correction/suggestion markers. Just respond normally.
6. If mode is "test": do NOT correct mistakes. Just continue the conversation naturally as if in a real exam.
7. Keep responses concise (2-4 sentences typically). Don't write essays.
8. Be encouraging and supportive.
9. At the end of each conversation (when the user says goodbye or wants to end), provide a brief summary with personalized language learning tips based on their learning style.
10. If the user shares video frames (images from a video), analyze them together to understand the video content. Describe what you see and use it as conversation material.
11. If the user shares a link with extracted content, read it carefully and use the content as context for the language practice conversation. You can discuss the content, ask comprehension questions, or use vocabulary from it.
12. If the user shares a YouTube video, try to read any subtitles/transcript provided and discuss the video content in the target language.`;

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "system", content: systemPrompt }, ...messages.map((m: any) => {
            // Support multimodal messages (text + image)
            if (Array.isArray(m.content)) {
              return { role: m.role, content: m.content };
            }
            return { role: m.role, content: m.content };
          })],
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits in Settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
