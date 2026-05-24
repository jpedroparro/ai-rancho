import { getDb, qRow, farmClause } from '../database'
import { createGoalsRepository } from '../repositories/goals'
import type { GoalType, PeriodType, Goal } from '../repositories/goals'

export type { GoalType, PeriodType, Goal }

export interface GoalProgress {
  goalId: string
  label: string
  type: GoalType
  targetValue: number
  currentValue: number
  percentage: number
  achieved: boolean
  periodValue: string
}

interface CreateGoalDto {
  type: GoalType
  label: string
  targetValue: number
  periodType: PeriodType
  periodValue: string
  farmId?: string
}

function periodBounds(periodType: PeriodType, periodValue: string): { start: string; end: string } {
  if (periodType === 'MONTHLY') {
    // periodValue = YYYY-MM
    const [y, m] = periodValue.split('-').map(Number)
    const last = new Date(y, m, 0).getDate()
    return { start: `${periodValue}-01`, end: `${periodValue}-${String(last).padStart(2, '0')}` }
  }
  // YEARLY: periodValue = YYYY
  return { start: `${periodValue}-01-01`, end: `${periodValue}-12-31` }
}

export function createGoalsService() {
  const repo = createGoalsRepository()

  async function computeCurrentValue(goal: Goal, farmIds?: string[]): Promise<number> {
    const db = await getDb()
    const { start, end } = periodBounds(goal.periodType, goal.periodValue)
    const fc = farmClause(farmIds)

    if (goal.type === 'MILK_PRODUCTION') {
      const row = qRow(db,
        `SELECT COALESCE(SUM(total), 0) as v FROM milk_records WHERE date >= ? AND date <= ?${fc.sql}`,
        [start, end, ...fc.params]
      )
      return Number(row?.v ?? 0)
    }

    if (goal.type === 'REVENUE') {
      const row = qRow(db,
        `SELECT COALESCE(SUM(total), 0) as v FROM sales WHERE date >= ? AND date <= ?${fc.sql}`,
        [start, end, ...fc.params]
      )
      return Number(row?.v ?? 0)
    }

    if (goal.type === 'EXPENSES_LIMIT') {
      const row = qRow(db,
        `SELECT COALESCE(SUM(amount), 0) as v FROM expenses WHERE date >= ? AND date <= ?${fc.sql}`,
        [start, end, ...fc.params]
      )
      return Number(row?.v ?? 0)
    }

    if (goal.type === 'ANIMALS_COUNT') {
      const row = qRow(db,
        `SELECT COUNT(*) as v FROM animals WHERE status='ACTIVE'${fc.sql}`,
        fc.params
      )
      return Number(row?.v ?? 0)
    }

    return 0
  }

  function buildProgress(goal: Goal, currentValue: number): GoalProgress {
    const pct = goal.targetValue > 0 ? (currentValue / goal.targetValue) * 100 : 0
    const achieved = goal.type === 'EXPENSES_LIMIT'
      ? currentValue <= goal.targetValue
      : currentValue >= goal.targetValue
    return {
      goalId: goal.id,
      label: goal.label,
      type: goal.type,
      targetValue: goal.targetValue,
      currentValue,
      percentage: Math.min(pct, 999),
      achieved,
      periodValue: goal.periodValue,
    }
  }

  return {
    getGoals: (filters?: { farmIds?: string[]; type?: GoalType }) => repo.findAll(filters),

    createGoal: (dto: CreateGoalDto) =>
      repo.create({
        farmId: dto.farmId ?? null,
        type: dto.type,
        label: dto.label,
        targetValue: dto.targetValue,
        periodType: dto.periodType,
        periodValue: dto.periodValue,
        status: 'ACTIVE',
      }),

    updateGoal: (id: string, data: Partial<Omit<Goal, 'id' | 'createdAt'>>) =>
      repo.update(id, data),

    deleteGoal: (id: string) => repo.delete(id),

    async evaluateGoal(goalId: string, farmIds?: string[]): Promise<GoalProgress> {
      const goal = await repo.findById(goalId)
      if (!goal) throw new Error('Meta não encontrada')
      const current = await computeCurrentValue(goal, farmIds)
      return buildProgress(goal, current)
    },

    async evaluateAll(farmIds?: string[]): Promise<GoalProgress[]> {
      const goals = await repo.findAll({ farmIds })
      return Promise.all(goals.map(g => {
        return computeCurrentValue(g, farmIds).then(v => buildProgress(g, v))
      }))
    },
  }
}
