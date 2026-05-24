'use client'
import { useEffect, useState } from 'react'
import { AlertTriangle, TrendingDown, Lightbulb, TrendingUp, Milk, DollarSign, Users, RefreshCw } from 'lucide-react'
import type { Insight, InsightSeverity } from '@/lib/services/insights'

const SEV: Record<InsightSeverity, { color: string; bg: string; Icon: any }> = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.08)',   Icon: AlertTriangle },
  warning:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  Icon: TrendingDown  },
  tip:      { color: '#3b82f6', bg: 'rgba(59,130,246,0.08)',  Icon: Lightbulb     },
  positive: { color: '#22c55e', bg: 'rgba(34,197,94,0.08)',   Icon: TrendingUp    },
}

const CAT_ICON: Record<string, any> = {
  milk:        Milk,
  financial:   DollarSign,
  operational: Users,
  animal:      AlertTriangle,
}

export default function InsightsCard({ farmParam }: { farmParam: string }) {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading]   = useState(true)
  const [ts, setTs]             = useState(Date.now())

  useEffect(() => {
    setLoading(true)
    fetch(`/api/ai/insights${farmParam}`)
      .then(r => r.ok ? r.json() : [])
      .then(data => { setInsights(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [farmParam, ts])

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#14381a,#1e5c22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* small brain/spark icon */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2 L15 9 L22 9 L16.5 13.5 L18.5 21 L12 17 L5.5 21 L7.5 13.5 L2 9 L9 9 Z"/>
            </svg>
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Assistente Rural</p>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>Análise automática dos seus dados</p>
          </div>
        </div>
        <button
          onClick={() => setTs(Date.now())}
          disabled={loading}
          style={{ width: 30, height: 30, borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}
          title="Atualizar"
        >
          <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}/>
        </button>
      </div>

      {/* Insights */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: 13 }}>
          Analisando dados…
        </div>
      ) : insights.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '1.5rem' }}>
          <TrendingUp size={28} style={{ color: '#22c55e', marginBottom: 6 }}/>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#22c55e' }}>Tudo certo por aqui!</p>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Nenhum alerta no momento.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {insights.map(ins => {
            const { color, bg, Icon } = SEV[ins.severity]
            const CatIcon = CAT_ICON[ins.category] ?? Lightbulb
            return (
              <div
                key={ins.id}
                style={{
                  display: 'flex',
                  gap: 10,
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: bg,
                  border: `1px solid ${color}22`,
                }}
              >
                <div style={{ paddingTop: 1, flexShrink: 0 }}>
                  <Icon size={15} style={{ color }}/>
                </div>
                <div>
                  <p style={{ fontSize: 12.5, fontWeight: 600, color, marginBottom: 2 }}>{ins.title}</p>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.45 }}>{ins.message}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
