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
    const { url, type } = await req.json();

    if (!url || typeof url !== "string") {
      return new Response(
        JSON.stringify({ error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (type === "url") {
      // Fetch URL content
      const resp = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; LinguaBot/1.0)" },
        redirect: "follow",
      });

      if (!resp.ok) {
        return new Response(
          JSON.stringify({ error: `Failed to fetch URL: ${resp.status}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const contentType = resp.headers.get("content-type") || "";
      let text = "";

      if (contentType.includes("text/html")) {
        const html = await resp.text();
        // Strip HTML tags, scripts, styles to get text content
        text = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/&nbsp;/g, " ")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/\s+/g, " ")
          .trim();
        // Limit to ~8000 chars to not overwhelm context
        if (text.length > 8000) text = text.slice(0, 8000) + "...";
      } else if (contentType.includes("text/") || contentType.includes("application/json")) {
        text = await resp.text();
        if (text.length > 8000) text = text.slice(0, 8000) + "...";
      } else {
        return new Response(
          JSON.stringify({ error: "Unsupported content type: " + contentType }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ content: text, sourceUrl: url }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (type === "video_url") {
      // For video URLs (e.g. YouTube): scrape title/captions directly, no AI call needed.
      // Try to extract YouTube video ID for transcript
      const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
      
      let videoContext = "";
      if (ytMatch) {
        const videoId = ytMatch[1];
        // Try to fetch YouTube captions/transcript via a public endpoint
        try {
          const captionResp = await fetch(
            `https://www.youtube.com/watch?v=${videoId}`,
            { headers: { "User-Agent": "Mozilla/5.0 (compatible; LinguaBot/1.0)" } }
          );
          const html = await captionResp.text();
          
          // Extract caption track URL from the page
          const captionMatch = html.match(/"captionTracks":\[(.*?)\]/);
          if (captionMatch) {
            try {
              const tracks = JSON.parse(`[${captionMatch[1]}]`);
              const track = tracks.find((t: any) => t.baseUrl) || tracks[0];
              if (track?.baseUrl) {
                const captionUrl = track.baseUrl.replace(/\\u0026/g, "&");
                const captionResp2 = await fetch(captionUrl);
                const captionXml = await captionResp2.text();
                // Parse XML captions
                const captions = captionXml
                  .replace(/<[^>]+>/g, " ")
                  .replace(/&amp;/g, "&")
                  .replace(/&lt;/g, "<")
                  .replace(/&gt;/g, ">")
                  .replace(/&#39;/g, "'")
                  .replace(/&quot;/g, '"')
                  .replace(/\s+/g, " ")
                  .trim();
                if (captions.length > 0) {
                  videoContext = captions.slice(0, 6000);
                }
              }
            } catch {
              // Caption parsing failed, continue without
            }
          }

          // Also extract title
          const titleMatch = html.match(/<title>(.*?)<\/title>/);
          const title = titleMatch ? titleMatch[1].replace(" - YouTube", "") : "";
          if (title) {
            videoContext = `Video Title: ${title}\n\n${videoContext ? `Subtitles/Transcript:\n${videoContext}` : "No subtitles available."}`;
          }
        } catch {
          videoContext = `YouTube video URL: ${url}. Unable to fetch subtitles.`;
        }
      } else {
        videoContext = `Video URL: ${url}. This is a direct video link.`;
      }

      return new Response(
        JSON.stringify({ content: videoContext, sourceUrl: url, type: "video" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid type. Use 'url' or 'video_url'" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("analyze-content error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
