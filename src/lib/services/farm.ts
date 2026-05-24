import { createFarmRepository } from '../repositories/farm'
import type { IFarmRepository, Farm, CreateFarmDto } from '../types'

export function createFarmService(repo: IFarmRepository = createFarmRepository()) {
  return {
    getFarms: (userId: string) => repo.findByUserId(userId),

    getFarmById: (id: string) => repo.findById(id),

    createFarm: (userId: string, data: CreateFarmDto) =>
      repo.create({ name: data.name, location: data.location ?? null, hectares: data.hectares ?? null, description: data.description ?? null, userId }),

    updateFarm: (id: string, data: Partial<Omit<Farm, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>) => repo.update(id, data),

    deleteFarm: (id: string) => repo.delete(id),

    /** Returns IDs of the user's farms. If a specific farmId is requested, verifies ownership. */
    async resolveFarmIds(userId: string, farmId?: string | null): Promise<string[]> {
      if (farmId) {
        const farm = await repo.findById(farmId)
        if (!farm || farm.userId !== userId) return []
        return [farmId]
      }
      const farms = await repo.findByUserId(userId)
      return farms.map(f => f.id)
    },
  }
}
