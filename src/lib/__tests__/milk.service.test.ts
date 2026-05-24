import { initTestDb, clearTestDb, seedFarm } from './test-db'
import { createAnimalService } from '../services/animal'
import { createMilkService } from '../services/milk'

const FARM = 'farm-1'
let animalId: string

beforeEach(async () => {
  const db = await initTestDb()
  seedFarm(db, FARM)
  const a = await createAnimalService().createAnimal({ tag: 'LT-001', type: 'DAIRY', gender: 'FEMALE', farmId: FARM })
  animalId = a.id
})
afterEach(clearTestDb)

describe('MilkService', () => {
  describe('createRecord', () => {
    it('cria registro com manhã + tarde e soma total', async () => {
      const svc = createMilkService()
      const rec = await svc.createRecord({ animalId, date: '2024-06-01', morning: 8.5, evening: 5.0, farmId: FARM })
      expect(rec.id).toBeTruthy()
      expect(rec.morning).toBe(8.5)
      expect(rec.evening).toBe(5.0)
      expect(rec.total).toBeCloseTo(13.5)
    })

    it('cria registro só com manhã (tarde = 0)', async () => {
      const svc = createMilkService()
      const rec = await svc.createRecord({ animalId, date: '2024-06-02', morning: 10, farmId: FARM })
      expect(rec.total).toBeCloseTo(10)
      expect(rec.evening).toBe(0)
    })
  })

  describe('getRecords', () => {
    it('retorna registros dos últimos N dias', async () => {
      const svc = createMilkService()
      const today = new Date().toISOString().split('T')[0]
      await svc.createRecord({ animalId, date: today, morning: 9, evening: 6, farmId: FARM })
      const records = await svc.getRecords(7, [FARM])
      expect(records.length).toBeGreaterThanOrEqual(1)
    })

    it('não retorna registros fora do período', async () => {
      const svc = createMilkService()
      await svc.createRecord({ animalId, date: '2000-01-01', morning: 5, farmId: FARM })
      const records = await svc.getRecords(7, [FARM])
      expect(records).toHaveLength(0)
    })
  })

  describe('getRecordsByAnimal', () => {
    it('retorna somente registros do animal informado', async () => {
      const svc = createMilkService()
      const a2 = await createAnimalService().createAnimal({ tag: 'LT-002', type: 'DAIRY', gender: 'FEMALE', farmId: FARM })
      await svc.createRecord({ animalId, date: '2024-06-01', morning: 10, farmId: FARM })
      await svc.createRecord({ animalId: a2.id, date: '2024-06-01', morning: 8, farmId: FARM })
      const records = await svc.getRecordsByAnimal(animalId)
      expect(records.every(r => r.animalId === animalId)).toBe(true)
    })
  })
})
