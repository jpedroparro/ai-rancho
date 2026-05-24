import { createAnimalRepository } from '../repositories/animal'
import type { IAnimalRepository, CreateAnimalDto, UpdateAnimalDto } from '../types'

export function createAnimalService(repo: IAnimalRepository = createAnimalRepository()) {
  return {
    getAnimals: (filters?: { type?: string; status?: string; farmIds?: string[] }) => repo.findAll(filters),

    getAnimalById: (id: string) => repo.findById(id),

    createAnimal: (data: CreateAnimalDto) => repo.create({
      tag: data.tag,
      name: data.name ?? null,
      type: data.type,
      breed: data.breed ?? null,
      birthDate: null,
      gender: data.gender ?? 'FEMALE',
      status: data.status ?? 'ACTIVE',
      weight: data.weight ?? null,
      notes: data.notes ?? null,
      farmId: data.farmId ?? null,
    }),

    updateAnimal: (id: string, data: UpdateAnimalDto) => repo.update(id, data),

    deleteAnimal: (id: string) => repo.delete(id),
  }
}
