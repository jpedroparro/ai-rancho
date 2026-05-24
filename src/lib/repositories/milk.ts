import { getDb, qRows, qRow, newId, farmClause } from '../database'
import type { MilkRecord, IMilkRepository } from '../types'

export function createMilkRepository(): IMilkRepository {
  return {
    async findByDays(days, farmIds?) {
      const db = await getDb()
      const since = new Date(Date.now() - days * 86_400_000).toISOString().split('T')[0]
      const fc = farmClause(farmIds)
      const records = qRows(db, `SELECT * FROM milk_records WHERE date >= ?${fc.sql} ORDER BY date DESC`, [since, ...fc.params])
      return records.map(r => ({
        ...r,
        animal: qRow(db, 'SELECT tag, name FROM animals WHERE id=?', [r.animalId]) ?? undefined,
      })) as MilkRecord[]
    },

    async findByAnimalId(animalId) {
      const db = await getDb()
      return qRows(db, 'SELECT * FROM milk_records WHERE animalId=? ORDER BY date DESC', [animalId]) as MilkRecord[]
    },

    async create(data) {
      const db = await getDb()
      const id = newId()
      const total = (data.morning ?? 0) + (data.evening ?? 0)
      db.run(
        'INSERT INTO milk_records (id,animalId,date,morning,evening,total,notes,farmId) VALUES (?,?,?,?,?,?,?,?)',
        [id, data.animalId, data.date, data.morning ?? 0, data.evening ?? 0, total, data.notes ?? null, (data as any).farmId ?? null]
      )
      return { id, ...data, total, createdAt: new Date().toISOString() } as MilkRecord
    },
  }
}
