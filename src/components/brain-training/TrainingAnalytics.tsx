import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  TrainingRecord,
  TrainingGame,
  getGameStats,
  getBrainStateBreakdown,
  gameLabel,
} from '@/lib/brain-training/training-history';
import { BRAIN_STATE_INFO } from '@/lib/brainwave/types';

const GAMES: { key: TrainingGame; emoji: string }[] = [
  { key: 'nback', emoji: '🧠' },
  { key: 'attention', emoji: '⚡' },
  { key: 'speed', emoji: '🎯' },
];

function TrendBadge({ trend }: { trend: number | null }) {
  if (trend === null) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }
  if (trend > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-emerald-600 font-medium">
        <TrendingUp className="w-3 h-3" /> +{trend}%
      </span>
    );
  }
  if (trend < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-xs text-red-500 font-medium">
        <TrendingDown className="w-3 h-3" /> {trend}%
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
      <Minus className="w-3 h-3" /> 0%
    </span>
  );
}

/** Mini bar sparkline of recent accuracy values. */
function Sparkline({ values }: { values: number[] }) {
  const recent = values.slice(-12);
  if (recent.length === 0) return null;
  return (
    <div className="flex items-end gap-0.5 h-8">
      {recent.map((v, i) => (
        <div
          key={i}
          className="flex-1 min-w-[3px] rounded-sm bg-primary/60"
          style={{ height: `${Math.max(8, v)}%` }}
          title={`${v}%`}
        />
      ))}
    </div>
  );
}

interface Props {
  history: TrainingRecord[];
}

export function TrainingAnalytics({ history }: Props) {
  if (history.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-6 text-center space-y-1">
          <p className="text-sm text-muted-foreground">尚無訓練紀錄</p>
          <p className="text-xs text-muted-foreground">
            完成任一項腦力訓練後，這裡會量化分析你的表現趨勢與最佳腦態
          </p>
        </CardContent>
      </Card>
    );
  }

  const breakdown = getBrainStateBreakdown(history);
  const bestState = breakdown[0];

  return (
    <div className="space-y-4">
      {/* Per-game quantified stats */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">訓練數據分析</CardTitle>
          <CardDescription className="text-xs">
            共完成 {history.length} 次訓練 · 量化你的認知表現趨勢
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {GAMES.map(({ key, emoji }) => {
            const stats = getGameStats(history, key);
            if (stats.count === 0) return null;
            const accuracies = history.filter(r => r.game === key).map(r => r.accuracy);
            return (
              <div key={key} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50">
                <span className="text-xl w-7 text-center">{emoji}</span>
                <div className="w-20 shrink-0">
                  <p className="text-xs font-medium">{gameLabel(key)}</p>
                  <p className="text-xs text-muted-foreground">{stats.count} 次</p>
                </div>
                <div className="flex-1 min-w-0">
                  <Sparkline values={accuracies} />
                </div>
                <div className="grid grid-cols-3 gap-2 text-center shrink-0 w-44">
                  <div>
                    <p className="text-xs font-bold text-foreground">{stats.latest}%</p>
                    <p className="text-[10px] text-muted-foreground">最新</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-emerald-600">{stats.best}%</p>
                    <p className="text-[10px] text-muted-foreground">最佳</p>
                  </div>
                  <div>
                    <TrendBadge trend={stats.trend} />
                    <p className="text-[10px] text-muted-foreground">趨勢</p>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Brain-state correlation */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">腦態 × 表現關聯</CardTitle>
          <CardDescription className="text-xs">
            不同腦態下的平均訓練準確率，找出你的最佳學習狀態
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {bestState && bestState.count >= 1 && (
            <div className="text-xs bg-emerald-50 border border-emerald-200 rounded-lg p-2.5 mb-1">
              💡 你在
              <span className="font-semibold mx-1">
                {BRAIN_STATE_INFO[bestState.state].emoji}{' '}
                {BRAIN_STATE_INFO[bestState.state].labelZh}
              </span>
              狀態下表現最佳，平均準確率
              <span className="font-semibold text-emerald-700 ml-1">
                {bestState.avgAccuracy}%
              </span>
            </div>
          )}
          {breakdown.map(b => {
            const info = BRAIN_STATE_INFO[b.state];
            return (
              <div key={b.state} className="flex items-center gap-2">
                <span className="text-base w-6 text-center">{info.emoji}</span>
                <span className="text-xs w-20 shrink-0">{info.labelZh}</span>
                <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${b.avgAccuracy}%`, backgroundColor: info.color }}
                  />
                </div>
                <span className="text-xs font-medium w-10 text-right">{b.avgAccuracy}%</span>
                <Badge variant="outline" className="text-[10px] shrink-0">{b.count}次</Badge>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
