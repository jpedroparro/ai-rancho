import { initTestDb, clearTestDb, seedFarm } from './test-db'
import { createHealthService } from '../services/health'

describe('HealthService', () => {
  beforeEach(async () => {
    const db = await initTestDb()
    seedFarm(db)
  })
  afterEach(() => clearTestDb())

  it('creates health event', async () => {
    const svc = createHealthService()
    const ev = await svc.create({ farmId: 'farm-1', type: 'VACCINATION', title: 'Febre Aftosa', date: '2026-05-01' })
    expect(ev.id).toBeTruthy()
    expect(ev.title).toBe('Febre Aftosa')
  })

  it('calculates withdrawalEndDate from withdrawalDays', async () => {
    const svc = createHealthService()
    const ev = await svc.create({ farmId: 'farm-1', type: 'TREATMENT', title: 'Antibiotico', date: '2026-05-01', withdrawalDays: 14 })
    expect(ev.withdrawalEndDate).toBe('2026-05-15')
  })

  it('returns null withdrawalEndDate when withdrawalDays is 0', async () => {
    const svc = createHealthService()
    const ev = await svc.create({ farmId: 'farm-1', type: 'VACCINATION', title: 'Vacina', date: '2026-05-01', withdrawalDays: 0 })
    expect(ev.withdrawalEndDate).toBeNull()
  })

  it('lists events by farm', async () => {
    const svc = createHealthService()
    await svc.create({ farmId: 'farm-1', type: 'VACCINATION', title: 'Aftosa', date: '2026-05-01' })
    await svc.create({ farmId: 'farm-1', type: 'DEWORMING', title: 'Ivermec', date: '2026-05-02' })
    const evs = await svc.getAll({ farmIds: ['farm-1'] })
    expect(evs.length).toBeGreaterThanOrEqual(2)
  })

  it('deletes health event', async () => {
    const svc = createHealthService()
    const ev = await svc.create({ farmId: 'farm-1', type: 'VACCINATION', title: 'Teste', date: '2026-05-01' })
    await svc.delete(ev.id)
    const evs = await svc.getAll({ farmIds: ['farm-1'] })
    expect(evs.find(e => e.id === ev.id)).toBeUndefined()
  })
})
