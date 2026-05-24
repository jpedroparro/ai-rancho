import { createExpenseRepository } from '../repositories/expense'
import type { IExpenseRepository, CreateExpenseDto } from '../types'

export function createExpenseService(repo: IExpenseRepository = createExpenseRepository()) {
  return {
    getExpenses: (farmIds?: string[]) => repo.findAll(farmIds),

    createExpense: (data: CreateExpenseDto) => repo.create({
      category: data.category,
      description: data.description,
      date: data.date,
      amount: data.amount,
      supplier: data.supplier ?? null,
      notes: data.notes ?? null,
      farmId: data.farmId ?? null,
    }),

    deleteExpense: (id: string) => repo.delete(id),
  }
}
