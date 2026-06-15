import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, Brain, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  QUIZ_QUESTIONS,
  calculateResult,
  STYLE_INFO,
  LearningStyle,
} from '@/lib/learning-styles';

const Quiz = () => {
  const navigate = useNavigate();
  const { user, profile, isAdmin, signOut } = useAuth();
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, LearningStyle>>({});
  const [result, setResult] = useState<ReturnType<typeof calculateResult> | null>(null);
  const [saving, setSaving] = useState(false);

  const total = QUIZ_QUESTIONS.length;
  const progress = result ? 100 : ((currentQ) / total) * 100;
  const question = QUIZ_QUESTIONS[currentQ];

  const handleSelect = (style: LearningStyle) => {
    const newAnswers = { ...answers, [question.id]: style };
    setAnswers(newAnswers);

    if (currentQ < total - 1) {
      setTimeout(() => setCurrentQ((p) => p + 1), 300);
    } else {
      const res = calculateResult(newAnswers);
      setResult(res);
      // Save to profile
      if (user) {
        setSaving(true);
        supabase
          .from('profiles')
          .update({ learning_style: res.primary })
          .eq('user_id', user.id)
          .then(({ error }) => {
            setSaving(false);
            if (error) {
              console.error('Save learning style error:', error);
              toast.error('儲存結果時發生錯誤');
            } else {
              toast.success('學習型態已儲存！');
            }
          });
      }
    }
  };

  const info = result ? STYLE_INFO[result.primary] : null;

  return (
    <div className="min-h-screen bg-background">
      <Header
        isLoggedIn={!!user}
        isAdmin={isAdmin}
        userName={profile?.display_name || user?.email?.split('@')[0] || 'User'}
        onLogin={() => navigate('/auth')}
        onLogout={signOut}
      />

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          返回
        </Button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto mb-4">
            <Brain className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold mb-2">學習型態測驗</h1>
          <p className="text-muted-foreground">
            了解你的學習風格，獲得個人化語言學習建議
          </p>
        </div>

        <Progress value={progress} className="mb-8 h-2" />

        {!result ? (
          <div className="animate-fade-in" key={currentQ}>
            <p className="text-sm text-muted-foreground mb-2">
              第 {currentQ + 1} / {total} 題
            </p>
            <h2 className="text-xl font-semibold mb-6">{question.question}</h2>

            <div className="space-y-3">
              {question.options.map((opt) => {
                const selected = answers[question.id] === opt.style;
                return (
                  <button
                    key={opt.label}
                    onClick={() => handleSelect(opt.style)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 hover:scale-[1.01] ${
                      selected
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/30 bg-card'
                    }`}
                  >
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-muted text-sm font-bold mr-3">
                      {opt.label}
                    </span>
                    {opt.text}
                  </button>
                );
              })}
            </div>

            {currentQ > 0 && (
              <Button
                variant="ghost"
                className="mt-4"
                onClick={() => setCurrentQ((p) => p - 1)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                上一題
              </Button>
            )}
          </div>
        ) : (
          <div className="animate-slide-up space-y-6">
            <Card className="p-8 text-center border-2" style={{ borderColor: info?.color }}>
              <div className="text-5xl mb-4">{info?.emoji}</div>
              <h2 className="text-2xl font-bold mb-1">{info?.name}</h2>
              <p className="text-muted-foreground mb-4">{info?.nameEn}</p>
              <p className="text-foreground/80">{info?.description}</p>
            </Card>

            {/* Score breakdown */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">各型態分數</h3>
              <div className="space-y-3">
                {(Object.entries(result.scores) as [LearningStyle, number][])
                  .sort((a, b) => b[1] - a[1])
                  .map(([style, score]) => {
                    const s = STYLE_INFO[style];
                    return (
                      <div key={style} className="flex items-center gap-3">
                        <span className="text-lg">{s.emoji}</span>
                        <span className="w-28 text-sm">{s.name}</span>
                        <div className="flex-1 h-3 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{
                              width: `${(score / total) * 100}%`,
                              backgroundColor: s.color,
                            }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8 text-right">
                          {score}/{total}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </Card>

            {/* Language tips */}
            <Card className="p-6">
              <h3 className="font-semibold mb-4">🌍 各語言學習建議</h3>
              <div className="space-y-4">
                {Object.entries(info?.languageTips || {}).map(([lang, tip]) => {
                  const langNames: Record<string, string> = {
                    english: '🇬🇧 英語',
                    german: '🇩🇪 德語',
                    french: '🇫🇷 法語',
                    spanish: '🇪🇸 西班牙語',
                    japanese: '🇯🇵 日語',
                    korean: '🇰🇷 韓語',
                  };
                  return (
                    <div key={lang}>
                      <p className="font-medium text-sm mb-1">{langNames[lang]}</p>
                      <p className="text-sm text-muted-foreground">{tip}</p>
                    </div>
                  );
                })}
              </div>
            </Card>

            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  setResult(null);
                  setAnswers({});
                  setCurrentQ(0);
                }}
              >
                重新測驗
              </Button>
              <Button onClick={() => navigate('/practice')}>
                開始語言練習
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>

            {!user && (
              <p className="text-center text-sm text-muted-foreground">
                💡 <button onClick={() => navigate('/auth')} className="underline text-primary">登入</button> 後結果會自動儲存，AI 對話也會根據你的學習型態調整教學方式
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Quiz;
