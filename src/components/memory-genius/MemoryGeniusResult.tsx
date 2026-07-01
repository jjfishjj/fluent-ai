import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MGResult } from '@/lib/memory-genius/types';
import { TYPE_PROFILES } from '@/lib/memory-genius/type-profiles';
import { RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';

interface Props {
  result: MGResult;
  onRetake: () => void;
}

export function MemoryGeniusResult({ result, onRetake }: Props) {
  const [weekTab, setWeekTab] = useState<1 | 2 | 3>(1);
  const [showSecondary, setShowSecondary] = useState(false);

  const primary = TYPE_PROFILES[result.primaryType];
  const secondary = TYPE_PROFILES[result.secondaryType];

  const quadrantLabels: Record<string, { zh: string; desc: string }> = {
    innovation: { zh: '創新象限', desc: '感官觸發 × 深度沉浸' },
    perception:  { zh: '感知象限', desc: '抽象思維 × 深度沉浸' },
    integration: { zh: '整合象限', desc: '感官觸發 × 即時反應' },
    action:      { zh: '行動象限', desc: '抽象思維 × 即時反應' },
  };
  const ql = quadrantLabels[result.quadrant];

  // Normalise x/y to -10..10 for dot placement (clamp)
  const dotX = Math.max(-10, Math.min(10, result.xScore));
  const dotY = Math.max(-10, Math.min(10, result.yScore));
  // Map to 0–100% (left = sensory x<0, right = abstract x>0; top = deep y>0, bottom = immediate y<0)
  const dotLeft = ((dotX + 10) / 20) * 100;
  const dotTop  = ((10 - dotY) / 20) * 100; // invert y so top = deep

  const weekContent = [
    { week: 1 as const, label: '第 1–4 週', content: primary.week1to4 },
    { week: 2 as const, label: '第 5–8 週', content: primary.week5to8 },
    { week: 3 as const, label: '第 9–12 週', content: primary.week9to12 },
  ];

  return (
    <div className="space-y-5">
      {/* Identity card */}
      <div
        className="rounded-2xl p-5 space-y-3 text-white"
        style={{ background: `linear-gradient(135deg, ${primary.color}dd, ${primary.color}99)` }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium opacity-80 mb-0.5">記憶天才類型</p>
            <h2 className="text-3xl font-black tracking-tight">{primary.emoji} {primary.nameEn}</h2>
            <p className="text-lg font-bold opacity-90">{primary.nameZh}</p>
          </div>
          <div className="text-right text-xs opacity-75 shrink-0">
            <p>{ql.zh}</p>
            <p className="text-[10px] mt-0.5">{ql.desc}</p>
          </div>
        </div>
        <p className="text-sm opacity-90 leading-relaxed">{primary.tagline}</p>
        <div className="flex gap-3 text-xs opacity-80 flex-wrap">
          <span>🧠 {primary.brainwave}</span>
          <span>⏰ {primary.bestTime}</span>
          <span>📚 {primary.varkLabel}</span>
        </div>
        <blockquote className="border-l-2 border-white/50 pl-3 text-sm italic opacity-85">
          "{primary.quote}"
        </blockquote>
      </div>

      {/* Quadrant map */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">你的記憶座標</p>
        <div className="relative border border-slate-200 rounded-xl overflow-hidden" style={{ aspectRatio: '2/1' }}>
          {/* Axis lines */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-full h-px bg-slate-300" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="h-full w-px bg-slate-300" />
          </div>
          {/* Quadrant labels */}
          <span className="absolute top-2 left-3 text-[10px] text-muted-foreground">感官 + 深度</span>
          <span className="absolute top-2 right-3 text-[10px] text-muted-foreground text-right">抽象 + 深度</span>
          <span className="absolute bottom-2 left-3 text-[10px] text-muted-foreground">感官 + 即時</span>
          <span className="absolute bottom-2 right-3 text-[10px] text-muted-foreground text-right">抽象 + 即時</span>
          {/* Dot */}
          <div
            className="absolute w-5 h-5 rounded-full border-2 border-white shadow-md -translate-x-1/2 -translate-y-1/2 transition-all"
            style={{ left: `${dotLeft}%`, top: `${dotTop}%`, backgroundColor: primary.color }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground px-1">
          <span>← 感官觸發</span>
          <span>← 深度沉浸 / 即時反應 →</span>
          <span>抽象思維 →</span>
        </div>
      </div>

      {/* Memory traits */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">你的記憶特徵</p>
        <div className="space-y-2">
          {primary.memoryTraits.map((t, i) => (
            <div key={i} className="flex items-start gap-2.5 text-sm">
              <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5" style={{ backgroundColor: primary.color }}>
                {i + 1}
              </span>
              <span className="text-muted-foreground leading-relaxed">{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Best methods */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">推薦學習方法</p>
        <div className="grid sm:grid-cols-2 gap-2">
          {primary.bestMethods.map((m, i) => (
            <div key={i} className="flex items-start gap-2 bg-slate-50 rounded-lg p-3 text-sm">
              <span className="text-base shrink-0">✓</span>
              <span className="text-muted-foreground leading-relaxed">{m}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Avoid methods */}
      <div className="rounded-xl border border-red-100 bg-red-50 p-3 space-y-1.5">
        <p className="text-xs font-semibold text-red-700">建議避免</p>
        {primary.avoidMethods.map((m, i) => (
          <div key={i} className="flex items-start gap-2 text-sm text-red-600">
            <span className="shrink-0">✗</span>
            <span>{m}</span>
          </div>
        ))}
      </div>

      {/* 12-week plan */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">12 週學習計劃</p>
        <div className="flex gap-2">
          {weekContent.map(w => (
            <button
              key={w.week}
              onClick={() => setWeekTab(w.week)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                weekTab === w.week
                  ? 'border-primary text-primary bg-primary/5'
                  : 'border-slate-200 text-muted-foreground hover:bg-slate-50'
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
        <div className="bg-slate-50 rounded-xl p-4 text-sm text-muted-foreground leading-relaxed">
          {weekContent.find(w => w.week === weekTab)?.content}
        </div>
      </div>

      {/* Secondary type */}
      <div className="rounded-xl border border-slate-200 overflow-hidden">
        <button
          className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors"
          onClick={() => setShowSecondary(s => !s)}
        >
          <div className="flex items-center gap-2 text-sm">
            <span style={{ color: secondary.color }}>{secondary.emoji}</span>
            <span className="font-medium">副類型：{secondary.nameZh} ({secondary.nameEn})</span>
          </div>
          {showSecondary ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>
        {showSecondary && (
          <div className="px-4 pb-4 space-y-3 border-t border-slate-100">
            <p className="text-sm text-muted-foreground pt-3">{secondary.tagline}</p>
            <div className="space-y-1.5">
              {secondary.bestMethods.slice(0, 2).map((m, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="shrink-0 opacity-60" style={{ color: secondary.color }}>✓</span>
                  <span className="text-muted-foreground">{m}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Completed date + retake */}
      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-muted-foreground">
          測定時間：{new Date(result.completedAt).toLocaleDateString('zh-TW')}
        </p>
        <Button variant="outline" size="sm" onClick={onRetake} className="gap-1.5 text-xs">
          <RefreshCw className="w-3.5 h-3.5" />
          重新測驗
        </Button>
      </div>
    </div>
  );
}
