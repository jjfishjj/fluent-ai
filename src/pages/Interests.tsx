import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Save, Target, Heart } from 'lucide-react';

const LANGUAGES = [
  { id: 'english', label: 'English 🇬🇧' },
  { id: 'german', label: 'Deutsch 🇩🇪' },
  { id: 'french', label: 'Français 🇫🇷' },
  { id: 'spanish', label: 'Español 🇪🇸' },
  { id: 'japanese', label: '日本語 🇯🇵' },
  { id: 'korean', label: '한국어 🇰🇷' },
];

const LEARNING_GOALS = [
  { id: 'exam', label: '📝 考試準備' },
  { id: 'travel', label: '✈️ 旅行會話' },
  { id: 'work', label: '💼 職場英文' },
  { id: 'culture', label: '🌍 文化交流' },
  { id: 'academic', label: '🎓 學術研究' },
  { id: 'daily', label: '💬 日常對話' },
];

const INTEREST_TOPICS = [
  { id: 'music', label: '🎵 音樂' },
  { id: 'movies', label: '🎬 電影' },
  { id: 'tech', label: '💻 科技' },
  { id: 'sports', label: '⚽ 運動' },
  { id: 'food', label: '🍕 美食' },
  { id: 'books', label: '📚 閱讀' },
  { id: 'gaming', label: '🎮 遊戲' },
  { id: 'art', label: '🎨 藝術' },
  { id: 'travel', label: '✈️ 旅行' },
];

const Interests = () => {
  const navigate = useNavigate();
  const { user, profile, isAdmin, signOut } = useAuth();
  const [targetLanguage, setTargetLanguage] = useState('english');
  const [goals, setGoals] = useState<string[]>([]);
  const [topics, setTopics] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('user_interests')
      .select('*')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setTargetLanguage(data.target_language);
          setGoals(data.learning_goals || []);
          setTopics(data.interest_topics || []);
        }
      });
  }, [user]);

  const toggleItem = (list: string[], setList: (v: string[]) => void, id: string) => {
    setList(list.includes(id) ? list.filter(i => i !== id) : [...list, id]);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('user_interests')
      .update({
        target_language: targetLanguage,
        learning_goals: goals,
        interest_topics: topics,
      })
      .eq('user_id', user.id);

    if (error) {
      toast.error('儲存失敗');
    } else {
      toast.success('興趣設定已更新！');
    }
    setSaving(false);
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
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate('/friends')}>
          <ArrowLeft className="w-4 h-4 mr-1" /> 返回交友大廳
        </Button>

        <h1 className="text-2xl font-display font-bold mb-6 flex items-center gap-2">
          <Heart className="w-7 h-7 text-primary" />
          興趣泡泡設定
        </h1>

        <div className="bg-card rounded-xl border border-border shadow-soft p-6 space-y-6">
          {/* Target Language */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              第一層：目標語言
            </h3>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map(lang => (
                <Badge
                  key={lang.id}
                  variant={targetLanguage === lang.id ? 'default' : 'outline'}
                  className="cursor-pointer text-sm px-3 py-1.5 transition-all hover:scale-105"
                  onClick={() => setTargetLanguage(lang.id)}
                >
                  {lang.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Learning Goals */}
          <div>
            <h3 className="font-semibold mb-3">第二層：學習目標（可多選）</h3>
            <div className="flex flex-wrap gap-2">
              {LEARNING_GOALS.map(goal => (
                <Badge
                  key={goal.id}
                  variant={goals.includes(goal.id) ? 'default' : 'outline'}
                  className="cursor-pointer text-sm px-3 py-1.5 transition-all hover:scale-105"
                  onClick={() => toggleItem(goals, setGoals, goal.id)}
                >
                  {goal.label}
                </Badge>
              ))}
            </div>
          </div>

          {/* Interest Topics */}
          <div>
            <h3 className="font-semibold mb-3">第二層：興趣話題（可多選）</h3>
            <div className="flex flex-wrap gap-2">
              {INTEREST_TOPICS.map(topic => (
                <Badge
                  key={topic.id}
                  variant={topics.includes(topic.id) ? 'default' : 'outline'}
                  className="cursor-pointer text-sm px-3 py-1.5 transition-all hover:scale-105"
                  onClick={() => toggleItem(topics, setTopics, topic.id)}
                >
                  {topic.label}
                </Badge>
              ))}
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} variant="gradient" className="w-full">
            <Save className="w-4 h-4 mr-2" />
            {saving ? '儲存中...' : '儲存設定'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Interests;
