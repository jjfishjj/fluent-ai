import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { GENIUS_INFO, GeniusType } from '@/lib/genius-type';
import { Language } from '@/lib/types';

const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: 'english', label: 'English' },
  { value: 'german', label: 'German' },
  { value: 'french', label: 'French' },
  { value: 'spanish', label: 'Spanish' },
  { value: 'japanese', label: 'Japanese' },
  { value: 'korean', label: 'Korean' },
  { value: 'hebrew', label: 'Hebrew' },
  { value: 'chinese', label: 'Chinese' },
  { value: 'turkish', label: 'Turkish' },
  { value: 'arabic', label: 'Arabic' },
  { value: 'russian', label: 'Russian' },
  { value: 'thai', label: 'Thai' },
  { value: 'vietnamese', label: 'Vietnamese' },
  { value: 'indonesian', label: 'Indonesian' },
  { value: 'hindi', label: 'Hindi' },
  { value: 'cantonese', label: 'Cantonese' },
  { value: 'hakka', label: 'Hakka' },
];

const GENIUS_OPTIONS = Object.values(GENIUS_INFO);

interface QaRow {
  id: string;
  question: string;
  answer: string;
  language: string | null;
  genius_type: string | null;
  is_active: boolean;
  created_at: string;
}

const EMPTY_FORM = { question: '', answer: '', language: '__any__', genius_type: '__any__' };

export function AdminQaTrainingTab() {
  const { user } = useAuth();
  const [rows, setRows] = useState<QaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchRows();
  }, []);

  const fetchRows = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('qa_training_examples')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) toast.error('讀取失敗：' + error.message);
    setRows(data || []);
    setLoading(false);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (row: QaRow) => {
    setEditingId(row.id);
    setForm({
      question: row.question,
      answer: row.answer,
      language: row.language || '__any__',
      genius_type: row.genius_type || '__any__',
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.question.trim() || !form.answer.trim()) {
      toast.error('問題與回答都要填');
      return;
    }
    setSaving(true);
    const payload = {
      question: form.question.trim(),
      answer: form.answer.trim(),
      language: form.language === '__any__' ? null : form.language,
      genius_type: form.genius_type === '__any__' ? null : form.genius_type,
    };
    const { error } = editingId
      ? await supabase.from('qa_training_examples').update(payload).eq('id', editingId)
      : await supabase.from('qa_training_examples').insert({ ...payload, created_by: user?.id });
    setSaving(false);
    if (error) { toast.error('儲存失敗：' + error.message); return; }
    toast.success(editingId ? '已更新' : '已新增');
    setDialogOpen(false);
    fetchRows();
  };

  const remove = async (id: string) => {
    if (!confirm('確定刪除這筆訓練資料？')) return;
    const { error } = await supabase.from('qa_training_examples').delete().eq('id', id);
    if (error) { toast.error('刪除失敗：' + error.message); return; }
    toast.success('已刪除');
    fetchRows();
  };

  const toggleActive = async (row: QaRow) => {
    const { error } = await supabase
      .from('qa_training_examples')
      .update({ is_active: !row.is_active })
      .eq('id', row.id);
    if (error) { toast.error('更新失敗：' + error.message); return; }
    fetchRows();
  };

  if (loading) return <p className="text-muted-foreground">載入中...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          這裡的問答會被機器人當作回答範例參考（不限語言 / 不限型態 = 套用到所有對話）。
        </p>
        <Button onClick={openCreate} size="sm" className="gap-1">
          <Plus className="w-4 h-4" /> 新增
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">問題</th>
                <th className="text-left p-3 font-medium">回答</th>
                <th className="text-left p-3 font-medium">語言</th>
                <th className="text-left p-3 font-medium">記憶天才型態</th>
                <th className="text-left p-3 font-medium">啟用</th>
                <th className="text-left p-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-muted-foreground">
                    還沒有訓練資料，點右上角「新增」開始輸入。
                  </td>
                </tr>
              )}
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border align-top">
                  <td className="p-3 max-w-xs truncate" title={r.question}>{r.question}</td>
                  <td className="p-3 max-w-xs truncate" title={r.answer}>{r.answer}</td>
                  <td className="p-3">
                    {r.language
                      ? <Badge variant="secondary">{r.language}</Badge>
                      : <span className="text-muted-foreground text-xs">不限</span>}
                  </td>
                  <td className="p-3">
                    {r.genius_type
                      ? <Badge variant="secondary">{GENIUS_INFO[r.genius_type as GeniusType]?.nameZh || r.genius_type}</Badge>
                      : <span className="text-muted-foreground text-xs">不限</span>}
                  </td>
                  <td className="p-3">
                    <Switch checked={r.is_active} onCheckedChange={() => toggleActive(r)} />
                  </td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={() => openEdit(r)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => remove(r.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? '編輯訓練資料' : '新增訓練資料'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">問題（用戶可能會問的）</label>
              <Textarea
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
                placeholder="例：How do I say 'thank you' politely?"
                rows={2}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">期望的回答風格 / 內容</label>
              <Textarea
                value={form.answer}
                onChange={(e) => setForm({ ...form, answer: e.target.value })}
                placeholder="例：Thank you very much. / Thanks a lot.（簡短示範＋語氣說明）"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">限定語言</label>
                <Select value={form.language} onValueChange={(v) => setForm({ ...form, language: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__any__">不限語言</SelectItem>
                    {LANGUAGE_OPTIONS.map((l) => (
                      <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">限定記憶天才型態</label>
                <Select value={form.genius_type} onValueChange={(v) => setForm({ ...form, genius_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__any__">不限型態</SelectItem>
                    {GENIUS_OPTIONS.map((g) => (
                      <SelectItem key={g.type} value={g.type}>{g.emoji} {g.nameZh}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={save} disabled={saving}>{saving ? '儲存中...' : '儲存'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
