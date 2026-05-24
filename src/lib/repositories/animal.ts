import { getDb, qRows, qRow, newId, farmClause } from '../database'
import type { Animal, IAnimalRepository } from '../types'

export function createAnimalRepository(): IAnimalRepository {
  return {
    async findAll(filters = {}) {
      const db = await getDb()
      let sql = 'SELECT * FROM animals WHERE 1=1'
      const params: any[] = []
      if (filters.type) { sql += ' AND type = ?'; params.push(filters.type) }
      if (filters.status && filters.status !== 'ALL') { sql += ' AND status = ?'; params.push(filters.status) }
      else if (!filters.status) { sql += " AND status = 'ACTIVE'"; }
      const fc = farmClause(filters.farmIds)
      sql += fc.sql
      params.push(...fc.params)
      sql += ' ORDER BY tag ASC'
      return qRows(db, sql, params) as Animal[]
    },

    async findById(id) {
      const db = await getDb()
      return qRow(db, 'SELECT * FROM animals WHERE id = ?', [id]) as Animal | null
    },

    async create(data) {
      const db = await getDb()
      const id = newId()
      db.run(
        'INSERT INTO animals (id,tag,name,type,breed,gender,weight,status,notes,farmId) VALUES (?,?,?,?,?,?,?,?,?,?)',
        [id, data.tag, data.name ?? null, data.type, data.breed ?? null, data.gender ?? 'FEMALE', data.weight ?? null, data.status ?? 'ACTIVE', data.notes ?? null, (data as any).farmId ?? null]
      )
      return { id, ...data, birthDate: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Animal
    },

    async update(id, data) {
      const db = await getDb()
      const existing = qRow(db, 'SELECT * FROM animals WHERE id = ?', [id]) as Animal
      const merged = { ...existing, ...data }
      db.run(
        'UPDATE animals SET tag=?,name=?,type=?,breed=?,gender=?,weight=?,status=?,notes=?,updatedAt=datetime("now") WHERE id=?',
        [merged.tag, merged.name ?? null, merged.type, merged.breed ?? null, merged.gender, merged.weight ?? null, merged.status, merged.notes ?? null, id]
      )
      return merged
    },

    async delete(id) {
      const db = await getDb()
      db.run('DELETE FROM animals WHERE id=?', [id])
    },
  }
}
