import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { BrainwaveSnapshot } from '@/lib/brainwave/types';

interface Props {
  history: BrainwaveSnapshot[];
}

const BAND_COLORS = {
  delta: '#6b7280',
  theta: '#8b5cf6',
  alpha: '#10b981',
  beta: '#3b82f6',
  gamma: '#f59e0b',
};

export function BrainwaveChart({ history }: Props) {
  const data = useMemo(() => {
    // Show last 60 data points
    const slice = history.slice(-60);
    return slice.map((snap, i) => ({
      t: i,
      delta: Math.round(snap.bands.delta * 100),
      theta: Math.round(snap.bands.theta * 100),
      alpha: Math.round(snap.bands.alpha * 100),
      beta: Math.round(snap.bands.beta * 100),
      gamma: Math.round(snap.bands.gamma * 100),
    }));
  }, [history]);

  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
        Waiting for signal…
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 4, right: 8, left: -24, bottom: 0 }}>
        <XAxis dataKey="t" hide />
        <YAxis domain={[0, 60]} tickCount={4} tick={{ fontSize: 10 }} />
        <Tooltip
          formatter={(v: number, name: string) => [`${v}%`, name.charAt(0).toUpperCase() + name.slice(1)]}
          contentStyle={{ fontSize: 12 }}
        />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
        {(Object.keys(BAND_COLORS) as Array<keyof typeof BAND_COLORS>).map(band => (
          <Area
            key={band}
            type="monotone"
            dataKey={band}
            stackId={undefined}
            stroke={BAND_COLORS[band]}
            fill={BAND_COLORS[band]}
            fillOpacity={0.15}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
