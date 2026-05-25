import { getDb, qRows, qRow, newId, farmClause } from '../database'
import type { MilkStockMovement, CreateMilkStockMovementDto, IMilkStockRepository } from '../types'

export function createMilkStockRepository(): IMilkStockRepository {
  return {
    async getBalance(farmIds?) {
      const db = await getDb()
      const fc = farmClause(farmIds)
      const entries = ((qRow(db, 'SELECT COALESCE(SUM(quantity),0) as t FROM milk_stock_movements WHERE type="ENTRY"' + fc.sql, fc.params) as any)?.t) ?? 0
      const exits   = ((qRow(db, 'SELECT COALESCE(SUM(quantity),0) as t FROM milk_stock_movements WHERE type="EXIT"'  + fc.sql, fc.params) as any)?.t) ?? 0
      return Math.max(0, entries - exits)
    },
    async findMovements(farmIds?) {
      const db = await getDb()
      const fc = farmClause(farmIds)
      return qRows(db, 'SELECT * FROM milk_stock_movements WHERE 1=1' + fc.sql + ' ORDER BY date DESC, createdAt DESC', fc.params) as MilkStockMovement[]
    },
    async addEntry(data) {
      const db = await getDb()
      const id = newId()
      db.run('INSERT INTO milk_stock_movements (id,farmId,date,type,reason,quantity,saleId,notes) VALUES (?,?,?,?,?,?,?,?)',
        [id, data.farmId ?? null, data.date, 'ENTRY', data.reason, data.quantity, data.saleId ?? null, data.notes ?? null])
      return { id, ...data, type: 'ENTRY' as const, createdAt: new Date().toISOString() } as MilkStockMovement
    },
    async addExit(data) {
      const db = await getDb()
      const id = newId()
      db.run('INSERT INTO milk_stock_movements (id,farmId,date,type,reason,quantity,saleId,notes) VALUES (?,?,?,?,?,?,?,?)',
        [id, data.farmId ?? null, data.date, 'EXIT', data.reason, data.quantity, data.saleId ?? null, data.notes ?? null])
      return { id, ...data, type: 'EXIT' as const, createdAt: new Date().toISOString() } as MilkStockMovement
    },
  }
}
