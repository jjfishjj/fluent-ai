import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

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

const LANG_COLORS: Record<string, string> = {
  english: 'hsl(217, 91%, 60%)',
  german: 'hsl(48, 96%, 53%)',
  french: 'hsl(239, 84%, 67%)',
  spanish: 'hsl(25, 95%, 53%)',
  japanese: 'hsl(330, 81%, 60%)',
  korean: 'hsl(187, 92%, 41%)',
};

const SCENARIO_COLORS = ['hsl(217, 91%, 60%)', 'hsl(142, 71%, 45%)', 'hsl(25, 95%, 53%)', 'hsl(262, 83%, 58%)', 'hsl(330, 81%, 60%)'];
const DIFF_COLORS = ['hsl(142, 71%, 45%)', 'hsl(48, 96%, 53%)', 'hsl(0, 84%, 60%)'];

const tooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '0.75rem',
  fontSize: '0.75rem',
};

interface ProfileInfo {
  user_id: string;
  display_name: string | null;
  email: string | null;
  learning_style: string | null;
}

const STYLE_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  visual: { label: '視覺型', emoji: '👁️', color: 'hsl(220, 90%, 55%)' },
  auditory: { label: '聽覺型', emoji: '👂', color: 'hsl(142, 70%, 45%)' },
  reading: { label: '讀寫型', emoji: '📖', color: 'hsl(38, 92%, 50%)' },
  kinesthetic: { label: '實作型', emoji: '🤸', color: 'hsl(340, 80%, 55%)' },
};

export function AdminConversationsTab() {
  const [conversations, setConversations] = useState<ConvRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<MsgRow[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [profileMap, setProfileMap] = useState<Record<string, ProfileInfo>>({});

  useEffect(() => {
    fetchConversations();
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('user_id, display_name, email, learning_style');
    const map: Record<string, ProfileInfo> = {};
    data?.forEach(p => { map[p.user_id] = p; });
    setProfileMap(map);
  };

  const fetchConversations = async () => {
    const { data } = await supabase
      .from('conversations')
      .select('id, language, scenario, difficulty, mode, started_at, user_id')
      .order('started_at', { ascending: false })
      .limit(500);
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

  // Compute stats per language
  const langStats = conversations.reduce<Record<string, { scenarios: Record<string, number>; difficulties: Record<string, number>; total: number }>>((acc, c) => {
    if (!acc[c.language]) acc[c.language] = { scenarios: {}, difficulties: {}, total: 0 };
    acc[c.language].total++;
    acc[c.language].scenarios[c.scenario] = (acc[c.language].scenarios[c.scenario] || 0) + 1;
    acc[c.language].difficulties[c.difficulty] = (acc[c.language].difficulties[c.difficulty] || 0) + 1;
    return acc;
  }, {});

  // Overall scenario/difficulty breakdown for charts
  const allScenarios: Record<string, number> = {};
  const allDifficulties: Record<string, number> = {};
  conversations.forEach(c => {
    allScenarios[c.scenario] = (allScenarios[c.scenario] || 0) + 1;
    allDifficulties[c.difficulty] = (allDifficulties[c.difficulty] || 0) + 1;
  });

  const scenarioChartData = Object.entries(allScenarios).map(([k, v]) => ({ name: k.charAt(0).toUpperCase() + k.slice(1), value: v }));
  const diffChartData = Object.entries(allDifficulties).map(([k, v]) => ({ name: k.charAt(0).toUpperCase() + k.slice(1), value: v }));

  // Per-language stacked data for bar chart
  const langBreakdownData = Object.entries(langStats).map(([lang, s]) => ({
    language: lang.charAt(0).toUpperCase() + lang.slice(1),
    ...s.scenarios,
    total: s.total,
  }));

  if (loading) return <p className="text-muted-foreground">載入中...</p>;

  return (
    <div className="space-y-6">
      {/* Stats charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scenario pie */}
        <div className="bg-card rounded-xl p-5 border border-border shadow-soft">
          <h4 className="font-semibold text-sm mb-3">📋 情境比例</h4>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={scenarioChartData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} style={{ fontSize: '10px' }}>
                  {scenarioChartData.map((_, i) => <Cell key={i} fill={SCENARIO_COLORS[i % SCENARIO_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Difficulty pie */}
        <div className="bg-card rounded-xl p-5 border border-border shadow-soft">
          <h4 className="font-semibold text-sm mb-3">📊 難度比例</h4>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={diffChartData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} style={{ fontSize: '10px' }}>
                  {diffChartData.map((_, i) => <Cell key={i} fill={DIFF_COLORS[i % DIFF_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Per-language total bar */}
        <div className="bg-card rounded-xl p-5 border border-border shadow-soft">
          <h4 className="font-semibold text-sm mb-3">🌐 各語言對話數</h4>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={langBreakdownData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="language" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                  {langBreakdownData.map((entry, i) => (
                    <Cell key={i} fill={LANG_COLORS[entry.language.toLowerCase()] || 'hsl(210, 10%, 60%)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Per-language detail cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(langStats).sort((a, b) => b[1].total - a[1].total).map(([lang, s]) => (
          <div key={lang} className="bg-card rounded-xl p-4 border border-border shadow-soft">
            <h4 className="font-semibold capitalize mb-2 flex items-center gap-2">
              <span className="w-3 h-3 rounded-full" style={{ backgroundColor: LANG_COLORS[lang] }} />
              {lang} <Badge variant="secondary">{s.total}</Badge>
            </h4>
            <div className="text-xs text-muted-foreground space-y-1">
              <p><strong>情境：</strong>{Object.entries(s.scenarios).map(([k, v]) => `${k}(${v})`).join(', ')}</p>
              <p><strong>難度：</strong>{Object.entries(s.difficulties).map(([k, v]) => `${k}(${v})`).join(', ')}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Conversations table */}
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
                <th className="text-left p-3 font-medium">用戶資訊</th>
                <th className="text-left p-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {conversations.slice(0, 100).map((c) => {
                const profile = c.user_id ? profileMap[c.user_id] : null;
                return (
                <tr key={c.id} className="border-t border-border">
                  <td className="p-3 capitalize">{c.language}</td>
                  <td className="p-3 capitalize">{c.scenario}</td>
                  <td className="p-3"><Badge variant="outline">{c.difficulty}</Badge></td>
                  <td className="p-3"><Badge variant="secondary">{c.mode}</Badge></td>
                  <td className="p-3 text-muted-foreground">
                    {new Date(c.started_at).toLocaleString('zh-TW')}
                  </td>
                  <td className="p-3">
                    {profile ? (
                      <div className="text-xs space-y-0.5">
                        <p className="font-medium">{profile.display_name || '未命名'}</p>
                        <p className="text-muted-foreground">{profile.email || '-'}</p>
                        <p className="text-muted-foreground font-mono text-[10px]">{c.user_id?.slice(0, 8)}...</p>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">訪客</span>
                    )}
                  </td>
                  <td className="p-3">
                    <Button variant="ghost" size="sm" onClick={() => viewMessages(c.id)}>
                      查看對話
                    </Button>
                  </td>
                </tr>
              )})}
              {conversations.length === 0 && (
                <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">尚無對話紀錄</td></tr>
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
    </div>
  );
}
