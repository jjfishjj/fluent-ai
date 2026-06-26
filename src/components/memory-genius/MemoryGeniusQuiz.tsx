import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Brain } from 'lucide-react';
import { QUESTIONS } from '@/lib/memory-genius/quiz-data';

interface Props {
  onComplete: (answers: number[]) => void;
  onCancel: () => void;
  trainingCount?: number; // how many brain-lab sessions available for calibration
}

type Phase = 'intro' | 'quiz';

export function MemoryGeniusQuiz({ onComplete, onCancel, trainingCount = 0 }: Props) {
  const [phase, setPhase] = useState<Phase>('intro');
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[]>(Array(QUESTIONS.length).fill(-1));
  const [animating, setAnimating] = useState(false);

  const handleSelect = useCallback((optionIdx: number) => {
    if (animating) return;
    const next = [...answers];
    next[current] = optionIdx;
    setAnswers(next);

    if (current >= QUESTIONS.length - 1) {
      setTimeout(() => onComplete(next), 350);
      return;
    }
    setAnimating(true);
    setTimeout(() => {
      setCurrent(c => c + 1);
      setAnimating(false);
    }, 350);
  }, [animating, answers, current, onComplete]);

  const handleBack = useCallback(() => {
    if (current > 0) setCurrent(c => c - 1);
    else setPhase('intro');
  }, [current]);

  if (phase === 'intro') {
    return (
      <div className="space-y-5 py-2">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-indigo-100 flex items-center justify-center mx-auto">
            <Brain className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-xl font-bold">記憶天才測定</h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            28 道行為情境題，約 5–8 分鐘。沒有對錯答案，選最像你自然反應的選項。
          </p>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
          <p className="font-medium text-xs text-muted-foreground uppercase tracking-wide">測定說明</p>
          {[
            '兩軸評分：記憶觸發方式（感官 ↔ 抽象）× 學習節奏（深度 ↔ 即時）',
            '輸出：8 種天才類型中的主類型 + 副類型',
            trainingCount > 0
              ? `✓ 你有 ${trainingCount} 筆腦力訓練紀錄，將自動校準結果準確度`
              : '完成腦力訓練後可提升校準準確度',
          ].map((t, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="mt-0.5 text-indigo-500 shrink-0">•</span>
              <span className="text-muted-foreground">{t}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} className="flex-1">取消</Button>
          <Button onClick={() => setPhase('quiz')} className="flex-1 bg-indigo-600 hover:bg-indigo-700">
            開始測定
          </Button>
        </div>
      </div>
    );
  }

  const q = QUESTIONS[current];
  const progressPct = Math.round((current / QUESTIONS.length) * 100);
  const groupLabel = q.group === 'X' ? '記憶觸發' : q.group === 'Y' ? '學習節奏' : '學習偏好';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleBack}
          className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-muted-foreground" />
        </button>
        <div className="flex-1">
          <Progress value={progressPct} className="h-1.5" />
        </div>
        <span className="text-xs text-muted-foreground shrink-0">{current + 1}/{QUESTIONS.length}</span>
      </div>

      {/* Group badge */}
      <div className="flex items-center gap-2">
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          q.group === 'X' ? 'bg-blue-100 text-blue-700' :
          q.group === 'Y' ? 'bg-purple-100 text-purple-700' :
          'bg-emerald-100 text-emerald-700'
        }`}>
          {groupLabel}
        </span>
        <span className="text-xs text-muted-foreground">Q{q.id}</span>
      </div>

      {/* Question */}
      <div
        className={`transition-opacity duration-200 ${animating ? 'opacity-0' : 'opacity-100'}`}
      >
        <p className="text-base font-medium leading-relaxed mb-4">{q.text}</p>

        <div className="space-y-2">
          {q.options.map((opt, i) => {
            const selected = answers[current] === i;
            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                className={`w-full text-left rounded-xl border-2 p-3.5 transition-all duration-150 flex items-start gap-3 ${
                  selected
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50 active:scale-[0.99]'
                }`}
              >
                <span className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${
                  selected ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-muted-foreground'
                }`}>
                  {opt.label}
                </span>
                <span className="text-sm leading-relaxed">{opt.text}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
