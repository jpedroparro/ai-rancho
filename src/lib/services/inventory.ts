import { createInventoryRepository } from '../repositories/inventory'
import type { CreateInventoryItemDto, UpdateInventoryItemDto, InventoryCategory } from '../types'

export function createInventoryService() {
  const repo = createInventoryRepository()

  return {
    getItems: (filters?: { farmIds?: string[]; category?: InventoryCategory; lowStock?: boolean }) =>
      repo.findAll(filters),

    getItemById: (id: string) => repo.findById(id),

    createItem: (dto: CreateInventoryItemDto) =>
      repo.create({
        farmId: dto.farmId ?? null,
        name: dto.name.trim(),
        category: dto.category,
        quantity: dto.quantity,
        unit: dto.unit,
        minQuantity: dto.minQuantity ?? 0,
        costPerUnit: dto.costPerUnit ?? 0,
        supplier: dto.supplier ?? null,
        notes: dto.notes ?? null,
      }),

    updateItem: (id: string, dto: UpdateInventoryItemDto) =>
      repo.update(id, dto),

    async updateQuantity(id: string, delta: number) {
      const item = await repo.findById(id)
      if (!item) throw new Error('Item não encontrado')
      const newQty = item.quantity + delta
      if (newQty < 0) throw new Error('Estoque insuficiente')
      return repo.update(id, { quantity: newQty })
    },

    deleteItem: (id: string) => repo.delete(id),

    getStockValue: (farmIds?: string[]) => repo.sumStockValue(farmIds),
  }
}
