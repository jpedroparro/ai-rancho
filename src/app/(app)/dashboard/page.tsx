'use client'
import { useEffect, useState } from 'react'
import { Beef, Droplets, TrendingUp, TrendingDown, Users } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useFarm } from '@/contexts/FarmContext'
import InsightsCard from '@/components/InsightsCard'

function StatCard({ icon: Icon, label, value, sub, color }: any) {
  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon size={22} style={{ color }} />
      </div>
      <div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</p>
        <p style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', lineHeight: 1.2 }}>{value}</p>
        {sub && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</p>}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const [data, setData] = useState<any>(null)
  const { farmParam, selectedFarmId } = useFarm()

  useEffect(() => {
    fetch('/api/dashboard' + farmParam).then(r => r.json()).then(setData)
  }, [farmParam, selectedFarmId])

  if (!data) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <p style={{ color: 'var(--text-muted)' }}>Carregando...</p>
    </div>
  )

  const milkChart = (data.milkRecords || []).map((r: any) => ({
    date: new Date(r.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    total: +Number(r.total).toFixed(1),
  }))
  const monthName = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1200 }}>
      <div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700 }}>Dashboard</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Visão geral da fazenda</p>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        <StatCard icon={Beef}        label="Total de Animais" value={data.animals?.total} sub={`${data.animals?.dairy} leiteiras · ${data.animals?.sheep} ovelhas · ${data.animals?.beef} bovinos`} color="var(--brand)" />
        <StatCard icon={Droplets}    label="Leite Hoje"       value={`${(data.milkToday || 0).toFixed(1)} L`} color="#3b82f6" />
        <StatCard icon={TrendingUp}  label="Receita Total"    value={`R$ ${(data.revenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} color="var(--brand)" />
        <StatCard icon={TrendingDown} label="Despesas"        value={`R$ ${(data.expenses || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} color="var(--danger)" />
        <StatCard icon={Users}       label="Funcionários"     value={data.employees} sub="ativos" color="var(--accent)" />
      </div>

      {/* Main content: charts + insights */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '1rem', alignItems: 'start' }}>

        {/* Left column: charts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, marginBottom: '1rem' }}>{`Producao de Leite — ${monthName}`}</h3>
            {milkChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={milkChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }} />
                  <Line type="monotone" dataKey="total" stroke="var(--brand)" strokeWidth={2} dot={{ r: 3 }} name="Litros" />
                </LineChart>
              </ResponsiveContainer>
            ) : <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Sem dados de leite ainda.</p>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="card">
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, marginBottom: '1rem' }}>Vendas Recentes</h3>
              {data.recentSales?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {data.recentSales.map((s: any) => (
                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 500 }}>{{ MILK: 'Leite', ANIMAL: 'Animal', WOOL: 'Lã', MEAT: 'Carne' }[s.type as string] || s.type}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(s.date + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--brand)' }}>R$ {s.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              ) : <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Sem vendas registradas.</p>}
            </div>

            <div className="card">
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, marginBottom: '1rem' }}>Despesas Recentes</h3>
              {data.recentExpenses?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {data.recentExpenses.map((e: any) => (
                    <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 500 }}>{e.description}</p>
                        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{new Date(e.date + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--danger)' }}>R$ {e.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              ) : <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Sem despesas registradas.</p>}
            </div>
          </div>
        </div>

        {/* Right column: AI insights */}
        <InsightsCard farmParam={farmParam} />
      </div>
    </div>
  )
}
