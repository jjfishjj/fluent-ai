import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { PullToRefresh } from '@/components/layout/PullToRefresh';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Sparkles, Heart, X, Zap, Users, RefreshCw } from 'lucide-react';
import { drawMatch, getTodayMatches, acceptMatch, rejectMatch, MatchResult } from '@/lib/matching-service';
import { getEnergyBalance, claimDailyLogin } from '@/lib/energy-service';
import { getFriendships, FriendshipWithProfile } from '@/lib/friendship-service';
import { getTitleForScore } from '@/lib/friendship-service';

const LEARNING_GOAL_LABELS: Record<string, string> = {
  exam: '考試準備', travel: '旅行會話', work: '職場英文',
  culture: '文化交流', academic: '學術研究', daily: '日常對話',
};
const TOPIC_LABELS: Record<string, string> = {
  music: '🎵 音樂', movies: '🎬 電影', tech: '💻 科技',
  sports: '⚽ 運動', food: '🍕 美食', books: '📚 閱讀',
  gaming: '🎮 遊戲', art: '🎨 藝術', travel: '✈️ 旅行',
};

const Friends = () => {
  const navigate = useNavigate();
  const { user, profile, isAdmin, signOut } = useAuth();
  const [energy, setEnergy] = useState<{ balance: number; lifetime_earned: number } | null>(null);
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [friendships, setFriendships] = useState<FriendshipWithProfile[]>([]);
  const [todayMatchCount, setTodayMatchCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'draw' | 'friends'>('draw');

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    try {
      const [e, matches, friends] = await Promise.all([
        getEnergyBalance(user.id),
        getTodayMatches(user.id),
        getFriendships(user.id),
      ]);
      setEnergy(e);
      setTodayMatchCount(matches.length);
      setFriendships(friends);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDailyLogin = async () => {
    if (!user) return;
    try {
      const result = await claimDailyLogin(user.id);
      if (result.success) {
        toast.success(`簽到成功！獲得 ${result.amount} 能量點數 ⚡`);
        loadData();
      } else {
        toast.info('今天已經簽到過了！');
      }
    } catch (err) {
      toast.error('簽到失敗');
    }
  };

  const handleDraw = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await drawMatch(user.id);
      if (result) {
        setMatchResult(result);
        setTodayMatchCount(prev => prev + 1);
        loadData();
      } else {
        toast.info('目前沒有可配對的語伴，請稍後再試！');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '配對失敗');
    }
    setLoading(false);
  };

  const handleAccept = async () => {
    if (!user || !matchResult) return;
    const todayMatches = await getTodayMatches(user.id);
    const latestMatch = todayMatches[todayMatches.length - 1];
    if (latestMatch) {
      await acceptMatch(latestMatch.id, user.id, matchResult.matchedUserId);
      toast.success(`已加入 ${matchResult.matchedUserName} 為語伴！🎉`);
    }
    setMatchResult(null);
    loadData();
  };

  const handleReject = async () => {
    if (!user) return;
    const todayMatches = await getTodayMatches(user.id);
    const latestMatch = todayMatches[todayMatches.length - 1];
    if (latestMatch) {
      await rejectMatch(latestMatch.id);
    }
    setMatchResult(null);
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        isLoggedIn={!!user}
        isAdmin={isAdmin}
        userName={profile?.display_name || user?.email?.split('@')[0] || 'User'}
        onLogin={() => navigate('/auth')}
        onLogout={signOut}
      />
      <PullToRefresh onRefresh={loadData}>
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Energy Bar */}
        <div className="flex items-center justify-between mb-6 bg-card rounded-xl p-4 border border-border shadow-soft">
          <div className="flex items-center gap-3">
            <Zap className="w-6 h-6 text-warning" />
            <div>
              <p className="text-sm text-muted-foreground">能量點數</p>
              <p className="text-2xl font-bold font-display">{energy?.balance ?? 0}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleDailyLogin}>
              每日簽到
            </Button>
            <Button size="sm" variant="outline" onClick={() => navigate('/energy')}>
              查看紀錄
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={tab === 'draw' ? 'default' : 'outline'}
            onClick={() => setTab('draw')}
            className="flex-1"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            每日一抽
          </Button>
          <Button
            variant={tab === 'friends' ? 'default' : 'outline'}
            onClick={() => setTab('friends')}
            className="flex-1"
          >
            <Users className="w-4 h-4 mr-2" />
            我的語伴 ({friendships.length})
          </Button>
        </div>

        {tab === 'draw' && (
          <div className="space-y-6">
            {!matchResult ? (
              <div className="bg-card rounded-2xl border border-border shadow-soft p-8 text-center">
                <div className="w-24 h-24 mx-auto rounded-full gradient-primary flex items-center justify-center mb-6 shadow-glow">
                  <Sparkles className="w-12 h-12 text-primary-foreground" />
                </div>
                <h2 className="text-2xl font-display font-bold mb-2">尋找你的語伴</h2>
                <p className="text-muted-foreground mb-4">
                  透過興趣泡泡精準匹配，找到最適合你的語言學習夥伴
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  今日已抽 {todayMatchCount} 次 {todayMatchCount === 0 && '（首次免費）'}
                  {todayMatchCount >= 1 && '（每次 30 能量點數）'}
                </p>
                <Button
                  variant="gradient"
                  size="lg"
                  onClick={handleDraw}
                  disabled={loading}
                  className="px-8"
                >
                  {loading ? (
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-5 h-5 mr-2" />
                  )}
                  {loading ? '配對中...' : todayMatchCount === 0 ? '免費抽一次' : '再抽一次（30⚡）'}
                </Button>
              </div>
            ) : (
              <div className="bg-card rounded-2xl border border-border shadow-soft overflow-hidden animate-fade-in">
                <div className="gradient-primary p-6 text-center">
                  <div className="w-20 h-20 mx-auto rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3">
                    <span className="text-3xl font-bold text-primary-foreground">
                      {matchResult.matchedUserName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-xl font-display font-bold text-primary-foreground">
                    {matchResult.matchedUserName}
                  </h3>
                </div>
                <div className="p-6 space-y-4">
                  {/* Compatibility Score */}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">契合度</span>
                      <span className="font-bold text-primary">{matchResult.compatibilityScore}%</span>
                    </div>
                    <Progress value={matchResult.compatibilityScore} className="h-3" />
                  </div>
                  {/* Shared interests */}
                  {matchResult.sharedGoals.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">共同學習目標</p>
                      <div className="flex flex-wrap gap-2">
                        {matchResult.sharedGoals.map((g: string) => (
                          <Badge key={g} variant="secondary">{LEARNING_GOAL_LABELS[g] || g}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {matchResult.sharedTopics.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">共同興趣</p>
                      <div className="flex flex-wrap gap-2">
                        {matchResult.sharedTopics.map((t: string) => (
                          <Badge key={t} variant="outline">{TOPIC_LABELS[t] || t}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" className="flex-1" onClick={handleReject}>
                      <X className="w-4 h-4 mr-2" />
                      跳過
                    </Button>
                    <Button variant="gradient" className="flex-1" onClick={handleAccept}>
                      <Heart className="w-4 h-4 mr-2" />
                      加為語伴
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'friends' && (
          <div className="space-y-4">
            {friendships.length === 0 ? (
              <div className="bg-card rounded-xl border border-border p-8 text-center">
                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground">還沒有語伴，快去抽一個吧！</p>
              </div>
            ) : (
              friendships.map((f) => {
                const titleInfo = getTitleForScore(f.intimacyScore);
                const nextThreshold = [21, 51, 101, 200].find(t => t > f.intimacyScore) || 200;
                const prevThreshold = [0, 21, 51, 101, 200].reverse().find(t => t <= f.intimacyScore) || 0;
                const progress = ((f.intimacyScore - prevThreshold) / (nextThreshold - prevThreshold)) * 100;
                return (
                  <div key={f.id} className="bg-card rounded-xl border border-border p-4 shadow-soft">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                        <span className="text-lg font-bold text-primary-foreground">
                          {f.friendName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold truncate">{f.friendName}</p>
                          <Badge variant="outline" className="text-xs">{f.title}</Badge>
                        </div>
                        <div className="mt-1">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>親密度 {f.intimacyScore}</span>
                            <span>下一稱號 {nextThreshold}</span>
                          </div>
                          <Progress value={Math.min(progress, 100)} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
      </PullToRefresh>
    </div>
  );
};

export default Friends;
