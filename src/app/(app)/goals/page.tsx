'use client'
import { useEffect, useState } from 'react'
import { Plus, X, Target, Trash2, TrendingUp } from 'lucide-react'
import { useFarm } from '@/contexts/FarmContext'
import type { GoalType, PeriodType } from '@/lib/services/goals'

interface GoalWithProgress {
  id: string
  type: GoalType
  label: string
  targetValue: number
  periodType: PeriodType
  periodValue: string
  status: string
  progress: {
    currentValue: number
    percentage: number
    achieved: boolean
  } | null
}

const TYPE_LABELS: Record<GoalType, string> = {
  MILK_PRODUCTION: 'Produção de Leite (L)',
  REVENUE:         'Receita (R$)',
  EXPENSES_LIMIT:  'Limite de Despesas (R$)',
  ANIMALS_COUNT:   'Plantel (animais)',
}
const TYPE_COLORS: Record<GoalType, string> = {
  MILK_PRODUCTION: '#3b82f6',
  REVENUE:         '#22c55e',
  EXPENSES_LIMIT:  '#ef4444',
  ANIMALS_COUNT:   '#a855f7',
}

const now = new Date()
const THIS_MONTH = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
const THIS_YEAR  = String(now.getFullYear())

const emptyForm = (): { type: GoalType; label: string; targetValue: string; periodType: PeriodType; periodValue: string } => ({
  type: 'MILK_PRODUCTION', label: '', targetValue: '', periodType: 'MONTHLY', periodValue: THIS_MONTH,
})

export default function GoalsPage() {
  const { farmParam, selectedFarmId } = useFarm()
  const [goals,   setGoals]   = useState<GoalWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState(false)
  const [form,    setForm]    = useState(emptyForm())
  const [saving,  setSaving]  = useState(false)

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/goals${farmParam}`)
    const data = res.ok ? await res.json() : []
    setGoals(data)
    setLoading(false)
  }
  useEffect(() => { load() }, [farmParam, selectedFarmId])

  async function handleSave() {
    if (!form.label || !form.targetValue) return
    setSaving(true)
    await fetch('/api/goals', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, targetValue: Number(form.targetValue) }),
    })
    setSaving(false); setModal(false); setForm(emptyForm()); load()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/goals/${id}`, { method: 'DELETE' })
    load()
  }

  const achieved = goals.filter(g => g.progress?.achieved).length
  const total    = goals.length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1000 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700 }}>Metas & Indicadores</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Defina objetivos e acompanhe o progresso da fazenda</p>
        </div>
        <button onClick={() => setModal(true)} style={addBtn}>
          <Plus size={16}/> Nova Meta
        </button>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <Target size={22} style={{ color: 'var(--brand)', marginBottom: 6 }}/>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total de Metas</p>
          <p style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{total}</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <TrendingUp size={22} style={{ color: '#22c55e', marginBottom: 6 }}/>
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Metas Atingidas</p>
          <p style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-display)', color: '#22c55e' }}>{achieved}</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Taxa de Sucesso</p>
          <p style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--brand)' }}>
            {total > 0 ? Math.round((achieved / total) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* Goals list */}
      {loading ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Carregando...</div>
      ) : goals.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Target size={36} style={{ color: 'var(--text-muted)', marginBottom: 12 }}/>
          <p style={{ fontSize: 14, fontWeight: 600 }}>Nenhuma meta cadastrada</p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>Crie metas para acompanhar o progresso da fazenda.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          {goals.map(g => {
            const color  = TYPE_COLORS[g.type]
            const pct    = Math.min(g.progress?.percentage ?? 0, 100)
            const done   = g.progress?.achieved ?? false
            const fmt = (v: number) => g.type === 'MILK_PRODUCTION' || g.type === 'ANIMALS_COUNT'
              ? v.toFixed(1)
              : `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

            return (
              <div key={g.id} className="card" style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color, background: color + '22', padding: '2px 8px', borderRadius: 5 }}>
                        {TYPE_LABELS[g.type]}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {g.periodType === 'MONTHLY' ? g.periodValue : g.periodValue}
                      </span>
                      {done && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#22c55e', background: 'rgba(34,197,94,0.15)', padding: '2px 7px', borderRadius: 4 }}>✓ ATINGIDA</span>
                      )}
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{g.label}</p>
                  </div>
                  <button onClick={() => handleDelete(g.id)} style={delBtn}><Trash2 size={13}/></button>
                </div>

                {/* Progress bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'var(--border)', overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`, height: '100%',
                      background: done ? '#22c55e' : color,
                      borderRadius: 4, transition: 'width .4s ease',
                    }}/>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 90, textAlign: 'right' }}>
                    <span style={{ fontWeight: 600, color: done ? '#22c55e' : color }}>{fmt(g.progress?.currentValue ?? 0)}</span>
                    {' '}/{' '}{fmt(g.targetValue)}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: done ? '#22c55e' : color, minWidth: 40, textAlign: 'right' }}>
                    {(g.progress?.percentage ?? 0).toFixed(0)}%
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div style={overlayStyle}>
          <div className="card" style={{ width: '100%', maxWidth: 460 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>Nova Meta</h2>
              <button onClick={() => setModal(false)} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}><X size={16}/></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div>
                <label style={lbl}>Tipo de Meta *</label>
                <select style={inp} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as GoalType }))}>
                  {(Object.entries(TYPE_LABELS) as [GoalType, string][]).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={lbl}>Descrição *</label>
                <input style={inp} value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} placeholder="Ex: Meta de leite de junho"/>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={lbl}>Valor Alvo *</label>
                  <input type="number" style={inp} value={form.targetValue} onChange={e => setForm(f => ({ ...f, targetValue: e.target.value }))} min={0}/>
                </div>
                <div>
                  <label style={lbl}>Período</label>
                  <select style={inp} value={form.periodType} onChange={e => setForm(f => ({ ...f, periodType: e.target.value as PeriodType, periodValue: e.target.value === 'MONTHLY' ? THIS_MONTH : THIS_YEAR }))}>
                    <option value="MONTHLY">Mensal</option>
                    <option value="YEARLY">Anual</option>
                  </select>
                </div>
              </div>
              <div>
                <label style={lbl}>{form.periodType === 'MONTHLY' ? 'Mês (AAAA-MM)' : 'Ano (AAAA)'}</label>
                <input style={inp} value={form.periodValue} onChange={e => setForm(f => ({ ...f, periodValue: e.target.value }))}
                  placeholder={form.periodType === 'MONTHLY' ? '2024-06' : '2024'}/>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button onClick={() => setModal(false)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', fontSize: 14, color: 'var(--text-muted)' }}>Cancelar</button>
              <button onClick={handleSave} disabled={saving || !form.label || !form.targetValue} style={{ flex: 2, padding: '10px', borderRadius: 8, border: 'none', background: 'var(--brand)', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
                {saving ? 'Salvando…' : 'Criar Meta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const addBtn: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8,
  background: 'var(--brand)', color: '#fff', border: 'none',
  borderRadius: 8, padding: '10px 18px', cursor: 'pointer', fontSize: 14, fontWeight: 600,
}
const delBtn: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 7, border: '1px solid rgba(239,68,68,0.3)',
  background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center',
  justifyContent: 'center', color: '#ef4444', flexShrink: 0,
}
const overlayStyle: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
  zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
}
const lbl: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)',
  marginBottom: 5, letterSpacing: '0.04em',
}
const inp: React.CSSProperties = {
  width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)',
  background: 'var(--bg-input, var(--bg-card))', color: 'var(--text-primary)', fontSize: 14, boxSizing: 'border-box',
}
