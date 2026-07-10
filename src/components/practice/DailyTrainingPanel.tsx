import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Flame, TrendingUp } from 'lucide-react';
import { GENIUS_INFO, GeniusType } from '@/lib/genius-type';
import {
  dailyChallenges, loadDailyDone, markDailyDone, dailyStreak, loadReinforce, DailyChallenge,
} from '@/lib/genius-daily';
import { VARKProfile, getStylePercentages } from '@/lib/vark-analyzer';
import { LearningStyle } from '@/lib/learning-styles';

const VARK_LABEL: Record<LearningStyle, string> = {
  visual: '視覺 V', auditory: '聽覺 A', reading: '讀寫 R', kinesthetic: '動覺 K',
};
const VARK_COLOR: Record<LearningStyle, string> = {
  visual: '#6366f1', auditory: '#f59e0b', reading: '#0ea5e9', kinesthetic: '#10b981',
};

/** 介面二：每日訓練 — 每天輪換的型態挑戰卡；完成後回饋強化 VARK 與天賦量表。 */
export function DailyTrainingPanel({
  uid,
  userType,
  varkProfile,
  onLaunch,
  onComplete,
}: {
  uid: string;
  userType: GeniusType;
  varkProfile: VARKProfile | null;
  onLaunch: (prompt: string, challengeIdx: number) => void;
  onComplete: (challenge: DailyChallenge, idx: number) => void;
}) {
  const [done, setDone] = useState<number[]>([]);
  useEffect(() => { setDone(loadDailyDone(uid)); }, [uid]);

  const info = GENIUS_INFO[userType];
  const cards = dailyChallenges(userType);
  const streak = dailyStreak(uid);
  const reinforce = loadReinforce(uid);
  const pct = varkProfile ? getStylePercentages(varkProfile) : null;

  const complete = (c: DailyChallenge, idx: number) => {
    if (done.includes(idx)) return;
    setDone(markDailyDone(uid, idx));
    onComplete(c, idx);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* header row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{info.emoji}</span>
          <div>
            <div className="font-bold text-sm">{info.nameZh}的今日訓練</div>
            <div className="text-xs text-muted-foreground">每天 3 張挑戰卡，依你的型態輪換</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1 text-xs"><Flame className="w-3 h-3 text-orange-500" /> 連續 {streak} 天</Badge>
          <Badge variant="outline" className="text-xs">{done.length}/3 完成</Badge>
        </div>
      </div>

      {/* daily cards */}
      <div className="grid sm:grid-cols-3 gap-3">
        {cards.map((c, i) => {
          const isDone = done.includes(i);
          return (
            <Card key={i} className={isDone ? 'opacity-70' : ''} style={!isDone ? { borderColor: `${info.color}44` } : undefined}>
              <div className="h-1 rounded-t-lg" style={{ backgroundColor: isDone ? '#10b981' : info.color }} />
              <CardContent className="p-3.5 space-y-2 flex flex-col h-[calc(100%-4px)]">
                <div className="flex items-start justify-between gap-1">
                  <span className="font-semibold text-sm leading-tight">{c.title}</span>
                  {isDone && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed flex-1">{c.desc}</p>
                <Badge variant="secondary" className="text-[10px] w-fit">強化 {c.dimLabel}</Badge>
                {isDone ? (
                  <Button size="sm" variant="outline" disabled className="w-full text-xs">已完成 ✓</Button>
                ) : c.kind === 'ai' ? (
                  <Button size="sm" className="w-full text-xs text-white" style={{ backgroundColor: info.color }} onClick={() => onLaunch(c.prompt!, i)}>
                    用 AI 練習 →
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => complete(c, i)}>
                    我做完了，標記完成
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 量表強化 — the feedback loop, visible */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <TrendingUp className="w-4 h-4 text-indigo-500" /> 量表強化
            <span className="text-xs font-normal text-muted-foreground">完成訓練會回饋強化你的 VARK 與天賦量表</span>
          </div>
          {pct ? (
            <div className="space-y-1.5">
              {(Object.keys(VARK_LABEL) as LearningStyle[]).map(s => (
                <div key={s} className="flex items-center gap-2 text-xs">
                  <span className="w-14 shrink-0 text-muted-foreground">{VARK_LABEL[s]}</span>
                  <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct[s]}%`, backgroundColor: VARK_COLOR[s] }} />
                  </div>
                  <span className="w-9 text-right font-medium">{pct[s]}%</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">完成第一個訓練後，這裡會顯示你的 VARK 量表變化。</p>
          )}
          {reinforce.total > 0 && (
            <div className="flex gap-1.5 flex-wrap pt-1">
              <span className="text-xs text-muted-foreground">累積強化：</span>
              {Object.entries(reinforce.byDim).map(([dim, n]) => (
                <Badge key={dim} variant="outline" className="text-[10px]">{dim} +{n}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
