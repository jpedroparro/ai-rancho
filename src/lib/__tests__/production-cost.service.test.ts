import { initTestDb, clearTestDb, seedFarm } from './test-db'
import { createAnimalService } from '../services/animal'
import { createMilkService } from '../services/milk'
import { createExpenseService } from '../services/expense'
import { createProductionCostService } from '../services/production-cost'

const FARM = 'farm-1'

beforeEach(async () => {
  const db = await initTestDb()
  seedFarm(db, FARM)
})
afterEach(clearTestDb)

describe('ProductionCostService', () => {
  describe('getCostPerLiter', () => {
    it('retorna zero quando não há despesas nem produção', async () => {
      const svc = createProductionCostService()
      const result = await svc.getCostPerLiter({ farmIds: [FARM], start: '2024-01-01', end: '2024-01-31' })
      expect(result.costPerLiter).toBe(0)
      expect(result.totalExpenses).toBe(0)
      expect(result.totalLiters).toBe(0)
    })

    it('calcula custo por litro no período', async () => {
      const expSvc = createExpenseService()
      const milkSvc = createMilkService()
      const animalSvc = createAnimalService()

      const cow = await animalSvc.createAnimal({ tag: 'LT-01', type: 'DAIRY', gender: 'FEMALE', farmId: FARM })
      await milkSvc.createRecord({ animalId: cow.id, date: '2024-06-10', morning: 10, evening: 8, farmId: FARM })
      await milkSvc.createRecord({ animalId: cow.id, date: '2024-06-11', morning: 9, evening: 7, farmId: FARM })
      // Total: 18 + 16 = 34 litros
      await expSvc.createExpense({ category: 'FEED', description: 'Ração', date: '2024-06-10', amount: 340, farmId: FARM })

      const svc = createProductionCostService()
      const result = await svc.getCostPerLiter({ farmIds: [FARM], start: '2024-06-01', end: '2024-06-30' })
      expect(result.totalLiters).toBeCloseTo(34)
      expect(result.totalExpenses).toBeCloseTo(340)
      expect(result.costPerLiter).toBeCloseTo(10) // 340 / 34
    })

    it('ignora produção e despesas fora do período', async () => {
      const expSvc = createExpenseService()
      const milkSvc = createMilkService()
      const animalSvc = createAnimalService()

      const cow = await animalSvc.createAnimal({ tag: 'LT-02', type: 'DAIRY', gender: 'FEMALE', farmId: FARM })
      await milkSvc.createRecord({ animalId: cow.id, date: '2024-05-01', morning: 100, farmId: FARM }) // fora
      await milkSvc.createRecord({ animalId: cow.id, date: '2024-06-15', morning: 10, farmId: FARM }) // dentro
      await expSvc.createExpense({ category: 'FEED', description: 'Ração', date: '2024-05-01', amount: 9999, farmId: FARM }) // fora
      await expSvc.createExpense({ category: 'FEED', description: 'Ração', date: '2024-06-15', amount: 50, farmId: FARM }) // dentro

      const svc = createProductionCostService()
      const result = await svc.getCostPerLiter({ farmIds: [FARM], start: '2024-06-01', end: '2024-06-30' })
      expect(result.totalLiters).toBeCloseTo(10)
      expect(result.totalExpenses).toBeCloseTo(50)
    })
  })

  describe('getCostPerAnimal', () => {
    it('retorna custo zero por litro quando animal não tem produção', async () => {
      const animalSvc = createAnimalService()
      const cow = await animalSvc.createAnimal({ tag: 'LT-03', type: 'DAIRY', gender: 'FEMALE', farmId: FARM })

      const svc = createProductionCostService()
      const result = await svc.getCostPerAnimal({ farmIds: [FARM], start: '2024-06-01', end: '2024-06-30' })
      const entry = result.find(r => r.animalId === cow.id)
      // Sem produção registrada, animal não aparece
      expect(entry).toBeUndefined()
    })

    it('calcula produção e custo por animal', async () => {
      const animalSvc = createAnimalService()
      const milkSvc = createMilkService()
      const cow = await animalSvc.createAnimal({ tag: 'LT-04', type: 'DAIRY', gender: 'FEMALE', farmId: FARM })
      await milkSvc.createRecord({ animalId: cow.id, date: '2024-06-10', morning: 12, evening: 8, farmId: FARM })

      const svc = createProductionCostService()
      const result = await svc.getCostPerAnimal({ farmIds: [FARM], start: '2024-06-01', end: '2024-06-30' })
      expect(result).toHaveLength(1)
      expect(result[0].totalLiters).toBeCloseTo(20)
      expect(result[0].tag).toBe('LT-04')
    })
  })

  describe('getMonthlySummary', () => {
    it('agrupa custo por mês', async () => {
      const animalSvc = createAnimalService()
      const milkSvc = createMilkService()
      const expSvc = createExpenseService()

      const cow = await animalSvc.createAnimal({ tag: 'LT-05', type: 'DAIRY', gender: 'FEMALE', farmId: FARM })
      await milkSvc.createRecord({ animalId: cow.id, date: '2024-05-15', morning: 20, farmId: FARM })
      await milkSvc.createRecord({ animalId: cow.id, date: '2024-06-15', morning: 10, farmId: FARM })
      await expSvc.createExpense({ category: 'FEED', description: 'Ração', date: '2024-05-15', amount: 200, farmId: FARM })
      await expSvc.createExpense({ category: 'FEED', description: 'Ração', date: '2024-06-15', amount: 150, farmId: FARM })

      const svc = createProductionCostService()
      const months = await svc.getMonthlySummary({ farmIds: [FARM], start: '2024-05-01', end: '2024-06-30' })
      expect(months).toHaveLength(2)

      const may = months.find(m => m.month === '2024-05')!
      expect(may.totalLiters).toBeCloseTo(20)
      expect(may.totalExpenses).toBeCloseTo(200)
      expect(may.costPerLiter).toBeCloseTo(10)

      const jun = months.find(m => m.month === '2024-06')!
      expect(jun.costPerLiter).toBeCloseTo(15)
    })
  })
})
