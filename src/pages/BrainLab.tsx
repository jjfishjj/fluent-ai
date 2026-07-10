import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Activity, BookOpen, Zap, Library } from 'lucide-react';
import { DeviceConnector } from '@/components/brainwave/DeviceConnector';
import { BrainwaveChart } from '@/components/brainwave/BrainwaveChart';
import { BrainStateCard } from '@/components/brainwave/BrainStateCard';
import { LearningAdvisor } from '@/components/brainwave/LearningAdvisor';
import { NBackGame } from '@/components/brain-training/NBackGame';
import { AttentionGame } from '@/components/brain-training/AttentionGame';
import { SpeedMatchGame } from '@/components/brain-training/SpeedMatchGame';
import { TrainingAnalytics } from '@/components/brain-training/TrainingAnalytics';
import { loadHistory, saveRecord, TrainingGame } from '@/lib/brain-training/training-history';
import { useBrainwave } from '@/contexts/BrainwaveContext';
import { useAuth } from '@/contexts/AuthContext';
import { loadVARKProfile } from '@/lib/vark-service';
import { VARKProfile } from '@/lib/vark-analyzer';
import { LearningStyle } from '@/lib/learning-styles';
import { getStylePercentages, getDominantStyle } from '@/lib/vark-analyzer';
import { getMaterialsByStyle, getRecommendedMaterials, PracticeMaterial } from '@/lib/vark-materials-library';
import { useNavigate } from 'react-router-dom';
import { loadProgress, saveProgress, markCompleted } from '@/lib/material-progress';
import { loadCards, stats as srsStats } from '@/lib/memory-srs';
import { loadGeniusType, geniusInfo, GeniusType } from '@/lib/genius-type';

// 型態 → 最適腦力訓練遊戲（題庫/訓練對應測驗結果）
const GENIUS_GAME: Record<GeniusType, { game: 'nback' | 'attention' | 'speed'; reason: string }> = {
  architect: { game: 'nback', reason: '工作記憶訓練最能強化你的框架保持力' },
  analyst:   { game: 'nback', reason: '2-Back 的規律偵測正是你的分析強項' },
  connector: { game: 'nback', reason: '工作記憶是你連結知識網的底層能力' },
  visionary: { game: 'attention', reason: '視覺追蹤最貼近你的圖像記憶通道' },
  explorer:  { game: 'attention', reason: '即時視覺反應符合你的情境直覺' },
  melodist:  { game: 'speed', reason: '快速配對強化你的語感自動化' },
  performer: { game: 'speed', reason: '限時輸出正是你的即時反應主場' },
  narrator:  { game: 'speed', reason: '快速詞義連結支撐你的敘事流暢度' },
};
import { Check } from 'lucide-react';

export default function BrainLab() {
  const { mode, bands, brainState, history, inferred } = useBrainwave();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [varkProfile, setVarkProfile] = useState<VARKProfile | null>(null);
  const [materialStyle, setMaterialStyle] = useState<LearningStyle>('visual');
  const [materialCategory, setMaterialCategory] = useState<string>('All');
  const geniusType = loadGeniusType();
  const recGame = geniusType ? GENIUS_GAME[geniusType] : null;
  const [selectedGame, setSelectedGame] = useState<'nback' | 'attention' | 'speed'>(recGame?.game ?? 'nback');
  // 題庫對應測驗：處理速度遊戲優先使用你自己的記憶卡（≥8 張時）
  const cardPairs: [string, string][] = loadCards(user?.id ?? 'guest')
    .filter(c => c.english.trim() && c.meaning.trim())
    .map(c => [c.english, c.meaning] as [string, string]);
  const useOwnBank = cardPairs.length >= 8;
  const [trainingHistory, setTrainingHistory] = useState(() => loadHistory(user?.id ?? 'guest'));

  // Reload training history when auth resolves
  useEffect(() => {
    setTrainingHistory(loadHistory(user?.id ?? 'guest'));
  }, [user?.id]);

  // Persist a training session with the brain state + band-power snapshot at play time
  const recordTraining = (game: TrainingGame, accuracy: number, detail: Record<string, number>) => {
    const updated = saveRecord(user?.id ?? 'guest', {
      game,
      accuracy,
      detail,
      brainState,
      bands,
      timestamp: new Date().toISOString(),
    });
    setTrainingHistory([...updated]);
  };

  useEffect(() => {
    if (user) {
      const p = loadVARKProfile(user.id);
      setVarkProfile(p);
      if (p) setMaterialStyle(getDominantStyle(p));
    }
  }, [user]);

  const dominantStyle = varkProfile ? getDominantStyle(varkProfile) : null;
  const userId = user?.id ?? 'guest';
  const [progress, setProgress] = useState(() => loadProgress(user?.id ?? 'guest'));

  // Reload progress when auth resolves (user was null on first render)
  useEffect(() => {
    setProgress(loadProgress(user?.id ?? 'guest'));
  }, [user?.id]);
  const allMaterials = getMaterialsByStyle(materialStyle);
  const categories = ['All', ...new Set(allMaterials.map(m => m.categoryZh))];
  const filteredMaterials = materialCategory === 'All'
    ? allMaterials
    : allMaterials.filter(m => m.categoryZh === materialCategory);
  const recommended = dominantStyle
    ? getRecommendedMaterials(dominantStyle, brainState, progress.completed, 3)
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Brain className="w-6 h-6 text-blue-500" />
              <h1 className="text-2xl font-bold">Brain Lab</h1>
              <span className="text-lg text-muted-foreground">腦力學習實驗室</span>
            </div>
            <p className="text-sm text-muted-foreground">
              結合 EEG 腦波分析與 VARK 學習風格，提供即時個人化學習建議
            </p>
          </div>
          {mode !== 'disconnected' && (
            <Badge className="bg-emerald-500 gap-1.5">
              <Activity className="w-3 h-3" /> 即時監測中
            </Badge>
          )}
        </div>

        {/* Device Connection */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">裝置連線</h2>
          <DeviceConnector />
        </section>

        {/* Memory cards · SRS entry — brain-state aware */}
        {(() => {
          const due = srsStats(loadCards(userId)).due;
          const goodBrain = brainState === 'focus' || brainState === 'alert';
          const nudge = goodBrain && due > 0;
          return (
            <button
              onClick={() => navigate('/memory')}
              className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 hover:shadow-sm transition-shadow text-left ${
                nudge ? 'border-emerald-300 bg-gradient-to-r from-emerald-50 to-teal-50' : 'border-indigo-200 bg-gradient-to-r from-indigo-50 to-violet-50'
              }`}
            >
              <span className="text-xl">{nudge ? '🎯' : '🧠'}</span>
              <div className="flex-1 text-sm">
                {nudge ? (
                  <>
                    <span className="font-semibold text-emerald-800">現在腦態適合記憶——來複習吧</span>
                    <span className="text-emerald-700">　你正處於{brainState === 'focus' ? '深度專注' : '高度警覺'}腦態，有 {due} 張到期</span>
                  </>
                ) : (
                  <>
                    <span className="font-semibold">記憶卡 · SRS 間隔複習</span>
                    <span className="text-muted-foreground">　{due > 0 ? `${due} 張到期 · ` : ''}依型態編碼、主動提取、按專屬節奏複習</span>
                  </>
                )}
              </div>
              <span className={`shrink-0 ${nudge ? 'text-emerald-600' : 'text-indigo-600'}`}>→</span>
            </button>
          );
        })()}

        <Tabs defaultValue="advisor" className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="advisor" className="gap-1.5 text-xs sm:text-sm">
              <Zap className="w-3.5 h-3.5" /> 學習建議
            </TabsTrigger>
            <TabsTrigger value="materials" className="gap-1.5 text-xs sm:text-sm">
              <Library className="w-3.5 h-3.5" /> 素材庫
            </TabsTrigger>
            <TabsTrigger value="training" className="gap-1.5 text-xs sm:text-sm">
              <Brain className="w-3.5 h-3.5" /> 腦力訓練
            </TabsTrigger>
            <TabsTrigger value="realtime" className="gap-1.5 text-xs sm:text-sm">
              <Activity className="w-3.5 h-3.5" /> 腦波圖
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Advisor (now first) */}
          <TabsContent value="advisor" className="space-y-4">
            {/* Inferred state reasoning */}
            {inferred && mode === 'behavioral' && (
              <Card className="bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
                <CardContent className="pt-4 pb-3 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-lg">{inferred.state === 'focus' ? '🎯' : inferred.state === 'relaxed' ? '🌊' : inferred.state === 'creative' ? '✨' : inferred.state === 'alert' ? '⚡' : '😴'}</span>
                    <span className="font-semibold text-emerald-800">腦態推算結果</span>
                    <Badge variant="outline" className="text-xs border-emerald-300 text-emerald-700">
                      信心度 {Math.round(inferred.confidence * 100)}%
                    </Badge>
                  </div>
                  <p className="text-sm text-emerald-700">{inferred.reasoningZh}</p>
                  {inferred.nextBestTimeZh && (
                    <p className="text-xs text-teal-600">💡 {inferred.nextBestTimeZh}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {varkProfile && (
              <Card className="bg-gradient-to-r from-blue-50 to-violet-50 border-0">
                <CardContent className="pt-4 pb-3 flex items-center gap-3 flex-wrap">
                  <div className="text-sm">
                    <span className="text-muted-foreground">你的 VARK 風格：</span>
                    <span className="font-semibold ml-1">{dominantStyle}</span>
                  </div>
                  {Object.entries(getStylePercentages(varkProfile)).map(([style, pct]) => (
                    <Badge key={style} variant="secondary" className="text-xs">{style} {pct}%</Badge>
                  ))}
                </CardContent>
              </Card>
            )}
            <LearningAdvisor varkProfile={varkProfile} />

            {/* VARK × Brain State Matrix */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">VARK × 腦態最佳配對</CardTitle>
                <CardDescription className="text-xs">不同腦態下最適合的學習方式</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { emoji: '🎯', state: '深度專注 (β)', style: '讀寫型', act: '文法練習、閱讀理解、作文', time: '9–11 AM / 2–4 PM' },
                    { emoji: '🌊', state: '放鬆專注 (α)', style: '聽覺型', act: '聽力練習、發音、音樂學習', time: '下午 / 傍晚' },
                    { emoji: '✨', state: '創意流動 (θ)', style: '動覺型', act: '角色扮演、自由對話、故事創作', time: '早晨 / 晚上' },
                    { emoji: '⚡', state: '高度警覺 (γ)', style: '視覺型', act: '圖片描述、單字卡、影片理解', time: '早上 10–12' },
                  ].map(row => (
                    <div key={row.state} className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-slate-50">
                      <span className="text-lg w-8 text-center">{row.emoji}</span>
                      <div className="w-28 shrink-0">
                        <p className="font-medium text-xs">{row.state}</p>
                        <p className="text-xs text-muted-foreground">{row.time}</p>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">{row.style}</Badge>
                      <span className="text-xs text-muted-foreground">{row.act}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: Practice Materials Library */}
          <TabsContent value="materials" className="space-y-4">

            {/* Recommended section */}
            {recommended.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">今日推薦</span>
                  <Badge variant="outline" className="text-xs gap-1">
                    {brainState === 'focus' ? '🎯' : brainState === 'relaxed' ? '🌊' : brainState === 'creative' ? '✨' : brainState === 'alert' ? '⚡' : '🧠'}
                    {brainState === 'focus' ? '深度專注' : brainState === 'relaxed' ? '放鬆專注' : brainState === 'creative' ? '創意流動' : brainState === 'alert' ? '高度警覺' : '一般'} 模式
                  </Badge>
                  <span className="text-xs text-muted-foreground ml-auto">只顯示未完成</span>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {recommended.map(mat => (
                    <Card key={mat.id} className="shrink-0 w-56 border-primary/30 bg-primary/5">
                      <CardContent className="pt-3 pb-3 space-y-2">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs font-semibold line-clamp-1">{mat.titleZh}</p>
                          <Badge variant="secondary" className="text-xs shrink-0">{mat.duration}分</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{mat.descriptionZh}</p>
                        <button
                          className="text-xs text-primary font-medium hover:underline w-full text-left"
                          onClick={() => navigate(`/practice?prompt=${encodeURIComponent(mat.prompt)}&materialId=${mat.id}`)}
                        >
                          → 立即練習
                        </button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Style filter */}
            <div className="flex gap-2 flex-wrap">
              {(['visual', 'auditory', 'reading', 'kinesthetic'] as LearningStyle[]).map(style => (
                <button
                  key={style}
                  onClick={() => { setMaterialStyle(style); setMaterialCategory('All'); }}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    materialStyle === style
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-input hover:bg-accent'
                  }`}
                >
                  {style === 'visual' ? '👁️ 視覺型' : style === 'auditory' ? '👂 聽覺型' : style === 'reading' ? '📖 讀寫型' : '🤸 動覺型'}
                  {dominantStyle === style && <span className="ml-1 text-xs opacity-70">(你的)</span>}
                </button>
              ))}
            </div>
            {/* Category filter */}
            <div className="flex gap-1.5 flex-wrap">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setMaterialCategory(cat)}
                  className={`px-2.5 py-0.5 rounded-full text-xs border transition-colors ${
                    materialCategory === cat ? 'bg-secondary text-secondary-foreground border-secondary' : 'border-input hover:bg-accent'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {filteredMaterials.map(mat => {
                const done = progress.completed.includes(mat.id);
                return (
                  <Card key={mat.id} className={`hover:shadow-md transition-shadow ${done ? 'opacity-70' : ''}`}>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 min-w-0">
                          {done && (
                            <span className="mt-0.5 shrink-0 w-4 h-4 rounded-full bg-emerald-100 border border-emerald-400 flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 text-emerald-600" />
                            </span>
                          )}
                          <div className="min-w-0">
                            <CardTitle className="text-sm">{mat.titleZh}</CardTitle>
                            <p className="text-xs text-muted-foreground">{mat.title}</p>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0 flex-wrap justify-end">
                          <Badge variant="outline" className="text-xs">{mat.difficulty === 'beginner' ? '初級' : mat.difficulty === 'intermediate' ? '中級' : '高級'}</Badge>
                          <Badge variant="secondary" className="text-xs">{mat.duration}分</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <p className="text-xs text-muted-foreground">{mat.descriptionZh}</p>
                      <div className="flex gap-1 flex-wrap">
                        <Badge variant="outline" className="text-xs">{mat.categoryZh}</Badge>
                        {mat.bestBrainStates.map(s => (
                          <Badge key={s} variant="outline" className="text-xs opacity-70">
                            {s === 'focus' ? '🎯' : s === 'relaxed' ? '🌊' : s === 'creative' ? '✨' : s === 'alert' ? '⚡' : '🧠'} {s === 'focus' ? '專注' : s === 'relaxed' ? '放鬆' : s === 'creative' ? '創意' : s === 'alert' ? '警覺' : '一般'}
                          </Badge>
                        ))}
                      </div>
                      <details className="text-xs">
                        <summary className="cursor-pointer text-primary hover:underline">查看 AI 練習提示</summary>
                        <div className="mt-2 bg-slate-50 p-2.5 rounded space-y-2">
                          <p className="text-muted-foreground leading-relaxed">{mat.prompt}</p>
                          <button
                            onClick={() => navigate(`/practice?prompt=${encodeURIComponent(mat.prompt)}&materialId=${mat.id}`)}
                            className="text-primary font-medium hover:underline"
                          >
                            → 前往練習頁使用此提示
                          </button>
                        </div>
                      </details>
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <div className="flex flex-wrap gap-1">
                          {mat.tags.map(tag => (
                            <span key={tag} className="text-xs px-1.5 py-0.5 bg-muted rounded text-muted-foreground">#{tag}</span>
                          ))}
                        </div>
                        {done ? (
                          <button
                            className="text-xs text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              const next = { ...progress, completed: progress.completed.filter(id => id !== mat.id) };
                              saveProgress(userId, next);
                              setProgress(next);
                            }}
                          >
                            取消完成
                          </button>
                        ) : (
                          <button
                            className="text-xs text-emerald-600 font-medium hover:underline"
                            onClick={() => {
                              const p = markCompleted(userId, mat.id);
                              setProgress({ ...p });
                            }}
                          >
                            ✓ 標記完成
                          </button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Tab 3: Brain Training */}
          <TabsContent value="training" className="space-y-4">
            {/* 依測驗型態推薦訓練 */}
            {geniusType && recGame ? (
              <div className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm">
                <span>{geniusInfo(geniusType)?.emoji}</span>
                <span className="text-muted-foreground">
                  依你的型態 <b className="text-indigo-700">{geniusInfo(geniusType)?.nameZh}</b> 推薦：{recGame.reason}
                </span>
              </div>
            ) : (
              <a href="/quizzes/memory-genius-quiz/" className="flex items-center gap-2 rounded-xl border border-indigo-200 bg-gradient-to-r from-indigo-50 to-violet-50 px-4 py-2.5 text-sm hover:shadow-sm transition-shadow">
                🧠 <span><b>測記憶天才型態</b>，訓練與題庫會依你的型態調整</span><span className="text-indigo-600 ml-auto">→</span>
              </a>
            )}

            {/* Game selector */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { key: 'nback' as const,     emoji: '🧠', title: '工作記憶', desc: '2-Back 任務' },
                { key: 'attention' as const, emoji: '⚡', title: '注意力訓練', desc: '視覺追蹤遊戲' },
                { key: 'speed' as const,     emoji: '🎯', title: '處理速度', desc: '快速詞彙配對' },
              ].map(ex => (
                <button
                  key={ex.key}
                  onClick={() => setSelectedGame(ex.key)}
                  className={`relative rounded-xl border-2 p-3 text-center space-y-1 transition-all ${
                    selectedGame === ex.key
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {recGame?.game === ex.key && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-600 text-white whitespace-nowrap">★ 為你推薦</span>
                  )}
                  <div className="text-2xl">{ex.emoji}</div>
                  <p className="text-xs font-semibold">{ex.title}</p>
                  <p className="text-xs text-muted-foreground">{ex.desc}</p>
                </button>
              ))}
            </div>

            {/* Active game */}
            <Card>
              {selectedGame === 'nback' && (
                <>
                  <CardHeader>
                    <CardTitle className="text-base">2-Back 工作記憶訓練</CardTitle>
                    <CardDescription>訓練工作記憶容量，可提升語法保留率和詞彙記憶速度</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <NBackGame onComplete={(r) => recordTraining('nback', r.accuracy, { hits: r.hits, misses: r.misses, falseAlarms: r.falseAlarms })} />
                  </CardContent>
                </>
              )}
              {selectedGame === 'attention' && (
                <>
                  <CardHeader>
                    <CardTitle className="text-base">注意力訓練 · 視覺追蹤</CardTitle>
                    <CardDescription>訓練視覺注意力與反應速度，有助提升閱讀流暢度</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AttentionGame onComplete={(r) => recordTraining('attention', r.accuracy, { hits: r.hits, misses: r.misses, avgReactionMs: r.avgReactionMs })} />
                  </CardContent>
                </>
              )}
              {selectedGame === 'speed' && (
                <>
                  <CardHeader>
                    <CardTitle className="text-base">處理速度 · 快速詞彙配對</CardTitle>
                    <CardDescription>
                      {useOwnBank
                        ? <>📚 題庫來自<b>你的記憶卡</b>（{cardPairs.length} 個詞）——訓練即複習</>
                        : '快速識別英中詞義，強化語言自動化處理能力（加 8 張以上記憶卡後，題庫會換成你自己的詞彙）'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SpeedMatchGame
                      customPairs={useOwnBank ? cardPairs : undefined}
                      onComplete={(r) => recordTraining('speed', r.accuracy, { correct: r.correct, wrong: r.wrong, avgSpeedMs: r.avgSpeedMs })}
                    />
                  </CardContent>
                </>
              )}
            </Card>

            {/* Quantified analytics across all training sessions */}
            <TrainingAnalytics history={trainingHistory} />
          </TabsContent>

          {/* Tab 4: Real-time EEG (moved last) */}
          <TabsContent value="realtime" className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-3">
                <BrainStateCard state={brainState} bands={bands} />
              </div>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">腦波頻帶即時圖</CardTitle>
                  <CardDescription className="text-xs">最近 12 秒的頻帶功率變化</CardDescription>
                </CardHeader>
                <CardContent>
                  <BrainwaveChart history={history} />
                </CardContent>
              </Card>
            </div>

            {/* Band legend */}
            <Card>
              <CardContent className="pt-4 pb-3">
                <div className="grid grid-cols-5 gap-2 text-center">
                  {[
                    { band: 'δ Delta', hz: '0.5–4', color: 'bg-gray-400', desc: '深層休息' },
                    { band: 'θ Theta', hz: '4–8', color: 'bg-violet-500', desc: '創意記憶' },
                    { band: 'α Alpha', hz: '8–13', color: 'bg-emerald-500', desc: '放鬆專注' },
                    { band: 'β Beta', hz: '13–30', color: 'bg-blue-500', desc: '主動思考' },
                    { band: 'γ Gamma', hz: '30–50', color: 'bg-amber-500', desc: '高階認知' },
                  ].map(b => (
                    <div key={b.band} className="space-y-1">
                      <div className={`w-3 h-3 rounded-full mx-auto ${b.color}`} />
                      <p className="text-xs font-medium">{b.band}</p>
                      <p className="text-xs text-muted-foreground">{b.hz} Hz</p>
                      <p className="text-xs text-muted-foreground">{b.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
