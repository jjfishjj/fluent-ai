import { supabase } from '@/integrations/supabase/client';
import { spendEnergy } from './energy-service';

export async function getShopItems() {
  const { data, error } = await supabase
    .from('shop_items')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function purchaseItem(userId: string, itemId: string) {
  const { data: item } = await supabase
    .from('shop_items')
    .select('*')
    .eq('id', itemId)
    .single();

  if (!item) throw new Error('商品不存在');
  if (item.stock !== null && item.stock <= 0) throw new Error('商品已售罄');

  await spendEnergy(userId, item.price, 'shop_redeem', `兌換：${item.name}`);

  const expiresAt = item.duration_days
    ? new Date(Date.now() + item.duration_days * 86400000).toISOString()
    : null;

  await supabase.from('user_purchases').insert({
    user_id: userId,
    shop_item_id: itemId,
    expires_at: expiresAt,
  });

  if (item.stock !== null) {
    await supabase
      .from('shop_items')
      .update({ stock: item.stock - 1 })
      .eq('id', itemId);
  }
}

export async function getUserPurchases(userId: string) {
  const { data, error } = await supabase
    .from('user_purchases')
    .select('*, shop_items(*)')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
