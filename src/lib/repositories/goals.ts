import { getDb, qRows, qRow, newId, farmClause } from '../database'

export type GoalType = 'MILK_PRODUCTION' | 'REVENUE' | 'EXPENSES_LIMIT' | 'ANIMALS_COUNT'
export type PeriodType = 'MONTHLY' | 'YEARLY'
export type GoalStatus = 'ACTIVE' | 'ACHIEVED' | 'FAILED'

export interface Goal {
  id: string
  farmId?: string | null
  type: GoalType
  label: string
  targetValue: number
  periodType: PeriodType
  periodValue: string
  status: GoalStatus
  createdAt: string
  updatedAt: string
}

function rowToGoal(row: any): Goal {
  return {
    id: row.id,
    farmId: row.farmId,
    type: row.type as GoalType,
    label: row.label,
    targetValue: Number(row.targetValue),
    periodType: row.periodType as PeriodType,
    periodValue: row.periodValue,
    status: row.status as GoalStatus,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export function createGoalsRepository() {
  return {
    async findAll(filters?: { farmIds?: string[]; type?: GoalType }) {
      const db = await getDb()
      const fc = farmClause(filters?.farmIds)
      let sql = `SELECT * FROM goals WHERE 1=1${fc.sql}`
      const params = [...fc.params]
      if (filters?.type) { sql += ' AND type = ?'; params.push(filters.type) }
      sql += ' ORDER BY createdAt DESC'
      return qRows(db, sql, params).map(rowToGoal)
    },

    async findById(id: string): Promise<Goal | null> {
      const db = await getDb()
      const row = qRow(db, 'SELECT * FROM goals WHERE id = ?', [id])
      return row ? rowToGoal(row) : null
    },

    async create(data: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) {
      const db = await getDb()
      const id = newId()
      const now = new Date().toISOString()
      db.run(
        `INSERT INTO goals (id, farmId, type, label, targetValue, periodType, periodValue, status, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, data.farmId ?? null, data.type, data.label, data.targetValue, data.periodType, data.periodValue, data.status, now, now]
      )
      return (await this.findById(id))!
    },

    async update(id: string, data: Partial<Omit<Goal, 'id' | 'createdAt'>>) {
      const db = await getDb()
      const ex = await this.findById(id)
      if (!ex) throw new Error('Meta não encontrada')
      const now = new Date().toISOString()
      db.run(
        `UPDATE goals SET label=?, targetValue=?, periodType=?, periodValue=?, status=?, updatedAt=? WHERE id=?`,
        [data.label ?? ex.label, data.targetValue ?? ex.targetValue, data.periodType ?? ex.periodType, data.periodValue ?? ex.periodValue, data.status ?? ex.status, now, id]
      )
      return (await this.findById(id))!
    },

    async delete(id: string) {
      const db = await getDb()
      db.run('DELETE FROM goals WHERE id = ?', [id])
    },
  }
}
