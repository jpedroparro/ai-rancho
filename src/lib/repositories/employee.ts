import { getDb, qRows, qRow, newId, farmClause } from '../database'
import type { Employee, IEmployeeRepository } from '../types'
import { createPaymentRepository } from './payment'

export function createEmployeeRepository(): IEmployeeRepository {
  return {
    async findAll(farmIds?) {
      const db = await getDb()
      const fc = farmClause(farmIds)
      const employees = qRows(db, `SELECT * FROM employees WHERE 1=1${fc.sql} ORDER BY name ASC`, fc.params) as Employee[]
      const paymentRepo = createPaymentRepository()
      return Promise.all(
        employees.map(async (e) => ({
          ...e,
          payments: await paymentRepo.findByEmployee(e.id, 3),
        }))
      )
    },

    async findById(id) {
      const db = await getDb()
      return qRow(db, 'SELECT * FROM employees WHERE id = ?', [id]) as Employee | null
    },

    async create(data) {
      const db = await getDb()
      const id = newId()
      db.run(
        'INSERT INTO employees (id,name,role,salary,phone,startDate,status,notes,farmId) VALUES (?,?,?,?,?,?,?,?,?)',
        [id, data.name, data.role ?? null, data.salary ?? 0, data.phone ?? null, data.startDate, data.status ?? 'ACTIVE', data.notes ?? null, (data as any).farmId ?? null]
      )
      return { id, ...data, salary: data.salary ?? 0, status: data.status ?? 'ACTIVE', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } as Employee
    },

    async update(id, data) {
      const db = await getDb()
      const existing = qRow(db, 'SELECT * FROM employees WHERE id = ?', [id]) as Employee
      const merged = { ...existing, ...data }
      db.run(
        'UPDATE employees SET name=?,role=?,salary=?,phone=?,startDate=?,status=?,notes=?,updatedAt=datetime("now") WHERE id=?',
        [merged.name, merged.role ?? null, merged.salary ?? 0, merged.phone ?? null, merged.startDate, merged.status, merged.notes ?? null, id]
      )
      return merged
    },

    async deactivate(id) {
      const db = await getDb()
      db.run('UPDATE employees SET status="INACTIVE",updatedAt=datetime("now") WHERE id=?', [id])
    },
  }
}
