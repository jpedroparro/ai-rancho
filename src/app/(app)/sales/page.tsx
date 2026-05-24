'use client'
import { useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { useFarm } from '@/contexts/FarmContext'

const EMPTY = { type: 'MILK', date: new Date().toISOString().split('T')[0], quantity: '', unit: 'L', pricePerUnit: '', buyer: '', notes: '' }
const TYPE_LABELS: Record<string, string> = { MILK: 'Leite', ANIMAL: 'Animal', WOOL: 'Lã', MEAT: 'Carne' }

export default function SalesPage() {
  const { farmParam, selectedFarmId } = useFarm()
  const [sales, setSales] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<any>(EMPTY)

  const load = () => fetch('/api/sales' + farmParam).then(r => r.json()).then(setSales)
  useEffect(() => { load() }, [farmParam])

  const totalRevenue = sales.reduce((s, x) => s + x.total, 0)

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch('/api/sales', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, quantity: parseFloat(form.quantity), pricePerUnit: parseFloat(form.pricePerUnit), farmId: selectedFarmId }) })
    setShowModal(false); setForm(EMPTY); load()
  }

  const typeBadge = (t: string) => ({ MILK: 'badge-green', ANIMAL: 'badge-amber', WOOL: 'badge-gray', MEAT: 'badge-red' }[t] || 'badge-gray')

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700 }}>Vendas</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Total: R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} /> Nova Venda
        </button>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Data</th><th>Tipo</th><th>Quantidade</th><th>Preço Unit.</th><th>Total</th><th>Comprador</th><th>Notas</th></tr></thead>
            <tbody>
              {sales.map(s => (
                <tr key={s.id}>
                  <td>{new Date(s.date).toLocaleDateString('pt-BR')}</td>
                  <td><span className={`badge ${typeBadge(s.type)}`}>{TYPE_LABELS[s.type] || s.type}</span></td>
                  <td>{s.quantity} {s.unit}</td>
                  <td>R$ {s.pricePerUnit.toFixed(2)}</td>
                  <td style={{ fontWeight: 600, color: 'var(--brand)' }}>R$ {s.total.toFixed(2)}</td>
                  <td>{s.buyer || '—'}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{s.notes || '—'}</td>
                </tr>
              ))}
              {sales.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Nenhuma venda registrada</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600 }}>Nova Venda</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group"><label>Tipo</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    <option value="MILK">Leite</option><option value="ANIMAL">Animal</option><option value="WOOL">Lã</option><option value="MEAT">Carne</option>
                  </select>
                </div>
                <div className="form-group"><label>Data</label><input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required /></div>
                <div className="form-group"><label>Quantidade</label><input type="number" step="0.01" value={form.quantity} onChange={e => setForm({...form, quantity: e.target.value})} required /></div>
                <div className="form-group"><label>Unidade</label>
                  <select value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}>
                    <option value="L">Litros (L)</option><option value="kg">Quilos (kg)</option><option value="un">Unidade (un)</option>
                  </select>
                </div>
                <div className="form-group"><label>Preço por Unidade (R$)</label><input type="number" step="0.01" value={form.pricePerUnit} onChange={e => setForm({...form, pricePerUnit: e.target.value})} required /></div>
                <div className="form-group"><label>Comprador</label><input value={form.buyer} onChange={e => setForm({...form, buyer: e.target.value})} /></div>
              </div>
              {form.quantity && form.pricePerUnit && (
                <div style={{ background: 'var(--brand-pale)', padding: '8px 12px', borderRadius: 8, fontSize: 14, color: 'var(--brand)' }}>
                  Total: R$ {(parseFloat(form.quantity) * parseFloat(form.pricePerUnit)).toFixed(2)}
                </div>
              )}
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
