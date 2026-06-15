import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { PullToRefresh } from '@/components/layout/PullToRefresh';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Zap, TrendingUp, TrendingDown, ArrowLeft } from 'lucide-react';
import { getEnergyBalance, getTransactionHistory } from '@/lib/energy-service';
import type { Tables } from '@/integrations/supabase/types';

type EnergyBalance = Tables<'energy_points'>;
type EnergyTransaction = Tables<'energy_transactions'>;

const TYPE_LABELS: Record<string, { label: string; icon: string }> = {
  daily_login: { label: '每日簽到', icon: '📅' },
  practice_reward: { label: '練習獎勵', icon: '🎯' },
  task_complete: { label: '任務完成', icon: '✅' },
  purchase: { label: '儲值', icon: '💰' },
  shop_redeem: { label: '商城兌換', icon: '🛒' },
  match_cost: { label: '配對費用', icon: '🎲' },
};

const Energy = () => {
  const navigate = useNavigate();
  const { user, profile, isAdmin, signOut } = useAuth();
  const [energy, setEnergy] = useState<EnergyBalance | null>(null);
  const [transactions, setTransactions] = useState<EnergyTransaction[]>([]);

  const loadData = async () => {
    if (!user) return;
    const [e, t] = await Promise.all([
      getEnergyBalance(user.id),
      getTransactionHistory(user.id, 50),
    ]);
    setEnergy(e);
    setTransactions(t);
  };

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

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
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate('/friends')}>
          <ArrowLeft className="w-4 h-4 mr-1" /> 返回交友大廳
        </Button>

        {/* Balance Card */}
        <div className="bg-card rounded-2xl border border-border shadow-soft p-6 mb-6 text-center">
          <Zap className="w-10 h-10 mx-auto text-warning mb-2" />
          <p className="text-sm text-muted-foreground">目前餘額</p>
          <p className="text-4xl font-display font-bold">{energy?.balance ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-1">累計獲得 {energy?.lifetime_earned ?? 0}</p>
        </div>

        {/* Transaction List */}
        <h2 className="text-lg font-display font-bold mb-4">交易紀錄</h2>
        <div className="space-y-2">
          {transactions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">暫無紀錄</p>
          ) : (
            transactions.map((tx) => {
              const typeInfo = TYPE_LABELS[tx.type] || { label: tx.type, icon: '📌' };
              const isPositive = tx.amount > 0;
              return (
                <div key={tx.id} className="flex items-center justify-between bg-card rounded-lg border border-border p-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{typeInfo.icon}</span>
                    <div>
                      <p className="text-sm font-medium">{typeInfo.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleString('zh-TW')}
                      </p>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 font-bold ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                    {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {isPositive ? '+' : ''}{tx.amount}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      </PullToRefresh>
    </div>
  );
};

export default Energy;
