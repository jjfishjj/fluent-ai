import { ConversationSettings } from '@/lib/types';

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

type MsgContent = string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
type Msg = { role: 'user' | 'assistant' | 'system'; content: MsgContent };

export async function streamChat({
  messages,
  settings,
  learningStyle,
  geniusType,
  onDelta,
  onDone,
  onError,
}: {
  messages: Msg[];
  settings: ConversationSettings;
  learningStyle?: string | null;
  geniusType?: string | null;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (msg: string) => void;
}) {
  // Abort if the server never answers — otherwise the UI spins forever.
  const abort = new AbortController();
  const timeout = setTimeout(() => abort.abort(), 45000);

  let resp: Response;
  try {
    resp = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages, settings, learningStyle, geniusType }),
      signal: abort.signal,
    });
  } catch (e) {
    clearTimeout(timeout);
    onError(
      e instanceof DOMException && e.name === 'AbortError'
        ? 'AI 伺服器逾時沒有回應（45 秒）。請稍後再試。'
        : '無法連線到 AI 伺服器。請檢查網路，或稍後再試。'
    );
    return;
  }
  clearTimeout(timeout);

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    const friendly: Record<number, string> = {
      402: 'AI 供應商額度已用完——請到你的 AI 平台帳戶檢查/補充額度。',
      429: '請求太頻繁，被暫時限流。等一分鐘再試。',
      404: '找不到 chat 服務——Vercel 的 VITE_SUPABASE_URL 可能指向錯的 Supabase 專案。',
      500: 'AI 服務錯誤（可能是 LOVABLE_API_KEY 未設定）。',
    };
    onError(data.error || friendly[resp.status] || `Error ${resp.status}`);
    return;
  }

  if (!resp.body) {
    onError('No response body');
    return;
  }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = '';
  let streamDone = false;

  while (!streamDone) {
    let chunk: ReadableStreamReadResult<Uint8Array>;
    try {
      chunk = await reader.read();
    } catch {
      onError('串流中斷。請重新發送訊息。');
      return;
    }
    const { done, value } = chunk;
    if (done) break;
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);

      if (line.endsWith('\r')) line = line.slice(0, -1);
      if (line.startsWith(':') || line.trim() === '') continue;
      if (!line.startsWith('data: ')) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === '[DONE]') {
        streamDone = true;
        break;
      }

      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        textBuffer = line + '\n' + textBuffer;
        break;
      }
    }
  }

  // Flush remaining
  if (textBuffer.trim()) {
    for (let raw of textBuffer.split('\n')) {
      if (!raw) continue;
      if (raw.endsWith('\r')) raw = raw.slice(0, -1);
      if (raw.startsWith(':') || raw.trim() === '') continue;
      if (!raw.startsWith('data: ')) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === '[DONE]') continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch { /* ignore */ }
    }
  }

  onDone();
}
