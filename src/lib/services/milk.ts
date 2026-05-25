import { createMilkRepository } from '../repositories/milk'
import type { IMilkRepository, CreateMilkDto } from '../types'

export function createMilkService(repo: IMilkRepository = createMilkRepository()) {
  return {
    getRecords: (days: number, farmIds?: string[]) => repo.findByDays(days, farmIds),

    getRecordsByDateRange: (startDate: string, endDate: string, farmIds?: string[]) =>
      repo.findByDateRange(startDate, endDate, farmIds),

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
