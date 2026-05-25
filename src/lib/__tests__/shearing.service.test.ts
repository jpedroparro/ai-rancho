import { initTestDb, clearTestDb, seedFarm } from './test-db'
import { createShearingService } from '../services/shearing'

function seedAnimal(db: any, id = 'sheep-1', farmId = 'farm-1') {
  db.run('INSERT INTO animals (id, tag, type, gender, status, farmId) VALUES (?,?,?,?,?,?)',
    [id, 'S001', 'SHEEP', 'FEMALE', 'ACTIVE', farmId])
}

describe('ShearingService', () => {
  let db: any

  beforeEach(async () => {
    db = await initTestDb()
    seedFarm(db)
    seedAnimal(db)
  })
  afterEach(() => clearTestDb())

  it('creates shearing record', async () => {
    const svc = createShearingService()
    const rec = await svc.create({ animalId: 'sheep-1', farmId: 'farm-1', date: '2026-05-01', woolWeight: 3.5, quality: 'FINE', costPerAnimal: 25 })
    expect(rec.id).toBeTruthy()
    expect(rec.woolWeight).toBe(3.5)
    expect(rec.quality).toBe('FINE')
  })

  it('returns records by animal', async () => {
    const svc = createShearingService()
    await svc.create({ animalId: 'sheep-1', farmId: 'farm-1', date: '2025-05-01', woolWeight: 3.2 })
    await svc.create({ animalId: 'sheep-1', farmId: 'farm-1', date: '2026-05-01', woolWeight: 3.8 })
    const recs = await svc.getByAnimal('sheep-1')
    expect(recs).toHaveLength(2)
    expect(recs[0].date > recs[1].date).toBe(true)
  })

  it('defaults costPerAnimal to 0', async () => {
    const svc = createShearingService()
    const rec = await svc.create({ animalId: 'sheep-1', farmId: 'farm-1', date: '2026-05-01', woolWeight: 2.8 })
    expect(rec.costPerAnimal).toBe(0)
  })

  it('returns all records by farm', async () => {
    const svc = createShearingService()
    await svc.create({ animalId: 'sheep-1', farmId: 'farm-1', date: '2026-05-01', woolWeight: 3.0 })
    const all = await svc.getAll(['farm-1'])
    expect(all.length).toBeGreaterThanOrEqual(1)
  })
})
