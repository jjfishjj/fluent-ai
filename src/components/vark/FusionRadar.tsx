import { useEffect, useState } from 'react'
import { supabase } from '@/integrations/supabase/client'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { VARK_CARDS, type VarkType } from '@/lib/vark'

interface VARKProfile {
  quiz_v: number; quiz_a: number; quiz_r: number; quiz_k: number
  behavior_v: number; behavior_a: number; behavior_r: number; behavior_k: number
  eeg_v?: number; eeg_a?: number; eeg_r?: number; eeg_k?: number
  blended_v: number; blended_a: number; blended_r: number; blended_k: number
  dominant_type: VarkType
  confidence?: number
}

export function FusionRadar({ userId }: { userId: string }) {
  const [p, setP] = useState<VARKProfile | null>(null)

  useEffect(() => {
    supabase.from('vark_profiles').select('*').eq('user_id', userId).single()
      .then(({ data }) => setP(data as VARKProfile | null))
  }, [userId])

  if (!p) return <div className="py-16 text-center text-muted-foreground">分析中…</div>

  const norm = (a: number, b: number, c: number, d: number) => {
    const s = (a + b + c + d) || 1
    return [a, b, c, d].map(x => Math.round(x / s * 100))
  }

  const quiz   = norm(p.quiz_v, p.quiz_a, p.quiz_r, p.quiz_k)
  const beh    = norm(p.behavior_v, p.behavior_a, p.behavior_r, p.behavior_k)
  const eeg    = norm(p.eeg_v ?? 0, p.eeg_a ?? 0, p.eeg_r ?? 0, p.eeg_k ?? 0)
  const blend  = norm(p.blended_v, p.blended_a, p.blended_r, p.blended_k)
  const hasEeg = (p.eeg_v ?? 0) + (p.eeg_a ?? 0) + (p.eeg_r ?? 0) + (p.eeg_k ?? 0) > 0

  const data = ['Visual', 'Auditory', 'Reading', 'Kinesthetic'].map((subject, idx) => ({
    subject, 測驗: quiz[idx], 行為: beh[idx], 腦波: eeg[idx], 融合: blend[idx],
  }))

  const card = p.dominant_type ? VARK_CARDS[p.dominant_type] : null
  const confidence = Math.round((p.confidence ?? (hasEeg ? 0.88 : 0.64)) * 100)

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      {card && (
        <div className="rounded-2xl p-5 text-white" style={{ background: `linear-gradient(135deg,${card.color}cc,${card.color})` }}>
          <div className="text-4xl mb-1">{card.emoji}</div>
          <div className="text-xs opacity-75">三源融合 · 主要學習風格</div>
          <h2 className="text-xl font-bold mt-1">{card.label}</h2>
          <div className="mt-3 text-xs bg-white/20 rounded-xl px-3 py-2">
            🧠 {card.bw} · 信賴度 {confidence}%
          </div>
          <ul className="mt-3 space-y-1">
            {card.tips.map(tip => (
              <li key={tip} className="text-xs opacity-90">• {tip}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl p-4">
        <h3 className="font-semibold mb-3">三源融合雷達圖</h3>
        <ResponsiveContainer width="100%" height={280}>
          <RadarChart data={data}>
            <PolarGrid stroke="#f0f0f0" />
            <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <Radar name="測驗" dataKey="測驗" stroke="#6366F1" fill="#6366F1" fillOpacity={0.1} strokeWidth={1.5} />
            <Radar name="行為" dataKey="行為" stroke="#EC4899" fill="#EC4899" fillOpacity={0.1} strokeWidth={1.5} />
            {hasEeg && <Radar name="腦波" dataKey="腦波" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.1} strokeWidth={1.5} strokeDasharray="4 3" />}
            <Radar name="融合" dataKey="融合" stroke="#10B981" fill="#10B981" fillOpacity={0.2} strokeWidth={2.5} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Tooltip formatter={(v: number) => v + '%'} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
