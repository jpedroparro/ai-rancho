'use client'
import { useEffect, useState } from 'react'
import { Plus, X, Syringe, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { useFarm } from '@/contexts/FarmContext'

const TYPE_LABELS: Record<string, string> = { VACCINATION: 'Vacinacao', TREATMENT: 'Tratamento', DEWORMING: 'Vermifugacao', EXAMINATION: 'Exame' }
const TYPE_COLORS: Record<string, string> = { VACCINATION: '#3b82f6', TREATMENT: '#f59e0b', DEWORMING: '#8b5cf6', EXAMINATION: 'var(--brand)' }
const EMPTY = { animalId: '', farmId: '', type: 'VACCINATION', title: '', date: new Date().toISOString().split('T')[0], product: '', dose: '', veterinarian: '', withdrawalDays: '0', notes: '', status: 'DONE' }

export default function HealthPage() {
  const { farmParam, selectedFarmId } = useFarm()
  const [events, setEvents] = useState<any[]>([])
  const [animals, setAnimals] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<any>(EMPTY)
  const [filter, setFilter] = useState('ALL')
  const fp = selectedFarmId ? '&farmId=' + selectedFarmId : ''

  const load = async () => {
    const [h, a] = await Promise.all([
      fetch('/api/health' + farmParam).then(x => x.json()),
      fetch('/api/animals?status=ACTIVE' + fp).then(x => x.json()),
    ])
    setEvents(Array.isArray(h) ? h : [])
    setAnimals(Array.isArray(a) ? a : [])
  }
  useEffect(() => { load() }, [farmParam])

  const today = new Date().toISOString().split('T')[0]
  const inWithdrawal = events.filter(e => e.withdrawalEndDate && e.withdrawalEndDate >= today).length
  const upcoming = events.filter(e => e.status === 'SCHEDULED' && e.date >= today).length

  const filtered = filter === 'ALL' ? events : events.filter(e => e.type === filter)

  const save = async (ev: React.FormEvent) => {
    ev.preventDefault()
    await fetch('/api/health', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, withdrawalDays: parseInt(form.withdrawalDays) || 0, farmId: selectedFarmId }) })
    setShowModal(false); setForm(EMPTY); load()
  }

  const del = async (id: string) => {
    if (!confirm('Remover este registro?')) return
    await fetch('/api/health/' + id, { method: 'DELETE' })
    load()
  }

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700 }}>Sanitario</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Vacinas, tratamentos e carencias</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16}/> Novo Registro
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Registros', value: events.length, color: 'var(--brand)', icon: Syringe },
          { label: 'Em Carencia', value: inWithdrawal, color: inWithdrawal > 0 ? '#f59e0b' : 'var(--text-muted)', icon: AlertTriangle },
          { label: 'Agendados', value: upcoming, color: upcoming > 0 ? '#3b82f6' : 'var(--text-muted)', icon: Clock },
          { label: 'Realizados', value: events.filter(e => e.status === 'DONE').length, color: 'var(--brand)', icon: CheckCircle },
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

      <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap' }}>
        {['ALL', 'VACCINATION', 'TREATMENT', 'DEWORMING', 'EXAMINATION'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: filter === f ? 600 : 400,
            background: filter === f ? (TYPE_COLORS[f] || 'var(--brand)') : 'var(--bg-card)',
            color: filter === f ? (f === 'ALL' ? '#000' : '#fff') : 'var(--text-muted)',
          }}>{f === 'ALL' ? 'Todos' : TYPE_LABELS[f]}</button>
        ))}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Data','Tipo','Titulo','Animal','Produto/Dose','Carencia','Status',''].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.map(e => {
                const inCarencia = e.withdrawalEndDate && e.withdrawalEndDate >= today
                return (
                  <tr key={e.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 14px', fontSize: 13, whiteSpace: 'nowrap' }}>{new Date(e.date + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, background: (TYPE_COLORS[e.type] || 'var(--brand)') + '22', color: TYPE_COLORS[e.type] || 'var(--brand)', fontWeight: 600 }}>{TYPE_LABELS[e.type] || e.type}</span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 500 }}>{e.title}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-muted)' }}>{e.animal?.tag || 'Lote'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-muted)' }}>{[e.product, e.dose].filter(Boolean).join(' / ') || '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      {inCarencia
                        ? <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, background: '#f59e0b22', color: '#f59e0b', fontWeight: 600 }}>Ate {new Date(e.withdrawalEndDate + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                        : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, background: e.status === 'DONE' ? 'var(--brand)22' : '#3b82f622', color: e.status === 'DONE' ? 'var(--brand)' : '#3b82f6', fontWeight: 600 }}>
                        {e.status === 'DONE' ? 'Realizado' : 'Agendado'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <button onClick={() => del(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: 12 }}>Remover</button>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && <tr><td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Nenhum registro sanitario.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ width: 460, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>Novo Registro Sanitario</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18}/></button>
            </div>
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Tipo *</label>
                <select required value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                  style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 14 }}>
                  {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              {[
                { label: 'Titulo *', key: 'title', required: true },
                { label: 'Data *', key: 'date', type: 'date', required: true },
                { label: 'Produto', key: 'product' },
                { label: 'Dose', key: 'dose' },
                { label: 'Veterinario', key: 'veterinarian' },
                { label: 'Dias de Carencia', key: 'withdrawalDays', type: 'number' },
              ].map(({ label, key, type, required }) => (
                <div key={key}>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>{label}</label>
                  <input required={required} type={type || 'text'} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 14 }}/>
                </div>
              ))}
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Animal (opcional)</label>
                <select value={form.animalId} onChange={e => setForm({ ...form, animalId: e.target.value })}
                  style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 14 }}>
                  <option value="">Lote / Fazenda toda</option>
                  {animals.map(a => <option key={a.id} value={a.id}>{a.tag}{a.name ? ' - ' + a.name : ''} ({a.type})</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                  style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 14 }}>
                  <option value="DONE">Realizado</option><option value="SCHEDULED">Agendado</option>
                </select>
              </div>
              <button type="submit" className="btn-primary">Salvar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
