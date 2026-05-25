'use client'
import { useEffect, useState } from 'react'
import { Plus, X, Heart } from 'lucide-react'
import { useFarm } from '@/contexts/FarmContext'

const TYPE_LABELS: Record<string, string> = { INSEMINATION: 'Inseminacao', PREGNANCY_CHECK: 'Diagnostico', CALVING: 'Parto', DRY_OFF: 'Secagem' }
const TYPE_COLORS: Record<string, string> = { INSEMINATION: '#ec4899', PREGNANCY_CHECK: '#3b82f6', CALVING: 'var(--brand)', DRY_OFF: '#f59e0b' }
const RESULT_LABELS: Record<string, string> = { PREGNANT: 'Prenhe', OPEN: 'Vazia', POSITIVE: 'Positivo', NEGATIVE: 'Negativo' }
const RESULT_COLORS: Record<string, string> = { PREGNANT: 'var(--brand)', OPEN: 'var(--danger)', POSITIVE: 'var(--brand)', NEGATIVE: 'var(--danger)' }
const EMPTY = { animalId: '', type: 'INSEMINATION', date: new Date().toISOString().split('T')[0], result: '', bullId: '', notes: '' }

export default function ReproductionPage() {
  const { farmParam, selectedFarmId } = useFarm()
  const [events, setEvents] = useState<any[]>([])
  const [animals, setAnimals] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<any>(EMPTY)
  const [filter, setFilter] = useState('ALL')
  const fp = selectedFarmId ? '&farmId=' + selectedFarmId : ''

  const load = async () => {
    const [r, a] = await Promise.all([
      fetch('/api/reproduction' + farmParam).then(x => x.json()),
      fetch('/api/animals?type=DAIRY&status=ACTIVE' + fp).then(x => x.json()),
    ])
    setEvents(Array.isArray(r) ? r : [])
    setAnimals(Array.isArray(a) ? a : [])
  }
  useEffect(() => { load() }, [farmParam])

  const pregnant = events.filter(e => e.result === 'PREGNANT').map(e => e.animalId)
  const uniquePregnant = [...new Set(pregnant)].length
  const calvings = events.filter(e => e.type === 'CALVING').length

  const filtered = filter === 'ALL' ? events : events.filter(e => e.type === filter)

  const save = async (ev: React.FormEvent) => {
    ev.preventDefault()
    await fetch('/api/reproduction', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, farmId: selectedFarmId, result: form.result || undefined, bullId: form.bullId || undefined }) })
    setShowModal(false); setForm(EMPTY); load()
  }

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700 }}>Reproducao</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>IATF, diagnostico de gestacao e partos</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16}/> Novo Evento
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Eventos', value: events.length, color: 'var(--brand)' },
          { label: 'Inseminacoes', value: events.filter(e => e.type === 'INSEMINATION').length, color: '#ec4899' },
          { label: 'Prenhas', value: uniquePregnant, color: 'var(--brand)' },
          { label: 'Partos', value: calvings, color: '#3b82f6' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Heart size={20} style={{ color, flexShrink: 0 }}/>
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</p>
              <p style={{ fontSize: 20, fontWeight: 700, color }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', flexWrap: 'wrap' }}>
        {['ALL', 'INSEMINATION', 'PREGNANCY_CHECK', 'CALVING', 'DRY_OFF'].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: filter === f ? 600 : 400,
            background: filter === f ? (TYPE_COLORS[f] || 'var(--brand)') : 'var(--bg-card)',
            color: filter === f ? (f === 'ALL' ? '#000' : '#fff') : 'var(--text-muted)',
          }}>{f === 'ALL' ? 'Todos' : TYPE_LABELS[f]}</button>
        ))}
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
            {['Data','Tipo','Animal','Resultado','Touro/Semen','Observacoes'].map(h => (
              <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>{h}</th>
            ))}
          </tr></thead>
          <tbody>
            {filtered.map(e => (
              <tr key={e.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 14px', fontSize: 13, whiteSpace: 'nowrap' }}>{new Date(e.date + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                <td style={{ padding: '10px 14px' }}>
                  <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, background: (TYPE_COLORS[e.type] || 'var(--brand)') + '22', color: TYPE_COLORS[e.type] || 'var(--brand)', fontWeight: 600 }}>{TYPE_LABELS[e.type] || e.type}</span>
                </td>
                <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600 }}>{e.animal?.tag || e.animalId}</td>
                <td style={{ padding: '10px 14px' }}>
                  {e.result
                    ? <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, background: (RESULT_COLORS[e.result] || 'var(--brand)') + '22', color: RESULT_COLORS[e.result] || 'var(--brand)', fontWeight: 600 }}>{RESULT_LABELS[e.result] || e.result}</span>
                    : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                </td>
                <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-muted)' }}>{e.bullId || '—'}</td>
                <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-muted)' }}>{e.notes || '—'}</td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Nenhum evento reprodutivo.</td></tr>}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ width: 420 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>Novo Evento Reprodutivo</h2>
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
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Tipo *</label>
                <select required value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                  style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 14 }}>
                  {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              {[{ label: 'Data *', key: 'date', type: 'date' }, { label: 'Touro / Semen', key: 'bullId' }, { label: 'Observacoes', key: 'notes' }].map(({ label, key, type }) => (
                <div key={key}>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>{label}</label>
                  <input required={key === 'date'} type={type || 'text'} value={form[key] || ''} onChange={e => setForm({ ...form, [key]: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 14 }}/>
                </div>
              ))}
              {(form.type === 'PREGNANCY_CHECK') && (
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Resultado</label>
                  <select value={form.result} onChange={e => setForm({ ...form, result: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 14 }}>
                    <option value="">Selecione...</option>
                    <option value="PREGNANT">Prenhe</option><option value="OPEN">Vazia</option>
                  </select>
                </div>
              )}
              <button type="submit" className="btn-primary">Registrar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
