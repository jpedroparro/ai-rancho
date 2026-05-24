import { createSaleRepository } from '../repositories/sale'
import type { ISaleRepository, CreateSaleDto } from '../types'

export function createSaleService(repo: ISaleRepository = createSaleRepository()) {
  return {
    getSales: (farmIds?: string[]) => repo.findAll(farmIds),

    getRevenue: (farmIds?: string[]) => repo.sumTotal(farmIds),

    getRecentSales: (limit: number, farmIds?: string[]) => repo.findRecent(limit, farmIds),

    createSale: (data: CreateSaleDto) => repo.create({
      type: data.type,
      date: data.date,
      quantity: data.quantity,
      unit: data.unit ?? (data.type === 'MILK' ? 'L' : 'kg'),
      pricePerUnit: data.pricePerUnit,
      total: 0,
      buyer: data.buyer ?? null,
      notes: data.notes ?? null,
      farmId: data.farmId ?? null,
    }),
  }
}
