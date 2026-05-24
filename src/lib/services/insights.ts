import { getDb, qRows, qRow } from '../database'

export type InsightSeverity = 'critical' | 'warning' | 'tip' | 'positive'

export interface Insight {
  id: string
  severity: InsightSeverity
  title: string
  message: string
  category: 'animal' | 'milk' | 'financial' | 'operational'
}

export async function generateInsights(farmIds?: string[]): Promise<Insight[]> {
  const db = await getDb()
  const insights: Insight[] = []

  const farmFilter = farmIds && farmIds.length > 0
    ? ` AND farmId IN (${farmIds.map(() => '?').join(',')})`
    : ''
  const fp = farmIds ?? []

  const today = new Date()
  const fmt = (d: Date) => d.toISOString().split('T')[0]
  const daysAgo = (n: number) => fmt(new Date(Date.now() - n * 86_400_000))

  // ── 1. Queda de produção por vaca (últimos 3 dias vs 3 anteriores) ──────────
  const dairyAnimals = qRows(db,
    `SELECT id, name, tag FROM animals WHERE type='DAIRY' AND status='ACTIVE'${farmFilter}`,
    fp
  )

  for (const cow of dairyAnimals) {
    const recent = qRow(db,
      `SELECT COALESCE(AVG(total),0) as avg FROM milk_records WHERE animalId=? AND date >= ?`,
      [cow.id, daysAgo(3)]
    )
    const previous = qRow(db,
      `SELECT COALESCE(AVG(total),0) as avg FROM milk_records WHERE animalId=? AND date >= ? AND date < ?`,
      [cow.id, daysAgo(7), daysAgo(3)]
    )

    const rAvg = recent?.avg ?? 0
    const pAvg = previous?.avg ?? 0

    if (pAvg > 1 && rAvg < pAvg * 0.7) {
      const drop = Math.round((1 - rAvg / pAvg) * 100)
      insights.push({
        id: `milk-drop-${cow.id}`,
        severity: drop >= 40 ? 'critical' : 'warning',
        title: `Queda de produção — ${cow.name ?? cow.tag}`,
        message: `Produção caiu ${drop}% nos últimos 3 dias (${rAvg.toFixed(1)} L vs ${pAvg.toFixed(1)} L anteriores). Verifique saúde, alimentação e estresse.`,
        category: 'milk',
      })
    }

    if (rAvg > 0 && pAvg > 0 && rAvg >= pAvg * 1.15) {
      insights.push({
        id: `milk-up-${cow.id}`,
        severity: 'positive',
        title: `Ótima produção — ${cow.name ?? cow.tag}`,
        message: `Produção aumentou ${Math.round((rAvg / pAvg - 1) * 100)}% nos últimos dias. Continue com o manejo atual.`,
        category: 'milk',
      })
    }
  }

  // ── 2. Vacas sem registro de leite hoje ──────────────────────────────────
  const todayStr = fmt(today)
  const milkedToday = new Set(
    qRows(db, `SELECT DISTINCT animalId FROM milk_records WHERE date=?${farmFilter}`, [todayStr, ...fp])
      .map((r: any) => r.animalId)
  )
  const notMilkedToday = dairyAnimals.filter((c: any) => !milkedToday.has(c.id))
  if (notMilkedToday.length > 0 && dairyAnimals.length > 0) {
    const names = notMilkedToday.map((c: any) => c.name ?? c.tag).join(', ')
    insights.push({
      id: 'milk-missing-today',
      severity: notMilkedToday.length === dairyAnimals.length ? 'critical' : 'warning',
      title: `Sem ordenha registrada hoje`,
      message: `${notMilkedToday.length} leiteira(s) sem registro hoje: ${names}.`,
      category: 'milk',
    })
  }

  // ── 3. Animais sem peso registrado ───────────────────────────────────────
  const noWeight = qRow(db,
    `SELECT COUNT(*) as c FROM animals WHERE status='ACTIVE' AND weight IS NULL${farmFilter}`,
    fp
  )
  if ((noWeight?.c ?? 0) > 0) {
    insights.push({
      id: 'animals-no-weight',
      severity: 'tip',
      title: `${noWeight.c} animal(is) sem peso`,
      message: `Registrar o peso regularmente ajuda a detectar problemas de saúde e planejar vendas no momento certo.`,
      category: 'animal',
    })
  }

  // ── 4. Despesas este mês vs mês passado ─────────────────────────────────
  const thisMonth  = fmt(today).slice(0, 7) // YYYY-MM
  const lastMonthD = new Date(today.getFullYear(), today.getMonth() - 1, 1)
  const lastMonth  = fmt(lastMonthD).slice(0, 7)

  const expThis = qRow(db,
    `SELECT COALESCE(SUM(amount),0) as t FROM expenses WHERE date LIKE ?${farmFilter}`,
    [`${thisMonth}%`, ...fp]
  )
  const expLast = qRow(db,
    `SELECT COALESCE(SUM(amount),0) as t FROM expenses WHERE date LIKE ?${farmFilter}`,
    [`${lastMonth}%`, ...fp]
  )

  const et = expThis?.t ?? 0
  const el = expLast?.t ?? 0
  if (el > 0 && et > el * 1.35) {
    const pct = Math.round((et / el - 1) * 100)
    insights.push({
      id: 'expenses-spike',
      severity: 'warning',
      title: `Despesas ${pct}% acima do mês passado`,
      message: `R$ ${et.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} este mês vs R$ ${el.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} no anterior. Revise as categorias de gasto.`,
      category: 'financial',
    })
  }

  // ── 5. Sem vendas nos últimos 30 dias ────────────────────────────────────
  const salesLast30 = qRow(db,
    `SELECT COUNT(*) as c FROM sales WHERE date >= ?${farmFilter}`,
    [daysAgo(30), ...fp]
  )
  if ((salesLast30?.c ?? 0) === 0) {
    insights.push({
      id: 'no-sales',
      severity: 'tip',
      title: `Nenhuma venda nos últimos 30 dias`,
      message: `Considere avaliar o estoque de animais para venda ou verificar canais de comercialização de leite e lã.`,
      category: 'financial',
    })
  }

  // ── 6. Receita vs despesa este mês ──────────────────────────────────────
  const revThis = qRow(db,
    `SELECT COALESCE(SUM(total),0) as t FROM sales WHERE date LIKE ?${farmFilter}`,
    [`${thisMonth}%`, ...fp]
  )
  const rt = revThis?.t ?? 0
  if (et > 0 && rt < et * 0.5 && et > 500) {
    insights.push({
      id: 'revenue-below-expenses',
      severity: 'critical',
      title: `Despesas muito acima da receita`,
      message: `Este mês: receita R$ ${rt.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} × despesas R$ ${et.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. Atenção ao fluxo de caixa.`,
      category: 'financial',
    })
  } else if (rt > 0 && rt >= et * 1.2 && et > 0) {
    insights.push({
      id: 'revenue-positive',
      severity: 'positive',
      title: `Mês positivo no financeiro`,
      message: `Receita supera despesas em ${Math.round((rt / et - 1) * 100)}% este mês. Bom resultado!`,
      category: 'financial',
    })
  }

  // ── 7. Funcionários sem pagamento há mais de 35 dias ────────────────────
  const activeEmployees = qRows(db,
    `SELECT e.id, e.name FROM employees e WHERE e.status='ACTIVE'${farmFilter}`,
    fp
  )
  for (const emp of activeEmployees) {
    const lastPay = qRow(db,
      `SELECT MAX(date) as d FROM payments WHERE employeeId=?`,
      [emp.id]
    )
    if (!lastPay?.d || lastPay.d < daysAgo(35)) {
      insights.push({
        id: `pay-overdue-${emp.id}`,
        severity: 'warning',
        title: `Pagamento pendente — ${emp.name}`,
        message: `Nenhum pagamento registrado nos últimos 35 dias para ${emp.name}.`,
        category: 'operational',
      })
    }
  }

  // Ordena: critical > warning > tip > positive
  const order: Record<InsightSeverity, number> = { critical: 0, warning: 1, tip: 2, positive: 3 }
  return insights.sort((a, b) => order[a.severity] - order[b.severity]).slice(0, 6)
}
