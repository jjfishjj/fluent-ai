import { supabase } from '@/integrations/supabase/client';

const IMAGE_GEN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-image`;

export async function uploadChatImage(file: File): Promise<string | null> {
  const ext = file.name.split('.').pop() || 'jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

  const { error } = await supabase.storage
    .from('chat-images')
    .upload(fileName, file, { contentType: file.type });

  if (error) {
    console.error('Upload error:', error);
    return null;
  }

  const { data } = supabase.storage.from('chat-images').getPublicUrl(fileName);
  return data.publicUrl;
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function generateImage(
  prompt: string,
  language: string
): Promise<{ imageUrl?: string; text?: string; error?: string }> {
  const resp = await fetch(IMAGE_GEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ prompt, language }),
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    return { error: data.error || `Error ${resp.status}` };
  }

  return resp.json();
}
