'use client'
import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts'
import { useFarm } from '@/contexts/FarmContext'

const MONTHS_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function fmt2(n: number) { return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }

export default function ProductionCostPage() {
  const { farmParam, selectedFarmId } = useFarm()
  const [year,    setYear]    = useState(new Date().getFullYear())
  const [data,    setData]    = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const start = `${year}-01-01`
    const end   = `${year}-12-31`
    const base  = farmParam ? farmParam + `&start=${start}&end=${end}` : `?start=${start}&end=${end}`
    fetch(`/api/production-cost${base}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [farmParam, selectedFarmId, year])

  const monthly = (data?.monthly ?? []).map((m: any) => ({
    label: MONTHS_PT[parseInt(m.month.split('-')[1]) - 1],
    liters: +m.totalLiters.toFixed(1),
    expenses: +m.totalExpenses.toFixed(2),
    costPerLiter: +m.costPerLiter.toFixed(2),
  }))

  const perAnimal = (data?.perAnimal ?? []).map((a: any) => ({
    label: a.name ?? a.tag,
    liters: +a.totalLiters.toFixed(1),
  }))

  const s = data?.summary ?? { totalExpenses: 0, totalLiters: 0, costPerLiter: 0 }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1100 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700 }}>Custo de Produção</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Custo por litro e análise de eficiência</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setYear(y => y - 1)} style={navBtn}><ChevronLeft size={16}/></button>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, minWidth: 60, textAlign: 'center' }}>{year}</span>
          <button onClick={() => setYear(y => y + 1)} style={navBtn}><ChevronRight size={16}/></button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>Carregando...</div>
      ) : (
        <>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            <KPI label="Total de Despesas" value={`R$ ${fmt2(s.totalExpenses)}`} color="var(--danger)"/>
            <KPI label="Total Produzido" value={`${s.totalLiters.toFixed(1)} L`} color="#3b82f6"/>
            <KPI label="Custo por Litro" value={`R$ ${fmt2(s.costPerLiter)}`} color="var(--brand)"/>
          </div>

          {/* Monthly chart */}
          {monthly.length > 0 && (
            <div className="card">
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, marginBottom: '1rem' }}>Custo por Litro — Mensal</h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={monthly}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-muted)' }}/>
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }}/>
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }}/>
                  <Legend/>
                  <Line type="monotone" dataKey="costPerLiter" stroke="var(--brand)" strokeWidth={2} dot={{ r: 3 }} name="R$/L"/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Expenses vs liters */}
            {monthly.length > 0 && (
              <div className="card">
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, marginBottom: '1rem' }}>Despesas × Produção</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={monthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--text-muted)' }}/>
                    <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }}/>
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}/>
                    <Bar dataKey="expenses" fill="#ef444477" name="Despesas (R$)" radius={[3,3,0,0]}/>
                    <Bar dataKey="liters" fill="rgba(74,222,128,0.6)" name="Litros" radius={[3,3,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Per animal */}
            {perAnimal.length > 0 && (
              <div className="card">
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, marginBottom: '1rem' }}>Produção por Animal</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={perAnimal} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
                    <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-muted)' }}/>
                    <YAxis dataKey="label" type="category" width={70} tick={{ fontSize: 11, fill: 'var(--text-muted)' }}/>
                    <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}/>
                    <Bar dataKey="liters" fill="rgba(74,222,128,0.7)" name="Litros" radius={[0,3,3,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {monthly.length === 0 && perAnimal.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>Sem dados de produção ou despesas em {year}.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function KPI({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</p>
      <p style={{ fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-display)', color }}>{value}</p>
    </div>
  )
}

const navBtn: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)',
  background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center',
  justifyContent: 'center', color: 'var(--text-muted)',
}
