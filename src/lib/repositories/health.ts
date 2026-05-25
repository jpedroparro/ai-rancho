import { getDb, qRows, newId, farmClause } from '../database'
import type { HealthEvent, CreateHealthEventDto, IHealthRepository } from '../types'

export function createHealthRepository(): IHealthRepository {
  return {
    async findAll(filters?) {
      const db = await getDb()
      const fc = farmClause(filters?.farmIds)
      const fcSql = fc.sql.replace(' AND farmId', ' AND h.farmId')
      const params: any[] = [...fc.params]
      let sql = 'SELECT h.*, a.tag, a.name as animalName FROM health_events h LEFT JOIN animals a ON a.id=h.animalId WHERE 1=1' + fcSql
      if (filters?.animalId) { sql += ' AND h.animalId=?'; params.push(filters.animalId) }
      sql += ' ORDER BY h.date DESC'
      const rows = qRows(db, sql, params)
      return rows.map(r => ({ ...r, animal: r.tag ? { tag: r.tag, name: r.animalName } : null })) as HealthEvent[]
    },
    async create(data) {
      const db = await getDb()
      const id = newId()
      const wd = data.withdrawalDays ?? 0
      const wEnd = wd > 0 ? new Date(new Date(data.date).getTime() + wd * 86400000).toISOString().split('T')[0] : null
      db.run('INSERT INTO health_events (id,animalId,farmId,type,title,date,dose,product,veterinarian,withdrawalDays,withdrawalEndDate,famacha,notes,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
        [id, data.animalId ?? null, data.farmId ?? null, data.type, data.title, data.date,
         data.dose ?? null, data.product ?? null, data.veterinarian ?? null,
         wd, wEnd, data.famacha ?? null, data.notes ?? null, data.status ?? 'DONE'])
      return { id, ...data, withdrawalDays: wd, withdrawalEndDate: wEnd, createdAt: new Date().toISOString() } as HealthEvent
    },
    async delete(id) {
      const db = await getDb()
      db.run('DELETE FROM health_events WHERE id=?', [id])
    },
  }
}
