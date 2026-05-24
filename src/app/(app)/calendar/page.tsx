'use client'
import { useEffect, useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, Plus, X, Check, Trash2, CalendarDays } from 'lucide-react'
import { useFarm } from '@/contexts/FarmContext'
import type { EventType, EventStatus } from '@/lib/types'

interface CalEvent {
  id: string
  title: string
  description?: string | null
  eventType: EventType
  date: string
  animalId?: string | null
  status: EventStatus
  animal?: { tag: string; name: string | null } | null
}

const EVENT_LABELS: Record<EventType, string> = {
  VACCINATION: 'Vacinação',
  TREATMENT:   'Tratamento',
  BREEDING:    'Reprodução',
  WEANING:     'Desmame',
  WEIGHING:    'Pesagem',
  SHEARING:    'Tosquia',
  PURCHASE:    'Compra',
  SALE:        'Venda',
  MAINTENANCE: 'Manutenção',
  OTHER:       'Outro',
}

const EVENT_COLORS: Record<EventType, { bg: string; text: string; dot: string }> = {
  VACCINATION: { bg: 'rgba(59,130,246,0.15)',  text: '#60a5fa', dot: '#3b82f6' },
  TREATMENT:   { bg: 'rgba(239,68,68,0.13)',   text: '#f87171', dot: '#ef4444' },
  BREEDING:    { bg: 'rgba(168,85,247,0.13)',  text: '#c084fc', dot: '#a855f7' },
  WEANING:     { bg: 'rgba(245,158,11,0.13)',  text: '#fbbf24', dot: '#f59e0b' },
  WEIGHING:    { bg: 'rgba(20,184,166,0.13)',  text: '#2dd4bf', dot: '#14b8a6' },
  SHEARING:    { bg: 'rgba(236,72,153,0.13)',  text: '#f472b6', dot: '#ec4899' },
  PURCHASE:    { bg: 'rgba(34,197,94,0.13)',   text: '#4ade80', dot: '#22c55e' },
  SALE:        { bg: 'rgba(74,222,128,0.12)',  text: '#86efac', dot: '#4ade80' },
  MAINTENANCE: { bg: 'rgba(107,114,128,0.15)', text: '#9ca3af', dot: '#6b7280' },
  OTHER:       { bg: 'rgba(99,102,241,0.13)',  text: '#a5b4fc', dot: '#6366f1' },
}

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

const today = new Date()
const fmt = (d: Date) => d.toISOString().split('T')[0]

function buildGrid(year: number, month: number): (string | null)[] {
  const first = new Date(year, month, 1)
  const last  = new Date(year, month + 1, 0)
  const startDow = first.getDay()
  const cells: (string | null)[] = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= last.getDate(); d++) {
    cells.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
  }
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

export default function CalendarPage() {
  const { farmParam, selectedFarmId } = useFarm()
  const [curYear,  setCurYear]  = useState(today.getFullYear())
  const [curMonth, setCurMonth] = useState(today.getMonth())   // 0-based
  const [events,   setEvents]   = useState<CalEvent[]>([])
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState<string | null>(fmt(today))
  const [animals,  setAnimals]  = useState<any[]>([])

  // Modal state
  const [modal,    setModal]    = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [form, setForm] = useState<{
    title: string; description: string; eventType: EventType; date: string; animalId: string
  }>({ title: '', description: '', eventType: 'OTHER', date: fmt(today), animalId: '' })

  const monthStr = `${curYear}-${String(curMonth + 1).padStart(2, '0')}`

  useEffect(() => {
    setLoading(true)
    const p = farmParam ? farmParam + '&year=' + curYear : '?year=' + curYear
    fetch(`/api/calendar${p}`)
      .then(r => r.ok ? r.json() : [])
      .then(d => { setEvents(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [farmParam, selectedFarmId, curYear])

  useEffect(() => {
    fetch('/api/animals' + farmParam)
      .then(r => r.ok ? r.json() : [])
      .then(setAnimals)
      .catch(() => {})
  }, [farmParam])

  const grid = useMemo(() => buildGrid(curYear, curMonth), [curYear, curMonth])

  const byDate = useMemo(() => {
    const m: Record<string, CalEvent[]> = {}
    for (const e of events) {
      if (!m[e.date]) m[e.date] = []
      m[e.date].push(e)
    }
    return m
  }, [events])

  const selectedEvents = selected ? (byDate[selected] ?? []) : []

  function prevMonth() {
    if (curMonth === 0) { setCurYear(y => y - 1); setCurMonth(11) }
    else setCurMonth(m => m - 1)
  }
  function nextMonth() {
    if (curMonth === 11) { setCurYear(y => y + 1); setCurMonth(0) }
    else setCurMonth(m => m + 1)
  }

  async function handleSave() {
    if (!form.title.trim() || !form.date) return
    setSaving(true)
    const farmId = new URLSearchParams(farmParam.replace('?', '')).get('farmId') ?? undefined
    const res = await fetch('/api/calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, farmId, animalId: form.animalId || null }),
    })
    if (res.ok) {
      const ev = await res.json()
      setEvents(prev => [...prev, ev].sort((a, b) => a.date.localeCompare(b.date)))
      setModal(false)
      setSelected(form.date)
      setForm({ title: '', description: '', eventType: 'OTHER', date: selected ?? fmt(today), animalId: '' })
    }
    setSaving(false)
  }

  async function toggleStatus(ev: CalEvent) {
    const newStatus: EventStatus = ev.status === 'DONE' ? 'PENDING' : 'DONE'
    const res = await fetch(`/api/calendar/${ev.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      setEvents(prev => prev.map(e => e.id === ev.id ? { ...e, status: newStatus } : e))
    }
  }

  async function deleteEvent(id: string) {
    const res = await fetch(`/api/calendar/${id}`, { method: 'DELETE' })
    if (res.ok) setEvents(prev => prev.filter(e => e.id !== id))
  }

  const todayStr = fmt(today)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700 }}>Calendário Agropecuário</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 4 }}>Agende eventos, tratamentos e atividades da fazenda</p>
        </div>
        <button
          onClick={() => { setForm(f => ({ ...f, date: selected ?? fmt(today) })); setModal(true) }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'var(--brand)', color: '#fff', border: 'none',
            borderRadius: 8, padding: '10px 18px', cursor: 'pointer',
            fontSize: 14, fontWeight: 600,
          }}
        >
          <Plus size={16}/> Novo Evento
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1rem', alignItems: 'start' }}>

        {/* ── Calendar grid ── */}
        <div className="card" style={{ padding: '1.25rem' }}>
          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <button onClick={prevMonth} style={navBtn}><ChevronLeft size={16}/></button>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>
              {MONTHS_PT[curMonth]} {curYear}
            </h2>
            <button onClick={nextMonth} style={navBtn}><ChevronRight size={16}/></button>
          </div>

          {/* Day-of-week header */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
            {WEEK_DAYS.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', padding: '4px 0', letterSpacing: '0.05em' }}>{d}</div>
            ))}
          </div>

          {/* Cells */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {grid.map((dateStr, i) => {
              if (!dateStr) return <div key={`empty-${i}`}/>
              const isToday    = dateStr === todayStr
              const isSelected = dateStr === selected
              const dayEvents  = byDate[dateStr] ?? []
              const hasPending = dayEvents.some(e => e.status === 'PENDING')
              const hasDone    = dayEvents.some(e => e.status === 'DONE')

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelected(dateStr)}
                  style={{
                    minHeight: 62,
                    borderRadius: 8,
                    padding: '6px 5px 4px',
                    cursor: 'pointer',
                    background: isSelected
                      ? 'rgba(74,222,128,0.18)'
                      : isToday
                      ? 'rgba(74,222,128,0.07)'
                      : 'transparent',
                    border: isSelected
                      ? '1.5px solid rgba(74,222,128,0.55)'
                      : isToday
                      ? '1.5px solid rgba(74,222,128,0.25)'
                      : '1.5px solid transparent',
                    transition: 'all .12s',
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'rgba(74,222,128,0.07)'
                  }}
                  onMouseLeave={e => {
                    if (!isSelected && !isToday) (e.currentTarget as HTMLElement).style.background = 'transparent'
                    if (!isSelected && isToday) (e.currentTarget as HTMLElement).style.background = 'rgba(74,222,128,0.07)'
                  }}
                >
                  <div style={{
                    fontSize: 13,
                    fontWeight: isToday ? 700 : 500,
                    color: isToday ? 'var(--brand)' : isSelected ? 'var(--brand)' : 'var(--text-primary)',
                    textAlign: 'center',
                    marginBottom: 4,
                  }}>
                    {parseInt(dateStr.split('-')[2])}
                  </div>
                  {/* Event dots */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
                    {dayEvents.slice(0, 4).map(ev => (
                      <div
                        key={ev.id}
                        style={{
                          width: 6, height: 6,
                          borderRadius: '50%',
                          background: ev.status === 'DONE' ? '#4b5563' : EVENT_COLORS[ev.eventType].dot,
                          opacity: ev.status === 'CANCELLED' ? 0.3 : 1,
                        }}
                      />
                    ))}
                    {dayEvents.length > 4 && (
                      <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>+{dayEvents.length - 4}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Legend */}
          <div style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {(Object.entries(EVENT_LABELS) as [EventType, string][]).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-muted)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: EVENT_COLORS[k].dot }}/>
                {v}
              </div>
            ))}
          </div>
        </div>

        {/* ── Day detail ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600 }}>
                {selected
                  ? new Date(selected + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
                  : 'Selecione um dia'}
              </h3>
              {selected && (
                <button
                  onClick={() => { setForm(f => ({ ...f, date: selected })); setModal(true) }}
                  style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)' }}
                  title="Adicionar evento"
                >
                  <Plus size={14}/>
                </button>
              )}
            </div>

            {!selected ? (
              <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Clique em um dia no calendário para ver os eventos.</p>
            ) : selectedEvents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                <CalendarDays size={28} style={{ color: 'var(--text-muted)', marginBottom: 8 }}/>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Nenhum evento neste dia</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {selectedEvents.map(ev => {
                  const { bg, text } = EVENT_COLORS[ev.eventType]
                  return (
                    <div
                      key={ev.id}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 9,
                        background: bg,
                        border: `1px solid ${text}33`,
                        opacity: ev.status === 'CANCELLED' ? 0.4 : 1,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: text, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                              {EVENT_LABELS[ev.eventType]}
                            </span>
                            {ev.status === 'DONE' && (
                              <span style={{ fontSize: 9, fontWeight: 700, color: '#4ade80', background: 'rgba(74,222,128,0.15)', padding: '1px 5px', borderRadius: 4 }}>FEITO</span>
                            )}
                          </div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{ev.title}</p>
                          {ev.description && (
                            <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{ev.description}</p>
                          )}
                          {ev.animal && (
                            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                              Animal: {ev.animal.name ?? ev.animal.tag}
                            </p>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                          <button
                            onClick={() => toggleStatus(ev)}
                            title={ev.status === 'DONE' ? 'Marcar como pendente' : 'Marcar como feito'}
                            style={{ width: 26, height: 26, borderRadius: 6, border: `1px solid ${text}44`, background: ev.status === 'DONE' ? 'rgba(74,222,128,0.2)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: ev.status === 'DONE' ? '#4ade80' : text }}
                          >
                            <Check size={13}/>
                          </button>
                          <button
                            onClick={() => deleteEvent(ev.id)}
                            title="Excluir evento"
                            style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid rgba(239,68,68,0.3)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444' }}
                          >
                            <Trash2 size={13}/>
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Upcoming events */}
          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-muted)' }}>
              PRÓXIMOS EVENTOS
            </h3>
            {loading ? (
              <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Carregando...</p>
            ) : (() => {
              const upcoming = events
                .filter(e => e.date >= todayStr && e.status === 'PENDING')
                .slice(0, 5)
              if (upcoming.length === 0) return (
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Nenhum evento pendente.</p>
              )
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {upcoming.map(ev => {
                    const { dot, text } = EVENT_COLORS[ev.eventType]
                    const d = new Date(ev.date + 'T12:00:00')
                    return (
                      <div
                        key={ev.id}
                        onClick={() => { setSelected(ev.date); setCurMonth(d.getMonth()); setCurYear(d.getFullYear()) }}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '5px 0', borderBottom: '1px solid var(--border)' }}
                      >
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: dot, flexShrink: 0 }}/>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.title}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} · {EVENT_LABELS[ev.eventType]}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>
        </div>
      </div>

      {/* ── Add event modal ── */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div className="card" style={{ width: '100%', maxWidth: 460, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700 }}>Novo Evento</h2>
              <button onClick={() => setModal(false)} style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                <X size={16}/>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={labelStyle}>Título *</label>
                <input
                  style={inputStyle}
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Ex: Vacinação contra aftosa"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label style={labelStyle}>Tipo *</label>
                  <select
                    style={inputStyle}
                    value={form.eventType}
                    onChange={e => setForm(f => ({ ...f, eventType: e.target.value as EventType }))}
                  >
                    {(Object.entries(EVENT_LABELS) as [EventType, string][]).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Data *</label>
                  <input
                    type="date"
                    style={inputStyle}
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Animal (opcional)</label>
                <select
                  style={inputStyle}
                  value={form.animalId}
                  onChange={e => setForm(f => ({ ...f, animalId: e.target.value }))}
                >
                  <option value="">— Todos / Nenhum —</option>
                  {animals.map((a: any) => (
                    <option key={a.id} value={a.id}>{a.name ?? a.tag} ({a.tag})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Descrição</label>
                <textarea
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 72 }}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Detalhes do evento..."
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button onClick={() => setModal(false)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid var(--border)', background: 'transparent', cursor: 'pointer', fontSize: 14, color: 'var(--text-muted)' }}>
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.title.trim() || !form.date}
                style={{ flex: 2, padding: '10px', borderRadius: 8, border: 'none', background: 'var(--brand)', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600, opacity: saving ? 0.7 : 1 }}
              >
                {saving ? 'Salvando...' : 'Salvar Evento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const navBtn: React.CSSProperties = {
  width: 32, height: 32,
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'transparent',
  cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  color: 'var(--text-muted)',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--text-muted)',
  marginBottom: 5,
  letterSpacing: '0.04em',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid var(--border)',
  background: 'var(--bg-input, var(--bg-card))',
  color: 'var(--text-primary)',
  fontSize: 14,
  boxSizing: 'border-box',
}
