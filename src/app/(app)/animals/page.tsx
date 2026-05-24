'use client'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Plus, Search, X, History } from 'lucide-react'
import { useFarm } from '@/contexts/FarmContext'

const TYPES    = [{ value: '', label: 'Todos' }, { value: 'DAIRY', label: 'Leiteiras' }, { value: 'SHEEP', label: 'Ovelhas' }, { value: 'BEEF', label: 'Bovinos' }]
const STATUSES = [{ value: 'ALL', label: 'Todos' }, { value: 'ACTIVE', label: 'Ativos' }, { value: 'SOLD', label: 'Vendidos' }, { value: 'DEAD', label: 'Mortos' }]
const EMPTY    = { tag: '', name: '', type: 'DAIRY', breed: '', gender: 'FEMALE', weight: '', status: 'ACTIVE', notes: '' }

export default function AnimalsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { farmParam, selectedFarmId } = useFarm()
  const [animals, setAnimals]         = useState<any[]>([])
  const [typeFilter, setTypeFilter]   = useState(searchParams.get('type') ?? '')
  const [statusFilter, setStatusFilter] = useState('ACTIVE')
  const [search, setSearch]           = useState('')
  const [showModal, setShowModal]     = useState(false)
  const [form, setForm]               = useState<any>(EMPTY)
  const [editId, setEditId]           = useState<string | null>(null)
  const [loading, setLoading]         = useState(false)

  const load = async () => {
    const p = new URLSearchParams()
    if (typeFilter) p.set('type', typeFilter)
    p.set('status', statusFilter)
    if (selectedFarmId) p.set('farmId', selectedFarmId)
    const r = await fetch('/api/animals?' + p)
    setAnimals(await r.json())
  }
  useEffect(() => { load() }, [typeFilter, statusFilter, farmParam])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const payload = { ...form, weight: form.weight ? parseFloat(form.weight) : null, farmId: selectedFarmId }
    if (editId) {
      await fetch('/api/animals/' + editId, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    } else {
      await fetch('/api/animals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    }
    setShowModal(false); setForm(EMPTY); setEditId(null); setLoading(false); load()
  }

  const del = async (id: string) => {
    if (!confirm('Remover animal? Esta ação não pode ser desfeita.')) return
    await fetch('/api/animals/' + id, { method: 'DELETE' })
    load()
  }

  const openEdit = (a: any) => {
    setForm({ tag: a.tag, name: a.name ?? '', type: a.type, breed: a.breed ?? '', gender: a.gender, weight: a.weight ?? '', status: a.status, notes: a.notes ?? '' })
    setEditId(a.id)
    setShowModal(true)
  }

  const filtered = animals.filter(a =>
    !search || a.tag.toLowerCase().includes(search.toLowerCase()) || (a.name && a.name.toLowerCase().includes(search.toLowerCase()))
  )

  const typeBadge  = (t: string) => ({ DAIRY: 'badge-green', SHEEP: 'badge-amber', BEEF: 'badge-red' }[t]  ?? 'badge-gray')
  const typeLabel  = (t: string) => ({ DAIRY: 'Leiteira',    SHEEP: 'Ovelha',      BEEF: 'Bovino'  }[t]  ?? t)
  const statusBadge = (s: string) => ({ ACTIVE: 'badge-green', SOLD: 'badge-amber', DEAD: 'badge-gray' }[s] ?? 'badge-gray')
  const statusLabel = (s: string) => ({ ACTIVE: 'Ativo',       SOLD: 'Vendido',     DEAD: 'Morto'   }[s] ?? s)

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700 }}>Animais</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>{filtered.length} animais</p>
        </div>
        <button className="btn-primary" onClick={() => { setForm(EMPTY); setEditId(null); setShowModal(true) }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} /> Novo Animal
        </button>
      </div>

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input placeholder="Buscar por tag ou nome..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 30 }} />
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            {TYPES.map(t => (
              <button key={t.value} onClick={() => setTypeFilter(t.value)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: typeFilter === t.value ? 'var(--brand)' : 'transparent', color: typeFilter === t.value ? 'white' : 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>
                {t.label}
              </button>
            ))}
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ width: 'auto' }}>
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table>
            <thead><tr><th>TAG</th><th>Nome</th><th>Tipo</th><th>Raça</th><th>Gênero</th><th>Peso</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>
              {filtered.map(a => (
                <tr key={a.id}>
                  <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>{a.tag}</td>
                  <td>{a.name || '—'}</td>
                  <td><span className={`badge ${typeBadge(a.type)}`}>{typeLabel(a.type)}</span></td>
                  <td>{a.breed || '—'}</td>
                  <td>{a.gender === 'FEMALE' ? 'Fêmea' : 'Macho'}</td>
                  <td>{a.weight ? `${a.weight} kg` : '—'}</td>
                  <td><span className={`badge ${statusBadge(a.status)}`}>{statusLabel(a.status)}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn-secondary" onClick={() => router.push(`/animals/${a.id}`)} style={{ padding: '4px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}><History size={12} /> Histórico</button>
                      <button className="btn-secondary" onClick={() => openEdit(a)} style={{ padding: '4px 10px', fontSize: 12 }}>Editar</button>
                      <button className="btn-danger"    onClick={() => del(a.id)}    style={{ padding: '4px 10px', fontSize: 12 }}>Remover</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Nenhum animal encontrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600 }}>{editId ? 'Editar Animal' : 'Novo Animal'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group"><label>TAG *</label><input value={form.tag} onChange={e => setForm({ ...form, tag: e.target.value })} required /></div>
                <div className="form-group"><label>Nome</label><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div className="form-group"><label>Tipo</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    <option value="DAIRY">Leiteira</option>
                    <option value="SHEEP">Ovelha</option>
                    <option value="BEEF">Bovino</option>
                  </select>
                </div>
                <div className="form-group"><label>Raça</label><input value={form.breed} onChange={e => setForm({ ...form, breed: e.target.value })} /></div>
                <div className="form-group"><label>Gênero</label>
                  <select value={form.gender} onChange={e => setForm({ ...form, gender: e.target.value })}>
                    <option value="FEMALE">Fêmea</option>
                    <option value="MALE">Macho</option>
                  </select>
                </div>
                <div className="form-group"><label>Peso (kg)</label><input type="number" step="0.1" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} /></div>
                <div className="form-group"><label>Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    <option value="ACTIVE">Ativo</option>
                    <option value="SOLD">Vendido</option>
                    <option value="DEAD">Morto</option>
                  </select>
                </div>
              </div>
              <div className="form-group"><label>Notas</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
