import { getDb, qRows, qRow, farmClause } from '../database'

interface CostFilter {
  farmIds?: string[]
  start: string
  end: string
}

export interface CostSummary {
  totalExpenses: number
  totalLiters: number
  costPerLiter: number
}

export interface AnimalCostEntry {
  animalId: string
  tag: string
  name: string | null
  totalLiters: number
}

export interface MonthlyCostEntry {
  month: string
  totalExpenses: number
  totalLiters: number
  costPerLiter: number
}

export function createProductionCostService() {
  return {
    async getCostPerLiter(filter: CostFilter): Promise<CostSummary> {
      const db = await getDb()
      const fc = farmClause(filter.farmIds)

      const expRow = qRow(db,
        `SELECT COALESCE(SUM(amount), 0) as t FROM expenses WHERE date >= ? AND date <= ?${fc.sql}`,
        [filter.start, filter.end, ...fc.params]
      )
      const milkRow = qRow(db,
        `SELECT COALESCE(SUM(total), 0) as t FROM milk_records WHERE date >= ? AND date <= ?${fc.sql}`,
        [filter.start, filter.end, ...fc.params]
      )

      const totalExpenses = Number(expRow?.t ?? 0)
      const totalLiters   = Number(milkRow?.t ?? 0)
      const costPerLiter  = totalLiters > 0 ? totalExpenses / totalLiters : 0

      return { totalExpenses, totalLiters, costPerLiter }
    },

    async getCostPerAnimal(filter: CostFilter): Promise<AnimalCostEntry[]> {
      const db = await getDb()
      const fc = farmClause(filter.farmIds)

      // fc.sql contains "AND farmId IN (?)" — scope to milk_records
      const farmSql = fc.sql.replace('AND farmId', 'AND m.farmId')
      const rows = qRows(db,
        `SELECT m.animalId, SUM(m.total) as liters, a.tag, a.name
         FROM milk_records m
         JOIN animals a ON m.animalId = a.id
         WHERE m.date >= ? AND m.date <= ?${farmSql}
         GROUP BY m.animalId
         ORDER BY liters DESC`,
        [filter.start, filter.end, ...fc.params]
      )

      return rows.map(r => ({
        animalId: r.animalId,
        tag: r.tag,
        name: r.name,
        totalLiters: Number(r.liters),
      }))
    },

    async getMonthlySummary(filter: CostFilter): Promise<MonthlyCostEntry[]> {
      const db = await getDb()
      const fc = farmClause(filter.farmIds)

      const expRows = qRows(db,
        `SELECT substr(date,1,7) as month, COALESCE(SUM(amount),0) as total
         FROM expenses WHERE date >= ? AND date <= ?${fc.sql}
         GROUP BY month ORDER BY month`,
        [filter.start, filter.end, ...fc.params]
      )
      const milkRows = qRows(db,
        `SELECT substr(date,1,7) as month, COALESCE(SUM(total),0) as liters
         FROM milk_records WHERE date >= ? AND date <= ?${fc.sql}
         GROUP BY month ORDER BY month`,
        [filter.start, filter.end, ...fc.params]
      )

      const expByMonth: Record<string, number> = {}
      for (const r of expRows) expByMonth[r.month] = Number(r.total)

      const milkByMonth: Record<string, number> = {}
      for (const r of milkRows) milkByMonth[r.month] = Number(r.liters)

      const allMonths = Array.from(new Set([...Object.keys(expByMonth), ...Object.keys(milkByMonth)])).sort()

      return allMonths.map(month => {
        const totalExpenses = expByMonth[month] ?? 0
        const totalLiters   = milkByMonth[month] ?? 0
        return {
          month,
          totalExpenses,
          totalLiters,
          costPerLiter: totalLiters > 0 ? totalExpenses / totalLiters : 0,
        }
      })
    },
  }
}
