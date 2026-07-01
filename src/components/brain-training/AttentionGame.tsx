import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const GRID_SIZE = 4;
const TOTAL_ROUNDS = 15;
const TARGET_DURATION_MS = 1400;

interface Results {
  hits: number;
  misses: number;
  avgReactionMs: number;
  accuracy: number;
}

type Phase = 'idle' | 'playing' | 'result';

interface Props {
  onComplete?: (results: Results) => void;
}

export function AttentionGame({ onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [round, setRound] = useState(0);
  const [activeCell, setActiveCell] = useState<number | null>(null);
  const [hits, setHits] = useState(0);
  const [misses, setMisses] = useState(0);
  const [results, setResults] = useState<Results | null>(null);

  const targetStartRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const roundRef = useRef(0);
  const hitsRef = useRef(0);
  const missesRef = useRef(0);
  const reactionTimesRef = useRef<number[]>([]);

  const endGame = useCallback(() => {
    const h = hitsRef.current;
    const m = missesRef.current;
    const rt = reactionTimesRef.current;
    const total = h + m;
    const r: Results = {
      hits: h,
      misses: m,
      avgReactionMs: rt.length > 0 ? Math.round(rt.reduce((a, b) => a + b, 0) / rt.length) : 0,
      accuracy: total > 0 ? Math.round((h / total) * 100) : 0,
    };
    setResults(r);
    setActiveCell(null);
    setPhase('result');
    onComplete?.(r);
  }, [onComplete]);

  const showNextTarget = useCallback(() => {
    roundRef.current += 1;
    if (roundRef.current > TOTAL_ROUNDS) {
      endGame();
      return;
    }
    setRound(roundRef.current);
    const cell = Math.floor(Math.random() * GRID_SIZE * GRID_SIZE);
    setActiveCell(cell);
    targetStartRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      missesRef.current += 1;
      setMisses(m => m + 1);
      setActiveCell(null);
      timerRef.current = setTimeout(showNextTarget, 300);
    }, TARGET_DURATION_MS);
  }, [endGame]);

  const handleCellClick = useCallback((cellIdx: number) => {
    if (phase !== 'playing' || activeCell !== cellIdx) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    const rt = Date.now() - targetStartRef.current;
    reactionTimesRef.current.push(rt);
    hitsRef.current += 1;
    setHits(h => h + 1);
    setActiveCell(null);
    timerRef.current = setTimeout(showNextTarget, 350);
  }, [phase, activeCell, showNextTarget]);

  const startGame = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    roundRef.current = 0;
    hitsRef.current = 0;
    missesRef.current = 0;
    reactionTimesRef.current = [];
    setHits(0);
    setMisses(0);
    setResults(null);
    setActiveCell(null);
    setPhase('playing');
    timerRef.current = setTimeout(showNextTarget, 600);
  }, [showNextTarget]);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
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
        <p className="text-sm text-muted-foreground">命中率</p>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="bg-emerald-50 rounded p-2">
            <div className="font-bold text-emerald-600">{results.hits}</div>
            <div className="text-xs text-muted-foreground">命中</div>
          </div>
          <div className="bg-red-50 rounded p-2">
            <div className="font-bold text-red-600">{results.misses}</div>
            <div className="text-xs text-muted-foreground">錯過</div>
          </div>
          <div className="bg-blue-50 rounded p-2">
            <div className="font-bold text-blue-600">{results.avgReactionMs}ms</div>
            <div className="text-xs text-muted-foreground">平均反應</div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {results.accuracy >= 80
            ? '⚡ 注意力集中！反應敏銳！'
            : results.accuracy >= 60
            ? '👍 不錯，繼續練習！'
            : '💪 多訓練可提升注意力！'}
        </p>
        <Button onClick={startGame} variant="outline">再來一次</Button>
      </div>
    );
  }

  if (phase === 'idle') {
    return (
      <div className="text-center space-y-4 py-4">
        <p className="text-sm text-muted-foreground">
          當方格亮起時，盡快點擊它！測試你的視覺注意力與反應速度。
        </p>
        <Badge variant="outline" className="text-xs">
          共 {TOTAL_ROUNDS} 輪 · 每目標最多 {TARGET_DURATION_MS / 1000} 秒
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
        <span>第 {round} / {TOTAL_ROUNDS} 輪</span>
        <span>命中 {hits} · 錯過 {misses}</span>
      </div>

      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
      >
        {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => (
          <button
            key={i}
            onClick={() => handleCellClick(i)}
            className={`aspect-square rounded-xl transition-all duration-100 border-2 ${
              activeCell === i
                ? 'bg-amber-400 border-amber-500 shadow-lg shadow-amber-200 scale-95'
                : 'bg-slate-100 border-slate-200 hover:bg-slate-200 active:scale-95'
            }`}
          />
        ))}
      </div>
      <p className="text-center text-xs text-muted-foreground">點擊亮起的方格</p>
    </div>
  );
}
