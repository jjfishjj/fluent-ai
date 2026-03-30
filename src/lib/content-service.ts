const ANALYZE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-content`;

export async function analyzeUrl(url: string): Promise<{ content?: string; error?: string }> {
  const isVideo = /youtu\.?be|vimeo|\.mp4|\.webm|\.mov/i.test(url);
  const resp = await fetch(ANALYZE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ url, type: isVideo ? 'video_url' : 'url' }),
  });
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    return { error: data.error || `Error ${resp.status}` };
  }
  return resp.json();
}

export function extractVideoFrames(video: HTMLVideoElement, count = 4): Promise<string[]> {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const frames: string[] = [];
    const duration = video.duration;
    const interval = duration / (count + 1);

    let captured = 0;

    const captureFrame = (time: number) => {
      video.currentTime = time;
    };

    video.onseeked = () => {
      canvas.width = Math.min(video.videoWidth, 640);
      canvas.height = Math.min(video.videoHeight, 480);
      const scale = Math.min(640 / video.videoWidth, 480 / video.videoHeight, 1);
      canvas.width = video.videoWidth * scale;
      canvas.height = video.videoHeight * scale;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      frames.push(canvas.toDataURL('image/jpeg', 0.7));
      captured++;
      if (captured < count) {
        captureFrame(interval * (captured + 1));
      } else {
        resolve(frames);
      }
    };

    captureFrame(interval);
  });
}

export function videoToBase64Frames(file: File, frameCount = 4): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;

    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadedmetadata = () => {
      video.oncanplaythrough = () => {
        extractVideoFrames(video, frameCount)
          .then((frames) => {
            URL.revokeObjectURL(url);
            resolve(frames);
          })
          .catch(reject);
      };
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load video'));
    };
  });
}
