'use client'
import { useEffect, useState } from 'react'
import { Plus, X, Trash2 } from 'lucide-react'
import { useFarm } from '@/contexts/FarmContext'

const EMPTY = { category: 'FEED', description: '', date: new Date().toISOString().split('T')[0], amount: '', supplier: '', notes: '' }
const CATS: Record<string, string> = { FEED: 'Alimentação', MEDICINE: 'Medicamentos', EQUIPMENT: 'Equipamentos', LABOR: 'Mão de obra', OTHER: 'Outros' }
const BADGE: Record<string, string> = { FEED: 'badge-green', MEDICINE: 'badge-amber', EQUIPMENT: 'badge-gray', LABOR: 'badge-red', OTHER: 'badge-gray' }

export default function ExpensesPage() {
  const { farmParam, selectedFarmId } = useFarm()
  const [expenses, setExpenses] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<any>(EMPTY)
  const [catFilter, setCatFilter] = useState('')

  const load = () => fetch('/api/expenses' + farmParam).then(r => r.json()).then(setExpenses)
  useEffect(() => { load() }, [farmParam])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch('/api/expenses', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, amount: parseFloat(form.amount), farmId: selectedFarmId }) })
    setShowModal(false); setForm(EMPTY); load()
  }

  const del = async (id: string) => {
    if (!confirm('Remover despesa?')) return
    await fetch('/api/expenses?id=' + id, { method: 'DELETE' }); load()
  }

  const filtered = catFilter ? expenses.filter(e => e.category === catFilter) : expenses
  const total = filtered.reduce((s, e) => s + e.amount, 0)

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700 }}>Despesas</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Total: R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} /> Nova Despesa
        </button>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => setCatFilter('')} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: !catFilter ? 'var(--brand)' : 'transparent', color: !catFilter ? 'white' : 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>Todos</button>
          {Object.entries(CATS).map(([k, v]) => (
            <button key={k} onClick={() => setCatFilter(k)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: catFilter === k ? 'var(--brand)' : 'transparent', color: catFilter === k ? 'white' : 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>{v}</button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Data</th><th>Categoria</th><th>Descrição</th><th>Fornecedor</th><th>Valor</th><th>Ações</th></tr></thead>
            <tbody>
              {filtered.map(e => (
                <tr key={e.id}>
                  <td>{new Date(e.date).toLocaleDateString('pt-BR')}</td>
                  <td><span className={`badge ${BADGE[e.category] || 'badge-gray'}`}>{CATS[e.category] || e.category}</span></td>
                  <td style={{ fontWeight: 500 }}>{e.description}</td>
                  <td>{e.supplier || '—'}</td>
                  <td style={{ fontWeight: 600, color: 'var(--danger)' }}>R$ {e.amount.toFixed(2)}</td>
                  <td><button className="btn-danger" onClick={() => del(e.id)} style={{ padding: '4px 8px', fontSize: 12 }}><Trash2 size={14} /></button></td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Nenhuma despesa registrada</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600 }}>Nova Despesa</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group"><label>Categoria</label>
                  <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                    {Object.entries(CATS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div className="form-group"><label>Data</label><input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required /></div>
              </div>
              <div className="form-group"><label>Descrição *</label><input value={form.description} onChange={e => setForm({...form, description: e.target.value})} required /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group"><label>Valor (R$)</label><input type="number" step="0.01" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} required /></div>
                <div className="form-group"><label>Fornecedor</label><input value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})} /></div>
              </div>
              <div className="form-group"><label>Notas</label><textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} /></div>
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
