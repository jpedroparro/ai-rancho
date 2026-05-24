'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Droplets, Scale, Calendar, Tag } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

const TYPE_LABEL: Record<string, string>   = { DAIRY: 'Leiteira', SHEEP: 'Ovelha', BEEF: 'Bovino' }
const TYPE_COLOR: Record<string, string>   = { DAIRY: 'var(--brand)', SHEEP: '#f59e0b', BEEF: '#ef4444' }
const STATUS_LABEL: Record<string, string> = { ACTIVE: 'Ativo', SOLD: 'Vendido', DEAD: 'Morto' }
const STATUS_COLOR: Record<string, string> = { ACTIVE: '#22c55e', SOLD: '#f59e0b', DEAD: '#6b7280' }

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: 14, fontWeight: 500 }}>{value ?? '—'}</span>
    </div>
  )
}

export default function AnimalHistoryPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [animal, setAnimal]   = useState<any>(null)
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch(`/api/animals/${id}`).then(r => r.ok ? r.json() : null),
      fetch(`/api/animals/${id}/milk`).then(r => r.ok ? r.json() : []),
    ]).then(([a, m]) => {
      setAnimal(a)
      setRecords(m ?? [])
      setLoading(false)
    })
  }, [id])

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <p style={{ color: 'var(--text-muted)' }}>Carregando...</p>
    </div>
  )

  if (!animal) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <p style={{ color: 'var(--text-muted)' }}>Animal não encontrado.</p>
    </div>
  )

  // Build chart data: sum milk per day, last 30 entries
  const byDay: Record<string, number> = {}
  records.forEach((r: any) => { byDay[r.date] = (byDay[r.date] || 0) + r.total })
  const chartData = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-30)
    .map(([date, total]) => ({
      date: new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      total: +Number(total).toFixed(1),
    }))

  const totalMilk  = records.reduce((s, r) => s + r.total, 0)
  const avgPerDay  = chartData.length > 0 ? totalMilk / Object.keys(byDay).length : 0
  const bestDay    = chartData.reduce((best, d) => d.total > best.total ? d : best, { date: '—', total: 0 })

  return (
    <div style={{ maxWidth: 900, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={() => router.back()}
          style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)', fontSize: 13 }}
        >
          <ArrowLeft size={14} /> Voltar
        </button>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Tag size={20} style={{ color: TYPE_COLOR[animal.type] }} />
            {animal.tag}
            {animal.name && <span style={{ fontSize: 18, fontWeight: 400, color: 'var(--text-secondary)' }}>— {animal.name}</span>}
          </h1>
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: TYPE_COLOR[animal.type] + '22', color: TYPE_COLOR[animal.type] }}>
              {TYPE_LABEL[animal.type] ?? animal.type}
            </span>
            <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: STATUS_COLOR[animal.status] + '22', color: STATUS_COLOR[animal.status] }}>
              {STATUS_LABEL[animal.status] ?? animal.status}
            </span>
          </div>
        </div>
      </div>

      {/* Animal details + stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="card">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, marginBottom: '0.5rem' }}>Informações</h2>
          <InfoRow label="Raça"          value={animal.breed} />
          <InfoRow label="Gênero"        value={animal.gender === 'FEMALE' ? 'Fêmea' : 'Macho'} />
          <InfoRow label="Peso atual"    value={animal.weight ? `${animal.weight} kg` : null} />
          <InfoRow label="Data nasc."    value={animal.birthDate ? new Date(animal.birthDate + 'T12:00:00').toLocaleDateString('pt-BR') : null} />
          <InfoRow label="Notas"         value={animal.notes} />
        </div>

        {animal.type === 'DAIRY' ? (
          <div className="card">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, marginBottom: '0.5rem' }}>Produção de Leite</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.5rem' }}>
              <div style={{ textAlign: 'center', padding: '0.75rem', background: 'var(--surface-2)', borderRadius: 10 }}>
                <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--brand)', fontFamily: 'var(--font-display)' }}>{totalMilk.toFixed(1)} L</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Total registrado</p>
              </div>
              <div style={{ textAlign: 'center', padding: '0.75rem', background: 'var(--surface-2)', borderRadius: 10 }}>
                <p style={{ fontSize: 22, fontWeight: 700, color: '#3b82f6', fontFamily: 'var(--font-display)' }}>{avgPerDay.toFixed(1)} L</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Média/dia</p>
              </div>
              <div style={{ textAlign: 'center', padding: '0.75rem', background: 'var(--surface-2)', borderRadius: 10 }}>
                <p style={{ fontSize: 22, fontWeight: 700, color: '#f59e0b', fontFamily: 'var(--font-display)' }}>{bestDay.total} L</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Melhor dia ({bestDay.date})</p>
              </div>
              <div style={{ textAlign: 'center', padding: '0.75rem', background: 'var(--surface-2)', borderRadius: 10 }}>
                <p style={{ fontSize: 22, fontWeight: 700, color: '#8b5cf6', fontFamily: 'var(--font-display)' }}>{records.length}</p>
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Registros</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              <Scale size={40} style={{ marginBottom: 8, opacity: 0.4 }} />
              <p style={{ fontSize: 14 }}>Sem produção de leite</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>{TYPE_LABEL[animal.type] ?? animal.type}</p>
            </div>
          </div>
        )}
      </div>

      {/* Milk chart */}
      {animal.type === 'DAIRY' && chartData.length > 0 && (
        <div className="card">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, marginBottom: '1rem' }}>
            <Droplets size={16} style={{ display: 'inline', marginRight: 6, color: '#3b82f6' }} />
            Produção Diária (últimos 30 dias)
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} unit=" L" />
              <Tooltip
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13 }}
                formatter={(v: any) => [`${v} L`, 'Total']}
              />
              <Bar dataKey="total" fill="var(--brand)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Milk records table */}
      {animal.type === 'DAIRY' && (
        <div className="card">
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 600, marginBottom: '0.75rem' }}>
            Histórico de Registros
            <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--text-muted)', marginLeft: 8 }}>{records.length} registros</span>
          </h2>
          {records.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Nenhum registro de leite encontrado</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Manhã (L)</th>
                    <th>Tarde (L)</th>
                    <th>Total (L)</th>
                    <th>Notas</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((r: any) => (
                    <tr key={r.id}>
                      <td>{new Date(r.date + 'T12:00:00').toLocaleDateString('pt-BR')}</td>
                      <td>{r.morning.toFixed(1)}</td>
                      <td>{r.evening.toFixed(1)}</td>
                      <td style={{ fontWeight: 600 }}>{r.total.toFixed(1)}</td>
                      <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{r.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
