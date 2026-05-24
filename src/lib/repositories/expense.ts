import { getDb, qRows, qRow, newId, farmClause } from '../database'
import type { Expense, IExpenseRepository } from '../types'

export function createExpenseRepository(): IExpenseRepository {
  return {
    async findAll(farmIds?) {
      const db = await getDb()
      const fc = farmClause(farmIds)
      return qRows(db, `SELECT * FROM expenses WHERE 1=1${fc.sql} ORDER BY date DESC`, fc.params) as Expense[]
    },

    async findRecent(limit, farmIds?) {
      const db = await getDb()
      const fc = farmClause(farmIds)
      return qRows(db, `SELECT * FROM expenses WHERE 1=1${fc.sql} ORDER BY date DESC LIMIT ?`, [...fc.params, limit]) as Expense[]
    },

    async sumTotal(farmIds?) {
      const db = await getDb()
      const fc = farmClause(farmIds)
      return (qRow(db, `SELECT COALESCE(SUM(amount),0) as t FROM expenses WHERE 1=1${fc.sql}`, fc.params) as any)?.t ?? 0
    },

    async create(data) {
      const db = await getDb()
      const id = newId()
      db.run(
        'INSERT INTO expenses (id,category,description,date,amount,supplier,notes,farmId) VALUES (?,?,?,?,?,?,?,?)',
        [id, data.category, data.description, data.date, data.amount, data.supplier ?? null, data.notes ?? null, (data as any).farmId ?? null]
      )
      return { id, ...data, createdAt: new Date().toISOString() } as Expense
    },

    async delete(id) {
      const db = await getDb()
      db.run('DELETE FROM expenses WHERE id=?', [id])
    },
  }
}
