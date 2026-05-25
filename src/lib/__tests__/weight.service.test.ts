import { initTestDb, clearTestDb, seedFarm } from './test-db'
import { createWeightService } from '../services/weight'

function seedAnimal(db: any, id = 'animal-1', farmId = 'farm-1') {
  db.run(
    'INSERT INTO animals (id, tag, type, gender, status, farmId) VALUES (?,?,?,?,?,?)',
    [id, 'A001', 'BEEF', 'MALE', 'ACTIVE', farmId]
  )
}

describe('WeightService', () => {
  let db: any

  beforeEach(async () => {
    db = await initTestDb()
    seedFarm(db)
    seedAnimal(db)
  })
  afterEach(() => clearTestDb())

  it('creates weight record', async () => {
    const svc = createWeightService()
    const rec = await svc.create({ animalId: 'animal-1', date: '2026-04-01', weight: 320, farmId: 'farm-1' })
    expect(rec.id).toBeTruthy()
    expect(rec.weight).toBe(320)
  })

  it('returns weights for animal', async () => {
    const svc = createWeightService()
    await svc.create({ animalId: 'animal-1', date: '2026-03-01', weight: 300, farmId: 'farm-1' })
    await svc.create({ animalId: 'animal-1', date: '2026-04-01', weight: 330, farmId: 'farm-1' })
    const recs = await svc.getByAnimal('animal-1')
    expect(recs).toHaveLength(2)
  })

  it('calculates GPD between two weighings', async () => {
    const svc = createWeightService()
    await svc.create({ animalId: 'animal-1', date: '2026-03-01', weight: 300, farmId: 'farm-1' })
    await svc.create({ animalId: 'animal-1', date: '2026-04-01', weight: 331, farmId: 'farm-1' })
    const gpd = await svc.getGPD('animal-1')
    expect(gpd).toBeCloseTo(1.0, 1)
  })

  it('returns null GPD with less than 2 weighings', async () => {
    const svc = createWeightService()
    await svc.create({ animalId: 'animal-1', date: '2026-04-01', weight: 300, farmId: 'farm-1' })
    const gpd = await svc.getGPD('animal-1')
    expect(gpd).toBeNull()
  })

  it('updates animal.weight to latest weighing', async () => {
    const svc = createWeightService()
    await svc.create({ animalId: 'animal-1', date: '2026-04-01', weight: 420, farmId: 'farm-1' })
    const row = db.exec('SELECT weight FROM animals WHERE id="animal-1"')
    expect(row[0].values[0][0]).toBe(420)
  })
})
