import { createMilkRepository } from '../repositories/milk'
import type { IMilkRepository, CreateMilkDto } from '../types'

export function createMilkService(repo: IMilkRepository = createMilkRepository()) {
  return {
    getRecords: (days: number, farmIds?: string[]) => repo.findByDays(days, farmIds),

    getRecordsByAnimal: (animalId: string) => repo.findByAnimalId(animalId),

    createRecord: (data: CreateMilkDto) => repo.create({
      animalId: data.animalId,
      date: data.date,
      morning: data.morning ?? 0,
      evening: data.evening ?? 0,
      total: 0,
      notes: data.notes ?? null,
      farmId: data.farmId ?? null,
    }),
  }
}
