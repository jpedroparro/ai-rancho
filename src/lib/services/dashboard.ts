import { getDb, qRow, qRows, farmClause } from '../database'

export async function getDashboardData(farmIds?: string[]) {
  const db = await getDb()

  const today = new Date().toISOString().split('T')[0]
  const now = new Date()
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

  const fc = farmClause(farmIds)

  const totalAnimals = (qRow(db, 'SELECT COUNT(*) as c FROM animals WHERE status="ACTIVE"' + fc.sql, fc.params) as any)?.c ?? 0
  const dairyCount  = (qRow(db, 'SELECT COUNT(*) as c FROM animals WHERE type="DAIRY" AND status="ACTIVE"' + fc.sql, fc.params) as any)?.c ?? 0
  const sheepCount  = (qRow(db, 'SELECT COUNT(*) as c FROM animals WHERE type="SHEEP" AND status="ACTIVE"' + fc.sql, fc.params) as any)?.c ?? 0
  const beefCount   = (qRow(db, 'SELECT COUNT(*) as c FROM animals WHERE type="BEEF"  AND status="ACTIVE"' + fc.sql, fc.params) as any)?.c ?? 0
  const employees   = (qRow(db, 'SELECT COUNT(*) as c FROM employees WHERE status="ACTIVE"' + fc.sql, fc.params) as any)?.c ?? 0

  const revenue      = (qRow(db, 'SELECT COALESCE(SUM(total),0) as t FROM sales WHERE 1=1' + fc.sql, fc.params) as any)?.t ?? 0
  const expensesTotal = (qRow(db, 'SELECT COALESCE(SUM(amount),0) as t FROM expenses WHERE 1=1' + fc.sql, fc.params) as any)?.t ?? 0

  const milkToday = (qRow(db, 'SELECT COALESCE(SUM(total),0) as t FROM milk_records WHERE date=?' + fc.sql, [today, ...fc.params]) as any)?.t ?? 0

  const recentSales = qRows(db, 'SELECT * FROM sales WHERE 1=1' + fc.sql + ' ORDER BY date DESC LIMIT 5', fc.params)
  const recentExpenses = qRows(db, 'SELECT * FROM expenses WHERE 1=1' + fc.sql + ' ORDER BY date DESC LIMIT 5', fc.params)

  const farmSql = fc.sql.replace(' AND farmId', ' AND m.farmId')
  const milkRecords = qRows(
    db,
    'SELECT m.date, SUM(m.total) as total FROM milk_records m WHERE m.date >= ? AND m.date <= ?' + farmSql + ' GROUP BY m.date ORDER BY m.date ASC',
    [firstOfMonth, today, ...fc.params]
  )

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
