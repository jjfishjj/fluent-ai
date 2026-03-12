import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User, Save, Brain } from 'lucide-react';

const Profile = () => {
  const navigate = useNavigate();
  const { user, profile, isAdmin, signOut } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [preferredLanguage, setPreferredLanguage] = useState(profile?.preferred_language || 'english');
  const [preferredDifficulty, setPreferredDifficulty] = useState(profile?.preferred_difficulty || 'intermediate');
  const [saving, setSaving] = useState(false);

  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName,
        preferred_language: preferredLanguage,
        preferred_difficulty: preferredDifficulty,
      })
      .eq('user_id', user.id);

    if (error) {
      toast.error('儲存失敗');
    } else {
      toast.success('個人資料已更新');
    }
    setSaving(false);
  };

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
        <h1 className="text-3xl font-display font-bold mb-8 flex items-center gap-3">
          <User className="w-8 h-8 text-primary" />
          個人資料
        </h1>

        <div className="bg-card rounded-xl p-6 border border-border shadow-soft space-y-6">
          <div>
            <Label>Email</Label>
            <Input value={user.email || ''} disabled className="mt-1" />
          </div>

          <div>
            <Label>顯示名稱</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="mt-1" />
          </div>

          <div>
            <Label>偏好語言</Label>
            <Select value={preferredLanguage} onValueChange={setPreferredLanguage}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="english">English</SelectItem>
                <SelectItem value="german">German</SelectItem>
                <SelectItem value="french">French</SelectItem>
                <SelectItem value="spanish">Spanish</SelectItem>
                <SelectItem value="japanese">Japanese</SelectItem>
                <SelectItem value="korean">Korean</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>偏好難度</Label>
            <Select value={preferredDifficulty} onValueChange={setPreferredDifficulty}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-3">
            <Label>學習型態</Label>
            {profile?.learning_style ? (
              <Badge variant="secondary">{profile.learning_style.toUpperCase()}</Badge>
            ) : (
              <Button variant="outline" size="sm" onClick={() => navigate('/quiz')}>
                <Brain className="w-4 h-4 mr-1" />
                進行測驗
              </Button>
            )}
          </div>

          <Button onClick={handleSave} disabled={saving} variant="gradient" className="w-full">
            <Save className="w-4 h-4 mr-2" />
            {saving ? '儲存中...' : '儲存變更'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
