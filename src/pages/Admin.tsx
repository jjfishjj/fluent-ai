import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminOverviewTab } from '@/components/admin/tabs/AdminOverviewTab';
import { AdminUsersTab } from '@/components/admin/tabs/AdminUsersTab';
import { AdminConversationsTab } from '@/components/admin/tabs/AdminConversationsTab';
import { AdminPermissionsTab } from '@/components/admin/tabs/AdminPermissionsTab';
import { AdminMockDataTab } from '@/components/admin/tabs/AdminMockDataTab';
import { Shield } from 'lucide-react';

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalConversations: number;
  avgConversationsPerUser: number;
  languageBreakdown: Record<string, number>;
  scenarioBreakdown: Record<string, number>;
  difficultyBreakdown: Record<string, number>;
}

const Admin = () => {
  const navigate = useNavigate();
  const { user, profile, isAdmin, isLoading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalConversations: 0,
    avgConversationsPerUser: 0,
    languageBreakdown: {},
    scenarioBreakdown: {},
    difficultyBreakdown: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !isAdmin) {
      navigate('/');
    }
  }, [isAdmin, isLoading, navigate]);

  useEffect(() => {
    if (isAdmin) fetchStats();
  }, [isAdmin]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      // Fetch total users
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch conversations
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id, language, user_id, started_at');

      const totalConvs = conversations?.length || 0;
      const uniqueUsers = new Set(conversations?.map(c => c.user_id).filter(Boolean));
      
      // Language breakdown
      const langBreakdown: Record<string, number> = {};
      conversations?.forEach(c => {
        langBreakdown[c.language] = (langBreakdown[c.language] || 0) + 1;
      });

      setStats({
        totalUsers: userCount || 0,
        activeUsers: uniqueUsers.size,
        totalConversations: totalConvs,
        avgConversationsPerUser: uniqueUsers.size > 0 ? Math.round(totalConvs / uniqueUsers.size) : 0,
        languageBreakdown: langBreakdown,
      });
    } catch (err) {
      console.error('Failed to fetch admin stats:', err);
    }
    setLoading(false);
  };

  if (isLoading || !isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header
        isLoggedIn={!!user}
        isAdmin={isAdmin}
        userName={profile?.display_name || 'Admin'}
        onLogin={() => navigate('/auth')}
        onLogout={signOut}
      />

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-display font-bold mb-2 flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" />
          管理後台
        </h1>
        <p className="text-muted-foreground mb-6">管理用戶、對話數據與平台設定</p>

        {/* Top Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatBox label="總註冊人數" value={stats.totalUsers} icon="👥" color="text-emerald-600" />
          <StatBox label="活躍用戶" value={stats.activeUsers} icon="📈" color="text-amber-600" />
          <StatBox label="總紀錄數" value={stats.totalConversations} icon="📄" color="text-blue-600" />
          <StatBox label="人均紀錄數" value={stats.avgConversationsPerUser} icon="📊" color="text-rose-600" />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6 flex-wrap">
            <TabsTrigger value="overview">總覽</TabsTrigger>
            <TabsTrigger value="users">用戶</TabsTrigger>
            <TabsTrigger value="conversations">對話紀錄</TabsTrigger>
            <TabsTrigger value="permissions">權限</TabsTrigger>
            <TabsTrigger value="mockdata">模擬數據</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <AdminOverviewTab stats={stats} loading={loading} />
          </TabsContent>
          <TabsContent value="users">
            <AdminUsersTab />
          </TabsContent>
          <TabsContent value="conversations">
            <AdminConversationsTab />
          </TabsContent>
          <TabsContent value="permissions">
            <AdminPermissionsTab />
          </TabsContent>
          <TabsContent value="mockdata">
            <AdminMockDataTab onDataGenerated={fetchStats} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

function StatBox({ label, value, icon, color }: { label: string; value: number; icon: string; color: string }) {
  return (
    <div className="bg-card rounded-xl p-5 border border-border shadow-soft text-center">
      <p className={`text-3xl mb-1 ${color}`}>{icon}</p>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export default Admin;
