'use client'
import { useState } from 'react'
import { Download, FileText } from 'lucide-react'
import { useFarm } from '@/contexts/FarmContext'

const REPORTS = [
  { key: 'sales',        label: 'Vendas',                   desc: 'Historico completo de vendas por periodo', icon: '💰' },
  { key: 'milk',         label: 'Producao de Leite',        desc: 'Todos os lancamentos de producao (365 dias)', icon: '🥛' },
  { key: 'milk-stock',   label: 'Extrato de Estoque Leite', desc: 'Entradas, saidas e saldo do estoque', icon: '📦' },
  { key: 'weights',      label: 'Pesagens',                 desc: 'Historico de pesagens e GPD por animal', icon: '⚖️' },
  { key: 'health',       label: 'Sanitario',                desc: 'Vacinas, tratamentos e carencias', icon: '💊' },
  { key: 'reproduction', label: 'Reproducao',               desc: 'IATF, diagnosticos e partos', icon: '❤️' },
]

function toCSV(data: any[]): string {
  if (!data.length) return ''
  const keys = Object.keys(data[0]).filter(k => !['id','farmId','createdAt','updatedAt'].includes(k))
  const header = keys.join(';')
  const rows = data.map(row => keys.map(k => {
    const v = row[k]
    if (v === null || v === undefined) return ''
    if (typeof v === 'object') return JSON.stringify(v)
    return String(v).replace(/;/g, ',')
  }).join(';'))
  return [header, ...rows].join('\n')
}

export default function ReportsPage() {
  const { farmParam } = useFarm()
  const [loading, setLoading] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, { count: number; data: any[] }>>({})

  const download = async (key: string, label: string) => {
    setLoading(key)
    try {
      const res = await fetch('/api/reports?type=' + key + farmParam)
      const json = await res.json()
      setResults(r => ({ ...r, [key]: { count: json.count, data: json.data } }))
      const csv = toCSV(json.data)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = label.replace(/\s+/g, '_') + '_' + new Date().toISOString().split('T')[0] + '.csv'
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700 }}>Relatorios</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Exporte seus dados em CSV para analise externa</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1rem' }}>
        {REPORTS.map(({ key, label, desc, icon }) => {
          const result = results[key]
          return (
            <div key={key} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ fontSize: 28, lineHeight: 1, flexShrink: 0 }}>{icon}</div>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600 }}>{label}</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{desc}</p>
                </div>
              </div>
              {result && (
                <p style={{ fontSize: 12, color: 'var(--brand)', background: 'var(--brand)11', borderRadius: 6, padding: '4px 10px' }}>
                  {result.count} registros exportados
                </p>
              )}
              <button onClick={() => download(key, label)} disabled={loading === key}
                className="btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, opacity: loading === key ? 0.6 : 1 }}>
                {loading === key ? <><FileText size={14}/> Gerando...</> : <><Download size={14}/> Exportar CSV</>}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
