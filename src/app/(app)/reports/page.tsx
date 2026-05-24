'use client'
import { useEffect, useState, useMemo } from 'react'
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, ComposedChart,
} from 'recharts'
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Droplets, PawPrint } from 'lucide-react'
import { useFarm } from '@/contexts/FarmContext'
import { formatCurrency } from '@/lib/utils'

// ── Constants ─────────────────────────────────────────────────────────────────
const MONTHS_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']
const MONTHS_LONG  = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const COLORS       = ['#2d7a2d','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#ec4899','#14b8a6','#f97316']

const LABELS: Record<string,string> = {
  DAIRY:'Leiteiras', BEEF:'Bovinos', SHEEP:'Ovinos',
  MILK:'Leite', ANIMAL:'Animal', WOOL:'Lã', MEAT:'Carne',
  FEED:'Alimentação', MEDICINE:'Veterinário', EQUIPMENT:'Equipamentos',
  LABOR:'Mão de Obra', OTHER:'Outros',
}

// ── Types ─────────────────────────────────────────────────────────────────────
type Mode   = 'month' | 'quarter' | 'year' | 'custom'
type TabKey = 'financial' | 'milk' | 'herd' | 'detail'

// ── Date helpers ──────────────────────────────────────────────────────────────
const parseD  = (s: string) => new Date(s + 'T12:00:00')
const fmtYMD  = (d: Date)   => d.toISOString().split('T')[0]
const inRange = (s: string, a: Date, b: Date) => { const d = parseD(s); return d >= a && d <= b }

function getRange(mode: Mode, year: number, month: number, quarter: number, cs: string, ce: string): [Date, Date] {
  if (mode === 'month')   return [new Date(year, month - 1, 1), new Date(year, month, 0)]
  if (mode === 'quarter') { const q = (quarter - 1) * 3; return [new Date(year, q, 1), new Date(year, q + 3, 0)] }
  if (mode === 'year')    return [new Date(year, 0, 1), new Date(year, 11, 31)]
  return [cs ? parseD(cs) : new Date(), ce ? parseD(ce) : new Date()]
}

// ── Aggregation helpers ───────────────────────────────────────────────────────
function byDay(rows: any[], dk: string, vk: string) {
  const m: Record<string,number> = {}
  rows.forEach(r => { m[r[dk]] = (m[r[dk]]||0) + (r[vk]||0) })
  return Object.entries(m).sort().map(([k,v]) => {
    const d = parseD(k)
    return { label: `${String(d.getDate()).padStart(2,'0')}/${MONTHS_SHORT[d.getMonth()]}`, value: +v.toFixed(2), key: k }
  })
}
function byWeek(rows: any[], dk: string, vk: string) {
  const m: Record<string,{label:string,value:number}> = {}
  rows.forEach(r => {
    const d = parseD(r[dk]); const day = d.getDay() || 7
    const mon = new Date(d); mon.setDate(d.getDate() - day + 1)
    const k = fmtYMD(mon)
    if (!m[k]) m[k] = { label: `${String(mon.getDate()).padStart(2,'0')}/${MONTHS_SHORT[mon.getMonth()]}`, value: 0 }
    m[k].value += r[vk] || 0
  })
  return Object.entries(m).sort().map(([,v]) => ({ ...v, value: +v.value.toFixed(2) }))
}
function byMonth(rows: any[], dk: string, vk: string) {
  const m: Record<string,number> = {}
  rows.forEach(r => {
    const d = parseD(r[dk]); const k = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
    m[k] = (m[k]||0) + (r[vk]||0)
  })
  return Object.entries(m).sort().map(([k,v]) => ({
    label: `${MONTHS_SHORT[parseInt(k.split('-')[1])-1]}/${k.split('-')[0].slice(2)}`,
    value: +v.toFixed(2), key: k,
  }))
}
function pickGroupFn(days: number) {
  if (days <= 35)  return byDay
  if (days <= 100) return byWeek
  return byMonth
}
function mergeRevExp(rev: any[], exp: any[]) {
  const rm: Record<string,number> = {}; rev.forEach(x => rm[x.label]=x.value)
  const em: Record<string,number> = {}; exp.forEach(x => em[x.label]=x.value)
  const all = Object.keys(rm).concat(Object.keys(em))
  const labels = all.filter((v, i) => all.indexOf(v) === i)
  return labels.map(l => ({ label: l, receita: rm[l]||0, despesa: em[l]||0, lucro: (rm[l]||0)-(em[l]||0) }))
}

// ── Small UI helpers ──────────────────────────────────────────────────────────
function KPI({ label, value, color, sub }: any) {
  return (
    <div className="card" style={{ textAlign:'center' }}>
      <p style={{ fontSize:12, color:'var(--text-muted)', marginBottom:6 }}>{label}</p>
      <p style={{ fontSize:22, fontWeight:700, fontFamily:'var(--font-display)', color }}>{value}</p>
      {sub && <p style={{ fontSize:11, color:'var(--text-muted)', marginTop:3 }}>{sub}</p>}
    </div>
  )
}
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontFamily:'var(--font-display)', fontSize:15, fontWeight:600, marginBottom:'0.875rem' }}>{children}</h3>
}
function Empty({ text }: { text: string }) {
  return <p style={{ textAlign:'center', color:'var(--text-muted)', padding:'2rem', fontSize:13 }}>{text}</p>
}

const TT = { contentStyle:{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 } }

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const now    = new Date()
  const { farmParam, selectedFarmId } = useFarm()

  // Period state
  const [mode,    setMode]    = useState<Mode>('month')
  const [year,    setYear]    = useState(now.getFullYear())
  const [month,   setMonth]   = useState(now.getMonth()+1)
  const [quarter, setQuarter] = useState(Math.floor(now.getMonth()/3)+1)
  const [cStart,  setCStart]  = useState(fmtYMD(new Date(now.getFullYear(), now.getMonth(), 1)))
  const [cEnd,    setCEnd]    = useState(fmtYMD(now))
  const [tab,     setTab]     = useState<TabKey>('financial')

  // Raw data
  const [sales,    setSales]    = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [animals,  setAnimals]  = useState<any[]>([])
  const [milk,     setMilk]     = useState<any[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    setLoading(true)
    const ap = farmParam ? farmParam + '&status=ALL' : '?status=ALL'
    const mp = farmParam ? farmParam + '&days=365'   : '?days=365'
    Promise.all([
      fetch('/api/sales'    + farmParam).then(r => r.json()),
      fetch('/api/expenses' + farmParam).then(r => r.json()),
      fetch('/api/animals'  + ap).then(r => r.json()),
      fetch('/api/milk'     + mp).then(r => r.json()),
    ]).then(([s,e,a,m]) => {
      setSales(Array.isArray(s)?s:[]); setExpenses(Array.isArray(e)?e:[])
      setAnimals(Array.isArray(a)?a:[]); setMilk(Array.isArray(m)?m:[])
      setLoading(false)
    })
  }, [farmParam, selectedFarmId])

  // Date range & filtered data
  const [start, end] = useMemo(()=>getRange(mode,year,month,quarter,cStart,cEnd),[mode,year,month,quarter,cStart,cEnd])
  const days = (end.getTime()-start.getTime())/86_400_000

  const fSales = useMemo(()=>sales.filter(r=>inRange(r.date,start,end)),   [sales,start,end])
  const fExp   = useMemo(()=>expenses.filter(r=>inRange(r.date,start,end)), [expenses,start,end])
  const fMilk  = useMemo(()=>milk.filter(r=>inRange(r.date,start,end)),     [milk,start,end])

  // ── Period navigation ──
  function prevPeriod() {
    if (mode==='month')   { if(month===1){setMonth(12);setYear(y=>y-1)} else setMonth(m=>m-1) }
    if (mode==='quarter') { if(quarter===1){setQuarter(4);setYear(y=>y-1)} else setQuarter(q=>q-1) }
    if (mode==='year')    setYear(y=>y-1)
  }
  function nextPeriod() {
    if (mode==='month')   { if(month===12){setMonth(1);setYear(y=>y+1)} else setMonth(m=>m+1) }
    if (mode==='quarter') { if(quarter===4){setQuarter(1);setYear(y=>y+1)} else setQuarter(q=>q+1) }
    if (mode==='year')    setYear(y=>y+1)
  }
  function periodLabel() {
    if (mode==='month')   return `${MONTHS_LONG[month-1]} ${year}`
    if (mode==='quarter') return `${quarter}º Trimestre ${year}`
    if (mode==='year')    return `${year}`
    return 'Período personalizado'
  }

  // ── Financial ──
  const totalRev = fSales.reduce((s,r)=>s+r.total,0)
  const totalExp = fExp.reduce((s,r)=>s+r.amount,0)
  const profit   = totalRev - totalExp
  const margin   = totalRev>0 ? (profit/totalRev)*100 : 0

  const gFn = pickGroupFn(days)
  const revVsExp = mergeRevExp(gFn(fSales,'date','total'), gFn(fExp,'date','amount'))

  const revByType: Record<string,number> = {}
  fSales.forEach(s => { revByType[s.type]=(revByType[s.type]||0)+s.total })
  const pieRev = Object.entries(revByType).map(([k,v])=>({name:LABELS[k]||k, value:+v.toFixed(2)}))

  const expByCat: Record<string,number> = {}
  fExp.forEach(e => { expByCat[e.category]=(expByCat[e.category]||0)+e.amount })
  const barExp = Object.entries(expByCat)
    .map(([k,v])=>({name:LABELS[k]||k, value:+v.toFixed(2)}))
    .sort((a,b)=>b.value-a.value)

  // ── Milk ──
  const totalMilk  = fMilk.reduce((s,r)=>s+r.total,0)
  const milkDays   = new Set(fMilk.map(r=>r.date)).size
  const avgMilk    = milkDays>0 ? totalMilk/milkDays : 0
  const milkByDay  = byDay(fMilk,'date','total')
  const bestMilkDay= milkByDay.reduce((b,d)=>d.value>b.value?d:b,{label:'—',value:0})

  const milkByAnimal: Record<string,number> = {}
  fMilk.forEach(r => { const n=r.animal?.name||r.animal?.tag||r.animalId; milkByAnimal[n]=(milkByAnimal[n]||0)+r.total })
  const milkAnimalBar = Object.entries(milkByAnimal)
    .map(([name,value])=>({name, value:+value.toFixed(1)}))
    .sort((a,b)=>b.value-a.value).slice(0,10)

  // ── Herd ──
  const active = animals.filter(a=>a.status==='ACTIVE')
  const sold   = animals.filter(a=>a.status==='SOLD')
  const dead   = animals.filter(a=>a.status==='DEAD')

  const herdByType: Record<string,number> = {}
  active.forEach(a=>{ herdByType[a.type]=(herdByType[a.type]||0)+1 })
  const herdPie = Object.entries(herdByType).map(([k,v])=>({name:LABELS[k]||k, value:v}))

  const females = active.filter(a=>a.gender==='FEMALE').length
  const males   = active.filter(a=>a.gender==='MALE').length

  // sales by month (all time) for annual comparison
  const salesByMonth = byMonth(sales,'date','total')

  // ── Tab styles ──
  const TABS: { key: TabKey; label: string; color: string }[] = [
    { key:'financial', label:'💰 Financeiro', color:'var(--brand)'  },
    { key:'milk',      label:'🥛 Leite',       color:'#3b82f6'       },
    { key:'herd',      label:'🐄 Rebanho',     color:'#f59e0b'       },
    { key:'detail',    label:'📋 Detalhado',   color:'var(--text-secondary)' },
  ]

  return (
    <div style={{ maxWidth:1200, display:'flex', flexDirection:'column', gap:'1.25rem' }}>

      {/* ── Header ── */}
      <div>
        <h1 style={{ fontFamily:'var(--font-display)', fontSize:26, fontWeight:700 }}>Relatórios</h1>
        <p style={{ color:'var(--text-muted)', fontSize:14, marginTop:4 }}>Análise completa por período, grupo e categoria</p>
      </div>

      {/* ── Period selector ── */}
      <div className="card" style={{ padding:'1rem 1.25rem', display:'flex', flexWrap:'wrap', gap:'1rem', alignItems:'center' }}>

        {/* Mode tabs */}
        <div style={{ display:'flex', gap:4, background:'var(--bg)', borderRadius:8, padding:3 }}>
          {(['month','quarter','year','custom'] as Mode[]).map(m => (
            <button key={m} onClick={()=>setMode(m)} style={{
              padding:'5px 12px', borderRadius:6, border:'none', cursor:'pointer', fontSize:12.5, fontWeight:500,
              background: mode===m ? 'var(--brand)' : 'transparent',
              color:       mode===m ? 'white'        : 'var(--text-secondary)',
              transition:'all .15s',
            }}>
              {{ month:'Mês', quarter:'Trimestre', year:'Ano', custom:'Período' }[m]}
            </button>
          ))}
        </div>

        {/* Navigation */}
        {mode !== 'custom' && (
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <button onClick={prevPeriod} style={{ width:28, height:28, borderRadius:6, border:'1px solid var(--border)', background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-secondary)' }}>
              <ChevronLeft size={14}/>
            </button>
            <span style={{ fontSize:14, fontWeight:600, minWidth:180, textAlign:'center' }}>{periodLabel()}</span>
            <button onClick={nextPeriod} style={{ width:28, height:28, borderRadius:6, border:'1px solid var(--border)', background:'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-secondary)' }}>
              <ChevronRight size={14}/>
            </button>
          </div>
        )}

        {/* Month/Year selectors */}
        {mode === 'month' && (
          <div style={{ display:'flex', gap:6 }}>
            <select value={month} onChange={e=>setMonth(+e.target.value)} style={{ width:'auto', fontSize:13 }}>
              {MONTHS_LONG.map((m,i)=><option key={i} value={i+1}>{m}</option>)}
            </select>
            <select value={year} onChange={e=>setYear(+e.target.value)} style={{ width:'auto', fontSize:13 }}>
              {Array.from({length:8},(_,i)=>now.getFullYear()-i).map(y=><option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        )}

        {/* Quarter selector */}
        {mode === 'quarter' && (
          <div style={{ display:'flex', gap:6 }}>
            <select value={quarter} onChange={e=>setQuarter(+e.target.value)} style={{ width:'auto', fontSize:13 }}>
              {[1,2,3,4].map(q=><option key={q} value={q}>{q}º Trimestre</option>)}
            </select>
            <select value={year} onChange={e=>setYear(+e.target.value)} style={{ width:'auto', fontSize:13 }}>
              {Array.from({length:8},(_,i)=>now.getFullYear()-i).map(y=><option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        )}

        {/* Year selector */}
        {mode === 'year' && (
          <select value={year} onChange={e=>setYear(+e.target.value)} style={{ width:'auto', fontSize:13 }}>
            {Array.from({length:8},(_,i)=>now.getFullYear()-i).map(y=><option key={y} value={y}>{y}</option>)}
          </select>
        )}

        {/* Custom date range */}
        {mode === 'custom' && (
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <input type="date" value={cStart} onChange={e=>setCStart(e.target.value)} style={{ width:'auto', fontSize:13 }}/>
            <span style={{ color:'var(--text-muted)', fontSize:13 }}>até</span>
            <input type="date" value={cEnd} onChange={e=>setCEnd(e.target.value)} style={{ width:'auto', fontSize:13 }}/>
          </div>
        )}

        <div style={{ marginLeft:'auto', fontSize:12, color:'var(--text-muted)' }}>
          {loading ? 'Carregando...' : `${fSales.length} vendas · ${fExp.length} despesas · ${fMilk.length} registros de leite`}
        </div>
      </div>

      {/* ── Tab selector ── */}
      <div style={{ display:'flex', gap:6, borderBottom:'1px solid var(--border)', paddingBottom:0 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={()=>setTab(t.key)} style={{
            padding:'8px 16px', border:'none', background:'transparent', cursor:'pointer',
            fontSize:13, fontWeight: tab===t.key ? 600 : 400,
            color:    tab===t.key ? t.color : 'var(--text-muted)',
            borderBottom: `2px solid ${tab===t.key ? t.color : 'transparent'}`,
            marginBottom:-1, transition:'all .15s',
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>Carregando dados…</div>
      ) : (
        <>
          {/* ════════════════ FINANCEIRO ════════════════ */}
          {tab === 'financial' && (
            <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>

              {/* KPIs */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:'1rem' }}>
                <KPI label="Receita" value={formatCurrency(totalRev)} color="var(--brand)"/>
                <KPI label="Despesas" value={formatCurrency(totalExp)} color="var(--danger)"/>
                <KPI label="Resultado" value={formatCurrency(profit)} color={profit>=0?'var(--brand)':'var(--danger)'} sub={profit>=0?'Lucro':'Prejuízo'}/>
                <KPI label="Margem" value={`${margin.toFixed(1)}%`} color={margin>=0?'var(--brand)':'var(--danger)'} sub="sobre a receita"/>
              </div>

              {/* Receita x Despesas ao longo do tempo */}
              <div className="card">
                <SectionTitle>Receita × Despesas no período</SectionTitle>
                {revVsExp.length === 0 ? <Empty text="Sem dados no período selecionado"/> : (
                  <ResponsiveContainer width="100%" height={240}>
                    <ComposedChart data={revVsExp} barGap={2}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
                      <XAxis dataKey="label" tick={{ fontSize:11, fill:'var(--text-muted)' }}/>
                      <YAxis tick={{ fontSize:11, fill:'var(--text-muted)' }} tickFormatter={v=>`R$${(v/1000).toFixed(0)}k`}/>
                      <Tooltip {...TT} formatter={(v:any,n:any)=>[formatCurrency(Number(v)), n==='receita'?'Receita':n==='despesa'?'Despesas':'Resultado']}/>
                      <Bar dataKey="receita" name="receita" fill="var(--brand)" radius={[3,3,0,0]} opacity={.85}/>
                      <Bar dataKey="despesa" name="despesa" fill="var(--danger)" radius={[3,3,0,0]} opacity={.85}/>
                      <Line type="monotone" dataKey="lucro" name="lucro" stroke="#3b82f6" strokeWidth={2} dot={false}/>
                    </ComposedChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Receita por tipo + Despesas por categoria */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                <div className="card">
                  <SectionTitle>Receitas por tipo</SectionTitle>
                  {pieRev.length===0 ? <Empty text="Sem vendas no período"/> : (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={pieRev} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={36}
                          label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine fontSize={11}>
                          {pieRev.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                        </Pie>
                        <Tooltip {...TT} formatter={(v:any)=>formatCurrency(Number(v))}/>
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>

                <div className="card">
                  <SectionTitle>Despesas por categoria</SectionTitle>
                  {barExp.length===0 ? <Empty text="Sem despesas no período"/> : (
                    <ResponsiveContainer width="100%" height={220}>
                      <BarChart data={barExp} layout="vertical" margin={{ left:60 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false}/>
                        <XAxis type="number" tick={{ fontSize:11, fill:'var(--text-muted)' }} tickFormatter={v=>`R$${(v/1000).toFixed(0)}k`}/>
                        <YAxis type="category" dataKey="name" tick={{ fontSize:11, fill:'var(--text-muted)' }} width={58}/>
                        <Tooltip {...TT} formatter={(v:any)=>formatCurrency(Number(v))}/>
                        <Bar dataKey="value" name="Valor" fill="var(--danger)" radius={[0,3,3,0]}>
                          {barExp.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Evolução anual mensal */}
              {salesByMonth.length > 1 && (
                <div className="card">
                  <SectionTitle>Receita mensal — histórico completo</SectionTitle>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={salesByMonth}>
                      <defs>
                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--brand)" stopOpacity={.25}/>
                          <stop offset="95%" stopColor="var(--brand)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
                      <XAxis dataKey="label" tick={{ fontSize:10, fill:'var(--text-muted)' }}/>
                      <YAxis tick={{ fontSize:10, fill:'var(--text-muted)' }} tickFormatter={v=>`R$${(v/1000).toFixed(0)}k`}/>
                      <Tooltip {...TT} formatter={(v:any)=>formatCurrency(Number(v))}/>
                      <Area type="monotone" dataKey="value" name="Receita" stroke="var(--brand)" fill="url(#revGrad)" strokeWidth={2}/>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* ════════════════ LEITE ════════════════ */}
          {tab === 'milk' && (
            <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:'1rem' }}>
                <KPI label="Total produzido"  value={`${totalMilk.toFixed(1)} L`}       color="#3b82f6"/>
                <KPI label="Média por dia"    value={`${avgMilk.toFixed(1)} L`}          color="#8b5cf6" sub={`${milkDays} dias com registro`}/>
                <KPI label="Melhor dia"       value={`${bestMilkDay.value.toFixed(1)} L`} color="var(--brand)" sub={bestMilkDay.label}/>
                <KPI label="Registros"        value={fMilk.length}                       color="var(--text-secondary)"/>
              </div>

              <div className="card">
                <SectionTitle>Produção diária no período</SectionTitle>
                {milkByDay.length===0 ? <Empty text="Sem registros de leite no período"/> : (
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={milkByDay}>
                      <defs>
                        <linearGradient id="milkGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#3b82f6" stopOpacity={.25}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
                      <XAxis dataKey="label" tick={{ fontSize:11, fill:'var(--text-muted)' }}/>
                      <YAxis tick={{ fontSize:11, fill:'var(--text-muted)' }} unit=" L"/>
                      <Tooltip {...TT} formatter={(v:any)=>[`${Number(v).toFixed(1)} L`,'Total']}/>
                      <Area type="monotone" dataKey="value" name="Litros" stroke="#3b82f6" fill="url(#milkGrad)" strokeWidth={2} dot={{ r:2 }}/>
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>

              {milkAnimalBar.length > 0 && (
                <div className="card">
                  <SectionTitle>Produção por animal</SectionTitle>
                  <ResponsiveContainer width="100%" height={Math.max(180, milkAnimalBar.length*36)}>
                    <BarChart data={milkAnimalBar} layout="vertical" margin={{ left:80 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false}/>
                      <XAxis type="number" tick={{ fontSize:11, fill:'var(--text-muted)' }} unit=" L"/>
                      <YAxis type="category" dataKey="name" tick={{ fontSize:12, fill:'var(--text-secondary)' }} width={75}/>
                      <Tooltip {...TT} formatter={(v:any)=>[`${Number(v).toFixed(1)} L`,'Total']}/>
                      <Bar dataKey="value" name="Total (L)" radius={[0,4,4,0]}>
                        {milkAnimalBar.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* ════════════════ REBANHO ════════════════ */}
          {tab === 'herd' && (
            <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              {/* Status cards */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:'1rem' }}>
                {[
                  { label:'Ativos',   value:active.length, color:'var(--brand)',  bg:'var(--brand-pale)' },
                  { label:'Vendidos', value:sold.length,   color:'var(--accent)', bg:'var(--accent-pale)' },
                  { label:'Mortos',   value:dead.length,   color:'var(--text-muted)', bg:'var(--border)' },
                  { label:'Total',    value:animals.length,color:'var(--text-primary)', bg:'var(--bg)' },
                ].map(c=>(
                  <div key={c.label} className="card" style={{ textAlign:'center', background:c.bg }}>
                    <p style={{ fontSize:32, fontWeight:700, fontFamily:'var(--font-display)', color:c.color }}>{c.value}</p>
                    <p style={{ fontSize:13, color:'var(--text-secondary)', marginTop:4 }}>{c.label}</p>
                  </div>
                ))}
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                {/* Por tipo */}
                <div className="card">
                  <SectionTitle>Rebanho ativo por tipo</SectionTitle>
                  {herdPie.length===0 ? <Empty text="Nenhum animal ativo"/> : (
                    <ResponsiveContainer width="100%" height={220}>
                      <PieChart>
                        <Pie data={herdPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={36}
                          label={({name,value})=>`${name}: ${value}`} fontSize={12}>
                          {herdPie.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                        </Pie>
                        <Tooltip {...TT}/>
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Por gênero + detalhes */}
                <div className="card">
                  <SectionTitle>Distribuição</SectionTitle>
                  <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem', marginTop:'0.5rem' }}>
                    {/* Gender */}
                    <div>
                      <p style={{ fontSize:12, color:'var(--text-muted)', marginBottom:6 }}>Gênero (ativos)</p>
                      <div style={{ display:'flex', gap:8 }}>
                        {[{label:'Fêmeas',value:females,color:'#ec4899'},{label:'Machos',value:males,color:'#3b82f6'}].map(g=>(
                          <div key={g.label} style={{ flex:1, background:g.color+'15', borderRadius:10, padding:'0.75rem', textAlign:'center', border:`1px solid ${g.color}30` }}>
                            <p style={{ fontSize:24, fontWeight:700, fontFamily:'var(--font-display)', color:g.color }}>{g.value}</p>
                            <p style={{ fontSize:12, color:'var(--text-secondary)', marginTop:2 }}>{g.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Por tipo detalhado */}
                    <div>
                      <p style={{ fontSize:12, color:'var(--text-muted)', marginBottom:6 }}>Por tipo</p>
                      {(['DAIRY','SHEEP','BEEF'] as const).map((type,i)=>{
                        const count = active.filter(a=>a.type===type).length
                        const pct   = active.length>0 ? count/active.length : 0
                        return (
                          <div key={type} style={{ marginBottom:6 }}>
                            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                              <span style={{ fontSize:12, color:'var(--text-secondary)' }}>{LABELS[type]}</span>
                              <span style={{ fontSize:12, fontWeight:600, color:COLORS[i] }}>{count}</span>
                            </div>
                            <div style={{ height:6, borderRadius:3, background:'var(--border)' }}>
                              <div style={{ height:6, borderRadius:3, background:COLORS[i], width:`${pct*100}%`, transition:'width .4s' }}/>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabela de animais */}
              <div className="card">
                <SectionTitle>Todos os animais ({animals.length})</SectionTitle>
                <div className="table-wrapper">
                  <table>
                    <thead><tr><th>TAG</th><th>Nome</th><th>Tipo</th><th>Raça</th><th>Gênero</th><th>Peso</th><th>Status</th></tr></thead>
                    <tbody>
                      {animals.slice(0,50).map(a=>(
                        <tr key={a.id}>
                          <td style={{ fontFamily:'monospace', fontWeight:600 }}>{a.tag}</td>
                          <td>{a.name||'—'}</td>
                          <td>{LABELS[a.type]||a.type}</td>
                          <td>{a.breed||'—'}</td>
                          <td>{a.gender==='FEMALE'?'Fêmea':'Macho'}</td>
                          <td>{a.weight?`${a.weight} kg`:'—'}</td>
                          <td><span className={`badge ${a.status==='ACTIVE'?'badge-green':a.status==='SOLD'?'badge-amber':'badge-gray'}`}>
                            {{ACTIVE:'Ativo',SOLD:'Vendido',DEAD:'Morto'}[a.status as string]||a.status}
                          </span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ════════════════ DETALHADO ════════════════ */}
          {tab === 'detail' && (
            <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', alignItems:'start' }}>
                {/* Sales table */}
                <div className="card">
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.875rem' }}>
                    <SectionTitle>Vendas ({fSales.length})</SectionTitle>
                    <span style={{ fontSize:13, fontWeight:600, color:'var(--brand)' }}>{formatCurrency(totalRev)}</span>
                  </div>
                  {fSales.length===0 ? <Empty text="Sem vendas no período"/> : (
                    <div className="table-wrapper">
                      <table>
                        <thead><tr><th>Data</th><th>Tipo</th><th>Qtd</th><th>Total</th></tr></thead>
                        <tbody>
                          {[...fSales].sort((a,b)=>b.date.localeCompare(a.date)).map(s=>(
                            <tr key={s.id}>
                              <td style={{ fontSize:12 }}>{parseD(s.date).toLocaleDateString('pt-BR')}</td>
                              <td><span className="badge badge-green">{LABELS[s.type]||s.type}</span></td>
                              <td style={{ fontSize:12 }}>{s.quantity} {s.unit}</td>
                              <td style={{ fontWeight:600, color:'var(--brand)' }}>{formatCurrency(s.total)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Expenses table */}
                <div className="card">
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.875rem' }}>
                    <SectionTitle>Despesas ({fExp.length})</SectionTitle>
                    <span style={{ fontSize:13, fontWeight:600, color:'var(--danger)' }}>{formatCurrency(totalExp)}</span>
                  </div>
                  {fExp.length===0 ? <Empty text="Sem despesas no período"/> : (
                    <div className="table-wrapper">
                      <table>
                        <thead><tr><th>Data</th><th>Categoria</th><th>Descrição</th><th>Valor</th></tr></thead>
                        <tbody>
                          {[...fExp].sort((a,b)=>b.date.localeCompare(a.date)).map(e=>(
                            <tr key={e.id}>
                              <td style={{ fontSize:12 }}>{parseD(e.date).toLocaleDateString('pt-BR')}</td>
                              <td><span className="badge badge-red" style={{ fontSize:10 }}>{LABELS[e.category]||e.category}</span></td>
                              <td style={{ fontSize:12, maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.description}</td>
                              <td style={{ fontWeight:600, color:'var(--danger)' }}>{formatCurrency(e.amount)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Milk records table */}
              <div className="card">
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'0.875rem' }}>
                  <SectionTitle>Registros de Leite ({fMilk.length})</SectionTitle>
                  <span style={{ fontSize:13, fontWeight:600, color:'#3b82f6' }}>{totalMilk.toFixed(1)} L total</span>
                </div>
                {fMilk.length===0 ? <Empty text="Sem registros de leite no período"/> : (
                  <div className="table-wrapper">
                    <table>
                      <thead><tr><th>Data</th><th>Animal</th><th>Manhã (L)</th><th>Tarde (L)</th><th>Total (L)</th></tr></thead>
                      <tbody>
                        {[...fMilk].sort((a,b)=>b.date.localeCompare(a.date)).slice(0,100).map(r=>(
                          <tr key={r.id}>
                            <td style={{ fontSize:12 }}>{parseD(r.date).toLocaleDateString('pt-BR')}</td>
                            <td style={{ fontWeight:500 }}>{r.animal?.name||r.animal?.tag||'—'}</td>
                            <td>{r.morning?.toFixed(1)}</td>
                            <td>{r.evening?.toFixed(1)}</td>
                            <td style={{ fontWeight:600, color:'#3b82f6' }}>{r.total?.toFixed(1)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
