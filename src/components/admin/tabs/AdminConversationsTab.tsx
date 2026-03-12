import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ConvRow {
  id: string;
  language: string;
  scenario: string;
  difficulty: string;
  mode: string;
  started_at: string;
  user_id: string | null;
}

interface MsgRow {
  id: string;
  role: string;
  content: string;
  correction: string | null;
  created_at: string;
}

export function AdminConversationsTab() {
  const [conversations, setConversations] = useState<ConvRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<MsgRow[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    const { data } = await supabase
      .from('conversations')
      .select('id, language, scenario, difficulty, mode, started_at, user_id')
      .order('started_at', { ascending: false })
      .limit(100);
    setConversations(data || []);
    setLoading(false);
  };

  const viewMessages = async (convId: string) => {
    setSelectedConv(convId);
    setMsgLoading(true);
    const { data } = await supabase
      .from('messages')
      .select('id, role, content, correction, created_at')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });
    setMessages(data || []);
    setMsgLoading(false);
  };

  if (loading) return <p className="text-muted-foreground">載入中...</p>;

  return (
    <>
      <div className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">語言</th>
                <th className="text-left p-3 font-medium">情境</th>
                <th className="text-left p-3 font-medium">難度</th>
                <th className="text-left p-3 font-medium">模式</th>
                <th className="text-left p-3 font-medium">時間</th>
                <th className="text-left p-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {conversations.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="p-3 capitalize">{c.language}</td>
                  <td className="p-3 capitalize">{c.scenario}</td>
                  <td className="p-3"><Badge variant="outline">{c.difficulty}</Badge></td>
                  <td className="p-3"><Badge variant="secondary">{c.mode}</Badge></td>
                  <td className="p-3 text-muted-foreground">
                    {new Date(c.started_at).toLocaleString('zh-TW')}
                  </td>
                  <td className="p-3">
                    <Button variant="ghost" size="sm" onClick={() => viewMessages(c.id)}>
                      查看對話
                    </Button>
                  </td>
                </tr>
              ))}
              {conversations.length === 0 && (
                <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">尚無對話紀錄</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!selectedConv} onOpenChange={() => setSelectedConv(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>對話內容</DialogTitle>
          </DialogHeader>
          {msgLoading ? (
            <p className="text-muted-foreground">載入中...</p>
          ) : (
            <div className="space-y-3">
              {messages.map((m) => (
                <div key={m.id} className={`p-3 rounded-lg ${m.role === 'user' ? 'bg-primary/10 ml-8' : 'bg-muted mr-8'}`}>
                  <p className="text-xs text-muted-foreground mb-1 font-medium">
                    {m.role === 'user' ? '使用者' : 'AI'}
                  </p>
                  <p className="text-sm">{m.content}</p>
                  {m.correction && (
                    <p className="text-xs text-destructive mt-1">糾正: {m.correction}</p>
                  )}
                </div>
              ))}
              {messages.length === 0 && (
                <p className="text-muted-foreground text-center py-4">此對話無訊息</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
