import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-guard'
import { createFarmService } from '@/lib/services/farm'
import { createGoalsService } from '@/lib/services/goals'

export const GET = withAuth(async (req, _, userId) => {
  const url    = new URL(req.url)
  const farmId = url.searchParams.get('farmId')
  const type   = url.searchParams.get('type') ?? undefined
  const farmIds = await createFarmService().resolveFarmIds(userId, farmId)
  const svc = createGoalsService()
  const [goals, progress] = await Promise.all([
    svc.getGoals({ farmIds, type: type as any }),
    svc.evaluateAll(farmIds),
  ])
  // Merge goals with their progress
  const progressMap = Object.fromEntries(progress.map(p => [p.goalId, p]))
  return NextResponse.json(goals.map(g => ({ ...g, progress: progressMap[g.id] ?? null })))
})

export const POST = withAuth(async (req, _, userId) => {
  const body = await req.json()
  const { type, label, targetValue, periodType, periodValue, farmId } = body
  if (!type || !label || targetValue === undefined || !periodType || !periodValue) {
    return NextResponse.json({ error: 'Campos obrigatórios faltando' }, { status: 400 })
  }
  const farmIds = await createFarmService().resolveFarmIds(userId, farmId)
  const resolvedFarmId = farmIds?.[0] ?? null
  const goal = await createGoalsService().createGoal({ type, label, targetValue, periodType, periodValue, farmId: resolvedFarmId ?? undefined })
  return NextResponse.json(goal, { status: 201 })
})
