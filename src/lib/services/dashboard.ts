import { getDb, qRow, qRows, farmClause } from '../database'

export async function getDashboardData(farmIds?: string[]) {
  const db = await getDb()

  const today = new Date().toISOString().split('T')[0]
  const since7 = new Date(Date.now() - 7 * 86_400_000).toISOString().split('T')[0]

  const fc = farmClause(farmIds)

  // Animal counts
  const totalAnimals = (qRow(db, `SELECT COUNT(*) as c FROM animals WHERE status="ACTIVE"${fc.sql}`, fc.params) as any)?.c ?? 0
  const dairyCount  = (qRow(db, `SELECT COUNT(*) as c FROM animals WHERE type="DAIRY" AND status="ACTIVE"${fc.sql}`, fc.params) as any)?.c ?? 0
  const sheepCount  = (qRow(db, `SELECT COUNT(*) as c FROM animals WHERE type="SHEEP" AND status="ACTIVE"${fc.sql}`, fc.params) as any)?.c ?? 0
  const beefCount   = (qRow(db, `SELECT COUNT(*) as c FROM animals WHERE type="BEEF"  AND status="ACTIVE"${fc.sql}`, fc.params) as any)?.c ?? 0
  const employees   = (qRow(db, `SELECT COUNT(*) as c FROM employees WHERE status="ACTIVE"${fc.sql}`, fc.params) as any)?.c ?? 0

  // Financial totals
  const revenue      = (qRow(db, `SELECT COALESCE(SUM(total),0) as t FROM sales WHERE 1=1${fc.sql}`, fc.params) as any)?.t ?? 0
  const expensesTotal = (qRow(db, `SELECT COALESCE(SUM(amount),0) as t FROM expenses WHERE 1=1${fc.sql}`, fc.params) as any)?.t ?? 0

  // Milk today
  const milkToday = (qRow(db, `SELECT COALESCE(SUM(total),0) as t FROM milk_records WHERE date=?${fc.sql}`, [today, ...fc.params]) as any)?.t ?? 0

  // Recent lists (UI only)
  const recentSales = qRows(db, `SELECT * FROM sales WHERE 1=1${fc.sql} ORDER BY date DESC LIMIT 5`, fc.params)
  const recentExpenses = qRows(db, `SELECT * FROM expenses WHERE 1=1${fc.sql} ORDER BY date DESC LIMIT 5`, fc.params)

  // Milk records last 7 days (for chart)
  const milkRecords = qRows(
    db,
    `SELECT m.*, a.name as animalName, a.tag as animalTag
     FROM milk_records m JOIN animals a ON m.animalId=a.id
     WHERE m.date >= ?${fc.sql.replace('farmId', 'm.farmId')} ORDER BY m.date DESC`,
    [since7, ...fc.params]
  ).map(r => ({ ...r, animal: { name: r.animalName, tag: r.animalTag } }))

  return {
    animals: { total: totalAnimals, dairy: dairyCount, sheep: sheepCount, beef: beefCount },
    employees,
    revenue,
    expenses: expensesTotal,
    milkToday,
    recentSales,
    recentExpenses,
    milkRecords,
  }
}
