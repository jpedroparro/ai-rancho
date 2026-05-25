import { createHealthRepository } from '../repositories/health'
import type { CreateHealthEventDto } from '../types'

export function createHealthService(repo = createHealthRepository()) {
  return {
    getAll: (filters?: { farmIds?: string[]; animalId?: string }) => repo.findAll(filters),
    create: (data: CreateHealthEventDto) => repo.create(data),
    delete: (id: string) => repo.delete(id),
  }
}
