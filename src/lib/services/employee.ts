import { createEmployeeRepository } from '../repositories/employee'
import { createPaymentRepository } from '../repositories/payment'
import type { IEmployeeRepository, IPaymentRepository, CreateEmployeeDto, CreatePaymentDto } from '../types'

export function createEmployeeService(
  empRepo: IEmployeeRepository = createEmployeeRepository(),
  payRepo: IPaymentRepository = createPaymentRepository()
) {
  return {
    getEmployees: (farmIds?: string[]) => empRepo.findAll(farmIds),

    getEmployeeById: (id: string) => empRepo.findById(id),

    createEmployee: (data: CreateEmployeeDto) => empRepo.create({
      name: data.name,
      role: data.role ?? null,
      salary: data.salary ?? 0,
      phone: data.phone ?? null,
      startDate: data.startDate,
      status: data.status ?? 'ACTIVE',
      notes: data.notes ?? null,
      farmId: data.farmId ?? null,
    }),

    updateEmployee: (id: string, data: CreateEmployeeDto) => empRepo.update(id, data),

    deactivateEmployee: (id: string) => empRepo.deactivate(id),

    getPayments: () => payRepo.findAll(),

    createPayment: (data: CreatePaymentDto) => payRepo.create({
      employeeId: data.employeeId,
      amount: data.amount,
      date: data.date,
      type: data.type ?? 'SALARY',
      notes: data.notes ?? null,
    }),
  }
}
