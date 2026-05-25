import { getDb, qRows, newId, farmClause } from '../database'
import type { ReproductionEvent, CreateReproductionEventDto, IReproductionRepository } from '../types'

export function createReproductionRepository(): IReproductionRepository {
  return {
    async findByAnimal(animalId) {
      const db = await getDb()
      return qRows(db, 'SELECT * FROM reproduction_events WHERE animalId=? ORDER BY date DESC', [animalId]) as ReproductionEvent[]
    },
    async findAll(farmIds?) {
      const db = await getDb()
      const fc = farmClause(farmIds)
      const fcSql = fc.sql.replace(' AND farmId', ' AND r.farmId')
      const rows = qRows(db,
        'SELECT r.*, a.tag, a.name as animalName FROM reproduction_events r LEFT JOIN animals a ON a.id=r.animalId WHERE 1=1' + fcSql + ' ORDER BY r.date DESC',
        fc.params)
      return rows.map(r => ({ ...r, animal: { tag: r.tag, name: r.animalName } })) as ReproductionEvent[]
    },
    async create(data) {
      const db = await getDb()
      const id = newId()
      db.run('INSERT INTO reproduction_events (id,animalId,farmId,type,date,result,bullId,notes) VALUES (?,?,?,?,?,?,?,?)',
        [id, data.animalId, data.farmId ?? null, data.type, data.date, data.result ?? null, data.bullId ?? null, data.notes ?? null])
      return { id, ...data, createdAt: new Date().toISOString() } as ReproductionEvent
    },
  }
}
