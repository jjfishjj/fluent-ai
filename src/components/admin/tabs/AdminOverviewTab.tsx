import { AdminStats } from '@/pages/Admin';
import { Badge } from '@/components/ui/badge';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface Props {
  stats: AdminStats;
  loading: boolean;
}

const LANG_COLORS: Record<string, string> = {
  english: 'hsl(217, 91%, 60%)',
  german: 'hsl(48, 96%, 53%)',
  french: 'hsl(239, 84%, 67%)',
  spanish: 'hsl(25, 95%, 53%)',
  japanese: 'hsl(330, 81%, 60%)',
  korean: 'hsl(187, 92%, 41%)',
};

const SCENARIO_COLORS = ['hsl(217, 91%, 60%)', 'hsl(142, 71%, 45%)', 'hsl(25, 95%, 53%)', 'hsl(262, 83%, 58%)', 'hsl(330, 81%, 60%)'];
const DIFF_COLORS = ['hsl(142, 71%, 45%)', 'hsl(48, 96%, 53%)', 'hsl(0, 84%, 60%)'];

export function AdminOverviewTab({ stats, loading }: Props) {
  if (loading) return <p className="text-muted-foreground">載入中...</p>;

  const languages = Object.entries(stats.languageBreakdown).sort((a, b) => b[1] - a[1]);
  const langChartData = languages.map(([lang, count]) => ({
    name: lang.charAt(0).toUpperCase() + lang.slice(1),
    value: count,
    color: LANG_COLORS[lang] || 'hsl(210, 10%, 60%)',
  }));

  const scenarioData = Object.entries(stats.scenarioBreakdown || {}).map(([s, count]) => ({
    name: s.charAt(0).toUpperCase() + s.slice(1),
    value: count,
  }));

  const difficultyData = Object.entries(stats.difficultyBreakdown || {}).map(([d, count]) => ({
    name: d.charAt(0).toUpperCase() + d.slice(1),
    value: count,
  }));

  const tooltipStyle = {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    borderRadius: '0.75rem',
    fontSize: '0.75rem',
  };

  return (
    <div className="space-y-6">
      {/* Language Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl p-6 border border-border shadow-soft">
          <h3 className="font-semibold mb-4">🌐 語言使用分布</h3>
          {langChartData.length === 0 ? (
            <p className="text-muted-foreground text-sm">尚無對話數據</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={langChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {langChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Scenario Bar Chart */}
        <div className="bg-card rounded-xl p-6 border border-border shadow-soft">
          <h3 className="font-semibold mb-4">📋 情境分布</h3>
          {scenarioData.length === 0 ? (
            <p className="text-muted-foreground text-sm">尚無數據</p>
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scenarioData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {scenarioData.map((_, i) => (
                      <Cell key={i} fill={SCENARIO_COLORS[i % SCENARIO_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Difficulty Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl p-6 border border-border shadow-soft">
          <h3 className="font-semibold mb-4">📊 難度分布</h3>
          {difficultyData.length === 0 ? (
            <p className="text-muted-foreground text-sm">尚無數據</p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={difficultyData} cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {difficultyData.map((_, i) => (
                      <Cell key={i} fill={DIFF_COLORS[i % DIFF_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Language bar breakdown */}
        <div className="bg-card rounded-xl p-6 border border-border shadow-soft">
          <h3 className="font-semibold mb-4">📈 語言對話數量</h3>
          {languages.length === 0 ? (
            <p className="text-muted-foreground text-sm">尚無數據</p>
          ) : (
            <div className="space-y-3">
              {languages.map(([lang, count]) => {
                const maxLang = languages[0]?.[1] || 1;
                return (
                  <div key={lang}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm capitalize">{lang}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                    <div className="h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(count / maxLang) * 100}%`,
                          backgroundColor: LANG_COLORS[lang] || 'hsl(var(--primary))',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
