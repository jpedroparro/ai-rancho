'use client'
import { useEffect, useState, useMemo } from 'react'
import { Plus, X, Droplets, TrendingUp, Archive, ShoppingCart } from 'lucide-react'
import { useFarm } from '@/contexts/FarmContext'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const toISO = (d: Date) => d.toISOString().split('T')[0]

export default function MilkPage() {
  const { farmParam, selectedFarmId } = useFarm()
  const [records, setRecords] = useState<any[]>([])
  const [animals, setAnimals] = useState<any[]>([])
  const [stock, setStock] = useState<{ balance: number; movements: any[] }>({ balance: 0, movements: [] })
  const [tab, setTab] = useState<'producao'|'estoque'>('producao')
  const [startDate, setStartDate] = useState(() => toISO(new Date(new Date().getFullYear(), new Date().getMonth(), 1)))
  const [endDate, setEndDate] = useState(() => toISO(new Date()))
  const [showModal, setShowModal] = useState(false)
  const [showExitModal, setShowExitModal] = useState(false)
  const [form, setForm] = useState<any>({ animalId: '', date: toISO(new Date()), morning: '', evening: '', notes: '' })
  const [exitForm, setExitForm] = useState<any>({ date: toISO(new Date()), reason: 'DISCARD', quantity: '', notes: '' })
  const fp = selectedFarmId ? '&farmId=' + selectedFarmId : ''

  const load = async () => {
    const [r, a, s] = await Promise.all([
      fetch('/api/milk?start=' + startDate + '&end=' + endDate + fp).then(x => x.json()),
      fetch('/api/animals?type=DAIRY&status=ACTIVE' + fp).then(x => x.json()),
      fetch('/api/milk-stock' + farmParam).then(x => x.json()),
    ])
    setRecords(Array.isArray(r) ? r : [])
    setAnimals(Array.isArray(a) ? a : [])
    if (s && typeof s.balance === 'number') setStock(s)
  }
  useEffect(() => { load() }, [farmParam, startDate, endDate])

  const days = Math.max(1, Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000) + 1)
  const totalPeriod = records.reduce((s, r) => s + r.total, 0)
  const totalToday = records.filter(r => r.date === toISO(new Date())).reduce((s, r) => s + r.total, 0)

  const chartData = useMemo(() => {
    const byDay: Record<string, number> = {}
    records.forEach(r => { byDay[r.date] = (byDay[r.date] || 0) + r.total })
    return Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b)).map(([date, total]) => ({
      date: new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      total: +total.toFixed(1),
    }))
  }, [records])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch('/api/milk', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, morning: parseFloat(form.morning)||0, evening: parseFloat(form.evening)||0, farmId: selectedFarmId }) })
    setShowModal(false); setForm({ animalId: '', date: toISO(new Date()), morning: '', evening: '', notes: '' }); load()
  }

  const saveExit = async (e: React.FormEvent) => {
    e.preventDefault()
    const qty = parseFloat(exitForm.quantity)
    if (qty > stock.balance + 0.001) { alert('Saldo insuficiente: ' + stock.balance.toFixed(1) + ' L disponivel'); return }
    await fetch('/api/milk-stock', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...exitForm, quantity: qty, type: 'EXIT', farmId: selectedFarmId }) })
    setShowExitModal(false); setExitForm({ date: toISO(new Date()), reason: 'DISCARD', quantity: '', notes: '' }); load()
  }

  const REASON_LABELS: Record<string, string> = { PRODUCTION: 'Producao', SALE: 'Venda', DISCARD: 'Descarte', OWN_CONSUMPTION: 'Consumo Proprio' }

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700 }}>Leite</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Producao, estoque e movimentacoes</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {tab === 'estoque' && <button className="btn-secondary" onClick={() => setShowExitModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Archive size={15}/> Saida Manual</button>}
          <button className="btn-primary" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={16}/> Lancar</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Hoje', value: totalToday.toFixed(1) + ' L', color: 'var(--brand)', icon: Droplets },
          { label: 'Periodo Total', value: totalPeriod.toFixed(1) + ' L', color: '#3b82f6', icon: TrendingUp },
          { label: 'Media/Dia', value: days ? (totalPeriod / days).toFixed(1) + ' L' : '0 L', color: '#8b5cf6', icon: Droplets },
          { label: 'Saldo Estoque', value: stock.balance.toFixed(1) + ' L', color: stock.balance > 0 ? 'var(--brand)' : 'var(--danger)', icon: Archive },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon size={20} style={{ color, flexShrink: 0 }}/>
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</p>
              <p style={{ fontSize: 20, fontWeight: 700, color }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        {(['producao', 'estoque'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '7px 18px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === t ? 600 : 400,
            background: tab === t ? 'var(--brand)' : 'var(--bg-card)', color: tab === t ? '#000' : 'var(--text-muted)',
          }}>{{ producao: 'Producao', estoque: 'Estoque' }[t]}</button>
        ))}
        {tab === 'producao' && (
          <>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 7, padding: '6px 10px', color: 'var(--text-primary)', fontSize: 13 }}/>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>ate</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 7, padding: '6px 10px', color: 'var(--text-primary)', fontSize: 13 }}/>
          </>
        )}
      </div>

      {tab === 'producao' && (
        <>
          <div className="card" style={{ marginBottom: '1rem' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, marginBottom: '1rem' }}>Producao Diaria</h3>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }}/>
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }}/>
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }}/>
                  <Line type="monotone" dataKey="total" stroke="var(--brand)" strokeWidth={2} dot={{ r: 3 }} name="Litros"/>
                </LineChart>
              </ResponsiveContainer>
            ) : <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Sem dados no periodo.</p>}
          </div>
          <div className="card" style={{ padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Data','Animal','Manha (L)','Tarde (L)','Total (L)','Obs'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {[...records].reverse().map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 14px', fontSize: 13 }}>{new Date(r.date + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600 }}>{r.animal?.tag || r.animalId}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13 }}>{r.morning} L</td>
                    <td style={{ padding: '10px 14px', fontSize: 13 }}>{r.evening} L</td>
                    <td style={{ padding: '10px 14px', fontSize: 14, fontWeight: 700, color: 'var(--brand)' }}>{r.total} L</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-muted)' }}>{r.notes || '—'}</td>
                  </tr>
                ))}
                {records.length === 0 && <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Nenhum lancamento no periodo.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'estoque' && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Saldo atual: </span>
              <span style={{ fontSize: 20, fontWeight: 700, color: stock.balance > 0 ? 'var(--brand)' : 'var(--danger)' }}>{stock.balance.toFixed(1)} L</span>
            </div>
            <div style={{ display: 'flex', gap: 16, fontSize: 13 }}>
              <span style={{ color: 'var(--brand)' }}>↑ Entradas: {stock.movements.filter(m => m.type === 'ENTRY').reduce((s: number, m: any) => s + m.quantity, 0).toFixed(1)} L</span>
              <span style={{ color: 'var(--danger)' }}>↓ Saidas: {stock.movements.filter(m => m.type === 'EXIT').reduce((s: number, m: any) => s + m.quantity, 0).toFixed(1)} L</span>
            </div>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Data','Movimento','Motivo','Quantidade','Obs'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {stock.movements.map(m => (
                <tr key={m.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 14px', fontSize: 13 }}>{new Date(m.date + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, background: m.type === 'ENTRY' ? 'var(--brand)22' : 'var(--danger)22', color: m.type === 'ENTRY' ? 'var(--brand)' : 'var(--danger)', fontWeight: 600 }}>
                      {m.type === 'ENTRY' ? '↑ Entrada' : '↓ Saida'}
                    </span>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-muted)' }}>{REASON_LABELS[m.reason] || m.reason}</td>
                  <td style={{ padding: '10px 14px', fontSize: 14, fontWeight: 700, color: m.type === 'ENTRY' ? 'var(--brand)' : 'var(--danger)' }}>
                    {m.type === 'ENTRY' ? '+' : '-'}{m.quantity.toFixed(1)} L
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-muted)' }}>{m.notes || '—'}</td>
                </tr>
              ))}
              {stock.movements.length === 0 && <tr><td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Nenhuma movimentacao registrada.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ width: 400 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>Lancamento de Leite</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18}/></button>
            </div>
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Animal *</label>
                <select required value={form.animalId} onChange={e => setForm({ ...form, animalId: e.target.value })}
                  style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 14 }}>
                  <option value="">Selecione...</option>
                  {animals.map(a => <option key={a.id} value={a.id}>{a.tag}{a.name ? ' - ' + a.name : ''}</option>)}
                </select>
              </div>
              {[{ label: 'Data *', key: 'date', type: 'date' }, { label: 'Manha (L)', key: 'morning', type: 'number' }, { label: 'Tarde (L)', key: 'evening', type: 'number' }, { label: 'Obs', key: 'notes' }].map(({ label, key, type }) => (
                <div key={key}>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>{label}</label>
                  <input required={key === 'date'} type={type || 'text'} step="0.1" value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 14 }}/>
                </div>
              ))}
              <button type="submit" className="btn-primary">Lancar</button>
            </form>
          </div>
        </div>
      )}

      {showExitModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ width: 380 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>Saida do Estoque</h2>
              <button onClick={() => setShowExitModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18}/></button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: '1rem' }}>Saldo disponivel: <strong style={{ color: 'var(--brand)' }}>{stock.balance.toFixed(1)} L</strong></p>
            <form onSubmit={saveExit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[{ label: 'Data *', key: 'date', type: 'date' }, { label: 'Quantidade (L) *', key: 'quantity', type: 'number' }, { label: 'Obs', key: 'notes' }].map(({ label, key, type }) => (
                <div key={key}>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>{label}</label>
                  <input required={key !== 'notes'} type={type || 'text'} step="0.1" value={exitForm[key]} onChange={e => setExitForm({ ...exitForm, [key]: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 14 }}/>
                </div>
              ))}
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Motivo</label>
                <select value={exitForm.reason} onChange={e => setExitForm({ ...exitForm, reason: e.target.value })}
                  style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 14 }}>
                  <option value="DISCARD">Descarte</option><option value="OWN_CONSUMPTION">Consumo Proprio</option>
                </select>
              </div>
              <button type="submit" className="btn-primary">Registrar Saida</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
