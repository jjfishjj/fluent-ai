import { useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Plus, ChevronDown, ChevronUp } from 'lucide-react'

const MODALITIES = [
  { value: 'visual',      label: '👁️ 視覺', hint: '用圖像或場景聯想' },
  { value: 'auditory',    label: '🎧 聽覺', hint: '用發音或聲音記憶' },
  { value: 'reading',     label: '📖 讀寫', hint: '用例句或文法記憶' },
  { value: 'kinesthetic', label: '🤸 動覺', hint: '用情境或動作記憶' },
]

interface Props {
  userId: string
  onAdded?: () => void
}

export function AddFSRSCard({ userId, onAdded }: Props) {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const [meaning, setMeaning] = useState('')
  const [note, setNote] = useState('')
  const [modality, setModality] = useState('reading')
  const [saving, setSaving] = useState(false)

  const handleAdd = async () => {
    if (!content.trim() || !meaning.trim()) {
      toast.error('請填入單字與意思')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('memory_items').insert({
      user_id: userId,
      content: content.trim(),
      meaning: meaning.trim(),
      encoding_context: modality,
      tags: note.trim() ? [note.trim()] : [],
      fsrs_state: 'new',
      next_review_at: new Date().toISOString(),
    })
    setSaving(false)
    if (error) {
      toast.error('加入失敗：' + error.message)
      return
    }
    toast.success(`✅ 「${content.trim()}」已加入 FSRS 複習佇列`)
    setContent('')
    setMeaning('')
    setNote('')
    setOpen(false)
    onAdded?.()
  }

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-semibold hover:bg-muted/50 transition-colors"
      >
        <Plus className="w-4 h-4 text-primary" />
        <span className="flex-1 text-left">新增 FSRS 記憶卡</span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
          {/* Word + Meaning */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">單字 / 片語</label>
              <Input
                placeholder="e.g. serendipity"
                value={content}
                onChange={e => setContent(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">中文意思</label>
              <Input
                placeholder="e.g. 意外發現好事"
                value={meaning}
                onChange={e => setMeaning(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
            </div>
          </div>

          {/* Modality selector */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">編碼方式（依你的 VARK 風格）</label>
            <div className="grid grid-cols-4 gap-2">
              {MODALITIES.map(m => (
                <button
                  key={m.value}
                  onClick={() => setModality(m.value)}
                  className={`rounded-xl py-2 text-xs font-medium border transition-colors ${
                    modality === m.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border hover:border-primary/50'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {MODALITIES.find(m => m.value === modality)?.hint}
            </p>
          </div>

          {/* Encoding note */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">記憶提示（選填）</label>
            <Textarea
              placeholder="用你選的編碼方式寫下記憶線索，例如：想像一個偶然發現寶藏的場景"
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>取消</Button>
            <Button size="sm" onClick={handleAdd} disabled={saving}>
              {saving ? '加入中…' : '加入複習佇列'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
