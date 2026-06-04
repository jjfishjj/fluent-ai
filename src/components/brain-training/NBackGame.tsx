import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const LETTERS = 'BCDFGHJKLMNPQRSTVWXYZ'.split('');
const SEQUENCE_LENGTH = 20;
const DISPLAY_MS = 2000;
const N = 2; // 2-back

function generateSequence(): string[] {
  const seq: string[] = [];
  for (let i = 0; i < SEQUENCE_LENGTH; i++) {
    // 30% chance to be a match
    if (i >= N && Math.random() < 0.3) {
      seq.push(seq[i - N]);
    } else {
      let letter: string;
      do { letter = LETTERS[Math.floor(Math.random() * LETTERS.length)]; }
      while (seq[i - N] === letter);
      seq.push(letter);
    }
  }
  return seq;
}

interface Results {
  hits: number;
  misses: number;
  falseAlarms: number;
  correctRejections: number;
  accuracy: number;
}

type Phase = 'idle' | 'playing' | 'result';

interface Props {
  onComplete?: (results: Results) => void;
}

export function NBackGame({ onComplete }: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [sequence] = useState(generateSequence);
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [userResponses, setUserResponses] = useState<boolean[]>([]);
  const [showFlash, setShowFlash] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isMatch = useCallback((idx: number) => idx >= N && sequence[idx] === sequence[idx - N], [sequence]);

  const advance = useCallback(() => {
    setCurrentIdx(prev => {
      const next = prev + 1;
      if (next >= SEQUENCE_LENGTH) {
        setPhase('result');
        return prev;
      }
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 300);
      return next;
    });
  }, []);

  useEffect(() => {
    if (phase !== 'playing') return;
    timerRef.current = setInterval(advance, DISPLAY_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, advance]);

  const handleMatch = useCallback(() => {
    if (phase !== 'playing' || currentIdx < N) return;
    setUserResponses(prev => {
      const next = [...prev];
      next[currentIdx] = true;
      return next;
    });
  }, [phase, currentIdx]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.code === 'Space') handleMatch(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleMatch]);

  const computeResults = (): Results => {
    let hits = 0, misses = 0, falseAlarms = 0, correctRejections = 0;
    for (let i = N; i < SEQUENCE_LENGTH; i++) {
      const match = isMatch(i);
      const responded = !!userResponses[i];
      if (match && responded) hits++;
      else if (match && !responded) misses++;
      else if (!match && responded) falseAlarms++;
      else correctRejections++;
    }
    const total = SEQUENCE_LENGTH - N;
    return { hits, misses, falseAlarms, correctRejections, accuracy: Math.round(((hits + correctRejections) / total) * 100) };
  };

  if (phase === 'result') {
    const r = computeResults();
    onComplete?.(r);
    return (
      <div className="text-center space-y-4 py-4">
        <div className="text-4xl font-bold" style={{ color: r.accuracy >= 70 ? '#10b981' : r.accuracy >= 50 ? '#f59e0b' : '#ef4444' }}>
          {r.accuracy}%
        </div>
        <p className="text-sm text-muted-foreground">Accuracy</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-emerald-50 rounded p-2"><div className="font-bold text-emerald-600">{r.hits}</div><div className="text-xs text-muted-foreground">Correct hits</div></div>
          <div className="bg-red-50 rounded p-2"><div className="font-bold text-red-600">{r.misses}</div><div className="text-xs text-muted-foreground">Misses</div></div>
          <div className="bg-amber-50 rounded p-2"><div className="font-bold text-amber-600">{r.falseAlarms}</div><div className="text-xs text-muted-foreground">False alarms</div></div>
          <div className="bg-blue-50 rounded p-2"><div className="font-bold text-blue-600">{r.correctRejections}</div><div className="text-xs text-muted-foreground">Correct rejects</div></div>
        </div>
        <p className="text-xs text-muted-foreground">
          {r.accuracy >= 70 ? '🧠 Excellent working memory!' : r.accuracy >= 50 ? '👍 Good effort — keep practicing!' : '💪 Keep training to improve!'}
        </p>
      </div>
    );
  }

  if (phase === 'idle') {
    return (
      <div className="text-center space-y-4 py-4">
        <p className="text-sm text-muted-foreground">
          A letter will appear every 2 seconds. Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Space</kbd> (or tap the button) when the current letter matches the letter from <strong>2 steps ago</strong>.
        </p>
        <Badge variant="outline" className="text-xs">2-back task — trains working memory</Badge>
        <Button onClick={() => { setPhase('playing'); advance(); }}>Start Training</Button>
      </div>
    );
  }

  const progress = Math.round((currentIdx / SEQUENCE_LENGTH) * 100);

  return (
    <div className="space-y-4">
      <Progress value={progress} className="h-1.5" />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Step {currentIdx + 1} / {SEQUENCE_LENGTH}</span>
        <span>Match = same as 2 steps ago</span>
      </div>

      <div className={`flex items-center justify-center h-32 rounded-2xl text-6xl font-bold transition-all duration-150 select-none
        ${showFlash ? 'bg-blue-100 scale-105' : 'bg-slate-100'}`}>
        {currentIdx >= 0 ? sequence[currentIdx] : '…'}
      </div>

      {currentIdx >= 2 && (
        <p className="text-center text-xs text-muted-foreground">
          2 steps ago: <strong>{sequence[currentIdx - N]}</strong>
        </p>
      )}

      <Button
        size="lg"
        className="w-full h-14 text-lg"
        variant={userResponses[currentIdx] ? 'default' : 'outline'}
        onClick={handleMatch}
        disabled={currentIdx < N}
      >
        {userResponses[currentIdx] ? '✓ Match!' : 'Match! (Space)'}
      </Button>
    </div>
  );
}
