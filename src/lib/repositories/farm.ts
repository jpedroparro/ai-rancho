import { getDb, qRows, qRow, newId } from '../database'
import type { Farm, IFarmRepository } from '../types'

export function createFarmRepository(): IFarmRepository {
  return {
    async findByUserId(userId) {
      const db = await getDb()
      return qRows(db, 'SELECT * FROM farms WHERE userId=? ORDER BY name ASC', [userId]) as Farm[]
    },

    async findById(id) {
      const db = await getDb()
      return qRow(db, 'SELECT * FROM farms WHERE id=?', [id]) as Farm | null
    },

    async create(data) {
      const db = await getDb()
      const id = newId()
      db.run(
        'INSERT INTO farms (id,name,location,hectares,description,userId) VALUES (?,?,?,?,?,?)',
        [id, data.name, data.location ?? null, data.hectares ?? null, data.description ?? null, data.userId]
      )
      return { id, ...data, location: data.location ?? null, hectares: data.hectares ?? null, description: data.description ?? null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Farm
    },

    async update(id, data) {
      const db = await getDb()
      const existing = qRow(db, 'SELECT * FROM farms WHERE id=?', [id]) as Farm
      const merged = { ...existing, ...data }
      db.run(
        'UPDATE farms SET name=?,location=?,hectares=?,description=?,updatedAt=datetime("now") WHERE id=?',
        [merged.name, merged.location ?? null, merged.hectares ?? null, merged.description ?? null, id]
      )
      return merged
    },

    async delete(id) {
      const db = await getDb()
      db.run('DELETE FROM farms WHERE id=?', [id])
    },
  }
}
