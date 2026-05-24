import { createCalendarRepository } from '../repositories/calendar'
import type { CreateCalendarEventDto, UpdateCalendarEventDto } from '../types'

export function createCalendarService() {
  const repo = createCalendarRepository()

  return {
    getAll: (filters?: { farmIds?: string[]; month?: string; year?: number }) =>
      repo.findAll(filters),

    getById: (id: string) => repo.findById(id),

    create: (dto: CreateCalendarEventDto, farmId?: string) =>
      repo.create({
        farmId: dto.farmId ?? farmId ?? null,
        title: dto.title.trim(),
        description: dto.description?.trim() ?? null,
        eventType: dto.eventType,
        date: dto.date,
        animalId: dto.animalId ?? null,
        status: 'PENDING',
      }),

    update: (id: string, dto: UpdateCalendarEventDto) =>
      repo.update(id, {
        ...(dto.title !== undefined && { title: dto.title.trim() }),
        ...(dto.description !== undefined && { description: dto.description?.trim() ?? null }),
        ...(dto.eventType !== undefined && { eventType: dto.eventType }),
        ...(dto.date !== undefined && { date: dto.date }),
        ...(dto.animalId !== undefined && { animalId: dto.animalId }),
        ...(dto.status !== undefined && { status: dto.status }),
      }),

    delete: (id: string) => repo.delete(id),
  }
}
