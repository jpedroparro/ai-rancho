import { getDb, qRows, newId, farmClause } from '../database'
import type { WeightRecord, CreateWeightDto, IWeightRepository } from '../types'

export function createWeightRepository(): IWeightRepository {
  return {
    async findByAnimal(animalId) {
      const db = await getDb()
      return qRows(db, 'SELECT * FROM weights WHERE animalId=? ORDER BY date ASC', [animalId]) as WeightRecord[]
    },
    async findAll(farmIds?) {
      const db = await getDb()
      const fc = farmClause(farmIds)
      const fcSql = fc.sql.replace(' AND farmId', ' AND w.farmId')
      const rows = qRows(db,
        'SELECT w.*, a.tag, a.name as animalName FROM weights w LEFT JOIN animals a ON a.id=w.animalId WHERE 1=1' + fcSql + ' ORDER BY w.date DESC',
        fc.params)
      return rows.map(r => ({ ...r, animal: { tag: r.tag, name: r.animalName } })) as WeightRecord[]
    },
    async create(data) {
      const db = await getDb()
      const id = newId()
      db.run('INSERT INTO weights (id,animalId,date,weight,notes,farmId) VALUES (?,?,?,?,?,?)',
        [id, data.animalId, data.date, data.weight, data.notes ?? null, data.farmId ?? null])
      db.run('UPDATE animals SET weight=?, updatedAt=datetime("now") WHERE id=?', [data.weight, data.animalId])
      return { id, ...data, notes: data.notes ?? null, createdAt: new Date().toISOString() } as WeightRecord
    },
  }
}
