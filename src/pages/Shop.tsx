import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ShoppingBag, Zap, Clock, Package, ArrowLeft } from 'lucide-react';
import { getShopItems, purchaseItem, getUserPurchases } from '@/lib/shop-service';
import { getEnergyBalance } from '@/lib/energy-service';

const TYPE_ICONS: Record<string, string> = {
  avatar_frame: '🖼️',
  chat_bg: '🎨',
  article_style: '✨',
  physical: '📦',
};

const Shop = () => {
  const navigate = useNavigate();
  const { user, profile, isAdmin, signOut } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [energy, setEnergy] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    const [i, p, e] = await Promise.all([
      getShopItems(),
      getUserPurchases(user.id),
      getEnergyBalance(user.id),
    ]);
    setItems(i);
    setPurchases(p);
    setEnergy(e);
  };

  const handlePurchase = async () => {
    if (!user || !selectedItem) return;
    setPurchasing(true);
    try {
      await purchaseItem(user.id, selectedItem.id);
      toast.success(`成功兌換「${selectedItem.name}」！🎉`);
      setSelectedItem(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message || '兌換失敗');
    }
    setPurchasing(false);
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
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => navigate('/friends')}>
          <ArrowLeft className="w-4 h-4 mr-1" /> 返回交友大廳
        </Button>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <ShoppingBag className="w-7 h-7 text-primary" />
            配配幣商城
          </h1>
          <Badge variant="outline" className="text-lg px-3 py-1">
            <Zap className="w-4 h-4 mr-1 text-warning" />
            {energy?.balance ?? 0}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((item: any) => {
            const owned = purchases.some((p: any) => p.shop_item_id === item.id);
            return (
              <div key={item.id} className="bg-card rounded-xl border border-border shadow-soft p-4 flex flex-col">
                <div className="text-3xl mb-3">{TYPE_ICONS[item.type] || '🎁'}</div>
                <h3 className="font-semibold mb-1">{item.name}</h3>
                <p className="text-sm text-muted-foreground flex-1">{item.description}</p>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      <Zap className="w-3 h-3 mr-1" />{item.price}
                    </Badge>
                    {item.duration_days && (
                      <Badge variant="outline">
                        <Clock className="w-3 h-3 mr-1" />{item.duration_days}天
                      </Badge>
                    )}
                    {item.stock !== null && (
                      <Badge variant="outline">
                        <Package className="w-3 h-3 mr-1" />剩 {item.stock}
                      </Badge>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant={owned ? 'outline' : 'default'}
                    disabled={owned || (item.stock !== null && item.stock <= 0)}
                    onClick={() => setSelectedItem(item)}
                  >
                    {owned ? '已擁有' : '兌換'}
                  </Button>
                </div>
              </div>
            );
          })}
          {items.length === 0 && (
            <p className="text-center text-muted-foreground col-span-2 py-12">商城準備中，敬請期待！</p>
          )}
        </div>
      </div>

      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>確認兌換</DialogTitle>
            <DialogDescription>
              確定要用 {selectedItem?.price} 能量點數兌換「{selectedItem?.name}」嗎？
              {selectedItem?.duration_days && ` （有效期 ${selectedItem.duration_days} 天）`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedItem(null)}>取消</Button>
            <Button onClick={handlePurchase} disabled={purchasing}>
              {purchasing ? '兌換中...' : '確認兌換'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Shop;
