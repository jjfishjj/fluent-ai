import { supabase } from '@/integrations/supabase/client';

export async function getEnergyBalance(userId: string) {
  const { data, error } = await supabase
    .from('energy_points')
    .select('balance, lifetime_earned, last_daily_login')
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  return data;
}

export async function claimDailyLogin(userId: string): Promise<{ success: boolean; amount: number }> {
  const energy = await getEnergyBalance(userId);
  const today = new Date().toISOString().split('T')[0];
  
  if (energy.last_daily_login === today) {
    return { success: false, amount: 0 };
  }

  const reward = 10;

  const { error: txError } = await supabase
    .from('energy_transactions')
    .insert({ user_id: userId, amount: reward, type: 'daily_login', description: '每日簽到獎勵' });
  if (txError) throw txError;

  const { error: updateError } = await supabase
    .from('energy_points')
    .update({
      balance: energy.balance + reward,
      lifetime_earned: energy.lifetime_earned + reward,
      last_daily_login: today,
    })
    .eq('user_id', userId);
  if (updateError) throw updateError;

  return { success: true, amount: reward };
}

export async function spendEnergy(userId: string, amount: number, type: string, description: string) {
  const energy = await getEnergyBalance(userId);
  if (energy.balance < amount) {
    throw new Error('能量點數不足');
  }

  const { error: txError } = await supabase
    .from('energy_transactions')
    .insert({ user_id: userId, amount: -amount, type, description });
  if (txError) throw txError;

  const { error: updateError } = await supabase
    .from('energy_points')
    .update({ balance: energy.balance - amount })
    .eq('user_id', userId);
  if (updateError) throw updateError;
}

export async function earnEnergy(userId: string, amount: number, type: string, description: string) {
  const energy = await getEnergyBalance(userId);

  const { error: txError } = await supabase
    .from('energy_transactions')
    .insert({ user_id: userId, amount, type, description });
  if (txError) throw txError;

  const { error: updateError } = await supabase
    .from('energy_points')
    .update({
      balance: energy.balance + amount,
      lifetime_earned: energy.lifetime_earned + amount,
    })
    .eq('user_id', userId);
  if (updateError) throw updateError;
}

export async function getTransactionHistory(userId: string, limit = 20) {
  const { data, error } = await supabase
    .from('energy_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}
