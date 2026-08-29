import { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { memoryQuestXpTrend, type MemoryQuestAttempt } from '@/lib/memory-quest-analytics';

interface MemoryQuestXpTrendChartProps {
  history: MemoryQuestAttempt[];
  now?: number;
}

export function MemoryQuestXpTrendChart({ history, now }: MemoryQuestXpTrendChartProps) {
  const data = useMemo(() => memoryQuestXpTrend(history, now), [history, now]);
  const hasActivity = data.some((point) => point.xp > 0);

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-black tracking-[0.16em] text-violet-600">PERSONAL XP</div>
          <h3 className="mt-1 font-black text-slate-950">近 7 日 XP 趨勢</h3>
        </div>
        <span className="rounded-full bg-violet-50 px-2.5 py-1 text-xs font-bold text-violet-700">每日</span>
      </div>
      {hasActivity ? (
        <div className="mt-4 h-48" aria-label="個人近七日 XP 趨勢圖">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="memoryQuestXpGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip
                formatter={(value: number) => [`${value} XP`, '獲得 XP']}
                labelFormatter={(label) => `${label}`}
                contentStyle={{ borderRadius: 12, borderColor: '#ddd6fe', fontSize: 12 }}
              />
              <Area
                type="monotone"
                dataKey="xp"
                name="XP"
                stroke="#7c3aed"
                strokeWidth={3}
                fill="url(#memoryQuestXpGradient)"
                dot={{ r: 3, fill: '#7c3aed', strokeWidth: 0 }}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="mt-4 flex h-48 items-center justify-center rounded-xl bg-slate-50 px-6 text-center text-sm leading-6 text-slate-500">
          完成第一場記憶任務後，這裡會顯示你的 XP 成長曲線。
        </div>
      )}
      <p className="mt-3 text-xs leading-5 text-slate-500">圖表只顯示目前帳號的本機訓練紀錄，空白日會保留，方便觀察練習節奏。</p>
    </div>
  );
}
