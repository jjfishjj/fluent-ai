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
import { Brain, Sparkles, Plus, Trash2, Check, X, Layers, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { loadGeniusType, geniusInfo, GENIUS_INFO, GeniusType } from '@/lib/genius-type';
import { GENIUS_PLAN, planFor } from '@/lib/genius-plan';
import {
  loadCards, addCard, deleteCard, dueCards, reviewCard, stats, dueLabel, MemoryItem,
} from '@/lib/memory-srs';

export default function MemoryLab() {
  const navigate = useNavigate();
  const { user, isAdmin, signOut, profile } = useAuth();
  const uid = user?.id || 'guest';

  const [geniusType, setGeniusType] = useState<GeniusType | null>(null);
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [tab, setTab] = useState('review');

  // review session
  const [queue, setQueue] = useState<string[] | null>(null);
  const [revealed, setRevealed] = useState(false);

  // add form
  const [english, setEnglish] = useState('');
  const [meaning, setMeaning] = useState('');
  const [encodeNote, setEncodeNote] = useState('');

  useEffect(() => {
    setGeniusType(loadGeniusType());
    setItems(loadCards(uid));
  }, [uid]);

  const plan = planFor(geniusType);
  const gi = geniusInfo(geniusType);
  const s = stats(items);

  const startReview = () => { setQueue(dueCards(items).map(c => c.id)); setRevealed(false); };
  const current = queue && queue.length ? items.find(c => c.id === queue[0]) : null;

  const grade = (g: 'again' | 'good') => {
    if (!current) return;
    const updated = reviewCard(uid, current.id, g, plan.schedule);
    setItems([...updated]);
    setQueue(g === 'good' ? queue!.slice(1) : [...queue!.slice(1), queue![0]]);
    setRevealed(false);
  };

  const handleAdd = () => {
    if (!english.trim() || !meaning.trim()) { toast.error('請填英文與中文意思'); return; }
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
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="review" className="gap-1.5 text-xs sm:text-sm"><Sparkles className="w-3.5 h-3.5" /> 今日複習</TabsTrigger>
            <TabsTrigger value="cards" className="gap-1.5 text-xs sm:text-sm"><Layers className="w-3.5 h-3.5" /> 卡片庫</TabsTrigger>
            <TabsTrigger value="types" className="gap-1.5 text-xs sm:text-sm"><Brain className="w-3.5 h-3.5" /> 八種天才卡</TabsTrigger>
          </TabsList>

          {/* ---------- Review ---------- */}
          <TabsContent value="review" className="space-y-4 pt-2">
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
                    {s.total === 0 ? '到「卡片庫」新增你的第一張英文卡' : '到期的卡片都複習過了，明天見'}
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
                      <Button className="w-full" variant="outline" onClick={() => setRevealed(true)}>顯示答案</Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
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
                  <Input placeholder="English word / phrase" value={english} onChange={e => setEnglish(e.target.value)} />
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
            <p className="text-sm text-muted-foreground">八種記憶天才，每種有專屬的編碼／提取方式與間隔複習節奏。</p>
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
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
