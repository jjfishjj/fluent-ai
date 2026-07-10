import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const WORD_PAIRS: [string, string][] = [
  ['apple', '蘋果'], ['book', '書本'], ['water', '水'],
  ['friend', '朋友'], ['happy', '快樂'], ['beautiful', '美麗'],
  ['quickly', '快速地'], ['difficult', '困難的'], ['remember', '記住'],
  ['travel', '旅行'], ['weather', '天氣'], ['music', '音樂'],
  ['important', '重要的'], ['understand', '理解'], ['knowledge', '知識'],
  ['experience', '經驗'], ['confident', '自信的'], ['language', '語言'],
  ['practice', '練習'], ['improve', '進步'], ['study', '學習'],
  ['achieve', '達成'], ['challenge', '挑戰'], ['creative', '有創意的'],
  ['curious', '好奇的'], ['patient', '有耐心的'], ['success', '成功'],
  ['opportunity', '機會'], ['imagination', '想像力'], ['solution', '解決方案'],
];

const TOTAL_ROUNDS = 12;

interface Results {
  correct: number;
  wrong: number;
  avgSpeedMs: number;
  accuracy: number;
}

type Phase = 'idle' | 'playing' | 'result';

interface Props {
  onComplete?: (results: Results) => void;
  /** 自訂題庫（例如用戶自己的記憶卡）；少於 8 組時退回內建題庫。 */
  customPairs?: [string, string][];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQuestion(pairs: [string, string][], usedIdx: number[]) {
  let available = pairs.map((_, i) => i).filter(i => !usedIdx.includes(i));
  if (available.length === 0) {
    // small custom banks may run dry before the round limit — recycle
    usedIdx.length = 0;
    available = pairs.map((_, i) => i);
  }
  const idx = available[Math.floor(Math.random() * available.length)];
  const [en, correctZh] = pairs[idx];
  const distractors = shuffle(pairs.filter((_, i) => i !== idx).map(([, zh]) => zh)).slice(0, 3);
  const options = shuffle([correctZh, ...distractors]);
  return { idx, en, options, correctIdx: options.indexOf(correctZh) };
}

export function SpeedMatchGame({ onComplete, customPairs }: Props) {
  const pairs = customPairs && customPairs.length >= 8 ? customPairs : WORD_PAIRS;
  const [phase, setPhase] = useState<Phase>('idle');
  const [round, setRound] = useState(0);
  const [question, setQuestion] = useState<{ en: string; options: string[]; correctIdx: number } | null>(null);
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [results, setResults] = useState<Results | null>(null);

  const questionStartRef = useRef<number>(0);
  const speedsRef = useRef<number[]>([]);
  const correctRef = useRef(0);
  const wrongRef = useRef(0);
  const roundRef = useRef(0);
  const usedIdxRef = useRef<number[]>([]);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const endGame = useCallback(() => {
    const c = correctRef.current;
    const w = wrongRef.current;
    const sp = speedsRef.current;
    const r: Results = {
      correct: c,
      wrong: w,
      avgSpeedMs: sp.length > 0 ? Math.round(sp.reduce((a, b) => a + b, 0) / sp.length) : 0,
      accuracy: c + w > 0 ? Math.round((c / (c + w)) * 100) : 0,
    };
    setResults(r);
    setPhase('result');
    onComplete?.(r);
  }, [onComplete]);

  const showNextQuestion = useCallback(() => {
    roundRef.current += 1;
    if (roundRef.current > TOTAL_ROUNDS) {
      endGame();
      return;
    }
    setRound(roundRef.current);
    setSelectedIdx(null);
    const q = buildQuestion(pairs, usedIdxRef.current);
    usedIdxRef.current.push(q.idx);
    setQuestion({ en: q.en, options: q.options, correctIdx: q.correctIdx });
    questionStartRef.current = Date.now();
  }, [endGame, pairs]);

  const handleAnswer = useCallback((optionIdx: number) => {
    if (phase !== 'playing' || !question || selectedIdx !== null) return;
    const rt = Date.now() - questionStartRef.current;
    speedsRef.current.push(rt);
    setSelectedIdx(optionIdx);

    if (optionIdx === question.correctIdx) {
      correctRef.current += 1;
      setCorrect(c => c + 1);
    } else {
      wrongRef.current += 1;
      setWrong(w => w + 1);
    }
    feedbackTimerRef.current = setTimeout(showNextQuestion, 650);
  }, [phase, question, selectedIdx, showNextQuestion]);

  const startGame = useCallback(() => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    roundRef.current = 0;
    correctRef.current = 0;
    wrongRef.current = 0;
    speedsRef.current = [];
    usedIdxRef.current = [];
    setCorrect(0);
    setWrong(0);
    setResults(null);
    setSelectedIdx(null);
    setQuestion(null);
    setPhase('playing');
    setTimeout(showNextQuestion, 100);
  }, [showNextQuestion]);

  useEffect(() => {
    return () => { if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current); };
  }, []);

  if (phase === 'result' && results) {
    return (
      <div className="text-center space-y-4 py-4">
        <div
          className="text-4xl font-bold"
          style={{ color: results.accuracy >= 80 ? '#10b981' : results.accuracy >= 60 ? '#f59e0b' : '#ef4444' }}
        >
          {results.accuracy}%
        </div>
        <p className="text-sm text-muted-foreground">正確率</p>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="bg-emerald-50 rounded p-2">
            <div className="font-bold text-emerald-600">{results.correct}</div>
            <div className="text-xs text-muted-foreground">答對</div>
          </div>
          <div className="bg-red-50 rounded p-2">
            <div className="font-bold text-red-600">{results.wrong}</div>
            <div className="text-xs text-muted-foreground">答錯</div>
          </div>
          <div className="bg-blue-50 rounded p-2">
            <div className="font-bold text-blue-600">{results.avgSpeedMs}ms</div>
            <div className="text-xs text-muted-foreground">平均速度</div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {results.accuracy >= 80
            ? '🎯 詞彙處理速度優秀！'
            : results.accuracy >= 60
            ? '👍 繼續練習可提升速度！'
            : '💪 多練習詞彙可增強記憶！'}
        </p>
        <Button onClick={startGame} variant="outline">再來一次</Button>
      </div>
    );
  }

  if (phase === 'idle') {
    return (
      <div className="text-center space-y-4 py-4">
        <p className="text-sm text-muted-foreground">
          看到英文單字後，快速選出正確的中文意思！測試你的詞彙處理速度。
        </p>
        <Badge variant="outline" className="text-xs">
          共 {TOTAL_ROUNDS} 題 · 越快越好
        </Badge>
        <Button onClick={startGame}>開始訓練</Button>
      </div>
    );
  }

  const progressPct = Math.round(((round - 1) / TOTAL_ROUNDS) * 100);

  return (
    <div className="space-y-4">
      <Progress value={progressPct} className="h-1.5" />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>第 {round} / {TOTAL_ROUNDS} 題</span>
        <span>✓ {correct} · ✗ {wrong}</span>
      </div>

      {question && (
        <>
          <div className="flex items-center justify-center h-24 rounded-2xl bg-blue-50 border-2 border-blue-200">
            <span className="text-3xl font-bold text-blue-800">{question.en}</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {question.options.map((opt, i) => {
              let cls = 'p-3 rounded-xl border-2 text-sm font-medium transition-all text-center cursor-pointer select-none ';
              if (selectedIdx === null) {
                cls += 'border-slate-200 hover:border-blue-300 hover:bg-blue-50 active:scale-95';
              } else if (i === question.correctIdx) {
                cls += 'border-emerald-400 bg-emerald-50 text-emerald-800';
              } else if (i === selectedIdx) {
                cls += 'border-red-400 bg-red-50 text-red-800';
              } else {
                cls += 'border-slate-100 bg-slate-50 text-muted-foreground opacity-50';
              }
              return (
                <button key={i} className={cls} onClick={() => handleAnswer(i)}>
                  {opt}
                </button>
              );
            })}
          </div>
          <p className="text-center text-xs text-muted-foreground">選出正確的中文翻譯</p>
        </>
      )}
    </div>
  );
}
