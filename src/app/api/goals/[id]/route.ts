import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-guard'
import { createGoalsService } from '@/lib/services/goals'

export const PATCH = withAuth(async (req, ctx, _userId) => {
  const id = ctx.params?.id as string
  const body = await req.json()
  const svc = createGoalsService()
  const existing = await svc.getGoals({}).then(gs => gs.find(g => g.id === id))
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const updated = await svc.updateGoal(id, body)
  return NextResponse.json(updated)
})

export const DELETE = withAuth(async (_req, ctx, _userId) => {
  const id = ctx.params?.id as string
  await createGoalsService().deleteGoal(id)
  return NextResponse.json({ ok: true })
})
