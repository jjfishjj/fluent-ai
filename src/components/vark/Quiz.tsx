import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { mapQuestion, VARK_KEYS, VARK_CARDS, type VarkQuestion, type VarkType } from '@/lib/vark'

const EMO: Record<VarkType, string> = { visual: '👁️', auditory: '🎧', reading: '📖', kinesthetic: '🤸' }

const btn = (ghost: boolean, disabled = false): React.CSSProperties => ({
  flex: 1, padding: 14, borderRadius: 15, fontSize: 15, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
  border: ghost ? '1px solid #e3e6ea' : 'none',
  background: ghost ? '#fff' : disabled ? '#e5e7eb' : 'var(--primary, #0e3a36)',
  color: ghost ? '#6b7280' : disabled ? '#aaa' : '#fff',
})

export function VARKQuiz({ userId, onDone }: { userId: string; onDone: (sessionId: string) => void }) {
  const [qs, setQs] = useState<VarkQuestion[]>([])
  const [i, setI] = useState(0)
  const [ans, setAns] = useState<Record<string, Set<VarkType>>>({})
  const [sessionId] = useState(() => crypto.randomUUID())
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    supabase.from('vark_questions').select('*').eq('language', 'zh').eq('is_active', true).limit(16)
      .then(({ data }) => setQs((data ?? []).map(r => mapQuestion(r as Record<string, unknown>))))
  }, [])

  if (!qs.length) return <div className="py-16 text-center text-muted-foreground">載入題目中…</div>

  const q = qs[i]
  const sel = ans[q.id] ?? new Set<VarkType>()

  const toggle = (t: VarkType) => {
    const n = new Set(sel)
    n.has(t) ? n.delete(t) : n.add(t)
    setAns({ ...ans, [q.id]: n })
  }

  const next = async () => {
    setBusy(true)
    if (sel.size) {
      await supabase.from('vark_responses').insert(
        [...sel].map(t => ({ user_id: userId, question_id: q.id, selected_type: t, session_id: sessionId }))
      )
    }
    if (i + 1 >= qs.length) {
      await supabase.rpc('calculate_vark_quiz', { p_session_id: sessionId, p_user_id: userId })
      onDone(sessionId)
    } else {
      setI(i + 1)
    }
    setBusy(false)
  }

  const pct = Math.round((i + 1) / qs.length * 100)

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <div className="flex justify-between text-sm text-muted-foreground mb-2">
        <span>問題 {i + 1} / {qs.length}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full mb-5 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-primary to-purple-500 transition-all duration-400" style={{ width: pct + '%' }} />
      </div>
      {q.ctx && <p className="text-sm text-muted-foreground italic mb-1">{q.ctx}</p>}
      <h2 className="text-lg font-semibold mb-1">{q.q}</h2>
      <p className="text-xs text-muted-foreground mb-4">可選擇多個答案</p>
      <div className="space-y-3 mb-6">
        {VARK_KEYS.map(t => {
          const on = sel.has(t)
          return (
            <button key={t} onClick={() => toggle(t)} className="w-full text-left flex items-start gap-3 p-4 rounded-2xl border-2 transition-all"
              style={{ borderColor: on ? VARK_CARDS[t].color : '#e5e7eb', background: on ? VARK_CARDS[t].color + '18' : '#fff' }}>
              <span className="text-xl">{EMO[t]}</span>
              <span className="text-sm text-gray-700 flex-1">{q.o[t]}</span>
              {on && <span className="font-bold" style={{ color: VARK_CARDS[t].color }}>✓</span>}
            </button>
          )
        })}
      </div>
      <div className="flex gap-3">
        {i > 0 && <button onClick={() => setI(i - 1)} style={btn(true)}>上一題</button>}
        <button onClick={next} disabled={!sel.size || busy} style={btn(false, !sel.size || busy)}>
          {i + 1 === qs.length ? '看融合結果 →' : '下一題 →'}
        </button>
      </div>
    </div>
  )
}
