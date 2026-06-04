import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Activity, BookOpen, Zap } from 'lucide-react';
import { DeviceConnector } from '@/components/brainwave/DeviceConnector';
import { BrainwaveChart } from '@/components/brainwave/BrainwaveChart';
import { BrainStateCard } from '@/components/brainwave/BrainStateCard';
import { LearningAdvisor } from '@/components/brainwave/LearningAdvisor';
import { NBackGame } from '@/components/brain-training/NBackGame';
import { useBrainwave } from '@/contexts/BrainwaveContext';
import { useAuth } from '@/contexts/AuthContext';
import { loadVARKProfile } from '@/lib/vark-service';
import { VARKProfile } from '@/lib/vark-analyzer';
import { VARK_EXAMPLES, getExamplesForStyle } from '@/lib/vark-examples-db';
import { LearningStyle } from '@/lib/learning-styles';
import { getStylePercentages, getDominantStyle } from '@/lib/vark-analyzer';

export default function BrainLab() {
  const { mode, bands, brainState, history } = useBrainwave();
  const { user } = useAuth();
  const [varkProfile, setVarkProfile] = useState<VARKProfile | null>(null);
  const [exampleStyle, setExampleStyle] = useState<LearningStyle>('visual');

  useEffect(() => {
    if (user) {
      const p = loadVARKProfile(user.id);
      setVarkProfile(p);
      if (p) setExampleStyle(getDominantStyle(p));
    }
  }, [user]);

  const dominantStyle = varkProfile ? getDominantStyle(varkProfile) : null;
  const styleExamples = getExamplesForStyle(exampleStyle);

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

        <Tabs defaultValue="realtime" className="space-y-4">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="realtime" className="gap-1.5 text-xs sm:text-sm">
              <Activity className="w-3.5 h-3.5" /> 即時腦波
            </TabsTrigger>
            <TabsTrigger value="advisor" className="gap-1.5 text-xs sm:text-sm">
              <Zap className="w-3.5 h-3.5" /> 學習建議
            </TabsTrigger>
            <TabsTrigger value="training" className="gap-1.5 text-xs sm:text-sm">
              <Brain className="w-3.5 h-3.5" /> 腦力訓練
            </TabsTrigger>
            <TabsTrigger value="examples" className="gap-1.5 text-xs sm:text-sm">
              <BookOpen className="w-3.5 h-3.5" /> VARK 範例
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Real-time EEG */}
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

          {/* Tab 2: Learning Advisor */}
          <TabsContent value="advisor" className="space-y-4">
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
                <CardTitle className="text-sm">VARK × 腦波最佳配對</CardTitle>
                <CardDescription className="text-xs">不同腦態下最適合的學習方式</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {[
                    { emoji: '🎯', state: '深度專注 (β)', style: '讀寫型', act: '文法練習、閱讀理解、作文' },
                    { emoji: '🌊', state: '放鬆專注 (α)', style: '聽覺型', act: '聽力練習、發音、音樂學習' },
                    { emoji: '✨', state: '創意流動 (θ)', style: '動覺型', act: '角色扮演、自由對話、故事創作' },
                    { emoji: '⚡', state: '高度警覺 (γ)', style: '視覺型', act: '圖片描述、單字卡、影片理解' },
                  ].map(row => (
                    <div key={row.state} className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-slate-50">
                      <span className="text-lg w-8 text-center">{row.emoji}</span>
                      <div className="w-36 shrink-0">
                        <span className="font-medium text-xs">{row.state}</span>
                      </div>
                      <Badge variant="outline" className="text-xs shrink-0">{row.style}</Badge>
                      <span className="text-xs text-muted-foreground">{row.act}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 3: Brain Training */}
          <TabsContent value="training" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">2-Back 工作記憶訓練</CardTitle>
                <CardDescription>
                  訓練工作記憶容量，研究顯示可提升語言學習的語法保留率和詞彙記憶速度
                </CardDescription>
              </CardHeader>
              <CardContent>
                <NBackGame onComplete={(results) => {
                  console.log('N-back results:', results);
                }} />
              </CardContent>
            </Card>

            <div className="grid sm:grid-cols-3 gap-3">
              {[
                { emoji: '🧠', title: '工作記憶', desc: '2-Back 任務', status: '可使用', available: true },
                { emoji: '⚡', title: '注意力訓練', desc: '視覺追蹤遊戲', status: '即將推出', available: false },
                { emoji: '🎯', title: '處理速度', desc: '快速詞彙配對', status: '即將推出', available: false },
              ].map(ex => (
                <Card key={ex.title} className={ex.available ? '' : 'opacity-60'}>
                  <CardContent className="pt-4 text-center space-y-1">
                    <div className="text-3xl">{ex.emoji}</div>
                    <p className="text-sm font-medium">{ex.title}</p>
                    <p className="text-xs text-muted-foreground">{ex.desc}</p>
                    <Badge variant={ex.available ? 'default' : 'secondary'} className="text-xs">{ex.status}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Tab 4: VARK Examples */}
          <TabsContent value="examples" className="space-y-4">
            {/* Style filter */}
            <div className="flex gap-2 flex-wrap">
              {(['visual', 'auditory', 'reading', 'kinesthetic'] as LearningStyle[]).map(style => (
                <button
                  key={style}
                  onClick={() => setExampleStyle(style)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                    exampleStyle === style
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-input hover:bg-accent'
                  }`}
                >
                  {style === 'visual' ? '👁️ 視覺型' : style === 'auditory' ? '👂 聽覺型' : style === 'reading' ? '📖 讀寫型' : '🤸 動覺型'}
                  {dominantStyle === style && <span className="ml-1 text-xs opacity-70">(你的風格)</span>}
                </button>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              {styleExamples.map(ex => (
                <Card key={ex.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-sm">{ex.titleZh}</CardTitle>
                      <div className="flex gap-1 shrink-0">
                        <Badge variant="outline" className="text-xs capitalize">{ex.difficulty}</Badge>
                        <Badge variant="secondary" className="text-xs">{ex.duration}分</Badge>
                      </div>
                    </div>
                    <CardDescription className="text-xs">{ex.title}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="text-xs text-muted-foreground">{ex.description}</p>
                    <div className="flex gap-1 flex-wrap">
                      <Badge variant="outline" className="text-xs">{ex.skill}</Badge>
                      {ex.bestBrainState.map(s => (
                        <Badge key={s} variant="outline" className="text-xs opacity-70">
                          {s === 'focus' ? '🎯' : s === 'relaxed' ? '🌊' : s === 'creative' ? '✨' : s === 'alert' ? '⚡' : '🧠'} {s}
                        </Badge>
                      ))}
                    </div>
                    <details className="text-xs">
                      <summary className="cursor-pointer text-primary hover:underline">查看練習提示</summary>
                      <p className="mt-1 text-muted-foreground bg-slate-50 p-2 rounded">{ex.prompt}</p>
                    </details>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
