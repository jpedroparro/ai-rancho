import { getDb, qRows, qRow, newId } from '../database'
import type { Payment, IPaymentRepository } from '../types'

export function createPaymentRepository(): IPaymentRepository {
  return {
    async findAll() {
      const db = await getDb()
      const payments = qRows(db, 'SELECT * FROM payments ORDER BY date DESC') as Payment[]
      return payments.map(p => ({
        ...p,
        employee: qRow(db, 'SELECT name FROM employees WHERE id=?', [p.employeeId]) ?? undefined,
      }))
    },

    async findByEmployee(employeeId, limit = 100) {
      const db = await getDb()
      return qRows(
        db,
        'SELECT * FROM payments WHERE employeeId=? ORDER BY date DESC LIMIT ?',
        [employeeId, limit]
      ) as Payment[]
    },

    async create(data) {
      const db = await getDb()
      const id = newId()
      db.run(
        'INSERT INTO payments (id,employeeId,amount,date,type,notes) VALUES (?,?,?,?,?,?)',
        [id, data.employeeId, data.amount, data.date, data.type ?? 'SALARY', data.notes ?? null]
      )
      return { id, ...data, type: data.type ?? 'SALARY', createdAt: new Date().toISOString() } as Payment
    },
  }
}
