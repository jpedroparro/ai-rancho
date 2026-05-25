import { createReproductionRepository } from '../repositories/reproduction'
import type { CreateReproductionEventDto } from '../types'

export function createReproductionService(repo = createReproductionRepository()) {
  return {
    getByAnimal: (animalId: string) => repo.findByAnimal(animalId),
    getAll: (farmIds?: string[]) => repo.findAll(farmIds),
    create: (data: CreateReproductionEventDto) => repo.create(data),
  }
}
