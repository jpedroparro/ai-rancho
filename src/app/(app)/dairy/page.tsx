'use client'
import { useEffect, useState } from 'react'
import { Plus, X, Milk } from 'lucide-react'
import { useFarm } from '@/contexts/FarmContext'

const EMPTY_MILK = { animalId: '', date: new Date().toISOString().split('T')[0], morning: '', evening: '', notes: '' }
const EMPTY_COW  = { tag: '', name: '', breed: '' }

export default function DairyPage() {
  const { farmParam, selectedFarmId } = useFarm()
  const [animals, setAnimals] = useState<any[]>([])
  const [records, setRecords] = useState<any[]>([])
  const [showForm, setShowForm] = useState<'animal' | 'milk' | null>(null)
  const [cowForm, setCowForm]   = useState<any>(EMPTY_COW)
  const [milkForm, setMilkForm] = useState<any>(EMPTY_MILK)
  const [loading, setLoading]   = useState(true)

  const loadAll = async () => {
    const fp = selectedFarmId ? `&farmId=${selectedFarmId}` : ''
    const [a, m] = await Promise.all([
      fetch(`/api/animals?type=DAIRY&status=ACTIVE${fp}`).then(r => r.json()),
      fetch(`/api/milk?days=30${fp}`).then(r => r.json()),
    ])
    setAnimals(a)
    setRecords(m)
    setLoading(false)
  }
  useEffect(() => { loadAll() }, [farmParam])

  const saveCow = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch('/api/animals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...cowForm, type: 'DAIRY', gender: 'FEMALE', farmId: selectedFarmId }),
    })
    setCowForm(EMPTY_COW)
    setShowForm(null)
    loadAll()
  }

  const saveMilk = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch('/api/milk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...milkForm, morning: parseFloat(milkForm.morning) || 0, evening: parseFloat(milkForm.evening) || 0, farmId: selectedFarmId }),
    })
    setMilkForm(EMPTY_MILK)
    setShowForm(null)
    loadAll()
  }

  const today = new Date().toISOString().split('T')[0]
  const totalToday = records.filter(r => r.date?.startsWith(today)).reduce((s, r) => s + r.total, 0)
  const totalMonth = records.reduce((s, r) => s + r.total, 0)
  const avgPerCow  = animals.length > 0 ? totalMonth / animals.length : 0

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <p style={{ color: 'var(--text-muted)' }}>Carregando...</p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1100, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700 }}>Leiteira</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>{animals.length} vacas ativas</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn-secondary"
            onClick={() => { setMilkForm(EMPTY_MILK); setShowForm('milk') }}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Milk size={16} /> Registrar Leite
          </button>
          <button
            className="btn-primary"
            onClick={() => { setCowForm(EMPTY_COW); setShowForm('animal') }}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={16} /> Nova Vaca
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Vacas ativas',      value: animals.length },
          { label: 'Produção hoje',     value: `${totalToday.toFixed(1)} L`,             color: '#3b82f6' },
          { label: 'Últimos 30 dias',   value: `${totalMonth.toFixed(1)} L`,             color: 'var(--brand)' },
          { label: 'Média por vaca',    value: `${avgPerCow.toFixed(1)} L`,              color: 'var(--accent)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{s.label}</p>
            <p style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', color: s.color ?? 'var(--text-primary)' }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>Vacas Cadastradas</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
          {animals.map(a => (
            <div key={a.id} className="card" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                <span style={{ fontFamily: 'monospace', fontSize: 11, background: 'var(--brand-pale)', color: 'var(--brand)', padding: '2px 8px', borderRadius: 6 }}>#{a.tag}</span>
                <span className="badge badge-green" style={{ fontSize: 11 }}>Ativa</span>
              </div>
              <p style={{ fontWeight: 600, fontSize: 14 }}>{a.name || `Vaca ${a.tag}`}</p>
              {a.breed && <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{a.breed}</p>}
            </div>
          ))}
          {animals.length === 0 && (
            <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Nenhuma vaca cadastrada.</p>
          )}
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, marginBottom: '1rem' }}>Registros Recentes</h2>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Data</th><th>Animal</th><th>Manhã (L)</th><th>Tarde (L)</th><th>Total (L)</th><th>Notas</th></tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id}>
                  <td>{new Date(r.date).toLocaleDateString('pt-BR')}</td>
                  <td style={{ fontWeight: 500 }}>{r.animal?.name || r.animal?.tag || '—'}</td>
                  <td>{r.morning.toFixed(1)}</td>
                  <td>{r.evening.toFixed(1)}</td>
                  <td style={{ fontWeight: 600, color: 'var(--brand)' }}>{r.total.toFixed(1)}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{r.notes || '—'}</td>
                </tr>
              ))}
              {records.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Nenhum registro encontrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="modal-overlay">
          <div className="modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600 }}>
                {showForm === 'animal' ? 'Nova Vaca' : 'Registrar Produção'}
              </h2>
              <button onClick={() => setShowForm(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            {showForm === 'animal' ? (
              <form onSubmit={saveCow} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div className="form-group"><label>Brinco/TAG *</label><input value={cowForm.tag} onChange={e => setCowForm({ ...cowForm, tag: e.target.value })} placeholder="LT-004" required /></div>
                <div className="form-group"><label>Nome</label><input value={cowForm.name} onChange={e => setCowForm({ ...cowForm, name: e.target.value })} placeholder="Mimosa" /></div>
                <div className="form-group"><label>Raça</label><input value={cowForm.breed} onChange={e => setCowForm({ ...cowForm, breed: e.target.value })} placeholder="Holandesa, Girolando..." /></div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowForm(null)}>Cancelar</button>
                  <button type="submit" className="btn-primary">Salvar</button>
                </div>
              </form>
            ) : (
              <form onSubmit={saveMilk} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div className="form-group">
                  <label>Animal *</label>
                  <select value={milkForm.animalId} onChange={e => setMilkForm({ ...milkForm, animalId: e.target.value })} required>
                    <option value="">Selecionar...</option>
                    {animals.map(a => <option key={a.id} value={a.id}>{a.tag} — {a.name || 'Sem nome'}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Data</label><input type="date" value={milkForm.date} onChange={e => setMilkForm({ ...milkForm, date: e.target.value })} required /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group"><label>Manhã (L)</label><input type="number" step="0.1" min="0" value={milkForm.morning} onChange={e => setMilkForm({ ...milkForm, morning: e.target.value })} /></div>
                  <div className="form-group"><label>Tarde (L)</label><input type="number" step="0.1" min="0" value={milkForm.evening} onChange={e => setMilkForm({ ...milkForm, evening: e.target.value })} /></div>
                </div>
                <div className="form-group"><label>Notas</label><input value={milkForm.notes} onChange={e => setMilkForm({ ...milkForm, notes: e.target.value })} /></div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowForm(null)}>Cancelar</button>
                  <button type="submit" className="btn-primary">Salvar</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
