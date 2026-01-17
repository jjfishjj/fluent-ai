import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Language } from '@/lib/types';

interface LanguageChartProps {
  data: Record<Language, number>;
}

const COLORS = {
  english: '#3b82f6',
  german: '#eab308',
  french: '#6366f1',
  spanish: '#f97316',
  japanese: '#ec4899',
  korean: '#06b6d4',
};

export function LanguageChart({ data }: LanguageChartProps) {
  const chartData = Object.entries(data).map(([language, value]) => ({
    name: language.charAt(0).toUpperCase() + language.slice(1),
    value,
    color: COLORS[language as Language],
  }));

  return (
    <div className="bg-card rounded-xl p-6 border border-border shadow-soft">
      <h3 className="font-semibold mb-4">Language Distribution</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.75rem',
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
