'use client'
import { useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useFarm } from '@/contexts/FarmContext'

const EMPTY = { animalId: '', date: new Date().toISOString().split('T')[0], morning: '', evening: '', notes: '' }

export default function MilkPage() {
  const { farmParam, selectedFarmId } = useFarm()
  const [records, setRecords] = useState<any[]>([])
  const [animals, setAnimals] = useState<any[]>([])
  const [days, setDays] = useState(14)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<any>(EMPTY)

  const load = async () => {
    const fp = selectedFarmId ? `&farmId=${selectedFarmId}` : ''
    const [r, a] = await Promise.all([
      fetch(`/api/milk?days=${days}${fp}`).then(r => r.json()),
      fetch(`/api/animals?type=DAIRY&status=ACTIVE${fp}`).then(r => r.json()),
    ])
    setRecords(r); setAnimals(a)
  }
  useEffect(() => { load() }, [days, farmParam])

  const totalToday = records.filter(r => new Date(r.date).toDateString() === new Date().toDateString()).reduce((s, r) => s + r.total, 0)
  const totalPeriod = records.reduce((s, r) => s + r.total, 0)

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch('/api/milk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, morning: parseFloat(form.morning) || 0, evening: parseFloat(form.evening) || 0, farmId: selectedFarmId }) })
    setShowModal(false); setForm(EMPTY); load()
  }

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700 }}>Produção de Leite</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Controle diário</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} /> Registrar
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Hoje', value: `${totalToday.toFixed(1)} L` },
          { label: `Últimos ${days} dias`, value: `${totalPeriod.toFixed(1)} L` },
          { label: 'Média/dia', value: `${(totalPeriod / days).toFixed(1)} L` },
          { label: 'Leiteiras ativas', value: animals.length },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{s.label}</p>
            <p style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {[7, 14, 30].map(d => (
            <button key={d} onClick={() => setDays(d)} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)', background: days === d ? 'var(--brand)' : 'transparent', color: days === d ? 'white' : 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>
              {d} dias
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Data</th><th>Animal</th><th>Manhã (L)</th><th>Tarde (L)</th><th>Total (L)</th><th>Notas</th></tr></thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id}>
                  <td>{new Date(r.date).toLocaleDateString('pt-BR')}</td>
                  <td style={{ fontWeight: 500 }}>{r.animal?.name || r.animal?.tag}</td>
                  <td>{r.morning.toFixed(1)}</td>
                  <td>{r.evening.toFixed(1)}</td>
                  <td style={{ fontWeight: 600, color: 'var(--brand)' }}>{r.total.toFixed(1)}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{r.notes || '—'}</td>
                </tr>
              ))}
              {records.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Nenhum registro encontrado</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600 }}>Registrar Produção</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div className="form-group"><label>Animal *</label>
                <select value={form.animalId} onChange={e => setForm({...form, animalId: e.target.value})} required>
                  <option value="">Selecionar animal...</option>
                  {animals.map(a => <option key={a.id} value={a.id}>{a.tag} — {a.name || 'Sem nome'}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Data</label><input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group"><label>Manhã (L)</label><input type="number" step="0.1" min="0" value={form.morning} onChange={e => setForm({...form, morning: e.target.value})} /></div>
                <div className="form-group"><label>Tarde (L)</label><input type="number" step="0.1" min="0" value={form.evening} onChange={e => setForm({...form, evening: e.target.value})} /></div>
              </div>
              <div className="form-group"><label>Notas</label><input value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
