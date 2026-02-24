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
    const { messages, settings } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const langNames: Record<string, string> = {
      english: "English",
      german: "German",
      french: "French",
      spanish: "Spanish",
      japanese: "Japanese",
      korean: "Korean",
    };

    const langName = langNames[settings?.language] || settings?.language || "English";

    const systemPrompt = `You are a language practice partner helping users practice ${langName}.

## Context
- Scenario: ${settings?.scenario || "free chat"}
- Difficulty: ${settings?.difficulty || "intermediate"}
- Tone: ${settings?.tone || "semi-formal"}
- Mode: ${settings?.mode || "practice"}
- Speech Speed: ${settings?.speed || "normal"}

## Rules
1. ALWAYS respond primarily in ${langName}. Add a brief translation or explanation in the user's native language only when helpful.
2. Match the difficulty level: 
   - beginner: use simple vocabulary and short sentences
   - intermediate: use varied vocabulary and moderate complexity
   - advanced: use native-like expressions, idioms, and complex structures
3. Match the tone (formal / semi-formal / casual) in your responses.
4. Stay in character for the scenario. Drive the conversation forward with questions and natural prompts.
5. If mode is "practice": gently correct grammar or vocabulary mistakes inline. After your response, if the user made errors, add a "📝 Correction:" section. If they could say it more naturally, add a "💡 More natural:" section.
6. If mode is "test": do NOT correct mistakes. Just continue the conversation naturally as if in a real exam.
7. Keep responses concise (2-4 sentences typically). Don't write essays.
8. Be encouraging and supportive.`;

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
          messages: [{ role: "system", content: systemPrompt }, ...messages],
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
