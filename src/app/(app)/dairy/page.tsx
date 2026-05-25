'use client'
import { useEffect, useState, useMemo } from 'react'
import { Plus, X, Droplets, Activity, Heart } from 'lucide-react'
import { useFarm } from '@/contexts/FarmContext'
import Link from 'next/link'

const STATUS_LABEL: Record<string, string> = { ACTIVE: 'Ativa', SOLD: 'Vendida', DEAD: 'Morta' }
const STATUS_COLOR: Record<string, string> = { ACTIVE: 'var(--brand)', SOLD: '#f59e0b', DEAD: 'var(--danger)' }

function calcDEL(lastCalvingDate?: string | null): number | null {
  if (!lastCalvingDate) return null
  return Math.floor((Date.now() - new Date(lastCalvingDate + 'T12:00:00').getTime()) / 86400000)
}

function delStatus(del: number | null) {
  if (del === null) return { label: 'Sem parto', color: 'var(--text-muted)' }
  if (del <= 100) return { label: 'Inicio lactacao', color: '#3b82f6' }
  if (del <= 200) return { label: 'Pico passado', color: 'var(--brand)' }
  if (del <= 305) return { label: 'Fim lactacao', color: '#f59e0b' }
  return { label: 'Secar (>' + del + 'd)', color: 'var(--danger)' }
}

const EMPTY = { tag: '', name: '', breed: '', birthDate: '', weight: '', notes: '' }

export default function DairyPage() {
  const { farmParam, selectedFarmId } = useFarm()
  const [animals, setAnimals] = useState<any[]>([])
  const [milkToday, setMilkToday] = useState<Record<string, number>>({})
  const [reproEvents, setReproEvents] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState<any>(EMPTY)
  const [search, setSearch] = useState('')

  const fp = selectedFarmId ? '&farmId=' + selectedFarmId : ''
  const today = new Date().toISOString().split('T')[0]

  const load = async () => {
    const [a, m, r] = await Promise.all([
      fetch('/api/animals?type=DAIRY&status=ACTIVE' + fp).then(x => x.json()),
      fetch('/api/milk?start=' + today + '&end=' + today + fp).then(x => x.json()),
      fetch('/api/reproduction' + farmParam).then(x => x.json()),
    ])
    setAnimals(Array.isArray(a) ? a : [])
    const todayMap: Record<string, number> = {}
    if (Array.isArray(m)) m.forEach((r: any) => { todayMap[r.animalId] = (todayMap[r.animalId] || 0) + r.total })
    setMilkToday(todayMap)
    setReproEvents(Array.isArray(r) ? r : [])
  }

  useEffect(() => { load() }, [farmParam])

  const lastCalvingByAnimal = useMemo(() => {
    const map: Record<string, string> = {}
    reproEvents.filter((e: any) => e.type === 'CALVING').forEach((e: any) => {
      if (!map[e.animalId] || e.date > map[e.animalId]) map[e.animalId] = e.date
    })
    return map
  }, [reproEvents])

  const filtered = animals.filter(a =>
    a.tag.toLowerCase().includes(search.toLowerCase()) ||
    (a.name || '').toLowerCase().includes(search.toLowerCase())
  )

  const totalToday = filtered.reduce((s, a) => s + (milkToday[a.id] || 0), 0)
  const alertDEL = filtered.filter(a => { const d = calcDEL(lastCalvingByAnimal[a.id]); return d !== null && d > 305 }).length

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch('/api/animals', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, type: 'DAIRY', gender: 'FEMALE', status: 'ACTIVE', weight: parseFloat(form.weight) || null, farmId: selectedFarmId }) })
    setShowModal(false); setForm(EMPTY); load()
  }

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700 }}>Gado de Leite</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Controle individual de lactacao e reproducao</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={16}/> Nova Vaca
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Em Lactacao', value: filtered.length, color: 'var(--brand)', icon: Droplets },
          { label: 'Leite Hoje', value: totalToday.toFixed(1) + ' L', color: '#3b82f6', icon: Activity },
          { label: 'Media/Vaca', value: filtered.length ? (totalToday / filtered.length).toFixed(1) + ' L' : '0 L', color: '#8b5cf6', icon: Droplets },
          { label: 'Alertas DEL', value: alertDEL, color: alertDEL > 0 ? 'var(--danger)' : 'var(--text-muted)', icon: Heart },
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

      <div className="card" style={{ padding: 0 }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por brinco ou nome..." style={{ flex: 1, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 7, padding: '7px 12px', color: 'var(--text-primary)', fontSize: 14 }}/>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{filtered.length} vacas</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Brinco', 'Nome', 'Raca', 'Peso (kg)', 'DEL', 'Status DEL', 'Hoje (L)', 'Acoes'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => {
                const del = calcDEL(lastCalvingByAnimal[a.id])
                const ds = delStatus(del)
                const todayL = milkToday[a.id] || 0
                return (
                  <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, fontSize: 13 }}>{a.tag}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13 }}>{a.name || '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-muted)' }}>{a.breed || '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13 }}>{a.weight ? a.weight + ' kg' : '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600 }}>{del !== null ? del + 'd' : '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, background: ds.color + '22', color: ds.color, fontWeight: 600 }}>{ds.label}</span>
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 14, fontWeight: 700, color: todayL > 0 ? 'var(--brand)' : 'var(--text-muted)' }}>{todayL > 0 ? todayL.toFixed(1) + ' L' : '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <Link href={'/animals/' + a.id} style={{ fontSize: 12, color: 'var(--brand)', textDecoration: 'none' }}>Ver ficha</Link>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Nenhuma vaca leiteira cadastrada.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ width: 420, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>Nova Vaca Leiteira</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18}/></button>
            </div>
            <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { label: 'Brinco *', key: 'tag', required: true },
                { label: 'Nome', key: 'name' },
                { label: 'Raca', key: 'breed' },
                { label: 'Data de Nascimento', key: 'birthDate', type: 'date' },
                { label: 'Peso (kg)', key: 'weight', type: 'number' },
              ].map(({ label, key, required, type }) => (
                <div key={key}>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>{label}</label>
                  <input required={required} type={type || 'text'} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 14 }}/>
                </div>
              ))}
              <button type="submit" className="btn-primary">Cadastrar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
