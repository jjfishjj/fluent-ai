import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Brain, Sparkles, Plus, Trash2, Check, X, Layers, ArrowLeft, Dumbbell, BarChart3, Building2 } from 'lucide-react';
import { MemoryPalace } from '@/components/memory/MemoryPalace';
import { toast } from 'sonner';
import { loadGeniusType, geniusInfo, GENIUS_INFO, GeniusType } from '@/lib/genius-type';
import { GENIUS_PLAN, planFor } from '@/lib/genius-plan';
import { GENIUS_TASKS } from '@/lib/genius-tasks';
import {
  loadCards, addCard, deleteCard, dueCards, reviewCard, stats, dueLabel, analytics, reviewTimeInsights,
  brainStateInsights, BRAIN_STATE_LABEL, MemoryItem,
} from '@/lib/memory-srs';
import { useBrainwave } from '@/contexts/BrainwaveContext';
import { ReviewDeck } from '@/components/memory/ReviewDeck';
import { AddFSRSCard } from '@/components/memory/AddFSRSCard';

export default function MemoryLab() {
  const navigate = useNavigate();
  const { user, isAdmin, signOut, profile } = useAuth();
  const uid = user?.id || 'guest';

  const [geniusType, setGeniusType] = useState<GeniusType | null>(null);
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [tab, setTab] = useState('review');
  const [taskType, setTaskType] = useState<GeniusType | null>(null);

  // review session
  const [queue, setQueue] = useState<string[] | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [recallText, setRecallText] = useState('');
  const [fsrsRefreshKey, setFsrsRefreshKey] = useState(0);

  // add form
  const [english, setEnglish] = useState('');
  const [meaning, setMeaning] = useState('');
  const [encodeNote, setEncodeNote] = useState('');
  const [fsrsRefreshKey, setFsrsRefreshKey] = useState(0);

  useEffect(() => {
    setGeniusType(loadGeniusType());
    setItems(loadCards(uid));
  }, [uid]);

  const plan = planFor(geniusType);
  const gi = geniusInfo(geniusType);
  const { mode: brainMode, brainState } = useBrainwave();
  const s = stats(items);
  const a = analytics(items);
  const ti = reviewTimeInsights(items);
  const bi = brainStateInsights(items);
  const goodBrain = brainState === 'focus' || brainState === 'alert';

  const startReview = () => { setQueue(dueCards(items).map(c => c.id)); setRevealed(false); setRecallText(''); };
  const current = queue && queue.length ? items.find(c => c.id === queue[0]) : null;

  const grade = (g: 'again' | 'good') => {
    if (!current) return;
    const updated = reviewCard(uid, current.id, g, plan.schedule, brainState);
    setItems([...updated]);
    setQueue(g === 'good' ? queue!.slice(1) : [...queue!.slice(1), queue![0]]);
    setRevealed(false);
    setRecallText('');
  };

  const handleAdd = () => {
    if (!english.trim() || !meaning.trim()) { toast.error('請填詞彙與意思'); return; }
    setItems([...addCard(uid, { english, meaning, encodeNote })]);
    setEnglish(''); setMeaning(''); setEncodeNote('');
    toast.success('已加入記憶卡，今天就會出現在複習佇列');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <Header
        isLoggedIn={!!user}
        isAdmin={isAdmin}
        userName={profile?.display_name || user?.email?.split('@')[0] || 'User'}
        onLogin={() => navigate('/auth')}
        onLogout={signOut}
      />
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        <Button variant="ghost" className="mb-1" onClick={() => navigate('/brain-lab')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Brain Lab
        </Button>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Brain className="w-6 h-6 text-indigo-500" />
              <h1 className="text-2xl font-bold">記憶卡 · SRS</h1>
              <span className="text-sm text-muted-foreground">間隔複習</span>
            </div>
            <p className="text-sm text-muted-foreground">
              把「訓練方案」變成每天的閉環：依你的型態編碼、主動提取、按專屬節奏複習。
            </p>
          </div>
          {gi ? (
            <Badge className="gap-1.5" style={{ backgroundColor: GENIUS_INFO[gi.type].color }}>
              {gi.emoji} {gi.nameZh}
            </Badge>
          ) : (
            <a href="/quizzes/memory-genius-quiz/" className="text-xs text-indigo-600 hover:underline">
              未測型態 · 去測記憶天才 →
            </a>
          )}
        </div>

        {/* stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { n: s.due, l: '今日待複習', c: 'text-indigo-600' },
            { n: s.total, l: '總卡片', c: 'text-slate-700' },
            { n: s.learning, l: '學習中', c: 'text-amber-600' },
            { n: s.mastered, l: '已鞏固', c: 'text-emerald-600' },
          ].map(x => (
            <Card key={x.l}><CardContent className="p-3 text-center">
              <div className={`text-2xl font-bold ${x.c}`}>{x.n}</div>
              <div className="text-xs text-muted-foreground">{x.l}</div>
            </CardContent></Card>
          ))}
        </div>

        <Tabs value={tab} onValueChange={(v) => { setTab(v); if (v === 'review') setQueue(null); }}>
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="review" className="gap-1 text-[11px] sm:text-xs px-0.5"><Sparkles className="w-3.5 h-3.5 shrink-0" /> 複習</TabsTrigger>
            <TabsTrigger value="cards" className="gap-1 text-[11px] sm:text-xs px-0.5"><Layers className="w-3.5 h-3.5 shrink-0" /> 卡片</TabsTrigger>
            <TabsTrigger value="types" className="gap-1 text-[11px] sm:text-xs px-0.5"><Dumbbell className="w-3.5 h-3.5 shrink-0" /> 訓練</TabsTrigger>
            <TabsTrigger value="stats" className="gap-1 text-[11px] sm:text-xs px-0.5"><BarChart3 className="w-3.5 h-3.5 shrink-0" /> 數據</TabsTrigger>
            <TabsTrigger value="palace" className="gap-1 text-[11px] sm:text-xs px-0.5"><Building2 className="w-3.5 h-3.5 shrink-0" /> 宮殿</TabsTrigger>
            <TabsTrigger value="fsrs" className="gap-1 text-[11px] sm:text-xs px-0.5"><Brain className="w-3.5 h-3.5 shrink-0" /> FSRS</TabsTrigger>
          </TabsList>

          {/* ---------- Review ---------- */}
          <TabsContent value="review" className="space-y-4 pt-2">
            {brainMode !== 'disconnected' && (
              <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                goodBrain ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-slate-50 text-muted-foreground'
              }`}>
                <span>🧠</span>
                <span>腦波：<b>{BRAIN_STATE_LABEL[brainState] || brainState}</b>{goodBrain ? ' · 現在很適合記憶，把握時機複習' : ''}</span>
              </div>
            )}
            {queue === null ? (
              s.due > 0 ? (
                <Card><CardContent className="p-6 text-center space-y-3">
                  <p className="text-sm text-muted-foreground">今天有 <b className="text-indigo-600">{s.due}</b> 張卡片到期</p>
                  <p className="text-xs text-muted-foreground">複習方式：{plan.retrieve.label} · 依你的型態主動提取</p>
                  <Button onClick={startReview} className="bg-indigo-600 hover:bg-indigo-700">開始複習</Button>
                </CardContent></Card>
              ) : (
                <Card><CardContent className="p-8 text-center space-y-2">
                  <div className="text-3xl">{s.total === 0 ? '🗂️' : '🎉'}</div>
                  <p className="font-medium">{s.total === 0 ? '還沒有記憶卡' : '今天複習完成！'}</p>
                  <p className="text-sm text-muted-foreground">
                    {s.total === 0 ? '到「卡片庫」新增你的第一張字卡' : '到期的卡片都複習過了，明天見'}
                  </p>
                  {s.total === 0 && <Button variant="outline" onClick={() => setTab('cards')}>去新增卡片</Button>}
                </CardContent></Card>
              )
            ) : current ? (
              <Card className="overflow-hidden">
                <div className="h-1.5 bg-indigo-500" style={{ width: `${100 - (queue.length / Math.max(1, s.due)) * 100}%` }} />
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>剩 {queue.length} 張</span>
                    <span>{plan.retrieve.label}{gi ? ` · ${gi.nameZh}` : ''}</span>
                  </div>
                  <div className="text-center py-4">
                    <div className="text-3xl font-bold">{current.english}</div>
                  </div>

                  {!revealed ? (
                    <div className="space-y-3">
                      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 text-sm text-indigo-800">
                        🧠 <b>{plan.retrieve.label}：</b>{plan.retrieve.prompt}
                      </div>
                      {plan.retrieve.input === 'write' ? (
                        <Textarea
                          placeholder="先寫出你回想到的意思或造一個句子（寫了才有主動提取效果）"
                          value={recallText}
                          onChange={e => setRecallText(e.target.value)}
                          rows={2}
                        />
                      ) : (
                        <div className="text-center text-sm text-muted-foreground bg-slate-50 rounded-lg py-3">
                          {plan.retrieve.input === 'speak' ? '🎙️ 先「說出來」再顯示答案' : '🖼️ 先在腦中「重建畫面」再顯示答案'}
                        </div>
                      )}
                      <Button className="w-full" variant="outline" onClick={() => setRevealed(true)}>顯示答案</Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {plan.retrieve.input === 'write' && recallText.trim() && (
                        <div className="text-sm bg-amber-50 border border-amber-100 rounded-lg p-2.5">
                          <span className="text-amber-700 font-medium">你的回想：</span>
                          <span className="text-muted-foreground">{recallText}</span>
                        </div>
                      )}
                      <div className="text-center">
                        <div className="text-lg font-medium">{current.meaning}</div>
                        {current.encodeNote && (
                          <div className="text-sm text-muted-foreground mt-2 bg-slate-50 rounded-lg p-2.5">
                            {plan.encode.label}：{current.encodeNote}
                          </div>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => grade('again')}>
                          <X className="w-4 h-4 mr-1" /> 忘記
                        </Button>
                        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => grade('good')}>
                          <Check className="w-4 h-4 mr-1" /> 記得
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card><CardContent className="p-8 text-center space-y-2">
                <div className="text-3xl">🎉</div>
                <p className="font-medium">這輪複習完成！</p>
                <Button variant="outline" onClick={() => setQueue(null)}>回到今日複習</Button>
              </CardContent></Card>
            )}
          </TabsContent>

          {/* ---------- Cards library ---------- */}
          <TabsContent value="cards" className="space-y-4 pt-2">
            <Card>
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-semibold flex items-center gap-1.5"><Plus className="w-4 h-4" /> 新增記憶卡</p>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Input placeholder="詞彙 / word / phrase" value={english} onChange={e => setEnglish(e.target.value)} />
                  <Input placeholder="中文意思" value={meaning} onChange={e => setMeaning(e.target.value)} />
                </div>
                <Textarea
                  placeholder={`${plan.encode.label}（${plan.encode.field}）：${plan.encode.hint}`}
                  value={encodeNote}
                  onChange={e => setEncodeNote(e.target.value)}
                  rows={2}
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">依你的型態用「{plan.encode.label}」記，最有效</p>
                  <Button size="sm" onClick={handleAdd} className="bg-indigo-600 hover:bg-indigo-700">加入</Button>
                </div>
              </CardContent>
            </Card>

            {items.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-6">還沒有卡片</p>
            ) : (
              <div className="space-y-2">
                {items.map(c => (
                  <Card key={c.id}>
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{c.english}</span>
                          <span className="text-sm text-muted-foreground">— {c.meaning}</span>
                        </div>
                        {c.encodeNote && <p className="text-xs text-muted-foreground truncate mt-0.5">{c.encodeNote}</p>}
                      </div>
                      <Badge variant={c.status === 'mastered' ? 'default' : 'secondary'} className="shrink-0 text-xs">
                        {c.status === 'mastered' ? '已鞏固' : dueLabel(c.nextReviewAt)}
                      </Badge>
                      <button className="text-muted-foreground hover:text-red-500 shrink-0" onClick={() => setItems([...deleteCard(uid, c.id)])}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ---------- 8 type cards ---------- */}
          <TabsContent value="types" className="space-y-3 pt-2">
            <p className="text-sm text-muted-foreground">八種記憶天才，每種有專屬的編碼／提取方式、間隔複習節奏，與對應的訓練課題（進練習後選語言）。</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {(Object.keys(GENIUS_PLAN) as GeniusType[]).map(t => {
                const info = GENIUS_INFO[t];
                const p = GENIUS_PLAN[t];
                const mine = t === geniusType;
                return (
                  <Card key={t} className="overflow-hidden" style={mine ? { borderColor: info.color, borderWidth: 2 } : undefined}>
                    <div className="h-1.5" style={{ backgroundColor: info.color }} />
                    <CardContent className="p-4 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{info.emoji}</span>
                        <div>
                          <div className="font-bold leading-tight" style={{ color: info.color }}>{info.nameZh}</div>
                          <div className="text-[11px] font-semibold tracking-wide text-muted-foreground">{info.nameEn}</div>
                        </div>
                        {mine && <Badge className="ml-auto text-xs" style={{ backgroundColor: info.color }}>你的型態</Badge>}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{p.signature}</p>
                      <div className="flex flex-wrap gap-1.5">
                        <Badge variant="outline" className="text-xs">📚 {info.vark}</Badge>
                        <Badge variant="outline" className="text-xs">🧠 {info.brainwave}</Badge>
                      </div>
                      <div className="text-xs space-y-1 pt-1">
                        <div><b>編碼</b>：{p.encode.label} — {p.encode.field}</div>
                        <div><b>提取</b>：{p.retrieve.label}</div>
                        <div className="flex items-center gap-1 flex-wrap">
                          <b>複習</b>：
                          {p.schedule.map((d, i) => (
                            <span key={i} className="text-muted-foreground">
                              第{d}天{i < p.schedule.length - 1 ? ' →' : ''}
                            </span>
                          ))}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="w-full mt-1 text-white"
                        style={{ backgroundColor: info.color }}
                        onClick={() => setTaskType(t)}
                      >
                        <Dumbbell className="w-3.5 h-3.5 mr-1" /> 開始訓練 · {GENIUS_TASKS[t].length} 個課題
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* ---------- Retention dashboard ---------- */}
          <TabsContent value="stats" className="space-y-4 pt-2">
            {a.totalReviews === 0 ? (
              <Card><CardContent className="p-8 text-center space-y-2">
                <div className="text-3xl">📊</div>
                <p className="font-medium">還沒有複習紀錄</p>
                <p className="text-sm text-muted-foreground">複習幾張卡片後，這裡會顯示你的保留率與趨勢</p>
              </CardContent></Card>
            ) : (
              <>
                {/* KPI tiles */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { n: `${a.retention}%`, l: '保留率', hint: '複習答對比例', c: '#4f46e5' },
                    { n: a.streakDays, l: '連續天數', hint: '每天複習不中斷', c: '#0ea5e9' },
                    { n: a.totalReviews, l: '總複習次數', hint: '累積提取次數', c: '#64748b' },
                    { n: a.mastered, l: '已鞏固', hint: '走完間隔節奏', c: '#10b981' },
                  ].map(k => (
                    <Card key={k.l}><CardContent className="p-3">
                      <div className="text-2xl font-bold" style={{ color: k.c }}>{k.n}</div>
                      <div className="text-xs font-medium">{k.l}</div>
                      <div className="text-[11px] text-muted-foreground">{k.hint}</div>
                    </CardContent></Card>
                  ))}
                </div>

                {/* 14-day activity — single-series magnitude bars (one indigo hue) */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold">近 14 天複習量</p>
                      <span className="text-xs text-muted-foreground">今天 {a.reviewedToday} 次</span>
                    </div>
                    {(() => {
                      const max = Math.max(1, ...a.byDay.map(d => d.count));
                      return (
                        <div className="flex items-end gap-1.5 h-28">
                          {a.byDay.map((d, i) => {
                            const h = d.count > 0 ? Math.max(6, Math.round((d.count / max) * 100)) : 2;
                            const isToday = i === a.byDay.length - 1;
                            return (
                              <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full" title={`${d.date}：${d.count} 次`}>
                                <div
                                  className="w-full rounded-t"
                                  style={{
                                    height: `${h}%`,
                                    backgroundColor: d.count === 0 ? '#e2e8f0' : isToday ? '#4f46e5' : '#a5b4fc',
                                  }}
                                />
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1.5">
                      <span>14 天前</span><span>今天</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Distribution */}
                <Card>
                  <CardContent className="p-4 space-y-2">
                    <p className="text-sm font-semibold mb-1">卡片狀態</p>
                    {([
                      { l: '待複習', v: a.due, c: '#4f46e5' },
                      { l: '學習中', v: a.learning, c: '#f59e0b' },
                      { l: '已鞏固', v: a.mastered, c: '#10b981' },
                    ]).map(row => {
                      const pct = a.total ? Math.round((row.v / a.total) * 100) : 0;
                      return (
                        <div key={row.l} className="flex items-center gap-2 text-xs">
                          <span className="w-14 shrink-0 text-muted-foreground">{row.l}</span>
                          <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: row.c }} />
                          </div>
                          <span className="w-8 text-right font-medium">{row.v}</span>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Best review time (from review history) */}
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <p className="text-sm font-semibold">🕐 最佳複習時段</p>
                    <div className="text-sm text-muted-foreground">
                      {ti.best
                        ? <>你在 <b className="text-indigo-600">{ti.best.label}</b> 複習答對率最高（<b>{ti.best.rate}%</b>）——把到期卡片排在這個時段效果最好。</>
                        : <>多複習幾次後，這裡會分析你表現最好的時段。</>}
                    </div>
                    <div className="space-y-2">
                      {ti.parts.map(p => {
                        const isBest = ti.best && p.label === ti.best.label;
                        return (
                          <div key={p.key} className="flex items-center gap-2 text-xs">
                            <span className="w-20 shrink-0 text-muted-foreground">{p.label}</span>
                            <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${p.rate}%`, backgroundColor: isBest ? '#4f46e5' : '#c7d2fe' }} />
                            </div>
                            <span className="w-16 text-right text-muted-foreground">{p.count ? `${p.rate}% · ${p.count}次` : '—'}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Brain state × retention (from live EEG / inferred state at review time) */}
                {bi.total > 0 && (
                  <Card>
                    <CardContent className="p-4 space-y-3">
                      <p className="text-sm font-semibold">🧠 腦態 × 記憶</p>
                      <div className="text-sm text-muted-foreground">
                        {bi.best
                          ? <>你在 <b className="text-emerald-600">{bi.best.label}</b> 腦態下複習，答對率最高（<b>{bi.best.rate}%</b>）——連上 Muse 時，這個腦態就是你的複習黃金時段。</>
                          : <>複習時連上 Muse 或開啟腦態推算，這裡會分析你在不同腦態下的記憶表現。</>}
                      </div>
                      <div className="space-y-2">
                        {bi.byState.map(row => (
                          <div key={row.state} className="flex items-center gap-2 text-xs">
                            <span className="w-16 shrink-0 text-muted-foreground">{row.label}</span>
                            <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${row.rate}%`, backgroundColor: bi.best && row.label === bi.best.label ? '#10b981' : '#a7f3d0' }} />
                            </div>
                            <span className="w-16 text-right text-muted-foreground">{row.rate}% · {row.count}次</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* ---------- Memory palace ---------- */}
          <TabsContent value="palace" className="pt-2">
            <MemoryPalace uid={uid} geniusType={geniusType} />
          </TabsContent>

          {/* ---------- FSRS Cloud ---------- */}
          <TabsContent value="fsrs" className="space-y-4 pt-2">
            {user ? (
              <>
                <AddFSRSCard userId={user.id} onAdded={() => setFsrsRefreshKey(k => k + 1)} />
                <ReviewDeck key={fsrsRefreshKey} userId={user.id} />
              </>
            ) : (
              <Card><CardContent className="p-8 text-center space-y-3">
                <div className="text-3xl">🔒</div>
                <p className="font-medium">需要登入</p>
                <p className="text-sm text-muted-foreground">FSRS 雲端複習需要帳號才能同步記憶資料</p>
                <Button variant="outline" onClick={() => navigate('/auth')}>登入 / 註冊</Button>
              </CardContent></Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Per-type training tasks (課題) */}
        <Dialog open={!!taskType} onOpenChange={(o) => { if (!o) setTaskType(null); }}>
          <DialogContent className="max-w-md">
            {taskType && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <span className="text-xl">{GENIUS_INFO[taskType].emoji}</span>
                    <span style={{ color: GENIUS_INFO[taskType].color }}>{GENIUS_INFO[taskType].nameZh} · 訓練課題</span>
                  </DialogTitle>
                </DialogHeader>
                <p className="text-xs text-muted-foreground -mt-1">{planFor(taskType).signature}</p>
                <div className="space-y-2.5">
                  {GENIUS_TASKS[taskType].map((task, i) => (
                    <div key={i} className="rounded-xl border p-3">
                      <div className="font-semibold text-sm">{task.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{task.desc}</div>
                      <Button
                        size="sm"
                        className="mt-2 w-full text-white"
                        style={{ backgroundColor: GENIUS_INFO[taskType].color }}
                        onClick={() => navigate(`/practice?prompt=${encodeURIComponent(task.prompt)}`)}
                      >
                        用 AI 練習 →
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
