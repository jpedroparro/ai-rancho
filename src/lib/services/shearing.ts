import { createShearingRepository } from '../repositories/shearing'
import type { CreateShearingRecordDto } from '../types'

export function createShearingService(repo = createShearingRepository()) {
  return {
    getByAnimal: (animalId: string) => repo.findByAnimal(animalId),
    getAll: (farmIds?: string[]) => repo.findAll(farmIds),
    create: (data: CreateShearingRecordDto) => repo.create(data),
  }
}
