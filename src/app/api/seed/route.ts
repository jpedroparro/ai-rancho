import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getDb, newId, qRow } from '@/lib/database'

export async function POST() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Não disponível' }, { status: 404 })
  }

  const db = await getDb()
  const existing = qRow(db, "SELECT id FROM users WHERE email='demo@airancho.com'")
  if (existing) return NextResponse.json({ alreadySeeded: true })

  const hashed = await bcrypt.hash('demo123', 10)

  // ── Usuário ──────────────────────────────────────────────────────────────────
  db.run('INSERT INTO users (id,name,email,password,role,farmName) VALUES (?,?,?,?,?,?)',
    ['user-demo', 'João Pedro Demo', 'demo@airancho.com', hashed, 'ADMIN', 'Ai.Rancho Demo'])

  // ── Fazendas ─────────────────────────────────────────────────────────────────
  const FARMS = {
    pequena: 'farm-pequena',
    media:   'farm-media',
    grande:  'farm-grande',
  }

  db.run('INSERT INTO farms (id,name,location,hectares,description,userId) VALUES (?,?,?,?,?,?)',
    [FARMS.pequena, 'Sítio São João', 'Sorocaba, SP', 48,
     'Pequena propriedade familiar com foco em leite e ovelhas', 'user-demo'])
  db.run('INSERT INTO farms (id,name,location,hectares,description,userId) VALUES (?,?,?,?,?,?)',
    [FARMS.media, 'Fazenda Vale Verde', 'Lavras, MG', 230,
     'Fazenda de médio porte com diversificação entre leite, corte e lã', 'user-demo'])
  db.run('INSERT INTO farms (id,name,location,hectares,description,userId) VALUES (?,?,?,?,?,?)',
    [FARMS.grande, 'Fazenda Horizonte', 'Campo Grande, MS', 1850,
     'Grande produtora de leite e corte — referência regional', 'user-demo'])

  // ── Helpers de data ───────────────────────────────────────────────────────────
  const pad   = (n: number) => String(n).padStart(2, '0')
  const isoDay = (d: Date)  => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`
  const addDays = (base: Date, n: number) => new Date(base.getTime() + n * 86_400_000)

  const today     = new Date()
  const startDate = new Date(today.getFullYear(), today.getMonth() - 5, 1) // 6 meses atrás

  // ── Gerador de datas do período ──────────────────────────────────────────────
  function eachDay(cb: (d: Date, iso: string) => void) {
    let d = new Date(startDate)
    while (d <= today) {
      cb(new Date(d), isoDay(d))
      d = addDays(d, 1)
    }
  }

  function eachMonth(cb: (year: number, month: number, lastDay: string) => void) {
    let d = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
    while (d <= today) {
      const y = d.getFullYear()
      const m = d.getMonth()
      const last = new Date(y, m + 1, 0)
      if (last <= today) cb(y, m, isoDay(last))
      d = new Date(y, m + 1, 1)
    }
  }

  // Variação sazonal: inverno (jun-ago) reduz produção ~15%
  function seasonFactor(date: Date) {
    const m = date.getMonth() // 0-based
    return (m >= 5 && m <= 7) ? 0.85 : 1.0
  }

  function rnd(min: number, max: number) {
    return Math.round((min + Math.random() * (max - min)) * 10) / 10
  }

  // ════════════════════════════════════════════════════════════════════════════
  // SÍTIO SÃO JOÃO — fazendaPequena
  // ════════════════════════════════════════════════════════════════════════════
  {
    const F = FARMS.pequena

    // Animais
    const animals = [
      { id: 'sp-lt1', tag: 'SJ-01', name: 'Mimosa',    type: 'DAIRY', breed: 'Jersey',     gender: 'FEMALE', weight: 360, base: 8  },
      { id: 'sp-lt2', tag: 'SJ-02', name: 'Boneca',    type: 'DAIRY', breed: 'Jersey',     gender: 'FEMALE', weight: 380, base: 9  },
      { id: 'sp-lt3', tag: 'SJ-03', name: 'Estrelinha',type: 'DAIRY', breed: 'Girolando',  gender: 'FEMALE', weight: 410, base: 11 },
      { id: 'sp-ov1', tag: 'SJ-04', name: 'Fofinha',   type: 'SHEEP', breed: 'Santa Inês', gender: 'FEMALE', weight: 55,  base: 0  },
      { id: 'sp-ov2', tag: 'SJ-05', name: 'Peluda',    type: 'SHEEP', breed: 'Dorper',     gender: 'FEMALE', weight: 60,  base: 0  },
      { id: 'sp-ov3', tag: 'SJ-06', name: 'Branca',    type: 'SHEEP', breed: 'Dorper',     gender: 'FEMALE', weight: 58,  base: 0  },
      { id: 'sp-bv1', tag: 'SJ-07', name: 'Trovão',    type: 'BEEF',  breed: 'Nelore',     gender: 'MALE',   weight: 320, base: 0  },
      { id: 'sp-bv2', tag: 'SJ-08', name: 'Relâmpago', type: 'BEEF',  breed: 'Nelore',     gender: 'MALE',   weight: 290, base: 0  },
    ]
    for (const a of animals) {
      db.run('INSERT INTO animals (id,tag,name,type,breed,gender,weight,status,farmId) VALUES (?,?,?,?,?,?,?,?,?)',
        [a.id, a.tag, a.name, a.type, a.breed, a.gender, a.weight, 'ACTIVE', F])
    }

    // Funcionários
    db.run('INSERT INTO employees (id,name,role,salary,phone,startDate,status,farmId) VALUES (?,?,?,?,?,?,?,?)',
      ['sp-emp1', 'Carlos Mendes', 'Ordenhador/Geral', 1700, '(15) 99111-2233', '2021-05-10', 'ACTIVE', F])
    db.run('INSERT INTO employees (id,name,role,salary,phone,startDate,status,farmId) VALUES (?,?,?,?,?,?,?,?)',
      ['sp-emp2', 'Ana Paula Ferreira', 'Auxiliar Rural', 1450, '(15) 99444-5566', '2023-02-01', 'ACTIVE', F])

    // Pagamentos (últimos 6 meses)
    eachMonth((y, m) => {
      const d = `${y}-${pad(m+1)}-05`
      db.run('INSERT INTO payments (id,employeeId,amount,date,type) VALUES (?,?,?,?,?)',
        [newId(), 'sp-emp1', 1700, d, 'SALARY'])
      db.run('INSERT INTO payments (id,employeeId,amount,date,type) VALUES (?,?,?,?,?)',
        [newId(), 'sp-emp2', 1450, d, 'SALARY'])
    })

    // Registros de leite diários
    const dairyCows = animals.filter(a => a.type === 'DAIRY')
    eachDay((date, iso) => {
      const sf = seasonFactor(date)
      for (const cow of dairyCows) {
        const morning = rnd(cow.base * 0.6 * sf, cow.base * 0.7 * sf)
        const evening = rnd(cow.base * 0.3 * sf, cow.base * 0.4 * sf)
        db.run('INSERT INTO milk_records (id,animalId,date,morning,evening,total,farmId) VALUES (?,?,?,?,?,?,?)',
          [newId(), cow.id, iso, morning, evening, +(morning + evening).toFixed(1), F])
      }
    })

    // Vendas de leite mensais (cooperativa, ~2.30/L)
    eachMonth((y, m, last) => {
      const sf = seasonFactor(new Date(y, m, 15))
      const liters = Math.round(rnd(800, 950) * sf)
      db.run('INSERT INTO sales (id,type,date,quantity,unit,pricePerUnit,total,buyer,farmId) VALUES (?,?,?,?,?,?,?,?,?)',
        [newId(), 'MILK', last, liters, 'L', 2.30, +(liters * 2.30).toFixed(2), 'Cooperativa Laticap', F])
    })

    // Venda de 1 bovino em 3 meses atrás
    {
      const d = isoDay(new Date(today.getFullYear(), today.getMonth() - 3, 12))
      db.run('INSERT INTO sales (id,type,date,quantity,unit,pricePerUnit,total,buyer,farmId) VALUES (?,?,?,?,?,?,?,?,?)',
        [newId(), 'ANIMAL', d, 1, 'cabeça', 2800, 2800, 'Frigorífico Sorocaba', F])
    }

    // Tosquia — venda de lã anual
    {
      const d = isoDay(new Date(today.getFullYear(), today.getMonth() - 1, 20))
      db.run('INSERT INTO sales (id,type,date,quantity,unit,pricePerUnit,total,buyer,farmId) VALUES (?,?,?,?,?,?,?,?,?)',
        [newId(), 'WOOL', d, 18, 'kg', 11, 198, null, F])
    }

    // Despesas mensais
    eachMonth((y, m, last) => {
      const mo = `${y}-${pad(m+1)}`
      db.run('INSERT INTO expenses (id,category,description,date,amount,supplier,farmId) VALUES (?,?,?,?,?,?,?)',
        [newId(), 'FEED',      'Ração concentrada',        `${mo}-08`, rnd(380, 450), 'Agropecuária Moura', F])
      db.run('INSERT INTO expenses (id,category,description,date,amount,supplier,farmId) VALUES (?,?,?,?,?,?,?)',
        [newId(), 'FEED',      'Sal mineral e volumoso',   `${mo}-10`, rnd(120, 180), null, F])
      db.run('INSERT INTO expenses (id,category,description,date,amount,supplier,farmId) VALUES (?,?,?,?,?,?,?)',
        [newId(), 'LABOR',     'Mão de obra (salários)',   `${mo}-05`, 3150, null, F])
      if (m % 2 === 0) {
        db.run('INSERT INTO expenses (id,category,description,date,amount,supplier,farmId) VALUES (?,?,?,?,?,?,?)',
          [newId(), 'MEDICINE', 'Medicamentos e vitaminas', `${mo}-15`, rnd(90, 180), 'VetCare MG', F])
      }
      if (m % 3 === 0) {
        db.run('INSERT INTO expenses (id,category,description,date,amount,supplier,farmId) VALUES (?,?,?,?,?,?,?)',
          [newId(), 'EQUIPMENT', 'Manutenção geral', `${mo}-18`, rnd(150, 350), null, F])
      }
    })
    // Despesa extra: conserto do bebedouro
    db.run('INSERT INTO expenses (id,category,description,date,amount,supplier,farmId) VALUES (?,?,?,?,?,?,?)',
      [newId(), 'EQUIPMENT', 'Conserto bebedouro automático', isoDay(addDays(today, -45)), 420, 'Manutenções Rurais', F])

    // Estoque
    const invSmall = [
      ['Ração concentrada', 'FEED',      180, 'kg',    60,  2.80, 'Agropecuária Moura'],
      ['Feno coastcross',   'FEED',       22, 'fardos',10,  9.00, null],
      ['Sal mineral',       'FEED',        8, 'kg',    15,  5.50, null],
      ['Ivermectina 1%',    'MEDICINE',    4, 'frascos', 3, 22.00, 'VetCare MG'],
      ['Vacina brucelose',  'MEDICINE',    6, 'doses',  10,  6.50, 'VetCare MG'],
      ['Diesel',            'FUEL',       80, 'L',     30,  6.40, 'Posto Boa Vista'],
    ]
    for (const [name, cat, qty, unit, min, cost, sup] of invSmall) {
      db.run('INSERT INTO inventory_items (id,farmId,name,category,quantity,unit,minQuantity,costPerUnit,supplier) VALUES (?,?,?,?,?,?,?,?,?)',
        [newId(), F, name, cat, qty, unit, min, cost, sup])
    }

    // Metas
    const cm = `${today.getFullYear()}-${pad(today.getMonth()+1)}`
    const cy = String(today.getFullYear())
    db.run('INSERT INTO goals (id,farmId,type,label,targetValue,periodType,periodValue,status) VALUES (?,?,?,?,?,?,?,?)',
      [newId(), F, 'MILK_PRODUCTION', 'Produção mensal de leite', 850, 'MONTHLY', cm, 'ACTIVE'])
    db.run('INSERT INTO goals (id,farmId,type,label,targetValue,periodType,periodValue,status) VALUES (?,?,?,?,?,?,?,?)',
      [newId(), F, 'REVENUE', 'Receita total do mês', 2500, 'MONTHLY', cm, 'ACTIVE'])
    db.run('INSERT INTO goals (id,farmId,type,label,targetValue,periodType,periodValue,status) VALUES (?,?,?,?,?,?,?,?)',
      [newId(), F, 'EXPENSES_LIMIT', 'Limite de despesas mensais', 2200, 'MONTHLY', cm, 'ACTIVE'])
    db.run('INSERT INTO goals (id,farmId,type,label,targetValue,periodType,periodValue,status) VALUES (?,?,?,?,?,?,?,?)',
      [newId(), F, 'ANIMALS_COUNT', 'Crescer plantel para 12 animais', 12, 'YEARLY', cy, 'ACTIVE'])

    // Calendário
    const fd = (n: number) => isoDay(addDays(today, n))
    db.run('INSERT INTO calendar_events (id,farmId,title,description,eventType,date,animalId,status) VALUES (?,?,?,?,?,?,?,?)',
      [newId(), F, 'Vacinação aftosa rebanho', 'Vacinação obrigatória semestral', 'VACCINATION', fd(5), null, 'PENDING'])
    db.run('INSERT INTO calendar_events (id,farmId,title,description,eventType,date,animalId,status) VALUES (?,?,?,?,?,?,?,?)',
      [newId(), F, 'Pesagem mensal animais', null, 'WEIGHING', fd(8), null, 'PENDING'])
    db.run('INSERT INTO calendar_events (id,farmId,title,description,eventType,date,animalId,status) VALUES (?,?,?,?,?,?,?,?)',
      [newId(), F, 'Vermifugação — ovelhas', 'Usar ivermectina 1%', 'TREATMENT', fd(12), 'sp-ov1', 'PENDING'])
    db.run('INSERT INTO calendar_events (id,farmId,title,description,eventType,date,animalId,status) VALUES (?,?,?,?,?,?,?,?)',
      [newId(), F, 'Tosquia das ovelhas', 'Chamar tosquiador — 3 ovelhas', 'SHEARING', fd(25), null, 'PENDING'])
    db.run('INSERT INTO calendar_events (id,farmId,title,description,eventType,date,animalId,status) VALUES (?,?,?,?,?,?,?,?)',
      [newId(), F, 'Vacinação brucelose — Mimosa', null, 'VACCINATION', isoDay(addDays(today, -8)), 'sp-lt1', 'DONE'])
    db.run('INSERT INTO calendar_events (id,farmId,title,description,eventType,date,animalId,status) VALUES (?,?,?,?,?,?,?,?)',
      [newId(), F, 'Revisão cerca perímetro', 'Consertado mourão setor norte', 'MAINTENANCE', isoDay(addDays(today, -15)), null, 'DONE'])
  }

  // ════════════════════════════════════════════════════════════════════════════
  // FAZENDA VALE VERDE — fazendaMedia
  // ════════════════════════════════════════════════════════════════════════════
  {
    const F = FARMS.media

    const animals = [
      { id: 'mv-lt1', tag: 'VV-01', name: 'Jatobá',     type: 'DAIRY', breed: 'Holandesa',  gender: 'FEMALE', weight: 540, base: 22 },
      { id: 'mv-lt2', tag: 'VV-02', name: 'Flor',       type: 'DAIRY', breed: 'Holandesa',  gender: 'FEMALE', weight: 520, base: 24 },
      { id: 'mv-lt3', tag: 'VV-03', name: 'Aurora',     type: 'DAIRY', breed: 'Girolando',  gender: 'FEMALE', weight: 490, base: 19 },
      { id: 'mv-lt4', tag: 'VV-04', name: 'Primavera',  type: 'DAIRY', breed: 'Girolando',  gender: 'FEMALE', weight: 475, base: 18 },
      { id: 'mv-lt5', tag: 'VV-05', name: 'Rainha',     type: 'DAIRY', breed: 'Holandesa',  gender: 'FEMALE', weight: 560, base: 26 },
      { id: 'mv-lt6', tag: 'VV-06', name: 'Diamante',   type: 'DAIRY', breed: 'Holandesa',  gender: 'FEMALE', weight: 545, base: 23 },
      { id: 'mv-lt7', tag: 'VV-07', name: 'Safira',     type: 'DAIRY', breed: 'Jersey',     gender: 'FEMALE', weight: 410, base: 14 },
      { id: 'mv-ov1', tag: 'VV-08', name: 'Névoa',      type: 'SHEEP', breed: 'Texel',      gender: 'FEMALE', weight: 70,  base: 0  },
      { id: 'mv-ov2', tag: 'VV-09', name: 'Gelo',       type: 'SHEEP', breed: 'Texel',      gender: 'FEMALE', weight: 68,  base: 0  },
      { id: 'mv-ov3', tag: 'VV-10', name: 'Cristal',    type: 'SHEEP', breed: 'Corriedale', gender: 'FEMALE', weight: 65,  base: 0  },
      { id: 'mv-ov4', tag: 'VV-11', name: 'Pérola',     type: 'SHEEP', breed: 'Corriedale', gender: 'FEMALE', weight: 62,  base: 0  },
      { id: 'mv-ov5', tag: 'VV-12', name: 'Íris',       type: 'SHEEP', breed: 'Santa Inês', gender: 'FEMALE', weight: 60,  base: 0  },
      { id: 'mv-bv1', tag: 'VV-13', name: 'Atlântico',  type: 'BEEF',  breed: 'Angus',      gender: 'MALE',   weight: 480, base: 0  },
      { id: 'mv-bv2', tag: 'VV-14', name: 'Pacífico',   type: 'BEEF',  breed: 'Angus',      gender: 'MALE',   weight: 510, base: 0  },
      { id: 'mv-bv3', tag: 'VV-15', name: 'Índico',     type: 'BEEF',  breed: 'Nelore',     gender: 'MALE',   weight: 460, base: 0  },
      { id: 'mv-bv4', tag: 'VV-16', name: 'Ártico',     type: 'BEEF',  breed: 'Nelore',     gender: 'MALE',   weight: 440, base: 0  },
      // Vendido há 2 meses
      { id: 'mv-bv5', tag: 'VV-17', name: 'Bravo',      type: 'BEEF',  breed: 'Angus',      gender: 'MALE',   weight: 520, base: 0, status: 'SOLD' },
      // Nova aquisição há 1 mês
      { id: 'mv-lt8', tag: 'VV-18', name: 'Estrela Nova',type:'DAIRY', breed: 'Holandesa',  gender: 'FEMALE', weight: 490, base: 21 },
    ]
    for (const a of animals) {
      db.run('INSERT INTO animals (id,tag,name,type,breed,gender,weight,status,farmId) VALUES (?,?,?,?,?,?,?,?,?)',
        [a.id, a.tag, a.name, a.type, a.breed, a.gender, a.weight, (a as any).status ?? 'ACTIVE', F])
    }

    // Funcionários
    const emps = [
      { id: 'mv-emp1', name: 'Rodrigo Alves',       role: 'Gerente de Campo',   salary: 3200, phone: '(35) 99100-0001', start: '2020-03-15' },
      { id: 'mv-emp2', name: 'Fernanda Costa',       role: 'Ordenhadora Chefe',  salary: 2100, phone: '(35) 99100-0002', start: '2021-08-01' },
      { id: 'mv-emp3', name: 'Paulo Henrique Santos',role: 'Ordenhador',         salary: 1900, phone: '(35) 99100-0003', start: '2022-01-10' },
      { id: 'mv-emp4', name: 'Luciana Barbosa',      role: 'Auxiliar Pecuária',  salary: 1700, phone: '(35) 99100-0004', start: '2023-07-20' },
    ]
    for (const e of emps) {
      db.run('INSERT INTO employees (id,name,role,salary,phone,startDate,status,farmId) VALUES (?,?,?,?,?,?,?,?)',
        [e.id, e.name, e.role, e.salary, e.phone, e.start, 'ACTIVE', F])
    }

    eachMonth((y, m) => {
      const d = `${y}-${pad(m+1)}-05`
      for (const e of emps) {
        db.run('INSERT INTO payments (id,employeeId,amount,date,type) VALUES (?,?,?,?,?)',
          [newId(), e.id, e.salary, d, 'SALARY'])
      }
    })

    // Milk records — 7 cows ativas (excluindo a nova que só tem 1 mês)
    const activeDairy = animals.filter(a => a.type === 'DAIRY' && a.id !== 'mv-lt8')
    const newCowStart = isoDay(new Date(today.getFullYear(), today.getMonth() - 1, 1))

    eachDay((date, iso) => {
      const sf = seasonFactor(date)
      for (const cow of activeDairy) {
        const morning = rnd(cow.base * 0.58 * sf, cow.base * 0.68 * sf)
        const evening = rnd(cow.base * 0.32 * sf, cow.base * 0.42 * sf)
        db.run('INSERT INTO milk_records (id,animalId,date,morning,evening,total,farmId) VALUES (?,?,?,?,?,?,?)',
          [newId(), cow.id, iso, morning, evening, +(morning + evening).toFixed(1), F])
      }
      // Vaca nova só a partir do mês passado
      if (iso >= newCowStart) {
        const cow = animals.find(a => a.id === 'mv-lt8')!
        const morning = rnd(cow.base * 0.58 * sf, cow.base * 0.68 * sf)
        const evening = rnd(cow.base * 0.32 * sf, cow.base * 0.42 * sf)
        db.run('INSERT INTO milk_records (id,animalId,date,morning,evening,total,farmId) VALUES (?,?,?,?,?,?,?)',
          [newId(), cow.id, iso, morning, evening, +(morning + evening).toFixed(1), F])
      }
    })

    // Vendas de leite mensais (2 compradores alternados)
    eachMonth((y, m, last) => {
      const sf = seasonFactor(new Date(y, m, 15))
      const liters = Math.round(rnd(3200, 3800) * sf)
      const buyer  = m % 2 === 0 ? 'Laticínio Canastra' : 'Cooperativa MG Leite'
      db.run('INSERT INTO sales (id,type,date,quantity,unit,pricePerUnit,total,buyer,farmId) VALUES (?,?,?,?,?,?,?,?,?)',
        [newId(), 'MILK', last, liters, 'L', 2.55, +(liters * 2.55).toFixed(2), buyer, F])
    })

    // Venda do boi Bravo há 2 meses
    db.run('INSERT INTO sales (id,type,date,quantity,unit,pricePerUnit,total,buyer,farmId) VALUES (?,?,?,?,?,?,?,?,?)',
      [newId(), 'ANIMAL', isoDay(new Date(today.getFullYear(), today.getMonth() - 2, 8)),
       1, 'cabeça', 5200, 5200, 'Frigorífico Vale', F])

    // Venda de angus magro há 4 meses
    db.run('INSERT INTO sales (id,type,date,quantity,unit,pricePerUnit,total,buyer,farmId) VALUES (?,?,?,?,?,?,?,?,?)',
      [newId(), 'ANIMAL', isoDay(new Date(today.getFullYear(), today.getMonth() - 4, 22)),
       2, 'cabeça', 4800, 9600, 'Frigorífico Andrade', F])

    // Tosquia 5 ovelhas
    db.run('INSERT INTO sales (id,type,date,quantity,unit,pricePerUnit,total,buyer,farmId) VALUES (?,?,?,?,?,?,?,?,?)',
      [newId(), 'WOOL', isoDay(new Date(today.getFullYear(), today.getMonth() - 1, 15)),
       32, 'kg', 12.50, 400, 'Fiação Canastra', F])

    // Compra da vaca nova Estrela Nova
    db.run('INSERT INTO sales (id,type,date,quantity,unit,pricePerUnit,total,buyer,farmId) VALUES (?,?,?,?,?,?,?,?,?)',
      [newId(), 'ANIMAL', isoDay(new Date(today.getFullYear(), today.getMonth() - 1, 3)),
       1, 'cabeça', -4500, -4500, 'Fazenda Bom Pasto (compra)', F])

    // Despesas mensais
    eachMonth((y, m, last) => {
      const mo = `${y}-${pad(m+1)}`
      db.run('INSERT INTO expenses (id,category,description,date,amount,supplier,farmId) VALUES (?,?,?,?,?,?,?)',
        [newId(), 'FEED', 'Ração concentrada (5 sacos 50kg)', `${mo}-07`, rnd(1400, 1700), 'NutriAgro MG', F])
      db.run('INSERT INTO expenses (id,category,description,date,amount,supplier,farmId) VALUES (?,?,?,?,?,?,?)',
        [newId(), 'FEED', 'Silagem de milho', `${mo}-10`, rnd(800, 1100), 'Silo Verde MG', F])
      db.run('INSERT INTO expenses (id,category,description,date,amount,supplier,farmId) VALUES (?,?,?,?,?,?,?)',
        [newId(), 'FEED', 'Sal mineral bovino', `${mo}-12`, rnd(280, 380), null, F])
      db.run('INSERT INTO expenses (id,category,description,date,amount,supplier,farmId) VALUES (?,?,?,?,?,?,?)',
        [newId(), 'LABOR', 'Salários + encargos', `${mo}-05`, 10200, null, F])
      db.run('INSERT INTO expenses (id,category,description,date,amount,supplier,farmId) VALUES (?,?,?,?,?,?,?)',
        [newId(), 'MEDICINE', 'Medicamentos e vacinas', `${mo}-15`, rnd(380, 620), 'VetSupply MG', F])
      db.run('INSERT INTO expenses (id,category,description,date,amount,supplier,farmId) VALUES (?,?,?,?,?,?,?)',
        [newId(), 'FUEL', 'Diesel trator e caminhão', `${mo}-20`, rnd(550, 750), 'Posto Horizonte', F])
      if (m % 2 === 0) {
        db.run('INSERT INTO expenses (id,category,description,date,amount,supplier,farmId) VALUES (?,?,?,?,?,?,?)',
          [newId(), 'EQUIPMENT', 'Manutenção equipamentos', `${mo}-18`, rnd(400, 800), 'Maq Rural', F])
      }
    })
    // Reforma bebedouros
    db.run('INSERT INTO expenses (id,category,description,date,amount,supplier,farmId) VALUES (?,?,?,?,?,?,?)',
      [newId(), 'EQUIPMENT', 'Reforma bebedouros pasto 4', isoDay(addDays(today, -60)), 1850, 'Hidráulica Rural', F])
    // Compra da vaca nova
    db.run('INSERT INTO expenses (id,category,description,date,amount,supplier,farmId) VALUES (?,?,?,?,?,?,?)',
      [newId(), 'OTHER', 'Aquisição vaca Holandesa (VV-18)', isoDay(new Date(today.getFullYear(), today.getMonth() - 1, 3)), 4500, 'Fazenda Bom Pasto', F])

    // Estoque
    const invMedia = [
      ['Ração concentrada',  'FEED',      820, 'kg',  200,  2.90, 'NutriAgro MG'],
      ['Silagem de milho',   'FEED',     4500, 'kg', 1000,  0.38, 'Silo Verde MG'],
      ['Feno de tifton',     'FEED',       65, 'fardos', 20, 9.00, null],
      ['Sal mineral bovino', 'FEED',       42, 'kg',  30,   5.80, null],
      ['Ivermectina 3,5%',   'MEDICINE',   18, 'frascos', 5, 28.00, 'VetSupply MG'],
      ['Vacina aftosa',      'MEDICINE',   30, 'doses', 20,  4.80, 'VetSupply MG'],
      ['Antibiótico injetável','MEDICINE',  6, 'frascos',  3, 65.00, 'VetSupply MG'],
      ['Diesel',             'FUEL',      380, 'L',  100,   6.30, 'Posto Horizonte'],
      ['Óleo lubrificante',  'FUEL',        8, 'L',    4,  18.00, 'Posto Horizonte'],
      ['Mangueira silicone', 'EQUIPMENT',   3, 'metros', 2, 38.00, null],
    ]
    for (const [name, cat, qty, unit, min, cost, sup] of invMedia) {
      db.run('INSERT INTO inventory_items (id,farmId,name,category,quantity,unit,minQuantity,costPerUnit,supplier) VALUES (?,?,?,?,?,?,?,?,?)',
        [newId(), F, name, cat, qty, unit, min, cost, sup])
    }

    // Metas
    const cm = `${today.getFullYear()}-${pad(today.getMonth()+1)}`
    const cy = String(today.getFullYear())
    db.run('INSERT INTO goals (id,farmId,type,label,targetValue,periodType,periodValue,status) VALUES (?,?,?,?,?,?,?,?)',
      [newId(), F, 'MILK_PRODUCTION', 'Meta de produção mensal', 3500, 'MONTHLY', cm, 'ACTIVE'])
    db.run('INSERT INTO goals (id,farmId,type,label,targetValue,periodType,periodValue,status) VALUES (?,?,?,?,?,?,?,?)',
      [newId(), F, 'REVENUE', 'Faturamento mínimo mensal', 12000, 'MONTHLY', cm, 'ACTIVE'])
    db.run('INSERT INTO goals (id,farmId,type,label,targetValue,periodType,periodValue,status) VALUES (?,?,?,?,?,?,?,?)',
      [newId(), F, 'EXPENSES_LIMIT', 'Controle de despesas mensais', 16000, 'MONTHLY', cm, 'ACTIVE'])
    db.run('INSERT INTO goals (id,farmId,type,label,targetValue,periodType,periodValue,status) VALUES (?,?,?,?,?,?,?,?)',
      [newId(), F, 'ANIMALS_COUNT', 'Plantel de 25 animais até fim do ano', 25, 'YEARLY', cy, 'ACTIVE'])
    db.run('INSERT INTO goals (id,farmId,type,label,targetValue,periodType,periodValue,status) VALUES (?,?,?,?,?,?,?,?)',
      [newId(), F, 'REVENUE', 'Receita anual R$ 150.000', 150000, 'YEARLY', cy, 'ACTIVE'])

    // Calendário
    const fd = (n: number) => isoDay(addDays(today, n))
    db.run('INSERT INTO calendar_events (id,farmId,title,description,eventType,date,animalId,status) VALUES (?,?,?,?,?,?,?,?)',
      [newId(), F, 'Vacinação aftosa rebanho completo', 'Todos bovinos — semestral', 'VACCINATION', fd(4), null, 'PENDING'])
    db.run('INSERT INTO calendar_events (id,farmId,title,description,eventType,date,animalId,status) VALUES (?,?,?,?,?,?,?,?)',
      [newId(), F, 'Inseminação artificial — Jatobá', 'IA programada — sêmen Holandês', 'BREEDING', fd(7), 'mv-lt1', 'PENDING'])
    db.run('INSERT INTO calendar_events (id,farmId,title,description,eventType,date,animalId,status) VALUES (?,?,?,?,?,?,?,?)',
      [newId(), F, 'Pesagem bimestral bovinos de corte', null, 'WEIGHING', fd(10), null, 'PENDING'])
    db.run('INSERT INTO calendar_events (id,farmId,title,description,eventType,date,animalId,status) VALUES (?,?,?,?,?,?,?,?)',
      [newId(), F, 'Vermifugação rebanho ovino', 'Ivermectina + closantel', 'TREATMENT', fd(14), null, 'PENDING'])
    db.run('INSERT INTO calendar_events (id,farmId,title,description,eventType,date,animalId,status) VALUES (?,?,?,?,?,?,?,?)',
      [newId(), F, 'Revisão ordenhadeira mecânica', 'Manutenção preventiva 6 meses', 'MAINTENANCE', fd(20), null, 'PENDING'])
    db.run('INSERT INTO calendar_events (id,farmId,title,description,eventType,date,animalId,status) VALUES (?,?,?,?,?,?,?,?)',
      [newId(), F, 'Tosquia ovelhas Texel', '4 animais — contratar tosquiador', 'SHEARING', fd(30), null, 'PENDING'])
    db.run('INSERT INTO calendar_events (id,farmId,title,description,eventType,date,animalId,status) VALUES (?,?,?,?,?,?,?,?)',
      [newId(), F, 'Vacinação brucelose novilhas', null, 'VACCINATION', isoDay(addDays(today, -10)), null, 'DONE'])
    db.run('INSERT INTO calendar_events (id,farmId,title,description,eventType,date,animalId,status) VALUES (?,?,?,?,?,?,?,?)',
      [newId(), F, 'Entrega vaca Holandesa VV-18', 'Compra concluída, animal chegou', 'PURCHASE', isoDay(new Date(today.getFullYear(), today.getMonth() - 1, 3)), 'mv-lt8', 'DONE'])
    db.run('INSERT INTO calendar_events (id,farmId,title,description,eventType,date,animalId,status) VALUES (?,?,?,?,?,?,?,?)',
      [newId(), F, 'Venda boi Bravo VV-17', 'Entregue ao Frigorífico Vale', 'SALE', isoDay(new Date(today.getFullYear(), today.getMonth() - 2, 8)), 'mv-bv5', 'DONE'])
  }

  // ════════════════════════════════════════════════════════════════════════════
  // FAZENDA HORIZONTE — fazendaGrande
  // ════════════════════════════════════════════════════════════════════════════
  {
    const F = FARMS.grande

    const animals = [
      // Vacas leiteiras de alta produção
      { id: 'fg-lt01', tag: 'HZ-01', name: 'Serena',      type: 'DAIRY', breed: 'Holandesa',  gender: 'FEMALE', weight: 620, base: 32 },
      { id: 'fg-lt02', tag: 'HZ-02', name: 'Helena',      type: 'DAIRY', breed: 'Holandesa',  gender: 'FEMALE', weight: 600, base: 34 },
      { id: 'fg-lt03', tag: 'HZ-03', name: 'Vitória',     type: 'DAIRY', breed: 'Holandesa',  gender: 'FEMALE', weight: 590, base: 31 },
      { id: 'fg-lt04', tag: 'HZ-04', name: 'Carmem',      type: 'DAIRY', breed: 'Girolando',  gender: 'FEMALE', weight: 530, base: 25 },
      { id: 'fg-lt05', tag: 'HZ-05', name: 'Jade',        type: 'DAIRY', breed: 'Holandesa',  gender: 'FEMALE', weight: 610, base: 33 },
      { id: 'fg-lt06', tag: 'HZ-06', name: 'Luna',        type: 'DAIRY', breed: 'Holandesa',  gender: 'FEMALE', weight: 585, base: 30 },
      { id: 'fg-lt07', tag: 'HZ-07', name: 'Nala',        type: 'DAIRY', breed: 'Girolando',  gender: 'FEMALE', weight: 510, base: 24 },
      { id: 'fg-lt08', tag: 'HZ-08', name: 'Isis',        type: 'DAIRY', breed: 'Holandesa',  gender: 'FEMALE', weight: 595, base: 28 },
      { id: 'fg-lt09', tag: 'HZ-09', name: 'Hera',        type: 'DAIRY', breed: 'Holandesa',  gender: 'FEMALE', weight: 580, base: 29 },
      { id: 'fg-lt10', tag: 'HZ-10', name: 'Bia',         type: 'DAIRY', breed: 'Jersey',     gender: 'FEMALE', weight: 420, base: 17 },
      { id: 'fg-lt11', tag: 'HZ-11', name: 'Cleo',        type: 'DAIRY', breed: 'Jersey',     gender: 'FEMALE', weight: 415, base: 16 },
      { id: 'fg-lt12', tag: 'HZ-12', name: 'Dora',        type: 'DAIRY', breed: 'Girolando',  gender: 'FEMALE', weight: 495, base: 22 },
      { id: 'fg-lt13', tag: 'HZ-13', name: 'Eva',         type: 'DAIRY', breed: 'Girolando',  gender: 'FEMALE', weight: 505, base: 23 },
      { id: 'fg-lt14', tag: 'HZ-14', name: 'Fada',        type: 'DAIRY', breed: 'Holandesa',  gender: 'FEMALE', weight: 570, base: 27 },
      // Ovelhas
      { id: 'fg-ov01', tag: 'HZ-15', name: 'Lona',        type: 'SHEEP', breed: 'Merino',     gender: 'FEMALE', weight: 75,  base: 0  },
      { id: 'fg-ov02', tag: 'HZ-16', name: 'Neve',        type: 'SHEEP', breed: 'Merino',     gender: 'FEMALE', weight: 72,  base: 0  },
      { id: 'fg-ov03', tag: 'HZ-17', name: 'Cinza',       type: 'SHEEP', breed: 'Merino',     gender: 'FEMALE', weight: 70,  base: 0  },
      { id: 'fg-ov04', tag: 'HZ-18', name: 'Ouro',        type: 'SHEEP', breed: 'Texel',      gender: 'FEMALE', weight: 80,  base: 0  },
      { id: 'fg-ov05', tag: 'HZ-19', name: 'Prata',       type: 'SHEEP', breed: 'Texel',      gender: 'FEMALE', weight: 78,  base: 0  },
      { id: 'fg-ov06', tag: 'HZ-20', name: 'Bronze',      type: 'SHEEP', breed: 'Dorper',     gender: 'FEMALE', weight: 82,  base: 0  },
      { id: 'fg-ov07', tag: 'HZ-21', name: 'Ferro',       type: 'SHEEP', breed: 'Dorper',     gender: 'MALE',   weight: 90,  base: 0  },
      { id: 'fg-ov08', tag: 'HZ-22', name: 'Aço',         type: 'SHEEP', breed: 'Dorper',     gender: 'MALE',   weight: 88,  base: 0  },
      // Bovinos de corte
      { id: 'fg-bv01', tag: 'HZ-23', name: 'Imperador',   type: 'BEEF',  breed: 'Nelore',     gender: 'MALE',   weight: 620, base: 0  },
      { id: 'fg-bv02', tag: 'HZ-24', name: 'Czar',        type: 'BEEF',  breed: 'Nelore',     gender: 'MALE',   weight: 580, base: 0  },
      { id: 'fg-bv03', tag: 'HZ-25', name: 'Faraó',       type: 'BEEF',  breed: 'Angus',      gender: 'MALE',   weight: 600, base: 0  },
      { id: 'fg-bv04', tag: 'HZ-26', name: 'Sultão',      type: 'BEEF',  breed: 'Angus',      gender: 'MALE',   weight: 560, base: 0  },
      { id: 'fg-bv05', tag: 'HZ-27', name: 'Rei',         type: 'BEEF',  breed: 'Brahman',    gender: 'MALE',   weight: 640, base: 0  },
      { id: 'fg-bv06', tag: 'HZ-28', name: 'Barão',       type: 'BEEF',  breed: 'Brahman',    gender: 'MALE',   weight: 600, base: 0  },
      { id: 'fg-bv07', tag: 'HZ-29', name: 'Conde',       type: 'BEEF',  breed: 'Brangus',    gender: 'MALE',   weight: 550, base: 0  },
      { id: 'fg-bv08', tag: 'HZ-30', name: 'Duque',       type: 'BEEF',  breed: 'Brangus',    gender: 'MALE',   weight: 530, base: 0  },
      { id: 'fg-bv09', tag: 'HZ-31', name: 'Príncipe',    type: 'BEEF',  breed: 'Nelore',     gender: 'MALE',   weight: 490, base: 0  },
      { id: 'fg-bv10', tag: 'HZ-32', name: 'Visconde',    type: 'BEEF',  breed: 'Nelore',     gender: 'MALE',   weight: 475, base: 0  },
      { id: 'fg-bv11', tag: 'HZ-33', name: 'Marquês',     type: 'BEEF',  breed: 'Angus',      gender: 'MALE',   weight: 540, base: 0  },
      { id: 'fg-bv12', tag: 'HZ-34', name: 'Lorde',       type: 'BEEF',  breed: 'Angus',      gender: 'MALE',   weight: 520, base: 0  },
      // Vendidos ao longo do período
      { id: 'fg-bv13', tag: 'HZ-35', name: 'Thor',        type: 'BEEF',  breed: 'Nelore',     gender: 'MALE',   weight: 610, base: 0, status: 'SOLD' },
      { id: 'fg-bv14', tag: 'HZ-36', name: 'Zeus',        type: 'BEEF',  breed: 'Angus',      gender: 'MALE',   weight: 595, base: 0, status: 'SOLD' },
    ]
    for (const a of animals) {
      db.run('INSERT INTO animals (id,tag,name,type,breed,gender,weight,status,farmId) VALUES (?,?,?,?,?,?,?,?,?)',
        [a.id, a.tag, a.name, a.type, a.breed, a.gender, a.weight, (a as any).status ?? 'ACTIVE', F])
    }

    // Funcionários
    const emps = [
      { id: 'fg-emp1', name: 'Marcelo Figueiredo',   role: 'Administrador Geral',   salary: 5800, phone: '(67) 99200-0001', start: '2018-01-10' },
      { id: 'fg-emp2', name: 'Priscila Nogueira',    role: 'Gerente de Produção',   salary: 4200, phone: '(67) 99200-0002', start: '2019-03-01' },
      { id: 'fg-emp3', name: 'José Antonio Lima',    role: 'Ordenhador Sênior',     salary: 2800, phone: '(67) 99200-0003', start: '2019-07-15' },
      { id: 'fg-emp4', name: 'Marcos Pereira',       role: 'Ordenhador',            salary: 2200, phone: '(67) 99200-0004', start: '2020-09-01' },
      { id: 'fg-emp5', name: 'Roberta Cavalcante',   role: 'Ordenhadora',           salary: 2200, phone: '(67) 99200-0005', start: '2021-02-10' },
      { id: 'fg-emp6', name: 'Cristiano Araújo',     role: 'Operador de Máquinas',  salary: 2600, phone: '(67) 99200-0006', start: '2021-05-20' },
      { id: 'fg-emp7', name: 'Tatiane Oliveira',     role: 'Auxiliar de Pecuária',  salary: 1950, phone: '(67) 99200-0007', start: '2022-11-01' },
    ]
    for (const e of emps) {
      db.run('INSERT INTO employees (id,name,role,salary,phone,startDate,status,farmId) VALUES (?,?,?,?,?,?,?,?)',
        [e.id, e.name, e.role, e.salary, e.phone, e.start, 'ACTIVE', F])
    }
    eachMonth((y, m) => {
      const d = `${y}-${pad(m+1)}-05`
      for (const e of emps) {
        db.run('INSERT INTO payments (id,employeeId,amount,date,type) VALUES (?,?,?,?,?)',
          [newId(), e.id, e.salary, d, 'SALARY'])
      }
      // Bônus trimestral ao administrador
      if (m % 3 === 0) {
        db.run('INSERT INTO payments (id,employeeId,amount,date,type) VALUES (?,?,?,?,?)',
          [newId(), 'fg-emp1', 1500, `${y}-${pad(m+1)}-10`, 'BONUS'])
      }
    })

    // Milk records — 14 vacas leiteiras
    const dairyCows = animals.filter(a => a.type === 'DAIRY')
    eachDay((date, iso) => {
      const sf = seasonFactor(date)
      for (const cow of dairyCows) {
        const morning = rnd(cow.base * 0.58 * sf, cow.base * 0.68 * sf)
        const evening = rnd(cow.base * 0.32 * sf, cow.base * 0.42 * sf)
        db.run('INSERT INTO milk_records (id,animalId,date,morning,evening,total,farmId) VALUES (?,?,?,?,?,?,?)',
          [newId(), cow.id, iso, morning, evening, +(morning + evening).toFixed(1), F])
      }
    })

    // Vendas de leite mensais (2 laticínios)
    eachMonth((y, m, last) => {
      const sf = seasonFactor(new Date(y, m, 15))
      const liters1 = Math.round(rnd(7500, 9000) * sf)
      const liters2 = Math.round(rnd(4000, 5000) * sf)
      db.run('INSERT INTO sales (id,type,date,quantity,unit,pricePerUnit,total,buyer,farmId) VALUES (?,?,?,?,?,?,?,?,?)',
        [newId(), 'MILK', last, liters1, 'L', 2.75, +(liters1 * 2.75).toFixed(2), 'Laticínio Horizonte S.A.', F])
      db.run('INSERT INTO sales (id,type,date,quantity,unit,pricePerUnit,total,buyer,farmId) VALUES (?,?,?,?,?,?,?,?,?)',
        [newId(), 'MILK', `${y}-${pad(m+1)}-15`, liters2, 'L', 2.68, +(liters2 * 2.68).toFixed(2), 'Cooperativa Central MS', F])
    })

    // Vendas de animais ao longo do período
    const salesAnimal = [
      { date: new Date(today.getFullYear(), today.getMonth() - 5, 10), qty: 3, price: 7200,  buyer: 'JBS Frigorífico', id: 'fg-bv13' },
      { date: new Date(today.getFullYear(), today.getMonth() - 3, 18), qty: 2, price: 6800,  buyer: 'Marfrig MS', id: 'fg-bv14' },
      { date: new Date(today.getFullYear(), today.getMonth() - 1, 5),  qty: 4, price: 7500,  buyer: 'JBS Frigorífico', id: null },
    ]
    for (const s of salesAnimal) {
      db.run('INSERT INTO sales (id,type,date,quantity,unit,pricePerUnit,total,buyer,farmId) VALUES (?,?,?,?,?,?,?,?,?)',
        [newId(), 'ANIMAL', isoDay(s.date), s.qty, 'cabeça', s.price, s.qty * s.price, s.buyer, F])
    }

    // Venda de lã (merino — alta qualidade)
    db.run('INSERT INTO sales (id,type,date,quantity,unit,pricePerUnit,total,buyer,farmId) VALUES (?,?,?,?,?,?,?,?,?)',
      [newId(), 'WOOL', isoDay(new Date(today.getFullYear(), today.getMonth() - 1, 20)),
       95, 'kg', 18.50, +(95 * 18.50).toFixed(2), 'Coopa Lã Premium', F])

    // Venda de carne (bifes corte diferenciado)
    db.run('INSERT INTO sales (id,type,date,quantity,unit,pricePerUnit,total,buyer,farmId) VALUES (?,?,?,?,?,?,?,?,?)',
      [newId(), 'MEAT', isoDay(new Date(today.getFullYear(), today.getMonth() - 2, 25)),
       320, 'kg', 32.00, 10240, 'Açougue Premium MS', F])

    // Despesas mensais
    eachMonth((y, m, last) => {
      const mo = `${y}-${pad(m+1)}`
      db.run('INSERT INTO expenses (id,category,description,date,amount,supplier,farmId) VALUES (?,?,?,?,?,?,?)',
        [newId(), 'FEED', 'Ração concentrada alta produção', `${mo}-05`, rnd(8500, 11000), 'NutriGado Premium', F])
      db.run('INSERT INTO expenses (id,category,description,date,amount,supplier,farmId) VALUES (?,?,?,?,?,?,?)',
        [newId(), 'FEED', 'Silagem de milho e sorgo', `${mo}-07`, rnd(6000, 8500), 'Silo MS Agro', F])
      db.run('INSERT INTO expenses (id,category,description,date,amount,supplier,farmId) VALUES (?,?,?,?,?,?,?)',
        [newId(), 'FEED', 'Sal mineral e suplementos', `${mo}-10`, rnd(1800, 2500), 'MineralPro MS', F])
      db.run('INSERT INTO expenses (id,category,description,date,amount,supplier,farmId) VALUES (?,?,?,?,?,?,?)',
        [newId(), 'LABOR', 'Folha de pagamento + encargos', `${mo}-05`, 25350, 'Contabilidade Rural MS', F])
      db.run('INSERT INTO expenses (id,category,description,date,amount,supplier,farmId) VALUES (?,?,?,?,?,?,?)',
        [newId(), 'MEDICINE', 'Vacinas, antibióticos e vitaminas', `${mo}-12`, rnd(2200, 3500), 'VetFarm MS', F])
      db.run('INSERT INTO expenses (id,category,description,date,amount,supplier,farmId) VALUES (?,?,?,?,?,?,?)',
        [newId(), 'FUEL', 'Diesel — tratores e caminhões', `${mo}-18`, rnd(3800, 5500), 'Petrobras Distribuidora', F])
      db.run('INSERT INTO expenses (id,category,description,date,amount,supplier,farmId) VALUES (?,?,?,?,?,?,?)',
        [newId(), 'EQUIPMENT', 'Manutenção e peças equipamentos', `${mo}-20`, rnd(1800, 3500), 'Maq Agro MS', F])
      db.run('INSERT INTO expenses (id,category,description,date,amount,supplier,farmId) VALUES (?,?,?,?,?,?,?)',
        [newId(), 'OTHER', 'Energia elétrica rural', `${mo}-15`, rnd(1400, 1900), 'ENERGISA MS', F])
    })
    // Investimentos pontuais
    db.run('INSERT INTO expenses (id,category,description,date,amount,supplier,farmId) VALUES (?,?,?,?,?,?,?)',
      [newId(), 'EQUIPMENT', 'Reforma sala de ordenha', isoDay(new Date(today.getFullYear(), today.getMonth() - 4, 15)), 18500, 'Construtora Rural MS', F])
    db.run('INSERT INTO expenses (id,category,description,date,amount,supplier,farmId) VALUES (?,?,?,?,?,?,?)',
      [newId(), 'EQUIPMENT', 'Aquisição resfriador de leite 5000L', isoDay(new Date(today.getFullYear(), today.getMonth() - 2, 8)), 32000, 'Alfa Equipamentos', F])
    db.run('INSERT INTO expenses (id,category,description,date,amount,supplier,farmId) VALUES (?,?,?,?,?,?,?)',
      [newId(), 'OTHER', 'Seguro da propriedade rural anual', isoDay(new Date(today.getFullYear(), 0, 20)), 8400, 'Bradesco Agro', F])

    // Estoque — grande escala
    const invGrande = [
      ['Ração concentrada 24%',   'FEED',     8500, 'kg',  2000, 2.95,  'NutriGado Premium'],
      ['Silagem de milho',        'FEED',    42000, 'kg', 10000, 0.42,  'Silo MS Agro'],
      ['Feno de tifton bolas',    'FEED',      280, 'fardos', 80, 9.50, null],
      ['Sal mineral bovino 25kg', 'FEED',      350, 'kg',    80, 5.90,  'MineralPro MS'],
      ['Núcleo proteico 37%',     'FEED',      900, 'kg',   200, 4.80,  'NutriGado Premium'],
      ['Ivermectina 3,5% inj.',   'MEDICINE',   85, 'frascos', 20, 28.50, 'VetFarm MS'],
      ['Vacina aftosa',           'MEDICINE',  120, 'doses',  50,  4.80, 'VetFarm MS'],
      ['Vacina raiva bovina',     'MEDICINE',   60, 'doses',  30,  5.20, 'VetFarm MS'],
      ['Antibiótico Pentabiótico','MEDICINE',   24, 'frascos',10, 72.00, 'VetFarm MS'],
      ['Vitamina ADE injetável',  'MEDICINE',   18, 'frascos', 6, 48.00, 'VetFarm MS'],
      ['Diesel',                  'FUEL',     3200, 'L',    800,  6.25, 'Petrobras Distrib.'],
      ['Arla 32 (ureia)',         'FUEL',      400, 'L',    100,  5.40, 'Petrobras Distrib.'],
      ['Óleo hidráulico',         'EQUIPMENT',  40, 'L',     10, 22.00, 'Maq Agro MS'],
      ['Peças reposição ordenha', 'EQUIPMENT',   1, 'kit',    1, 850.00,'Alfa Equipamentos'],
      ['Mangueira alta pressão',  'EQUIPMENT',  12, 'metros', 5,  55.00, null],
    ]
    for (const [name, cat, qty, unit, min, cost, sup] of invGrande) {
      db.run('INSERT INTO inventory_items (id,farmId,name,category,quantity,unit,minQuantity,costPerUnit,supplier) VALUES (?,?,?,?,?,?,?,?,?)',
        [newId(), F, name, cat, qty, unit, min, cost, sup])
    }

    // Metas ambiciosas
    const cm = `${today.getFullYear()}-${pad(today.getMonth()+1)}`
    const cy = String(today.getFullYear())
    db.run('INSERT INTO goals (id,farmId,type,label,targetValue,periodType,periodValue,status) VALUES (?,?,?,?,?,?,?,?)',
      [newId(), F, 'MILK_PRODUCTION', 'Meta mensal de produção (L)', 12000, 'MONTHLY', cm, 'ACTIVE'])
    db.run('INSERT INTO goals (id,farmId,type,label,targetValue,periodType,periodValue,status) VALUES (?,?,?,?,?,?,?,?)',
      [newId(), F, 'REVENUE', 'Faturamento mensal mínimo', 60000, 'MONTHLY', cm, 'ACTIVE'])
    db.run('INSERT INTO goals (id,farmId,type,label,targetValue,periodType,periodValue,status) VALUES (?,?,?,?,?,?,?,?)',
      [newId(), F, 'EXPENSES_LIMIT', 'Controle despesas operacionais', 70000, 'MONTHLY', cm, 'ACTIVE'])
    db.run('INSERT INTO goals (id,farmId,type,label,targetValue,periodType,periodValue,status) VALUES (?,?,?,?,?,?,?,?)',
      [newId(), F, 'REVENUE', 'Meta de faturamento anual', 800000, 'YEARLY', cy, 'ACTIVE'])
    db.run('INSERT INTO goals (id,farmId,type,label,targetValue,periodType,periodValue,status) VALUES (?,?,?,?,?,?,?,?)',
      [newId(), F, 'ANIMALS_COUNT', 'Ampliar plantel para 50 animais', 50, 'YEARLY', cy, 'ACTIVE'])
    db.run('INSERT INTO goals (id,farmId,type,label,targetValue,periodType,periodValue,status) VALUES (?,?,?,?,?,?,?,?)',
      [newId(), F, 'MILK_PRODUCTION', 'Produção anual 140.000 litros', 140000, 'YEARLY', cy, 'ACTIVE'])

    // Calendário — escala industrial
    const fd = (n: number) => isoDay(addDays(today, n))
    db.run('INSERT INTO calendar_events (id,farmId,title,description,eventType,date,animalId,status) VALUES (?,?,?,?,?,?,?,?)',
      [newId(), F, 'Vacinação aftosa — rebanho completo (36 cab.)', 'Equipe vacinadora contratada', 'VACCINATION', fd(3), null, 'PENDING'])
    db.run('INSERT INTO calendar_events (id,farmId,title,description,eventType,date,animalId,status) VALUES (?,?,?,?,?,?,?,?)',
      [newId(), F, 'Programa IA — lote 1 (5 vacas)', 'IA com sêmen Holandês importado', 'BREEDING', fd(5), null, 'PENDING'])
    db.run('INSERT INTO calendar_events (id,farmId,title,description,eventType,date,animalId,status) VALUES (?,?,?,?,?,?,?,?)',
      [newId(), F, 'Pesagem e escore corporal — lote corte', 'Todos bovinos de corte', 'WEIGHING', fd(8), null, 'PENDING'])
    db.run('INSERT INTO calendar_events (id,farmId,title,description,eventType,date,animalId,status) VALUES (?,?,?,?,?,?,?,?)',
      [newId(), F, 'Manutenção preventiva — ordenhadeira canalizada', 'Revisão completa com técnico', 'MAINTENANCE', fd(11), null, 'PENDING'])
    db.run('INSERT INTO calendar_events (id,farmId,title,description,eventType,date,animalId,status) VALUES (?,?,?,?,?,?,?,?)',
      [newId(), F, 'Entrega lote 4 bois ao JBS', 'Conferência peso — nota fiscal', 'SALE', fd(15), null, 'PENDING'])
    db.run('INSERT INTO calendar_events (id,farmId,title,description,eventType,date,animalId,status) VALUES (?,?,?,?,?,?,?,?)',
      [newId(), F, 'Tosquia rebanho Merino (3 animais)', 'Lã premium — contrato Coopa', 'SHEARING', fd(22), null, 'PENDING'])
    db.run('INSERT INTO calendar_events (id,farmId,title,description,eventType,date,animalId,status) VALUES (?,?,?,?,?,?,?,?)',
      [newId(), F, 'Auditoria ambiental anual', 'IBAMA — documentação completa', 'OTHER', fd(35), null, 'PENDING'])
    db.run('INSERT INTO calendar_events (id,farmId,title,description,eventType,date,animalId,status) VALUES (?,?,?,?,?,?,?,?)',
      [newId(), F, 'Vermifugação rebanho ovino (8 animais)', null, 'TREATMENT', fd(18), null, 'PENDING'])
    // Concluídos
    db.run('INSERT INTO calendar_events (id,farmId,title,description,eventType,date,animalId,status) VALUES (?,?,?,?,?,?,?,?)',
      [newId(), F, 'Entrega resfriador 5000L', 'Instalado e testado com sucesso', 'PURCHASE', isoDay(new Date(today.getFullYear(), today.getMonth() - 2, 8)), null, 'DONE'])
    db.run('INSERT INTO calendar_events (id,farmId,title,description,eventType,date,animalId,status) VALUES (?,?,?,?,?,?,?,?)',
      [newId(), F, 'Venda Thor e Zeus (Nelore + Angus)', 'Lote entregue JBS/Marfrig', 'SALE', isoDay(new Date(today.getFullYear(), today.getMonth() - 3, 18)), null, 'DONE'])
    db.run('INSERT INTO calendar_events (id,farmId,title,description,eventType,date,animalId,status) VALUES (?,?,?,?,?,?,?,?)',
      [newId(), F, 'Vacinação raiva bovina rebanho', null, 'VACCINATION', isoDay(addDays(today, -20)), null, 'DONE'])
  }

  return NextResponse.json({ seeded: true, farms: ['Sítio São João', 'Fazenda Vale Verde', 'Fazenda Horizonte'] })
}
