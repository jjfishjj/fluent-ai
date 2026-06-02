import { X } from 'lucide-react';
import { LearningStyle, STYLE_INFO } from '@/lib/learning-styles';

interface VARKInsightBannerProps {
  style: LearningStyle;
  tip: string;
  onDismiss: () => void;
}

export function VARKInsightBanner({ style, tip, onDismiss }: VARKInsightBannerProps) {
  const info = STYLE_INFO[style];

  return (
    <div
      className="mx-4 mt-2 p-3 rounded-xl border animate-scale-in"
      style={{
        background: `color-mix(in srgb, ${info.color} 8%, transparent)`,
        borderColor: `color-mix(in srgb, ${info.color} 25%, transparent)`,
      }}
    >
      <div className="flex items-start gap-2">
        <span className="text-base shrink-0">{info.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold mb-0.5" style={{ color: info.color }}>
            {info.name}・學習提示
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">{tip}</p>
        </div>
        <button
          onClick={onDismiss}
          className="shrink-0 p-0.5 rounded text-muted-foreground hover:text-foreground transition-colors"
          aria-label="關閉提示"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
