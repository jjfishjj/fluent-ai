import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AlertCircle, CalendarDays, CheckCircle2, MousePointerClick, RefreshCw, TrendingDown, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { buildTutorialFunnel, TutorialFunnelAggregateRow } from '@/lib/tutorial-funnel';

const toDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const initialRange = () => {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 29);
  return { start: toDateInput(start), end: toDateInput(end) };
};

const toExclusiveEnd = (date: string) => {
  const value = new Date(`${date}T00:00:00`);
  value.setDate(value.getDate() + 1);
  return value.toISOString();
};

export function AdminTutorialFunnelTab() {
  const initial = useMemo(initialRange, []);
  const [startDate, setStartDate] = useState(initial.start);
  const [endDate, setEndDate] = useState(initial.end);
  const [rows, setRows] = useState<TutorialFunnelAggregateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const funnel = useMemo(() => buildTutorialFunnel(rows), [rows]);

  const loadFunnel = useCallback(async () => {
    if (!startDate || !endDate || startDate > endDate) {
      setError('開始日期不能晚於結束日期。');
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    const { data, error: queryError } = await supabase.rpc('get_talent_tutorial_funnel', {
      p_start_at: new Date(`${startDate}T00:00:00`).toISOString(),
      p_end_at: toExclusiveEnd(endDate),
    });
    if (queryError) {
      setError('目前無法讀取教學漏斗，請確認分析資料庫已完成更新後再試一次。');
      setRows([]);
    } else {
      setRows((data || []) as TutorialFunnelAggregateRow[]);
    }
    setLoading(false);
  }, [endDate, startDate]);

  useEffect(() => { void loadFunnel(); }, [loadFunnel]);

  const applyPreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));
    setStartDate(toDateInput(start));
    setEndDate(toDateInput(end));
  };

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-5 shadow-soft">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-primary"><CalendarDays className="h-4 w-4" /> 日期範圍</div>
            <h2 className="mt-1 text-xl font-bold">新手教學整體漏斗</h2>
            <p className="mt-1 text-sm text-muted-foreground">僅顯示彙總數字，不提供匿名 ID、英文回答、語音或個別玩家軌跡。</p>
          </div>
          <Button variant="outline" onClick={() => void loadFunnel()} disabled={loading}><RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />重新整理</Button>
        </div>
        <div className="mt-5 flex flex-wrap items-end gap-3">
          <label className="text-sm font-medium">開始日期<input aria-label="漏斗開始日期" type="date" value={startDate} max={endDate} onChange={event => setStartDate(event.target.value)} className="mt-1 block h-10 rounded-md border border-input bg-background px-3" /></label>
          <label className="text-sm font-medium">結束日期<input aria-label="漏斗結束日期" type="date" value={endDate} min={startDate} max={toDateInput(new Date())} onChange={event => setEndDate(event.target.value)} className="mt-1 block h-10 rounded-md border border-input bg-background px-3" /></label>
          <div className="flex flex-wrap gap-2">{[7, 30, 90].map(days => <Button key={days} variant="secondary" size="sm" onClick={() => applyPreset(days)}>近 {days} 天</Button>)}</div>
        </div>
      </section>

      {error && <div role="alert" className="flex items-start gap-3 rounded-xl border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <MetricCard icon={<Users />} label="開始教學工作階段" value={loading ? '—' : String(funnel.starts)} />
        <MetricCard icon={<Users />} label="匿名玩家數" value={loading ? '—' : String(funnel.uniquePlayers)} />
        <MetricCard icon={<CheckCircle2 />} label="完整通關率" value={loading ? '—' : `${funnel.completionRate}%`} />
        <MetricCard icon={<MousePointerClick />} label="誤點總次數" value={loading ? '—' : String(funnel.totalMisclicks)} />
      </div>

      {loading ? <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">正在彙整匿名教學資料…</div> : error ? null : funnel.starts === 0 ? <EmptyFunnel /> : <>
        <section className="rounded-xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center gap-2"><TrendingDown className="h-5 w-5 text-amber-600" /><h3 className="font-semibold">各步完成與流失</h3></div>
          <p className="mt-1 text-sm text-muted-foreground">完成率以開始教學的工作階段為分母；流失率與前一步比較。</p>
          <div className="mt-5 space-y-4">{funnel.steps.map((step, index) => <div key={step.step} className="grid gap-2 md:grid-cols-[9rem_1fr_11rem] md:items-center"><div><span className="mr-2 text-xs font-bold text-muted-foreground">{index + 1}</span><span className="font-medium">{step.label}</span></div><div className="h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${step.completionRate}%` }} /></div><div className="flex justify-between text-xs"><span className="font-semibold">{step.sessions}・{step.completionRate}%</span><span className={step.dropOff > 0 ? 'text-amber-700' : 'text-muted-foreground'}>流失 {step.dropOff}（{step.dropOffRate}%）</span></div></div>)}</div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <RankingCard title="誤點步驟排行" empty="這段期間沒有誤點" rows={funnel.misclickRanking} tone="bg-rose-500" />
          <RankingCard title="跳過位置排行" empty="這段期間沒有跳過事件" rows={funnel.skipRanking} tone="bg-amber-500" />
        </div>
      </>}
    </div>
  );
}

function MetricCard({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return <div className="rounded-xl border border-border bg-card p-4 shadow-soft"><span className="text-primary [&>svg]:h-5 [&>svg]:w-5">{icon}</span><div className="mt-3 text-2xl font-bold">{value}</div><div className="text-xs text-muted-foreground">{label}</div></div>;
}

function RankingCard({ title, empty, rows, tone }: { title: string; empty: string; rows: Array<{ step: string; label: string; count: number; sessions: number }>; tone: string }) {
  const max = rows[0]?.count || 1;
  return <section className="rounded-xl border border-border bg-card p-5 shadow-soft"><h3 className="font-semibold">{title}</h3>{rows.length === 0 ? <p className="mt-4 text-sm text-muted-foreground">{empty}</p> : <div className="mt-4 space-y-4">{rows.map((row, index) => <div key={row.step}><div className="mb-1 flex justify-between text-sm"><span><strong className="mr-2 text-muted-foreground">#{index + 1}</strong>{row.label}</span><span className="font-semibold">{row.count} 次・{row.sessions} 工作階段</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full ${tone}`} style={{ width: `${(row.count / max) * 100}%` }} /></div></div>)}</div>}</section>;
}

function EmptyFunnel() {
  return <div className="rounded-xl border border-dashed border-border bg-card/60 p-10 text-center"><div className="text-4xl">📭</div><h3 className="mt-3 font-semibold">這段日期尚無教學資料</h3><p className="mt-1 text-sm text-muted-foreground">可擴大日期範圍，或先從公開遊戲完成一次互動教學。</p></div>;
}
