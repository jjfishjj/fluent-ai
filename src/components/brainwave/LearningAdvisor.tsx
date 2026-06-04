import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, ArrowRight, Clock } from 'lucide-react';
import { useBrainwave } from '@/contexts/BrainwaveContext';
import { VARKProfile } from '@/lib/vark-analyzer';
import { buildRecommendation, getDifficultyFromProfile } from '@/lib/learning-advisor';
import { useNavigate } from 'react-router-dom';

interface Props {
  varkProfile: VARKProfile | null;
}

export function LearningAdvisor({ varkProfile }: Props) {
  const { brainState, mode } = useBrainwave();
  const navigate = useNavigate();

  const rec = useMemo(() => {
    const difficulty = getDifficultyFromProfile(varkProfile);
    return buildRecommendation(varkProfile, brainState, difficulty);
  }, [varkProfile, brainState]);

  if (mode === 'disconnected') {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center text-muted-foreground text-sm">
          <Lightbulb className="w-8 h-8 mx-auto mb-2 opacity-30" />
          Connect your EEG device or start demo mode to receive personalized learning recommendations.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2" style={{ borderColor: rec.urgency === 'high' ? '#10b981' : '#e2e8f0' }}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <span className="text-xl">{rec.emoji}</span>
          <span>個人化學習建議</span>
          {rec.urgency === 'high' && <Badge className="bg-emerald-500 text-xs">最佳時機</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm font-medium">{rec.primaryMessageZh}</p>
        <p className="text-xs text-muted-foreground">{rec.primaryMessage}</p>

        {rec.example && (
          <div className="bg-slate-50 rounded-lg p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold">{rec.example.titleZh}</p>
                <p className="text-xs text-muted-foreground">{rec.example.title}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                <Clock className="w-3 h-3" />
                {rec.example.duration}分鐘
              </div>
            </div>
            <p className="text-xs text-muted-foreground">{rec.example.description}</p>
            <Button
              size="sm"
              className="w-full gap-1.5"
              onClick={() => navigate('/practice')}
            >
              開始練習 <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

        {!rec.example && rec.urgency === 'high' && (
          <Button size="sm" className="w-full gap-1.5" onClick={() => navigate('/practice')}>
            開始練習 <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
