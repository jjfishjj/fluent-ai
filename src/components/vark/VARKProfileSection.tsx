import { useNavigate } from 'react-router-dom';
import { Brain, TrendingUp, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VARKProfile, getDominantStyle, getStylePercentages } from '@/lib/vark-analyzer';
import { VARK_DEEP_RECS } from '@/lib/vark-recommendations';
import { LearningStyle, STYLE_INFO } from '@/lib/learning-styles';

const STYLE_ORDER: LearningStyle[] = ['visual', 'auditory', 'reading', 'kinesthetic'];

interface VARKProfileSectionProps {
  profile: VARKProfile;
  preferredLanguage?: string;
}

export function VARKProfileSection({ profile, preferredLanguage }: VARKProfileSectionProps) {
  const navigate = useNavigate();
  const hasData = profile.totalSignals >= 5;
  const percentages = getStylePercentages(profile);

  if (!hasData) {
    return (
      <div className="bg-card rounded-xl p-6 border border-border shadow-soft">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-1">
          <Brain className="w-5 h-5 text-primary" />
          VARK 學習風格分析
        </h2>
        <p className="text-sm text-muted-foreground mb-5">
          根據你和 AI 對話的習慣自動分析，不需要填問卷
        </p>
        <div className="rounded-lg bg-muted/50 border border-border p-5 text-center space-y-3">
          <p className="text-3xl">🔍</p>
          <p className="text-sm font-medium">尚未累積足夠的對話資料</p>
          <p className="text-xs text-muted-foreground">
            開始和 AI 練習語言後，系統會自動觀察你的學習習慣，<br />
            分析你屬於哪種 VARK 學習風格，並給出個人化建議。
          </p>
          <Button
            variant="gradient"
            size="sm"
            className="mt-2"
            onClick={() => navigate('/practice')}
          >
            開始練習
          </Button>
        </div>
      </div>
    );
  }

  const dominant = getDominantStyle(profile);
  const dominantInfo = STYLE_INFO[dominant];
  const recs = VARK_DEEP_RECS[dominant];
  const langTips = dominantInfo.languageTips[preferredLanguage || 'english'];

  return (
    <div className="bg-card rounded-xl p-6 border border-border shadow-soft space-y-5">
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-1">
          <Brain className="w-5 h-5 text-primary" />
          VARK 學習風格分析
        </h2>
        <p className="text-xs text-muted-foreground flex items-center gap-3">
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            {profile.conversationCount} 次對話
          </span>
          <span className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {profile.totalSignals} 個行為指標
          </span>
        </p>
      </div>

      {/* Dominant style highlight */}
      <div
        className="rounded-xl p-4 flex items-center gap-3"
        style={{
          background: `color-mix(in srgb, ${dominantInfo.color} 10%, transparent)`,
          border: `1px solid color-mix(in srgb, ${dominantInfo.color} 25%, transparent)`,
        }}
      >
        <span className="text-3xl">{dominantInfo.emoji}</span>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold" style={{ color: dominantInfo.color }}>
              {dominantInfo.name}
            </p>
            <Badge
              variant="secondary"
              className="text-xs"
              style={{ background: `color-mix(in srgb, ${dominantInfo.color} 15%, transparent)` }}
            >
              主導風格 {percentages[dominant]}%
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {dominantInfo.description}
          </p>
        </div>
      </div>

      {/* Style breakdown bars */}
      <div className="space-y-2.5">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">風格分布</p>
        {STYLE_ORDER.map(style => {
          const info = STYLE_INFO[style];
          const pct = percentages[style];
          return (
            <div key={style}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs flex items-center gap-1.5">
                  <span>{info.emoji}</span>
                  <span className={style === dominant ? 'font-semibold' : 'text-muted-foreground'}>
                    {info.name}
                  </span>
                </span>
                <span className="text-xs text-muted-foreground">{pct}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: info.color }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Personalized tips */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          針對你的學習建議
        </p>
        <ul className="space-y-1.5">
          {recs.tips.map((tip, i) => (
            <li key={i} className="text-xs text-foreground/80 flex items-start gap-2">
              <span className="text-primary mt-0.5">▸</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>

      {/* Fluent AI features to use */}
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
          建議多用這些功能
        </p>
        <div className="flex flex-wrap gap-1.5">
          {recs.fluent_features.map((f, i) => (
            <Badge key={i} variant="outline" className="text-xs">
              {f}
            </Badge>
          ))}
        </div>
      </div>

      {/* Language-specific tip */}
      {langTips && (
        <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground leading-relaxed">
          🌐 <span className="font-medium text-foreground">語言專屬建議：</span> {langTips}
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        className="w-full"
        onClick={() => navigate('/quiz')}
      >
        <Brain className="w-3.5 h-3.5 mr-1.5" />
        做正式 VARK 測驗，取得更精準結果
      </Button>
    </div>
  );
}
