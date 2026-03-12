import { AdminStats } from '@/pages/Admin';
import { Badge } from '@/components/ui/badge';

interface Props {
  stats: AdminStats;
  loading: boolean;
}

export function AdminOverviewTab({ stats, loading }: Props) {
  if (loading) return <p className="text-muted-foreground">載入中...</p>;

  const languages = Object.entries(stats.languageBreakdown).sort((a, b) => b[1] - a[1]);
  const maxLang = languages[0]?.[1] || 1;

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl p-6 border border-border shadow-soft">
        <h3 className="font-semibold mb-4">語言使用分布</h3>
        {languages.length === 0 ? (
          <p className="text-muted-foreground text-sm">尚無對話數據</p>
        ) : (
          <div className="space-y-3">
            {languages.map(([lang, count]) => (
              <div key={lang}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm capitalize">{lang}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full gradient-primary rounded-full transition-all"
                    style={{ width: `${(count / maxLang) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
