'use client'
import { useEffect, useState } from 'react'
import { Plus, X, Package, AlertTriangle, TrendingDown, Edit2, Trash2, Minus } from 'lucide-react'
import { useFarm } from '@/contexts/FarmContext'
import type { InventoryCategory } from '@/lib/types'

interface Item {
  id: string
  name: string
  category: InventoryCategory
  quantity: number
  unit: string
  minQuantity: number
  costPerUnit: number
  supplier?: string | null
  notes?: string | null
  status: 'OK' | 'LOW' | 'OUT'
}

const CAT_LABELS: Record<InventoryCategory, string> = {
  FEED: 'Alimentação', MEDICINE: 'Medicamento', EQUIPMENT: 'Equipamento',
  FUEL: 'Combustível', OTHER: 'Outro',
}
const CAT_COLORS: Record<InventoryCategory, string> = {
  FEED: '#22c55e', MEDICINE: '#3b82f6', EQUIPMENT: '#f59e0b', FUEL: '#ef4444', OTHER: '#8b5cf6',
}
const STATUS_STYLE = {
  OK:  { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  label: 'OK'     },
  LOW: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Baixo'  },
  OUT: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  label: 'Zerado' },
}

const CATS = Object.keys(CAT_LABELS) as InventoryCategory[]

const emptyForm = () => ({
  name: '', category: 'FEED' as InventoryCategory,
  quantity: '', unit: 'kg', minQuantity: '', costPerUnit: '', supplier: '', notes: '',
})

export default function InventoryPage() {
  const { farmParam, selectedFarmId } = useFarm()
  const [items,    setItems]    = useState<Item[]>([])
  const [loading,  setLoading]  = useState(true)
  const [modal,    setModal]    = useState<'add' | 'edit' | 'adjust' | null>(null)
  const [selected, setSelected] = useState<Item | null>(null)
  const [form,     setForm]     = useState(emptyForm())
  const [delta,    setDelta]    = useState('')
  const [saving,   setSaving]   = useState(false)
  const [catFilter, setCatFilter] = useState<InventoryCategory | ''>('')

  async function load() {
    setLoading(true)
    const cat = catFilter ? `&category=${catFilter}` : ''
    const res = await fetch(`/api/inventory${farmParam}${cat}`)
    const data = res.ok ? await res.json() : []
    setItems(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [farmParam, selectedFarmId, catFilter])

  async function handleSave() {
    if (!form.name || !form.quantity) return
    setSaving(true)
    const body = {
      name: form.name, category: form.category,
      quantity: Number(form.quantity), unit: form.unit,
      minQuantity: Number(form.minQuantity) || 0,
      costPerUnit: Number(form.costPerUnit) || 0,
      supplier: form.supplier || null,
      notes: form.notes || null,
    }
    if (modal === 'add') {
      await fetch('/api/inventory', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    } else {
      await fetch(`/api/inventory/${selected!.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    }
    setSaving(false); setModal(null); load()
  }

  async function handleAdjust() {
    if (!delta || !selected) return
    setSaving(true)
    await fetch(`/api/inventory/${selected.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delta: Number(delta) }),
    })
    setSaving(false); setModal(null); setDelta(''); load()
  }

  async function handleDelete(id: string) {
    await fetch(`/api/inventory/${id}`, { method: 'DELETE' })
    load()
  }

  const stockValue = items.reduce((s, i) => s + i.quantity * i.costPerUnit, 0)
  const lowCount   = items.filter(i => i.status !== 'OK').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1100 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700 }}>Estoque & Insumos</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Controle de ração, medicamentos, equipamentos e mais</p>
        </div>
        <button
          onClick={() => { setForm(emptyForm()); setModal('add') }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--brand)', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
        >
          <Plus size={16}/> Novo Item
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Package size={22} style={{ color: 'var(--brand)' }}/>
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Total de Itens</p>
            <p style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{items.length}</p>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <AlertTriangle size={22} style={{ color: '#f59e0b' }}/>
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Alertas de Estoque</p>
            <p style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)', color: lowCount > 0 ? '#f59e0b' : 'var(--text-primary)' }}>{lowCount}</p>
          </div>
        </div>
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <TrendingDown size={22} style={{ color: 'var(--brand)' }}/>
          <div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Valor do Estoque</p>
            <p style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-display)' }}>
              R$ {stockValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button onClick={() => setCatFilter('')} style={{ ...chipStyle, background: catFilter === '' ? 'var(--brand)' : 'transparent', color: catFilter === '' ? '#fff' : 'var(--text-muted)' }}>Todos</button>
        {CATS.map(c => (
          <button key={c} onClick={() => setCatFilter(c === catFilter ? '' : c)} style={{ ...chipStyle, background: catFilter === c ? CAT_COLORS[c] : 'transparent', color: catFilter === c ? '#fff' : 'var(--text-muted)', borderColor: CAT_COLORS[c] + '55' }}>
            {CAT_LABELS[c]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Nome', 'Categoria', 'Quantidade', 'Mínimo', 'Custo Unit.', 'Valor', 'Status', ''].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Carregando...</td></tr>
            ) : items.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Nenhum item cadastrado.</td></tr>
            ) : items.map(item => {
              const { color, bg, label } = STATUS_STYLE[item.status]
              return (
                <tr key={item.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <p style={{ fontSize: 13, fontWeight: 600 }}>{item.name}</p>
                    {item.supplier && <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.supplier}</p>}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: CAT_COLORS[item.category], background: CAT_COLORS[item.category] + '22', padding: '2px 8px', borderRadius: 5 }}>
                      {CAT_LABELS[item.category]}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>{item.quantity} {item.unit}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-muted)' }}>{item.minQuantity} {item.unit}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13 }}>
                    {item.costPerUnit > 0 ? `R$ ${item.costPerUnit.toFixed(2)}` : '—'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 500 }}>
                    {item.costPerUnit > 0 ? `R$ ${(item.quantity * item.costPerUnit).toFixed(2)}` : '—'}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color, background: bg, padding: '3px 8px', borderRadius: 5 }}>{label}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button title="Ajustar quantidade" onClick={() => { setSelected(item); setDelta(''); setModal('adjust') }} style={iconBtn}><Minus size={13}/></button>
                      <button title="Editar" onClick={() => { setSelected(item); setForm({ name: item.name, category: item.category, quantity: String(item.quantity), unit: item.unit, minQuantity: String(item.minQuantity), costPerUnit: String(item.costPerUnit), supplier: item.supplier ?? '', notes: item.notes ?? '' }); setModal('edit') }} style={iconBtn}><Edit2 size={13}/></button>
                      <button title="Excluir" onClick={() => handleDelete(item.id)} style={{ ...iconBtn, color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}><Trash2 size={13}/></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Add / Edit modal */}
      {(modal === 'add' || modal === 'edit') && (
        <div style={overlay}>
          <div className="card" style={{ width: '100%', maxWidth: 500 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>{modal === 'add' ? 'Novo Item' : 'Editar Item'}</h2>
              <button onClick={() => setModal(null)} style={closeBtn}><X size={16}/></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div>
                <label style={lbl}>Nome *</label>
                <input style={inp} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Ração concentrada"/>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={lbl}>Categoria *</label>
                  <select style={inp} value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as InventoryCategory }))}>
                    {CATS.map(c => <option key={c} value={c}>{CAT_LABELS[c]}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Unidade *</label>
                  <input style={inp} value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="kg, L, un, doses…"/>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={lbl}>Quantidade *</label>
                  <input type="number" style={inp} value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} min={0}/>
                </div>
                <div>
                  <label style={lbl}>Estoque Mínimo</label>
                  <input type="number" style={inp} value={form.minQuantity} onChange={e => setForm(f => ({ ...f, minQuantity: e.target.value }))} min={0}/>
                </div>
                <div>
                  <label style={lbl}>Custo Unit. (R$)</label>
                  <input type="number" style={inp} value={form.costPerUnit} onChange={e => setForm(f => ({ ...f, costPerUnit: e.target.value }))} min={0} step={0.01}/>
                </div>
              </div>
              <div>
                <label style={lbl}>Fornecedor</label>
                <input style={inp} value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))}/>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button onClick={() => setModal(null)} style={cancelBtn}>Cancelar</button>
              <button onClick={handleSave} disabled={saving || !form.name || !form.quantity} style={saveBtn}>{saving ? 'Salvando…' : 'Salvar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Adjust quantity modal */}
      {modal === 'adjust' && selected && (
        <div style={overlay}>
          <div className="card" style={{ width: '100%', maxWidth: 360 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>Ajustar Estoque</h2>
              <button onClick={() => setModal(null)} style={closeBtn}><X size={16}/></button>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: '1rem' }}>
              <b>{selected.name}</b> — atual: <b>{selected.quantity} {selected.unit}</b>
            </p>
            <label style={lbl}>Variação (use negativo para retirada)</label>
            <input type="number" style={inp} value={delta} onChange={e => setDelta(e.target.value)} placeholder="Ex: 50 ou -20"/>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button onClick={() => setModal(null)} style={cancelBtn}>Cancelar</button>
              <button onClick={handleAdjust} disabled={saving || !delta} style={saveBtn}>{saving ? 'Salvando…' : 'Confirmar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const chipStyle: React.CSSProperties = {
  padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
  border: '1px solid var(--border)', cursor: 'pointer', transition: 'all .15s',
}
const iconBtn: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 7, border: '1px solid var(--border)',
  background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: 'var(--text-muted)',
}
const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
  zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
}
const closeBtn: React.CSSProperties = {
  width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)',
  background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)',
}
const lbl: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)',
  marginBottom: 5, letterSpacing: '0.04em',
}
const inp: React.CSSProperties = {
  width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)',
  background: 'var(--bg-input, var(--bg-card))', color: 'var(--text-primary)', fontSize: 14, boxSizing: 'border-box',
}
const cancelBtn: React.CSSProperties = {
  flex: 1, padding: '10px', borderRadius: 8, border: '1px solid var(--border)',
  background: 'transparent', cursor: 'pointer', fontSize: 14, color: 'var(--text-muted)',
}
const saveBtn: React.CSSProperties = {
  flex: 2, padding: '10px', borderRadius: 8, border: 'none',
  background: 'var(--brand)', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600,
}
