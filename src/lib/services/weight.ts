import { createWeightRepository } from '../repositories/weight'
import type { CreateWeightDto } from '../types'

export function createWeightService(repo = createWeightRepository()) {
  return {
    getByAnimal: (animalId: string) => repo.findByAnimal(animalId),
    getAll: (farmIds?: string[]) => repo.findAll(farmIds),
    create: (data: CreateWeightDto) => repo.create(data),
    async getGPD(animalId: string): Promise<number | null> {
      const records = await repo.findByAnimal(animalId)
      if (records.length < 2) return null
      const last = records[records.length - 1]
      const prev = records[records.length - 2]
      const days = Math.max(1, (new Date(last.date).getTime() - new Date(prev.date).getTime()) / 86400000)
      return +((last.weight - prev.weight) / days).toFixed(3)
    },
  }
}
