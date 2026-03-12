import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Settings as SettingsIcon, Shield, Database } from 'lucide-react';

const Settings = () => {
  const navigate = useNavigate();
  const { user, profile, isAdmin, signOut } = useAuth();
  const [dataCollection, setDataCollection] = useState(profile?.enable_data_collection ?? true);
  const [saving, setSaving] = useState(false);

  if (!user) {
    navigate('/auth');
    return null;
  }

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ enable_data_collection: dataCollection })
      .eq('user_id', user.id);

    if (error) {
      toast.error('儲存失敗');
    } else {
      toast.success('設定已更新');
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
          <SettingsIcon className="w-8 h-8 text-primary" />
          設定
        </h1>

        <div className="space-y-6">
          <div className="bg-card rounded-xl p-6 border border-border shadow-soft">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              隱私設定
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">資料收集</p>
                <p className="text-sm text-muted-foreground">允許平台收集匿名對話資料以改善學習體驗</p>
              </div>
              <Switch checked={dataCollection} onCheckedChange={setDataCollection} />
            </div>
          </div>

          <div className="bg-card rounded-xl p-6 border border-border shadow-soft">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Database className="w-5 h-5 text-primary" />
              帳號資訊
            </h3>
            <div className="space-y-2 text-sm">
              <p><span className="text-muted-foreground">Email:</span> {user.email}</p>
              <p><span className="text-muted-foreground">帳號建立:</span> {new Date(user.created_at).toLocaleDateString('zh-TW')}</p>
              <p><span className="text-muted-foreground">角色:</span> {isAdmin ? '管理員' : '使用者'}</p>
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} variant="gradient" className="w-full">
            {saving ? '儲存中...' : '儲存設定'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
