'use client'
import { useEffect, useState } from 'react'
import { Plus, X, Scissors, Scale, Activity } from 'lucide-react'
import { useFarm } from '@/contexts/FarmContext'

const FAMACHA_COLORS = ['', '#22c55e', '#86efac', '#fbbf24', '#f97316', '#ef4444']
const FAMACHA_LABELS = ['', 'Otimo (1)', 'Bom (2)', 'Atencao (3)', 'Vermifugar (4)', 'Urgente (5)']
const EMPTY_SHEEP = { tag: '', name: '', breed: '', birthDate: '', gender: 'FEMALE', weight: '', notes: '' }
const EMPTY_SHEAR = { animalId: '', date: new Date().toISOString().split('T')[0], woolWeight: '', quality: 'MEDIUM', serviceProvider: '', costPerAnimal: '', notes: '' }
const EMPTY_HEALTH = { animalId: '', date: new Date().toISOString().split('T')[0], type: 'DEWORMING', title: 'Vermifugacao FAMACHA', product: '', famacha: '', notes: '' }

export default function SheepPage() {
  const { farmParam, selectedFarmId } = useFarm()
  const [animals, setAnimals] = useState<any[]>([])
  const [shearings, setShearings] = useState<any[]>([])
  const [health, setHealth] = useState<any[]>([])
  const [tab, setTab] = useState<'rebanho'|'tosquia'|'famacha'>('rebanho')
  const [showModal, setShowModal] = useState<string | null>(null)
  const [form, setForm] = useState<any>({})
  const fp = selectedFarmId ? '&farmId=' + selectedFarmId : ''

  const load = async () => {
    const [a, s, h] = await Promise.all([
      fetch('/api/animals?type=SHEEP' + fp).then(x => x.json()),
      fetch('/api/shearing' + farmParam).then(x => x.json()),
      fetch('/api/health' + farmParam).then(x => x.json()),
    ])
    setAnimals(Array.isArray(a) ? a : [])
    setShearings(Array.isArray(s) ? s : [])
    setHealth(Array.isArray(h) ? h : [])
  }
  useEffect(() => { load() }, [farmParam])

  const lastFamacha = (animalId: string) => {
    const events = health.filter((h: any) => h.animalId === animalId && h.famacha).sort((a: any, b: any) => b.date.localeCompare(a.date))
    return events[0]?.famacha ?? null
  }
  const lastShearing = (animalId: string) => {
    const recs = shearings.filter((s: any) => s.animalId === animalId).sort((a: any, b: any) => b.date.localeCompare(a.date))
    return recs[0] ?? null
  }

  const totalWool = shearings.reduce((s: number, r: any) => s + r.woolWeight, 0)
  const needVermif = animals.filter(a => { const f = lastFamacha(a.id); return f !== null && f >= 4 }).length

  const open = (modal: string, initial: any) => { setShowModal(modal); setForm(initial) }

  const saveAnimal = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch('/api/animals', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, type: 'SHEEP', status: 'ACTIVE', weight: parseFloat(form.weight) || null, farmId: selectedFarmId }) })
    setShowModal(null); load()
  }
  const saveShearing = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch('/api/shearing', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, woolWeight: parseFloat(form.woolWeight), costPerAnimal: parseFloat(form.costPerAnimal) || 0, farmId: selectedFarmId }) })
    setShowModal(null); load()
  }
  const saveFamacha = async (e: React.FormEvent) => {
    e.preventDefault()
    await fetch('/api/health', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, famacha: parseInt(form.famacha), farmId: selectedFarmId, status: 'DONE' }) })
    setShowModal(null); load()
  }

  const activeAnimals = animals.filter(a => a.status === 'ACTIVE')

  return (
    <div style={{ maxWidth: 1100 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700 }}>Ovinos</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Rebanho, tosquia e controle FAMACHA</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" onClick={() => open('famacha', EMPTY_HEALTH)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Activity size={15}/> FAMACHA</button>
          <button className="btn-secondary" onClick={() => open('shear', EMPTY_SHEAR)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Scissors size={15}/> Tosquia</button>
          <button className="btn-primary"   onClick={() => open('animal', EMPTY_SHEEP)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={15}/> Animal</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Total Rebanho', value: activeAnimals.length, color: 'var(--brand)', icon: Scale },
          { label: 'Tosquias', value: shearings.length, color: '#3b82f6', icon: Scissors },
          { label: 'Total La (kg)', value: totalWool.toFixed(1), color: '#8b5cf6', icon: Activity },
          { label: 'Vermifugar (F>=4)', value: needVermif, color: needVermif > 0 ? 'var(--danger)' : 'var(--text-muted)', icon: Activity },
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
        {(['rebanho', 'tosquia', 'famacha'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '7px 18px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === t ? 600 : 400,
            background: tab === t ? 'var(--brand)' : 'var(--bg-card)', color: tab === t ? '#000' : 'var(--text-muted)',
          }}>{{ rebanho: 'Rebanho', tosquia: 'Tosquia', famacha: 'FAMACHA' }[t]}</button>
        ))}
      </div>

      {tab === 'rebanho' && (
        <div className="card" style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Brinco','Nome','Raca','Peso','FAMACHA','Ult. Tosquia','La (kg)'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {activeAnimals.map(a => {
                const f = lastFamacha(a.id); const ls = lastShearing(a.id)
                return (
                  <tr key={a.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, fontSize: 13 }}>{a.tag}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13 }}>{a.name || '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-muted)' }}>{a.breed || '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13 }}>{a.weight ? a.weight + ' kg' : '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      {f ? <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 99, background: FAMACHA_COLORS[f] + '33', color: FAMACHA_COLORS[f], fontWeight: 700 }}>{FAMACHA_LABELS[f]}</span> : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 13 }}>{ls ? new Date(ls.date + 'T12:00:00').toLocaleDateString('pt-BR') : '—'}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--brand)', fontWeight: 600 }}>{ls ? ls.woolWeight + ' kg' : '—'}</td>
                  </tr>
                )
              })}
              {activeAnimals.length === 0 && <tr><td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Nenhum ovino cadastrado.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'tosquia' && (
        <div className="card" style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Data','Animal','La (kg)','Qualidade','Tosquiador','Custo'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {shearings.map((s: any) => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 14px', fontSize: 13 }}>{new Date(s.date + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 600, fontSize: 13 }}>{s.animal?.tag || s.animalId}</td>
                  <td style={{ padding: '10px 14px', fontSize: 14, fontWeight: 700, color: 'var(--brand)' }}>{s.woolWeight} kg</td>
                  <td style={{ padding: '10px 14px', fontSize: 13 }}>{{ FINE: 'Fina', MEDIUM: 'Media', COARSE: 'Grossa' }[s.quality as string] || '—'}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-muted)' }}>{s.serviceProvider || '—'}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13 }}>{s.costPerAnimal > 0 ? 'R$ ' + Number(s.costPerAnimal).toFixed(2) : '—'}</td>
                </tr>
              ))}
              {shearings.length === 0 && <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Nenhuma tosquia registrada.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'famacha' && (
        <div className="card" style={{ padding: 0 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Data','Animal','FAMACHA','Produto','Acao','Observacoes'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.06em' }}>{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {health.filter((h: any) => h.famacha).map((h: any) => (
                <tr key={h.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 14px', fontSize: 13 }}>{new Date(h.date + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                  <td style={{ padding: '10px 14px', fontWeight: 600, fontSize: 13 }}>{h.animal?.tag || h.animalId || 'Lote'}</td>
                  <td style={{ padding: '10px 14px' }}>
                    <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 99, background: FAMACHA_COLORS[h.famacha] + '33', color: FAMACHA_COLORS[h.famacha], fontWeight: 700 }}>{FAMACHA_LABELS[h.famacha]}</span>
                  </td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-muted)' }}>{h.product || '—'}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13 }}>{h.famacha >= 4 ? 'Vermifugar' : h.famacha >= 3 ? 'Monitorar' : 'OK'}</td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-muted)' }}>{h.notes || '—'}</td>
                </tr>
              ))}
              {health.filter((h: any) => h.famacha).length === 0 && <tr><td colSpan={6} style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>Nenhum registro FAMACHA.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showModal === 'animal' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ width: 380, maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}><h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>Novo Ovino</h2><button onClick={() => setShowModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18}/></button></div>
            <form onSubmit={saveAnimal} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {[{ label: 'Brinco *', key: 'tag', required: true }, { label: 'Nome', key: 'name' }, { label: 'Raca', key: 'breed' }, { label: 'Peso (kg)', key: 'weight', type: 'number' }].map(({ label, key, required, type }) => (
                <div key={key}>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>{label}</label>
                  <input required={required} type={type || 'text'} value={form[key] || ''} onChange={e => setForm({ ...form, [key]: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 14 }}/>
                </div>
              ))}
              <button type="submit" className="btn-primary">Cadastrar</button>
            </form>
          </div>
        </div>
      )}

      {showModal === 'shear' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ width: 400 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}><h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>Registro de Tosquia</h2><button onClick={() => setShowModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18}/></button></div>
            <form onSubmit={saveShearing} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Animal *</label>
                <select required value={form.animalId || ''} onChange={e => setForm({ ...form, animalId: e.target.value })}
                  style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 14 }}>
                  <option value="">Selecione...</option>
                  {activeAnimals.map(a => <option key={a.id} value={a.id}>{a.tag}{a.name ? ' - ' + a.name : ''}</option>)}
                </select>
              </div>
              {[{ label: 'Data *', key: 'date', type: 'date' }, { label: 'Peso da La (kg) *', key: 'woolWeight', type: 'number' }, { label: 'Tosquiador', key: 'serviceProvider' }, { label: 'Custo por Animal (R$)', key: 'costPerAnimal', type: 'number' }].map(({ label, key, type }) => (
                <div key={key}>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>{label}</label>
                  <input required={key !== 'serviceProvider' && key !== 'costPerAnimal'} type={type || 'text'} step="0.01" value={form[key] || ''} onChange={e => setForm({ ...form, [key]: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 14 }}/>
                </div>
              ))}
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Qualidade</label>
                <select value={form.quality || 'MEDIUM'} onChange={e => setForm({ ...form, quality: e.target.value })}
                  style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 14 }}>
                  <option value="FINE">Fina (&lt;22 microns)</option><option value="MEDIUM">Media</option><option value="COARSE">Grossa</option>
                </select>
              </div>
              <button type="submit" className="btn-primary">Registrar Tosquia</button>
            </form>
          </div>
        </div>
      )}

      {showModal === 'famacha' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ width: 400 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}><h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>Avaliacao FAMACHA</h2><button onClick={() => setShowModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18}/></button></div>
            <form onSubmit={saveFamacha} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Animal (opcional - deixe vazio para lote)</label>
                <select value={form.animalId || ''} onChange={e => setForm({ ...form, animalId: e.target.value })}
                  style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 14 }}>
                  <option value="">Lote / Todos</option>
                  {activeAnimals.map(a => <option key={a.id} value={a.id}>{a.tag}{a.name ? ' - ' + a.name : ''}</option>)}
                </select>
              </div>
              {[{ label: 'Data *', key: 'date', type: 'date' }, { label: 'Produto vermifugo', key: 'product' }].map(({ label, key, type }) => (
                <div key={key}>
                  <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>{label}</label>
                  <input required={key === 'date'} type={type || 'text'} value={form[key] || ''} onChange={e => setForm({ ...form, [key]: e.target.value })}
                    style={{ width: '100%', background: 'var(--bg-input)', border: '1px solid var(--border)', borderRadius: 7, padding: '8px 12px', color: 'var(--text-primary)', fontSize: 14 }}/>
                </div>
              ))}
              <div>
                <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Escore FAMACHA (1-5) *</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[1,2,3,4,5].map(n => (
                    <button key={n} type="button" onClick={() => setForm({ ...form, famacha: String(n) })} style={{
                      flex: 1, padding: '10px 0', borderRadius: 8, border: '2px solid', cursor: 'pointer', fontWeight: 700, fontSize: 16,
                      borderColor: form.famacha === String(n) ? FAMACHA_COLORS[n] : 'var(--border)',
                      background: form.famacha === String(n) ? FAMACHA_COLORS[n] + '33' : 'var(--bg-input)',
                      color: FAMACHA_COLORS[n],
                    }}>{n}</button>
                  ))}
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>1-2: OK | 3: Monitorar | 4-5: Vermifugar obrigatoriamente</p>
              </div>
              <button type="submit" className="btn-primary" disabled={!form.famacha}>Registrar</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
