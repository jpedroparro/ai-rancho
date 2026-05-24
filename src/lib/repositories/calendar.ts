import { getDb, qRows, qRow, newId } from '../database'
import type { CalendarEvent, ICalendarRepository } from '../types'

export function createCalendarRepository(): ICalendarRepository {
  return {
    async findAll(filters) {
      const db = await getDb()
      let sql = `
        SELECT e.*, a.tag as animalTag, a.name as animalName
        FROM calendar_events e
        LEFT JOIN animals a ON e.animalId = a.id
        WHERE 1=1
      `
      const params: any[] = []

      if (filters?.farmIds && filters.farmIds.length > 0) {
        sql += ` AND e.farmId IN (${filters.farmIds.map(() => '?').join(',')})`
        params.push(...filters.farmIds)
      }
      if (filters?.month) {
        sql += ` AND e.date LIKE ?`
        params.push(`${filters.month}%`)
      } else if (filters?.year) {
        sql += ` AND e.date LIKE ?`
        params.push(`${filters.year}%`)
      }

      sql += ' ORDER BY e.date ASC, e.createdAt ASC'
      return qRows(db, sql, params).map(row => ({
        id: row.id,
        farmId: row.farmId,
        title: row.title,
        description: row.description,
        eventType: row.eventType,
        date: row.date,
        animalId: row.animalId,
        status: row.status,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        animal: row.animalTag ? { tag: row.animalTag, name: row.animalName } : null,
      }))
    },

    async findById(id) {
      const db = await getDb()
      const row = qRow(db,
        `SELECT e.*, a.tag as animalTag, a.name as animalName
         FROM calendar_events e
         LEFT JOIN animals a ON e.animalId = a.id
         WHERE e.id = ?`,
        [id]
      )
      if (!row) return null
      return {
        id: row.id,
        farmId: row.farmId,
        title: row.title,
        description: row.description,
        eventType: row.eventType,
        date: row.date,
        animalId: row.animalId,
        status: row.status,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        animal: row.animalTag ? { tag: row.animalTag, name: row.animalName } : null,
      }
    },

    async create(data) {
      const db = await getDb()
      const id = newId()
      const now = new Date().toISOString()
      db.run(
        `INSERT INTO calendar_events (id, farmId, title, description, eventType, date, animalId, status, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [id, data.farmId ?? null, data.title, data.description ?? null, data.eventType, data.date, data.animalId ?? null, data.status, now, now]
      )
      return (await this.findById(id))!
    },

    async update(id, data) {
      const db = await getDb()
      const existing = await this.findById(id)
      if (!existing) throw new Error('Event not found')
      const now = new Date().toISOString()
      db.run(
        `UPDATE calendar_events SET
          title = ?, description = ?, eventType = ?, date = ?,
          animalId = ?, status = ?, updatedAt = ?
         WHERE id = ?`,
        [
          data.title ?? existing.title,
          data.description !== undefined ? data.description : existing.description,
          data.eventType ?? existing.eventType,
          data.date ?? existing.date,
          data.animalId !== undefined ? data.animalId : existing.animalId,
          data.status ?? existing.status,
          now, id,
        ]
      )
      return (await this.findById(id))!
    },

    async delete(id) {
      const db = await getDb()
      db.run('DELETE FROM calendar_events WHERE id = ?', [id])
    },
  }
}
