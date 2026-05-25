import { initTestDb, clearTestDb, seedFarm } from './test-db'
import { createReproductionService } from '../services/reproduction'

function seedAnimal(db: any, id = 'animal-1', farmId = 'farm-1') {
  db.run('INSERT INTO animals (id, tag, type, gender, status, farmId) VALUES (?,?,?,?,?,?)',
    [id, 'V001', 'DAIRY', 'FEMALE', 'ACTIVE', farmId])
}

describe('ReproductionService', () => {
  let db: any

  beforeEach(async () => {
    db = await initTestDb()
    seedFarm(db)
    seedAnimal(db)
  })
  afterEach(() => clearTestDb())

  it('creates insemination event', async () => {
    const svc = createReproductionService()
    const ev = await svc.create({ animalId: 'animal-1', farmId: 'farm-1', type: 'INSEMINATION', date: '2026-03-01', bullId: 'Touro-XYZ' })
    expect(ev.id).toBeTruthy()
    expect(ev.type).toBe('INSEMINATION')
    expect(ev.bullId).toBe('Touro-XYZ')
  })

  it('creates pregnancy check with result', async () => {
    const svc = createReproductionService()
    const ev = await svc.create({ animalId: 'animal-1', farmId: 'farm-1', type: 'PREGNANCY_CHECK', date: '2026-04-15', result: 'PREGNANT' })
    expect(ev.result).toBe('PREGNANT')
  })

  it('returns events for animal in order', async () => {
    const svc = createReproductionService()
    await svc.create({ animalId: 'animal-1', farmId: 'farm-1', type: 'INSEMINATION', date: '2026-03-01' })
    await svc.create({ animalId: 'animal-1', farmId: 'farm-1', type: 'PREGNANCY_CHECK', date: '2026-04-15', result: 'PREGNANT' })
    const evs = await svc.getByAnimal('animal-1')
    expect(evs).toHaveLength(2)
    expect(evs[0].date >= evs[1].date).toBe(true)
  })

  it('returns all events by farm', async () => {
    const svc = createReproductionService()
    await svc.create({ animalId: 'animal-1', farmId: 'farm-1', type: 'CALVING', date: '2026-04-01' })
    const all = await svc.getAll(['farm-1'])
    expect(all.length).toBeGreaterThanOrEqual(1)
  })
})
