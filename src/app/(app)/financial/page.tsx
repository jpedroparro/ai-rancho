'use client'
import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { useFarm } from '@/contexts/FarmContext'

const CATS: Record<string, string> = { FEED: 'Alimentação', MEDICINE: 'Medicamentos', EQUIPMENT: 'Equipamentos', LABOR: 'Mão de obra', OTHER: 'Outros' }
const PIE_COLORS = ['#22c55e', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6']

export default function FinancialPage() {
  const { farmParam } = useFarm()
  const [sales, setSales] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])

  useEffect(() => {
    Promise.all([fetch('/api/sales' + farmParam).then(r => r.json()), fetch('/api/expenses' + farmParam).then(r => r.json())])
      .then(([s, e]) => { setSales(s); setExpenses(e) })
  }, [farmParam])

  const totalRevenue = sales.reduce((s, x) => s + x.total, 0)
  const totalExpenses = expenses.reduce((s, x) => s + x.amount, 0)
  const profit = totalRevenue - totalExpenses
  const margin = totalRevenue > 0 ? (profit / totalRevenue * 100) : 0

  // Monthly chart data
  const monthlyData: Record<string, { month: string; receita: number; despesas: number }> = {}
  sales.forEach(s => {
    const m = new Date(s.date).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    if (!monthlyData[m]) monthlyData[m] = { month: m, receita: 0, despesas: 0 }
    monthlyData[m].receita += s.total
  })
  expenses.forEach(e => {
    const m = new Date(e.date).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
    if (!monthlyData[m]) monthlyData[m] = { month: m, receita: 0, despesas: 0 }
    monthlyData[m].despesas += e.amount
  })
  const chartData = Object.values(monthlyData).slice(-6)

  // Expense by category
  const expByCat: Record<string, number> = {}
  expenses.forEach(e => { expByCat[e.category] = (expByCat[e.category] || 0) + e.amount })
  const pieData = Object.entries(expByCat).map(([cat, value]) => ({ name: CATS[cat] || cat, value: Math.round(value * 100) / 100 }))

  // Revenue by type
  const revByType: Record<string, number> = {}
  sales.forEach(s => { revByType[s.type] = (revByType[s.type] || 0) + s.total })
  const revPieData = Object.entries(revByType).map(([type, value]) => ({
    name: { MILK: 'Leite', ANIMAL: 'Animal', WOOL: 'Lã', MEAT: 'Carne' }[type] || type,
    value: Math.round(value * 100) / 100
  }))

  const fmt = (v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700 }}>Financeiro</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Visão geral de receitas e despesas</p>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Receita Total', value: fmt(totalRevenue), color: 'var(--brand)', bg: 'var(--brand-pale)' },
          { label: 'Despesas Totais', value: fmt(totalExpenses), color: 'var(--danger)', bg: 'var(--danger-pale)' },
          { label: 'Lucro', value: fmt(profit), color: profit >= 0 ? 'var(--brand)' : 'var(--danger)', bg: profit >= 0 ? 'var(--brand-pale)' : 'var(--danger-pale)' },
          { label: 'Margem', value: `${margin.toFixed(1)}%`, color: margin >= 0 ? 'var(--brand)' : 'var(--danger)', bg: margin >= 0 ? 'var(--brand-pale)' : 'var(--danger-pale)' },
        ].map(k => (
          <div key={k.label} className="card" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{k.label}</p>
            <p style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-display)', color: k.color }}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Bar Chart */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, marginBottom: '1rem' }}>Receita vs Despesas por Mês</h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={chartData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }} formatter={(v: any) => [`R$ ${Number(v).toFixed(2)}`, '']} />
              <Bar dataKey="receita" fill="var(--brand)" radius={[4, 4, 0, 0]} name="Receita" />
              <Bar dataKey="despesas" fill="var(--danger)" radius={[4, 4, 0, 0]} name="Despesas" />
              <Legend />
            </BarChart>
          </ResponsiveContainer>
        ) : <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Sem dados suficientes.</p>}
      </div>

      {/* Pie Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, marginBottom: '1rem' }}>Despesas por Categoria</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => `R$ ${Number(v).toFixed(2)}`} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Sem dados.</p>}
        </div>
        <div className="card">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, marginBottom: '1rem' }}>Receita por Tipo</h3>
          {revPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={revPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={11}>
                  {revPieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => `R$ ${Number(v).toFixed(2)}`} contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Sem dados.</p>}
        </div>
      </div>
    </div>
  )
}
