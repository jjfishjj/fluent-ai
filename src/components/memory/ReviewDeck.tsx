import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { fromDB, toDB, review, retrievability, type Rating } from '@/lib/memory/fsrs'
import { toast } from 'sonner'

const MOD: Record<string, { c: string; n: string }> = {
  visual:      { c: '#6366F1', n: '👁️ 視覺卡' },
  auditory:    { c: '#EC4899', n: '🎧 語音複習' },
  reading:     { c: '#10B981', n: '📖 文字卡' },
  kinesthetic: { c: '#F59E0B', n: '🤸 情境重練' },
}

const RATINGS: { r: Rating; label: string; color: string }[] = [
  { r: 1, label: '忘了', color: '#ef4444' },
  { r: 2, label: '模糊', color: '#f59e0b' },
  { r: 3, label: '記得', color: '#10b981' },
  { r: 4, label: '秒答', color: '#10b981' },
]

type MemoryItem = Record<string, unknown>

export function ReviewDeck({ userId, eegEngagement }: { userId: string; eegEngagement?: number }) {
  const [items, setItems] = useState<MemoryItem[]>([])

  const load = async () => {
    const { data } = await supabase.from('memory_items').select('*')
      .eq('user_id', userId)
      .lte('next_review_at', new Date().toISOString())
      .order('next_review_at')
      .limit(30)
    setItems(data ?? [])
  }

  useEffect(() => { load() }, [userId])

  const grade = async (item: MemoryItem, rating: Rating) => {
    const card = fromDB(item)
    const { card: next, intervalDays } = review(card, rating, new Date(), { eegEngagement })
    const patch = toDB(next)
    await supabase.from('memory_items').update(patch).eq('id', item.id as string)
    await supabase.from('memory_reviews').insert({
      memory_item_id: item.id,
      user_id: userId,
      quality: rating,
      review_modality: item.encoding_context,
      eeg_engagement: eegEngagement ?? null,
    })
    const eng = eegEngagement != null ? `（含腦波專注 ${Math.round(eegEngagement * 100)}%）` : ''
    toast.success(`📅 FSRS：下次複習 ${intervalDays} 天後 · 穩定度 ${next.stability.toFixed(1)}天 ${eng}`)
    setItems(prev => prev.filter(x => x.id !== item.id))
  }

  if (!items.length) {
    return (
      <div className="py-16 text-center">
        <div className="text-4xl mb-3">🎉</div>
        <p className="text-muted-foreground">今日複習已完成！</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">今日待複習 {items.length} 項 · FSRS 排程</p>
      {items.map(item => {
        const card = fromDB(item)
        const mod = MOD[item.encoding_context as string] ?? MOD.reading
        const ret = Math.round(retrievability(card) * 100)
        return (
          <div key={item.id as string} className="bg-card border border-border rounded-2xl p-4 relative">
            <span className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full" style={{ background: mod.c + '22', color: mod.c }}>
              {mod.n}
            </span>
            <p className="font-semibold text-base pr-20">{item.content as string}</p>
            <p className="text-sm text-muted-foreground mt-1">{item.meaning as string}</p>
            <p className="text-xs text-muted-foreground mt-2">
              R={ret}% · S={card.stability.toFixed(1)}天 · D={card.difficulty.toFixed(1)}
            </p>
            <div className="h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: ret + '%', background: ret < 50 ? '#ef4444' : mod.c }} />
            </div>
            <div className="grid grid-cols-4 gap-2 mt-3">
              {RATINGS.map(({ r, label, color }) => (
                <button key={r} onClick={() => grade(item, r)}
                  className="py-2 border border-border rounded-xl text-xs font-semibold bg-background hover:bg-muted transition-colors"
                  style={{ color }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
