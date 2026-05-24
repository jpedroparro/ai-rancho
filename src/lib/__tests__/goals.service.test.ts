import { initTestDb, clearTestDb, seedFarm } from './test-db'
import { createAnimalService } from '../services/animal'
import { createMilkService } from '../services/milk'
import { createSaleService } from '../services/sale'
import { createExpenseService } from '../services/expense'
import { createGoalsService } from '../services/goals'

const FARM = 'farm-1'

beforeEach(async () => {
  const db = await initTestDb()
  seedFarm(db, FARM)
})
afterEach(clearTestDb)

describe('GoalsService', () => {
  describe('createGoal', () => {
    it('cria meta mensal de produção de leite', async () => {
      const svc = createGoalsService()
      const goal = await svc.createGoal({
        type: 'MILK_PRODUCTION',
        label: 'Meta de leite junho',
        targetValue: 1000,
        periodType: 'MONTHLY',
        periodValue: '2024-06',
        farmId: FARM,
      })
      expect(goal.id).toBeTruthy()
      expect(goal.type).toBe('MILK_PRODUCTION')
      expect(goal.targetValue).toBe(1000)
      expect(goal.status).toBe('ACTIVE')
    })

    it('cria meta anual de receita', async () => {
      const svc = createGoalsService()
      const goal = await svc.createGoal({
        type: 'REVENUE',
        label: 'Receita 2024',
        targetValue: 50000,
        periodType: 'YEARLY',
        periodValue: '2024',
        farmId: FARM,
      })
      expect(goal.periodType).toBe('YEARLY')
      expect(goal.targetValue).toBe(50000)
    })
  })

  describe('getGoals', () => {
    it('lista metas da fazenda', async () => {
      const svc = createGoalsService()
      await svc.createGoal({ type: 'MILK_PRODUCTION', label: 'Meta A', targetValue: 500, periodType: 'MONTHLY', periodValue: '2024-06', farmId: FARM })
      await svc.createGoal({ type: 'REVENUE', label: 'Meta B', targetValue: 5000, periodType: 'MONTHLY', periodValue: '2024-06', farmId: FARM })
      const goals = await svc.getGoals({ farmIds: [FARM] })
      expect(goals).toHaveLength(2)
    })

    it('filtra por tipo', async () => {
      const svc = createGoalsService()
      await svc.createGoal({ type: 'MILK_PRODUCTION', label: 'Leite', targetValue: 500, periodType: 'MONTHLY', periodValue: '2024-06', farmId: FARM })
      await svc.createGoal({ type: 'REVENUE', label: 'Receita', targetValue: 5000, periodType: 'MONTHLY', periodValue: '2024-06', farmId: FARM })
      const milk = await svc.getGoals({ farmIds: [FARM], type: 'MILK_PRODUCTION' })
      expect(milk).toHaveLength(1)
      expect(milk[0].type).toBe('MILK_PRODUCTION')
    })
  })

  describe('evaluateGoal — MILK_PRODUCTION', () => {
    it('retorna progresso zero sem registros de leite', async () => {
      const svc = createGoalsService()
      const goal = await svc.createGoal({ type: 'MILK_PRODUCTION', label: 'Meta', targetValue: 1000, periodType: 'MONTHLY', periodValue: '2024-06', farmId: FARM })
      const progress = await svc.evaluateGoal(goal.id, [FARM])
      expect(progress.currentValue).toBe(0)
      expect(progress.percentage).toBe(0)
      expect(progress.achieved).toBe(false)
    })

    it('calcula progresso de produção de leite', async () => {
      const animalSvc = createAnimalService()
      const milkSvc = createMilkService()
      const cow = await animalSvc.createAnimal({ tag: 'LT-01', type: 'DAIRY', gender: 'FEMALE', farmId: FARM })
      await milkSvc.createRecord({ animalId: cow.id, date: '2024-06-10', morning: 300, evening: 200, farmId: FARM })

      const svc = createGoalsService()
      const goal = await svc.createGoal({ type: 'MILK_PRODUCTION', label: 'Meta', targetValue: 400, periodType: 'MONTHLY', periodValue: '2024-06', farmId: FARM })
      const progress = await svc.evaluateGoal(goal.id, [FARM])
      expect(progress.currentValue).toBeCloseTo(500)
      expect(progress.percentage).toBeCloseTo(125)
      expect(progress.achieved).toBe(true)
    })
  })

  describe('evaluateGoal — REVENUE', () => {
    it('calcula progresso de receita', async () => {
      const saleSvc = createSaleService()
      await saleSvc.createSale({ type: 'MILK', date: '2024-06-15', quantity: 100, pricePerUnit: 2.5, farmId: FARM })

      const svc = createGoalsService()
      const goal = await svc.createGoal({ type: 'REVENUE', label: 'Meta', targetValue: 500, periodType: 'MONTHLY', periodValue: '2024-06', farmId: FARM })
      const progress = await svc.evaluateGoal(goal.id, [FARM])
      expect(progress.currentValue).toBeCloseTo(250)
      expect(progress.percentage).toBeCloseTo(50)
      expect(progress.achieved).toBe(false)
    })
  })

  describe('evaluateGoal — EXPENSES_LIMIT', () => {
    it('meta atingida quando despesas ficam abaixo do limite', async () => {
      const expSvc = createExpenseService()
      await expSvc.createExpense({ category: 'FEED', description: 'Ração', date: '2024-06-10', amount: 300, farmId: FARM })

      const svc = createGoalsService()
      const goal = await svc.createGoal({ type: 'EXPENSES_LIMIT', label: 'Limite', targetValue: 500, periodType: 'MONTHLY', periodValue: '2024-06', farmId: FARM })
      const progress = await svc.evaluateGoal(goal.id, [FARM])
      expect(progress.currentValue).toBeCloseTo(300)
      expect(progress.achieved).toBe(true) // despesas < target
    })

    it('meta NÃO atingida quando despesas superam o limite', async () => {
      const expSvc = createExpenseService()
      await expSvc.createExpense({ category: 'FEED', description: 'Ração', date: '2024-06-10', amount: 700, farmId: FARM })

      const svc = createGoalsService()
      const goal = await svc.createGoal({ type: 'EXPENSES_LIMIT', label: 'Limite', targetValue: 500, periodType: 'MONTHLY', periodValue: '2024-06', farmId: FARM })
      const progress = await svc.evaluateGoal(goal.id, [FARM])
      expect(progress.achieved).toBe(false)
    })
  })

  describe('evaluateGoal — ANIMALS_COUNT', () => {
    it('calcula progresso da meta de plantel', async () => {
      const animalSvc = createAnimalService()
      await animalSvc.createAnimal({ tag: 'LT-01', type: 'DAIRY', gender: 'FEMALE', farmId: FARM })
      await animalSvc.createAnimal({ tag: 'LT-02', type: 'DAIRY', gender: 'FEMALE', farmId: FARM })

      const svc = createGoalsService()
      const goal = await svc.createGoal({ type: 'ANIMALS_COUNT', label: 'Plantel', targetValue: 5, periodType: 'YEARLY', periodValue: '2024', farmId: FARM })
      const progress = await svc.evaluateGoal(goal.id, [FARM])
      expect(progress.currentValue).toBe(2)
      expect(progress.percentage).toBeCloseTo(40)
    })
  })

  describe('updateGoal / deleteGoal', () => {
    it('atualiza o valor alvo', async () => {
      const svc = createGoalsService()
      const goal = await svc.createGoal({ type: 'REVENUE', label: 'Meta', targetValue: 1000, periodType: 'MONTHLY', periodValue: '2024-06', farmId: FARM })
      const updated = await svc.updateGoal(goal.id, { targetValue: 2000 })
      expect(updated.targetValue).toBe(2000)
    })

    it('remove a meta', async () => {
      const svc = createGoalsService()
      const goal = await svc.createGoal({ type: 'REVENUE', label: 'Meta', targetValue: 1000, periodType: 'MONTHLY', periodValue: '2024-06', farmId: FARM })
      await svc.deleteGoal(goal.id)
      const goals = await svc.getGoals({ farmIds: [FARM] })
      expect(goals).toHaveLength(0)
    })
  })

  describe('evaluateAll', () => {
    it('avalia todas as metas de uma fazenda de uma vez', async () => {
      const svc = createGoalsService()
      await svc.createGoal({ type: 'REVENUE', label: 'Receita', targetValue: 1000, periodType: 'MONTHLY', periodValue: '2024-06', farmId: FARM })
      await svc.createGoal({ type: 'MILK_PRODUCTION', label: 'Leite', targetValue: 500, periodType: 'MONTHLY', periodValue: '2024-06', farmId: FARM })
      const results = await svc.evaluateAll([FARM])
      expect(results).toHaveLength(2)
      expect(results.every(r => 'percentage' in r && 'achieved' in r)).toBe(true)
    })
  })
})
