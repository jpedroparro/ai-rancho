import { getDb, qRows, qRow, newId, farmClause } from '../database'
import type { Sale, ISaleRepository } from '../types'

export function createSaleRepository(): ISaleRepository {
  return {
    async findAll(farmIds?) {
      const db = await getDb()
      const fc = farmClause(farmIds)
      return qRows(db, `SELECT * FROM sales WHERE 1=1${fc.sql} ORDER BY date DESC`, fc.params) as Sale[]
    },

    async findRecent(limit, farmIds?) {
      const db = await getDb()
      const fc = farmClause(farmIds)
      return qRows(db, `SELECT * FROM sales WHERE 1=1${fc.sql} ORDER BY date DESC LIMIT ?`, [...fc.params, limit]) as Sale[]
    },

    async sumTotal(farmIds?) {
      const db = await getDb()
      const fc = farmClause(farmIds)
      return (qRow(db, `SELECT COALESCE(SUM(total),0) as t FROM sales WHERE 1=1${fc.sql}`, fc.params) as any)?.t ?? 0
    },

    async create(data) {
      const db = await getDb()
      const id = newId()
      const total = data.quantity * data.pricePerUnit
      db.run(
        'INSERT INTO sales (id,type,date,quantity,unit,pricePerUnit,total,buyer,notes,farmId) VALUES (?,?,?,?,?,?,?,?,?,?)',
        [id, data.type, data.date, data.quantity, data.unit ?? 'kg', data.pricePerUnit, total, data.buyer ?? null, data.notes ?? null, (data as any).farmId ?? null]
      )
      return { id, ...data, total, unit: data.unit ?? 'kg', createdAt: new Date().toISOString() } as Sale
    },
  }
}
