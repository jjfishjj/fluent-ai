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
    const { prompt, language } = await req.json();

    // ---- Provider resolution (mirrors chat/index.ts, image-capable providers only) ----
    // Claude has no image-generation API, so this only supports OpenAI-compatible
    // endpoints that can return images from chat completions.
    // 1) AI_API_KEY (+ AI_BASE_URL, AI_IMAGE_MODEL) → defaults to Gemini
    // 2) LOVABLE_API_KEY (legacy)                   → old Lovable gateway
    const AI_API_KEY = Deno.env.get("AI_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!AI_API_KEY && !LOVABLE_API_KEY) {
      throw new Error("Image generation not configured. Set AI_API_KEY (Gemini/OpenAI-compatible), or LOVABLE_API_KEY.");
    }

    const baseUrl = AI_API_KEY
      ? (Deno.env.get("AI_BASE_URL") || "https://generativelanguage.googleapis.com/v1beta/openai")
      : "https://ai.gateway.lovable.dev/v1";
    const apiKey = AI_API_KEY || LOVABLE_API_KEY;
    // Gemini's current image-gen model as of writing is "gemini-2.5-flash-image".
    // If Google renames/retires it, override with `supabase secrets set AI_IMAGE_MODEL=...`
    // — no redeploy of this file needed.
    const model = AI_API_KEY
      ? (Deno.env.get("AI_IMAGE_MODEL") || "gemini-2.5-flash-image")
      : "google/gemini-3.1-flash-image-preview";

    const imagePrompt = `Generate an educational illustration related to language learning. Context: The user is practicing ${language || "a language"}. Based on the conversation context: "${prompt}". Create a clear, friendly, educational image that helps visualize the topic being discussed. Style: clean, colorful, educational illustration.`;

    const response = await fetch(
      `${baseUrl.replace(/\/$/, "")}/chat/completions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: imagePrompt }],
          modalities: ["image", "text"],
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
          JSON.stringify({ error: "AI credits exhausted." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const t = await response.text();
      console.error("Image generation error:", response.status, t);
      const hint = response.status === 404
        ? `Image model "${model}" not available for this account/key — try setting AI_IMAGE_MODEL to a different model via \`supabase secrets set\`.`
        : "Image generation failed";
      return new Response(
        JSON.stringify({ error: hint }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    const text = data.choices?.[0]?.message?.content;

    return new Response(
      JSON.stringify({ imageUrl, text }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("chat-image error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
