import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconColor?: string;
}

export function StatCard({ 
  title, 
  value, 
  change, 
  changeType = 'neutral',
  icon: Icon,
  iconColor = 'primary'
}: StatCardProps) {
  const changeColors = {
    positive: 'text-success',
    negative: 'text-destructive',
    neutral: 'text-muted-foreground',
  };

  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
          {change && (
            <p className={`text-sm mt-1 ${changeColors[changeType]}`}>
              {change}
            </p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl bg-${iconColor}/10 flex items-center justify-center`}>
          <Icon className={`w-6 h-6 text-${iconColor}`} />
        </div>
      </div>
    </div>
  );
}
