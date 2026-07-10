import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';
import { GENIUS_INFO, GeniusType } from '@/lib/genius-type';
import { GENIUS_PLAN } from '@/lib/genius-plan';
import { FULL_PLAN } from '@/lib/genius-daily';

const TYPES = Object.keys(GENIUS_INFO) as GeniusType[];

/** 介面一：訓練方案 — 每個天分型態的完整訓練方法（文字稿全文）。 */
export function TrainingPlanPanel({
  userType,
  onLaunch,
}: {
  userType: GeniusType | null;
  onLaunch: (prompt: string) => void;
}) {
  const [view, setView] = useState<GeniusType>(userType || 'explorer');
  useEffect(() => { if (userType) setView(userType); }, [userType]);

  const info = GENIUS_INFO[view];
  const plan = FULL_PLAN[view];
  const schedule = GENIUS_PLAN[view].schedule;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* type chips */}
      <div className="flex gap-1.5 flex-wrap">
        {TYPES.map(t => {
          const ti = GENIUS_INFO[t];
          const active = view === t;
          return (
            <button
              key={t}
              onClick={() => setView(t)}
              className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                active ? 'text-white border-transparent' : 'border-slate-200 text-muted-foreground hover:bg-slate-50'
              }`}
              style={active ? { backgroundColor: ti.color } : undefined}
            >
              {ti.emoji} {ti.nameZh}{userType === t ? '（你）' : ''}
            </button>
          );
        })}
      </div>

      {/* identity + signature */}
      <Card style={{ borderColor: `${info.color}55` }}>
        <div className="h-1.5 rounded-t-lg" style={{ backgroundColor: info.color }} />
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-2xl">{info.emoji}</span>
            <span className="font-bold text-lg" style={{ color: info.color }}>{info.nameZh} {info.nameEn}</span>
            <Badge variant="outline" className="text-xs">{info.brainwave} · {info.vark}</Badge>
            {userType === view && <Badge className="text-xs" style={{ backgroundColor: info.color }}>你的型態</Badge>}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{plan.signature}</p>
        </CardContent>
      </Card>

      {/* 編碼 / 提取 / 鞏固 */}
      {plan.blocks.map((b, i) => (
        <Card key={i}>
          <CardContent className="p-4 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold tracking-wide px-2 py-0.5 rounded-full" style={{ backgroundColor: `${info.color}18`, color: info.color }}>
                {b.tag}
              </span>
              <span className="font-semibold text-sm">{b.title}</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{b.body}</p>
          </CardContent>
        </Card>
      ))}

      {/* schedule strip */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
        <span className="font-semibold">間隔複習節奏：</span>
        {schedule.map((d, i) => (
          <span key={i} className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full bg-slate-100 font-medium">第 {d} 天</span>
            {i < schedule.length - 1 && <span style={{ color: info.color }}>→</span>}
          </span>
        ))}
      </div>

      {/* weekly */}
      <Card className="border-2" style={{ borderColor: `${info.color}66`, background: `${info.color}08` }}>
        <CardContent className="p-4 space-y-3">
          <div className="font-semibold text-sm flex items-center gap-1.5" style={{ color: info.color }}>
            <Sparkles className="w-4 h-4" /> 本週訓練建議
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{plan.weekly}</p>
          <Button className="text-white" style={{ backgroundColor: info.color }} onClick={() => onLaunch(plan.weeklyPrompt)}>
            用 AI 執行本週訓練 →
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
