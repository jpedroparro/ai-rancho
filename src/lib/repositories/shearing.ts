import { getDb, qRows, newId, farmClause } from '../database'
import type { ShearingRecord, CreateShearingRecordDto, IShearingRepository } from '../types'

export function createShearingRepository(): IShearingRepository {
  return {
    async findByAnimal(animalId) {
      const db = await getDb()
      return qRows(db, 'SELECT * FROM shearing_records WHERE animalId=? ORDER BY date DESC', [animalId]) as ShearingRecord[]
    },
    async findAll(farmIds?) {
      const db = await getDb()
      const fc = farmClause(farmIds)
      const fcSql = fc.sql.replace(' AND farmId', ' AND s.farmId')
      const rows = qRows(db,
        'SELECT s.*, a.tag, a.name as animalName FROM shearing_records s LEFT JOIN animals a ON a.id=s.animalId WHERE 1=1' + fcSql + ' ORDER BY s.date DESC',
        fc.params)
      return rows.map(r => ({ ...r, animal: { tag: r.tag, name: r.animalName } })) as ShearingRecord[]
    },
    async create(data) {
      const db = await getDb()
      const id = newId()
      db.run('INSERT INTO shearing_records (id,animalId,farmId,date,woolWeight,quality,serviceProvider,costPerAnimal,notes) VALUES (?,?,?,?,?,?,?,?,?)',
        [id, data.animalId, data.farmId ?? null, data.date, data.woolWeight,
         data.quality ?? null, data.serviceProvider ?? null, data.costPerAnimal ?? 0, data.notes ?? null])
      return { id, ...data, costPerAnimal: data.costPerAnimal ?? 0, createdAt: new Date().toISOString() } as ShearingRecord
    },
  }
}
