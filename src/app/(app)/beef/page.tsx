'use client'
import { useEffect, useState } from 'react'
import { Plus, X, Scale, TrendingUp, Beef } from 'lucide-react'
import { useFarm } from '@/contexts/FarmContext'
import Link from 'next/link'

const EMPTY_ANIMAL = { tag: '', name: '', breed: 'Nelore', birthDate: '', gender: 'MALE', weight: '', notes: '' }
const EMPTY_WEIGHT = { animalId: '', date: new Date().toISOString().split('T')[0], weight: '', notes: '' }

export default function BeefPage() {
  const { farmParam, selectedFarmId } = useFarm()
  const [animals, setAnimals] = useState<any[]>([])
  const [weights, setWeights] = useState<any[]>([])
  const [tab, setTab] = useState<'animals'|'weights'>('animals')
  const [showAnimalModal, setShowAnimalModal] = useState(false)
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [animalForm, setAnimalForm] = useState<any>(EMPTY_ANIMAL)
  const [weightForm, setWeightForm] = useState<any>(EMPTY_WEIGHT)
  const [search, setSearch] = useState('')
  const fp = selectedFarmId ? '&farmId=' + selectedFarmId : ''

  const load = async () => {
    const [a, w] = await Promise.all([
      fetch('/api/animals?type=BEEF' + fp).then(x => x.json()),
      fetch('/api/weights' + farmParam).then(x => x.json()),
    ])
    setAnimals(Array.isArray(a) ? a : [])
    setWeights(Array.isArray(w) ? w : [])
  }
  useEffect(() => { load() }, [farmParam])

  const gpd = (animalId: string) => {
    const recs = weights.filter((w: any) => w.animalId === animalId).sort((a: any, b: any) => a.date.localeCompare(b.date))
    if (recs.length < 2) return null
    const last = recs[recs.length - 1], prev = recs[recs.length - 2]
    const days = Math.max(1, (new Date(last.date).getTime() - new Date(prev.date).getTime()) / 86400000)
    return +((last.weight - prev.weight) / days).toFixed(2)
  }

  const avgWeight = animals.length ? animals.reduce((s, a) => s + (a.weight || 0), 0) / animals.length : 0
  const avgGPD = animals.map(a => gpd(a.id)).filter(g => g !== null) as number[]
  const avgGPDVal = avgGPD.length ? avgGPD.reduce((s, g) => s + g, 0) / avgGPD.length : 0
  const readyToSell = animals.filter(a => (a.weight || 0) >= 480).length

  const filtered = animals.filter(a =>
    a.tag.toLowerCase().includes(search.toLowerCase()) ||
    (a.name || '').toLowerCase().includes(search.toLowerCase()) ||
    a.status.toLowerCase().includes(search.toLowerCase())
  )

  const saveAnimal = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch('/api/animals', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...animalForm, type: 'BEEF', status: 'ACTIVE', weight: parseFloat(animalForm.weight) || null, farmId: selectedFarmId }) })
    setShowAnimalModal(false); setAnimalForm(EMPTY_ANIMAL); load()
  }

  const saveWeight = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch('/api/weights', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...weightForm, weight: parseFloat(weightForm.weight), farmId: selectedFarmId }) })
    setShowWeightModal(false); setWeightForm(EMPTY_WEIGHT); load()
  }

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700 }}>Nelore / Corte</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Pesagens, GPD e evolucao do lote</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={() => setShowWeightModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Scale size={15}/> Pesagem</button>
          <button className="btn-primary" onClick={() => setShowAnimalModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={15}/> Animal</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Cabecas', value: animals.filter(a => a.status === 'ACTIVE').length, color: 'var(--brand)', icon: Beef },
          { label: 'Peso Medio', value: avgWeight.toFixed(0) + ' kg', color: '#3b82f6', icon: Scale },
          { label: 'GPD Medio', value: avgGPDVal ? avgGPDVal.toFixed(2) + ' kg/d' : '—', color: avgGPDVal >= 0.5 ? 'var(--brand)' : '#f59e0b', icon: TrendingUp },
          { label: 'Pronto Venda', value: readyToSell + ' cab.', color: readyToSell > 0 ? '#f59e0b' : 'var(--text-muted)', icon: TrendingUp },
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

      <div style={{ display: 'flex', gap: 8, marginBottom: '1rem' }}>
        {(['animals', 'weights'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '7px 18px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === t ? 600 : 400,
            background: tab === t ? 'var(--brand)' : 'var(--bg-card)', color: tab === t ? '#000' : 'var(--text-muted)',
          }}>{{ animals: 'Rebanho', weights: 'Pesagens' }[t]}</button>
        ))}
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." style={{ marginLeft: 'auto', width: 200, background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 7, padding: '6px 12px', color: 'var(--text-primary)', fontSize: 13 }}/>
      </div>

      {tab === 'animals' && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Brinco','Nome','Sexo','Peso Atual','GPD','Status','Acoes'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filtered.map(a => {
                  const g = gpd(a.id)
                  const ready = (a.weight || 0) >= 480
                  return (
                    <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 14px', fontWeight: 600, fontSize: 13 }}>{a.tag}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13 }}>{a.name || '—'}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13 }}>{{ MALE: 'Macho', FEMALE: 'Femea' }[a.gender as string] || a.gender}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600 }}>{a.weight ? a.weight + ' kg' : '—'}</td>
                      <td style={{ padding: '10px 14px', fontSize: 13, color: g !== null ? (g >= 0.5 ? 'var(--brand)' : '#f59e0b') : 'var(--text-muted)' }}>{g !== null ? g + ' kg/d' : '—'}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 99, background: (ready ? '#f59e0b' : 'var(--brand)') + '22', color: ready ? '#f59e0b' : 'var(--brand)', fontWeight: 600 }}>
                          {ready ? 'Pronto venda' : a.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <Link href={'/animals/' + a.id} style={{ fontSize: 12, color: 'var(--brand)', textDecoration: 'none' }}>Ver ficha</Link>
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Nenhum animal cadastrado.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'weights' && (
        <div className="card" style={{ padding: 0 }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Data','Animal','Peso (kg)','Observacoes'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {weights.filter((w: any) => animals.find(a => a.id === w.animalId)).map((w: any) => (
                  <tr key={w.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 14px', fontSize: 13 }}>{new Date(w.date + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600 }}>{w.animal?.tag || w.animalId}</td>
                    <td style={{ padding: '10px 14px', fontSize: 14, fontWeight: 700, color: 'var(--brand)' }}>{w.weight} kg</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-muted)' }}>{w.notes || '—'}</td>
                  </tr>
                ))}
                {weights.length === 0 && <tr><td colSpan={4} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Nenhuma pesagem registrada.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showAnimalModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ width: 400, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>Novo Animal Corte</h2>
              <button onClick={() => setShowAnimalModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18}/></button>
            </div>
            <form onSubmit={saveAnimal} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[{ label: 'Brinco *', key: 'tag', required: true }, { label: 'Nome', key: 'name' }, { label: 'Raca', key: 'breed' }, { label: 'Peso (kg)', key: 'weight', type: 'number' }].map(({ label, key, required, type }) => (
                <div key={key}>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>{label}</label>
                  <input required={required} type={type || 'text'} value={animalForm[key]} onChange={e => setAnimalForm({ ...animalForm, [key]: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 14 }}/>
                </div>
              ))}
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Sexo</label>
                <select value={animalForm.gender} onChange={e => setAnimalForm({ ...animalForm, gender: e.target.value })}
                  style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 14 }}>
                  <option value="MALE">Macho</option><option value="FEMALE">Femea</option>
                </select>
              </div>
              <button type="submit" className="btn-primary">Cadastrar</button>
            </form>
          </div>
        </div>
      )}

      {showWeightModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ width: 380 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>Lancamento de Pesagem</h2>
              <button onClick={() => setShowWeightModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18}/></button>
            </div>
            <form onSubmit={saveWeight} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Animal *</label>
                <select required value={weightForm.animalId} onChange={e => setWeightForm({ ...weightForm, animalId: e.target.value })}
                  style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 14 }}>
                  <option value="">Selecione...</option>
                  {animals.filter(a => a.status === 'ACTIVE').map(a => <option key={a.id} value={a.id}>{a.tag}{a.name ? ' - ' + a.name : ''}</option>)}
                </select>
              </div>
              {[{ label: 'Data *', key: 'date', type: 'date' }, { label: 'Peso (kg) *', key: 'weight', type: 'number' }, { label: 'Observacoes', key: 'notes' }].map(({ label, key, type }) => (
                <div key={key}>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>{label}</label>
                  <input required={key !== 'notes'} type={type || 'text'} step="0.1" value={weightForm[key]} onChange={e => setWeightForm({ ...weightForm, [key]: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 14 }}/>
                </div>
              ))}
              <button type="submit" className="btn-primary">Registrar Pesagem</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
