'use client'
import { useState } from 'react'
import { Plus, Tractor, MapPin, Ruler, Pencil, Trash2, X } from 'lucide-react'
import { useFarm, type Farm } from '@/contexts/FarmContext'

const EMPTY = { name: '', location: '', hectares: '', description: '' }

export default function FarmsPage() {
  const { farms, reloadFarms, setSelectedFarmId } = useFarm()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<any>(EMPTY)
  const [editId, setEditId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const payload = {
      name: form.name.trim(),
      location: form.location || null,
      hectares: form.hectares ? parseFloat(form.hectares) : null,
      description: form.description || null,
    }
    if (editId) {
      await fetch(`/api/farms/${editId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    } else {
      const res = await fetch('/api/farms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (res.ok) {
        const created: Farm = await res.json()
        setSelectedFarmId(created.id)
      }
    }
    setShowModal(false)
    setForm(EMPTY)
    setEditId(null)
    setLoading(false)
    await reloadFarms()
  }

  const del = async (id: string) => {
    if (!confirm('Excluir fazenda? Isso não remove os dados associados a ela.')) return
    await fetch(`/api/farms/${id}`, { method: 'DELETE' })
    await reloadFarms()
  }

  const openEdit = (f: Farm) => {
    setForm({ name: f.name, location: f.location ?? '', hectares: f.hectares?.toString() ?? '', description: f.description ?? '' })
    setEditId(f.id)
    setShowModal(true)
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700 }}>Minhas Fazendas</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>{farms.length} fazenda{farms.length !== 1 ? 's' : ''} cadastrada{farms.length !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={() => { setForm(EMPTY); setEditId(null); setShowModal(true) }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16} /> Nova Fazenda
        </button>
      </div>

      {farms.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <Tractor size={48} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Nenhuma fazenda cadastrada</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: '1.5rem' }}>Cadastre sua primeira fazenda para começar a organizar seus dados.</p>
          <button className="btn-primary" onClick={() => { setForm(EMPTY); setEditId(null); setShowModal(true) }} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Plus size={16} /> Cadastrar Fazenda
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {farms.map(farm => (
            <div key={farm.id} className="card" style={{ position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--brand)22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Tractor size={20} style={{ color: 'var(--brand)' }} />
                  </div>
                  <div>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600 }}>{farm.name}</h3>
                    {farm.location && (
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={11} /> {farm.location}
                      </p>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 4 }}>
                  <button onClick={() => openEdit(farm)} style={{ width: 30, height: 30, borderRadius: 6, background: 'transparent', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    <Pencil size={13} />
                  </button>
                  <button onClick={() => del(farm.id)} style={{ width: 30, height: 30, borderRadius: 6, background: 'transparent', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {farm.hectares && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>
                  <Ruler size={13} /> {farm.hectares.toLocaleString('pt-BR')} ha
                </div>
              )}
              {farm.description && (
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>{farm.description}</p>
              )}

              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 12 }}>
                Criada em {new Date(farm.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600 }}>{editId ? 'Editar Fazenda' : 'Nova Fazenda'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={20} /></button>
            </div>
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
              <div className="form-group">
                <label>Nome *</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Fazenda Santa Maria" required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Localização</label>
                  <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Cidade, Estado" />
                </div>
                <div className="form-group">
                  <label>Área (hectares)</label>
                  <input type="number" step="0.01" value={form.hectares} onChange={e => setForm({ ...form, hectares: e.target.value })} placeholder="Ex: 150.5" />
                </div>
              </div>
              <div className="form-group">
                <label>Descrição</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Descrição opcional da fazenda..." />
              </div>
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
