import { getDb, qRows, qRow, newId, farmClause } from '../database'
import type { InventoryItem, InventoryStatus, InventoryCategory } from '../types'

function calcStatus(quantity: number, minQuantity: number): InventoryStatus {
  if (quantity <= 0) return 'OUT'
  if (quantity < minQuantity) return 'LOW'
  return 'OK'
}

function rowToItem(row: any): InventoryItem {
  const qty = Number(row.quantity)
  const min = Number(row.minQuantity ?? 0)
  return {
    id: row.id,
    farmId: row.farmId,
    name: row.name,
    category: row.category as InventoryCategory,
    quantity: qty,
    unit: row.unit,
    minQuantity: min,
    costPerUnit: Number(row.costPerUnit ?? 0),
    supplier: row.supplier,
    notes: row.notes,
    status: calcStatus(qty, min),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export function createInventoryRepository() {
  return {
    async findAll(filters?: { farmIds?: string[]; category?: InventoryCategory; lowStock?: boolean }) {
      const db = await getDb()
      const fc = farmClause(filters?.farmIds)
      let sql = `SELECT * FROM inventory_items WHERE 1=1${fc.sql}`
      const params = [...fc.params]
      if (filters?.category) { sql += ' AND category = ?'; params.push(filters.category) }
      sql += ' ORDER BY name ASC'
      let rows = qRows(db, sql, params).map(rowToItem)
      if (filters?.lowStock) rows = rows.filter(r => r.status === 'LOW' || r.status === 'OUT')
      return rows
    },

    async findById(id: string) {
      const db = await getDb()
      const row = qRow(db, 'SELECT * FROM inventory_items WHERE id = ?', [id])
      return row ? rowToItem(row) : null
    },

    async create(data: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt' | 'status'>) {
      const db = await getDb()
      const id = newId()
      const now = new Date().toISOString()
      db.run(
        `INSERT INTO inventory_items (id, farmId, name, category, quantity, unit, minQuantity, costPerUnit, supplier, notes, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, data.farmId ?? null, data.name, data.category, data.quantity, data.unit,
         data.minQuantity, data.costPerUnit, data.supplier ?? null, data.notes ?? null, now, now]
      )
      return (await this.findById(id))!
    },

    async update(id: string, data: Partial<Omit<InventoryItem, 'id' | 'createdAt' | 'status'>>) {
      const db = await getDb()
      const ex = await this.findById(id)
      if (!ex) throw new Error('Item não encontrado')
      const now = new Date().toISOString()
      db.run(
        `UPDATE inventory_items SET name=?, category=?, quantity=?, unit=?, minQuantity=?, costPerUnit=?, supplier=?, notes=?, updatedAt=? WHERE id=?`,
        [
          data.name ?? ex.name,
          data.category ?? ex.category,
          data.quantity !== undefined ? data.quantity : ex.quantity,
          data.unit ?? ex.unit,
          data.minQuantity !== undefined ? data.minQuantity : ex.minQuantity,
          data.costPerUnit !== undefined ? data.costPerUnit : ex.costPerUnit,
          data.supplier !== undefined ? data.supplier : ex.supplier,
          data.notes !== undefined ? data.notes : ex.notes,
          now, id,
        ]
      )
      return (await this.findById(id))!
    },

    async delete(id: string) {
      const db = await getDb()
      db.run('DELETE FROM inventory_items WHERE id = ?', [id])
    },

    async sumStockValue(farmIds?: string[]) {
      const db = await getDb()
      const fc = farmClause(farmIds)
      const row = qRow(db,
        `SELECT COALESCE(SUM(quantity * costPerUnit), 0) as v FROM inventory_items WHERE 1=1${fc.sql}`,
        fc.params
      )
      return Number(row?.v ?? 0)
    },
  }
}
