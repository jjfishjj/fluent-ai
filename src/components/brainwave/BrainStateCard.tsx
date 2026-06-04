import { BrainState, BRAIN_STATE_INFO, BandPowers } from '@/lib/brainwave/types';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface Props {
  state: BrainState;
  bands: BandPowers;
  compact?: boolean;
}

const BAND_LABELS: Array<{ key: keyof BandPowers; label: string; color: string }> = [
  { key: 'delta', label: 'δ Delta',  color: 'bg-gray-400' },
  { key: 'theta', label: 'θ Theta',  color: 'bg-violet-500' },
  { key: 'alpha', label: 'α Alpha',  color: 'bg-emerald-500' },
  { key: 'beta',  label: 'β Beta',   color: 'bg-blue-500' },
  { key: 'gamma', label: 'γ Gamma',  color: 'bg-amber-500' },
];

export function BrainStateCard({ state, bands, compact = false }: Props) {
  const info = BRAIN_STATE_INFO[state];

  if (compact) {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${info.bgColor} border`} style={{ borderColor: info.color + '40' }}>
        <span className="text-lg">{info.emoji}</span>
        <span className="text-sm font-medium" style={{ color: info.color }}>{info.labelZh}</span>
      </div>
    );
  }

  return (
    <Card className={`${info.bgColor} border-0 shadow-sm`}>
      <CardContent className="pt-5 pb-4 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{info.emoji}</span>
          <div>
            <p className="text-lg font-semibold" style={{ color: info.color }}>{info.labelZh}</p>
            <p className="text-sm text-muted-foreground">{info.label}</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{info.description}</p>
        <div className="space-y-2">
          {BAND_LABELS.map(({ key, label, color }) => (
            <div key={key} className="flex items-center gap-2 text-xs">
              <span className="w-16 text-muted-foreground">{label}</span>
              <div className="flex-1 bg-white/60 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${color}`}
                  style={{ width: `${Math.round(bands[key] * 100)}%` }}
                />
              </div>
              <span className="w-8 text-right text-muted-foreground">{Math.round(bands[key] * 100)}%</span>
            </div>
          ))}
        </div>
        {info.activities.length > 0 && (
          <div className="pt-1">
            <p className="text-xs font-medium text-muted-foreground mb-1">適合活動</p>
            <div className="flex flex-wrap gap-1">
              {info.activities.map(act => (
                <span key={act} className="text-xs px-2 py-0.5 bg-white/70 rounded-full border">{act}</span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
