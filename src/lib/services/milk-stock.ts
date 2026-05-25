import { createMilkStockRepository } from '../repositories/milk-stock'
import type { CreateMilkStockMovementDto, IMilkStockRepository } from '../types'

export function createMilkStockService(repo: IMilkStockRepository = createMilkStockRepository()) {
  return {
    getBalance: (farmIds?: string[]) => repo.getBalance(farmIds),
    getMovements: (farmIds?: string[]) => repo.findMovements(farmIds),
    addEntry: (data: CreateMilkStockMovementDto) => repo.addEntry(data),
    async addExit(data: CreateMilkStockMovementDto) {
      const balance = await repo.getBalance(data.farmId ? [data.farmId] : undefined)
      if (data.quantity > balance + 0.001) {
        throw new Error('Saldo insuficiente. Disponivel: ' + balance.toFixed(1) + 'L, solicitado: ' + data.quantity.toFixed(1) + 'L')
      }
      return repo.addExit(data)
    },
  }
}
