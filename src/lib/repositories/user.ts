import { getDb, qRow, newId } from '../database'
import type { User, IUserRepository } from '../types'

export function createUserRepository(): IUserRepository {
  return {
    async findByEmail(email) {
      const db = await getDb()
      return qRow(db, 'SELECT * FROM users WHERE email = ?', [email]) as User | null
    },

    async findById(id) {
      const db = await getDb()
      return qRow(db, 'SELECT * FROM users WHERE id = ?', [id]) as User | null
    },

    async create(data) {
      const db = await getDb()
      const id = newId()
      db.run(
        'INSERT INTO users (id,name,email,password,role,farmName,provider) VALUES (?,?,?,?,?,?,?)',
        [id, data.name ?? null, data.email, data.password, data.role ?? 'USER', data.farmName ?? null, data.provider ?? 'credentials']
      )
      return { id, ...data, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as User
    },
  }
}
