'use client'
import { useEffect, useState } from 'react'
import { Plus, X, AlertCircle } from 'lucide-react'
import { useFarm } from '@/contexts/FarmContext'

const TYPE_LABELS: Record<string, string> = { MILK: 'Leite', ANIMAL: 'Animal', WOOL: 'La', MEAT: 'Carne' }
const EMPTY = { type: 'MILK', date: new Date().toISOString().split('T')[0], quantity: '', unit: 'L', pricePerUnit: '', buyer: '', notes: '', animalIds: [] as string[] }

export default function SalesPage() {
  const { farmParam, selectedFarmId } = useFarm()
  const [sales, setSales] = useState<any[]>([])
  const [animals, setAnimals] = useState<any[]>([])
  const [milkBalance, setMilkBalance] = useState(0)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<any>(EMPTY)
  const [error, setError] = useState('')
  const fp = selectedFarmId ? '&farmId=' + selectedFarmId : ''

  const load = async () => {
    const [s, a, ms] = await Promise.all([
      fetch('/api/sales' + farmParam).then(x => x.json()),
      fetch('/api/animals?status=ACTIVE' + fp).then(x => x.json()),
      fetch('/api/milk-stock' + farmParam).then(x => x.json()),
    ])
    setSales(Array.isArray(s) ? s : [])
    setAnimals(Array.isArray(a) ? a : [])
    setMilkBalance(ms?.balance ?? 0)
  }
  useEffect(() => { load() }, [farmParam])

  const totalRevenue = sales.reduce((s, x) => s + x.total, 0)

  const toggleAnimal = (id: string) => {
    setForm((f: any) => ({ ...f, animalIds: f.animalIds.includes(id) ? f.animalIds.filter((x: string) => x !== id) : [...f.animalIds, id] }))
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const payload: any = { ...form, quantity: parseFloat(form.quantity), pricePerUnit: parseFloat(form.pricePerUnit), farmId: selectedFarmId }
    if (form.type !== 'ANIMAL') delete payload.animalIds
    const res = await fetch('/api/sales', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (!res.ok) { const d = await res.json(); setError(d.error || 'Erro ao salvar'); return }
    setShowModal(false); setForm(EMPTY); setError(''); load()
  }

  const typeBadge = (t: string) => ({ MILK: 'badge-green', ANIMAL: 'badge-amber', WOOL: 'badge-gray', MEAT: 'badge-red' }[t] || 'badge-gray')
  const activeAnimals = animals.filter(a => a.status === 'ACTIVE')

  return (
    <div style={{ maxWidth: 1000 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700 }}>Vendas</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Leite, animais, la e carne</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16}/> Nova Venda
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Receita Total</p>
          <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--brand)' }}>R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="card">
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total de Vendas</p>
          <p style={{ fontSize: 22, fontWeight: 700 }}>{sales.length}</p>
        </div>
        <div className="card">
          <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Saldo Leite</p>
          <p style={{ fontSize: 22, fontWeight: 700, color: milkBalance > 0 ? 'var(--brand)' : 'var(--danger)' }}>{milkBalance.toFixed(1)} L</p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>disponivel para venda</p>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Data','Tipo','Qtd','Preco Unit.','Total','Comprador','Obs'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {sales.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 14px', fontSize: 13, whiteSpace: 'nowrap' }}>{new Date(s.date + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                  <td style={{ padding: '10px 14px' }}><span className={typeBadge(s.type)} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, fontWeight: 600 }}>{TYPE_LABELS[s.type] || s.type}</span></td>
                  <td style={{ padding: '10px 14px', fontSize: 13 }}>{s.quantity} {s.unit}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13 }}>R$ {Number(s.pricePerUnit).toFixed(2)}</td>
                  <td style={{ padding: '10px 14px', fontSize: 14, fontWeight: 700, color: 'var(--brand)' }}>R$ {Number(s.total).toFixed(2)}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-muted)' }}>{s.buyer || '—'}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-muted)' }}>{s.notes || '—'}</td>
                </tr>
              ))}
              {sales.length === 0 && <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Nenhuma venda registrada.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '1rem' }}>
          <div className="card" style={{ width: 480, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>Nova Venda</h2>
              <button onClick={() => { setShowModal(false); setError('') }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18}/></button>
            </div>

            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--danger)22', border: '1px solid var(--danger)', borderRadius: 8, padding: '10px 14px', marginBottom: '1rem' }}>
                <AlertCircle size={16} style={{ color: 'var(--danger)', flexShrink: 0 }}/>
                <p style={{ fontSize: 13, color: 'var(--danger)' }}>{error}</p>
              </div>
            )}

            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Tipo de Venda *</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {Object.entries(TYPE_LABELS).map(([k, v]) => (
                    <button key={k} type="button" onClick={() => setForm({ ...EMPTY, type: k })} style={{
                      flex: 1, padding: '8px 0', borderRadius: 7, border: '2px solid', cursor: 'pointer', fontSize: 12, fontWeight: form.type === k ? 700 : 400,
                      borderColor: form.type === k ? 'var(--brand)' : 'var(--border)',
                      background: form.type === k ? 'var(--brand)22' : 'var(--bg-input)',
                      color: form.type === k ? 'var(--brand)' : 'var(--text-muted)',
                    }}>{v}</button>
                  ))}
                </div>
              </div>

              {form.type === 'MILK' && (
                <div style={{ background: 'var(--brand)11', borderRadius: 8, padding: '8px 12px', fontSize: 12, color: 'var(--text-muted)' }}>
                  Saldo disponivel: <strong style={{ color: 'var(--brand)' }}>{milkBalance.toFixed(1)} L</strong>
                </div>
              )}

              {form.type === 'ANIMAL' && (
                <div>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 6 }}>Selecione os animais vendidos: <span style={{ color: 'var(--danger)' }}>*</span></label>
                  <p style={{ fontSize: 11, color: '#f59e0b', marginBottom: 8 }}>Os animais selecionados serao marcados como VENDIDOS automaticamente.</p>
                  <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 7, padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {activeAnimals.map(a => (
                      <label key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 4px', borderRadius: 5, background: form.animalIds.includes(a.id) ? 'var(--brand)11' : 'transparent' }}>
                        <input type="checkbox" checked={form.animalIds.includes(a.id)} onChange={() => toggleAnimal(a.id)} style={{ accentColor: 'var(--brand)' }}/>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{a.tag}</span>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{a.name ? '- ' + a.name : ''} ({a.type}) {a.weight ? '| ' + a.weight + ' kg' : ''}</span>
                      </label>
                    ))}
                    {activeAnimals.length === 0 && <p style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>Nenhum animal ativo.</p>}
                  </div>
                  {form.animalIds.length > 0 && <p style={{ fontSize: 12, color: 'var(--brand)', marginTop: 4 }}>{form.animalIds.length} animal(is) selecionado(s)</p>}
                </div>
              )}

              {[
                { label: 'Data *', key: 'date', type: 'date', required: true },
                { label: form.type === 'MILK' ? 'Quantidade (L) *' : 'Quantidade (kg ou cab.) *', key: 'quantity', type: 'number', required: true },
                { label: 'Preco por Unidade (R$) *', key: 'pricePerUnit', type: 'number', required: true },
                { label: 'Comprador', key: 'buyer' },
                { label: 'Observacoes', key: 'notes' },
              ].map(({ label, key, type, required }) => (
                <div key={key}>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>{label}</label>
                  <input required={required} type={type || 'text'} step="0.01" value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 14 }}/>
                </div>
              ))}

              {form.quantity && form.pricePerUnit && (
                <div style={{ background: 'var(--brand)11', borderRadius: 8, padding: '10px 14px' }}>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Total calculado: <strong style={{ color: 'var(--brand)', fontSize: 16 }}>R$ {(parseFloat(form.quantity) * parseFloat(form.pricePerUnit)).toFixed(2)}</strong></p>
                </div>
              )}

              <button type="submit" className="btn-primary">Registrar Venda</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
