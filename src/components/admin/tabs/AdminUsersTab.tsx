import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

interface UserRow {
  user_id: string;
  display_name: string | null;
  preferred_language: string | null;
  learning_style: string | null;
  created_at: string;
}

export function AdminUsersTab() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('user_id, display_name, preferred_language, learning_style, created_at')
      .order('created_at', { ascending: false });
    setUsers(data || []);
    setLoading(false);
  };

  if (loading) return <p className="text-muted-foreground">載入中...</p>;

  return (
    <div className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-3 font-medium">名稱</th>
              <th className="text-left p-3 font-medium">偏好語言</th>
              <th className="text-left p-3 font-medium">學習型態</th>
              <th className="text-left p-3 font-medium">註冊日期</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.user_id} className="border-t border-border">
                <td className="p-3">{u.display_name || '未設定'}</td>
                <td className="p-3 capitalize">{u.preferred_language || '-'}</td>
                <td className="p-3">
                  {u.learning_style ? (
                    <Badge variant="secondary">{u.learning_style.toUpperCase()}</Badge>
                  ) : '-'}
                </td>
                <td className="p-3 text-muted-foreground">
                  {new Date(u.created_at).toLocaleDateString('zh-TW')}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={4} className="p-6 text-center text-muted-foreground">尚無用戶</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
