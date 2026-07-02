import { useRef, useState, ReactNode } from 'react';
import { Loader2, ArrowDown } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  onRefresh: () => Promise<unknown>;
  children: ReactNode;
}

const THRESHOLD = 70;

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop <= 0 && !isRefreshing) {
      startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY.current === null || isRefreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) setPullDistance(Math.min(delta * 0.5, 100));
  };

  const handleTouchEnd = async () => {
    if (startY.current === null || isRefreshing) return;
    if (pullDistance >= THRESHOLD) {
      setIsRefreshing(true);
      if (Capacitor.isNativePlatform()) Haptics.impact({ style: ImpactStyle.Medium });
      try { await onRefresh(); } finally { setIsRefreshing(false); }
    }
    setPullDistance(0);
    startY.current = null;
  };

  return (
    <div ref={containerRef} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} className="relative">
      <div className="absolute left-0 right-0 flex items-center justify-center transition-transform"
        style={{ top: -40, height: 40, transform: `translateY(${pullDistance}px)`, opacity: pullDistance > 0 || isRefreshing ? 1 : 0 }}>
        {isRefreshing
          ? <Loader2 className="w-5 h-5 text-primary animate-spin" />
          : <ArrowDown className={cn('w-5 h-5 text-muted-foreground transition-transform', pullDistance >= THRESHOLD && 'text-primary rotate-180')} />}
      </div>
      <div style={{ transform: `translateY(${isRefreshing ? THRESHOLD : pullDistance}px)`, transition: pullDistance === 0 || isRefreshing ? 'transform 0.2s ease' : 'none' }}>
        {children}
      </div>
    </div>
  );
}
