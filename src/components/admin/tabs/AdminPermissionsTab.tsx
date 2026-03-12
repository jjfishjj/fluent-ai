import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface RoleRow {
  user_id: string;
  role: string;
  display_name: string | null;
}

export function AdminPermissionsTab() {
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    // Fetch roles with profile info
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('user_id, role');

    const { data: profileData } = await supabase
      .from('profiles')
      .select('user_id, display_name');

    const profileMap = new Map(profileData?.map(p => [p.user_id, p.display_name]) || []);

    setRoles(
      (roleData || []).map(r => ({
        ...r,
        display_name: profileMap.get(r.user_id) || null,
      }))
    );
    setLoading(false);
  };

  const toggleAdmin = async (userId: string, currentRole: string) => {
    if (currentRole === 'admin') {
      // Downgrade to user
      const { error } = await supabase
        .from('user_roles')
        .update({ role: 'user' as any })
        .eq('user_id', userId);
      if (error) { toast.error('更新失敗'); return; }
    } else {
      // Upgrade to admin
      const { error } = await supabase
        .from('user_roles')
        .update({ role: 'admin' as any })
        .eq('user_id', userId);
      if (error) { toast.error('更新失敗'); return; }
    }
    toast.success('權限已更新');
    fetchRoles();
  };

  if (loading) return <p className="text-muted-foreground">載入中...</p>;

  return (
    <div className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">名稱</th>
              <th className="text-left p-3 font-medium">User ID</th>
              <th className="text-left p-3 font-medium">角色</th>
              <th className="text-left p-3 font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((r) => (
              <tr key={r.user_id} className="border-t border-border">
                <td className="p-3">{r.display_name || '未設定'}</td>
                <td className="p-3 text-xs text-muted-foreground font-mono">{r.user_id.slice(0, 8)}...</td>
                <td className="p-3">
                  <Badge variant={r.role === 'admin' ? 'default' : 'secondary'}>
                    {r.role === 'admin' ? '管理員' : '使用者'}
                  </Badge>
                </td>
                <td className="p-3">
                  <Button variant="outline" size="sm" onClick={() => toggleAdmin(r.user_id, r.role)}>
                    {r.role === 'admin' ? '降為使用者' : '升為管理員'}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
