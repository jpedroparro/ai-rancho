import { NextResponse } from 'next/server'
import { withAuth, validationError } from '@/lib/api-guard'
import { createExpenseService } from '@/lib/services/expense'
import { createFarmService } from '@/lib/services/farm'
import { validateExpense } from '@/lib/validation'

export const GET = withAuth(async (req, _, userId) => {
  const { searchParams } = new URL(req.url)
  const farmIds = await createFarmService().resolveFarmIds(userId, searchParams.get('farmId'))
  return NextResponse.json(await createExpenseService().getExpenses(farmIds))
})

export const POST = withAuth(async (req, _, userId) => {
  const data = await req.json()
  const check = validateExpense(data)
  if (!check.ok) return validationError(check.error)

  const farmIds = await createFarmService().resolveFarmIds(userId, data.farmId)
  const farmId = farmIds[0] ?? null

  const expense = await createExpenseService().createExpense({ ...data, farmId })
  return NextResponse.json(expense, { status: 201 })
})

export const DELETE = withAuth(async (req) => {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  if (!id) return validationError('ID obrigatório')

  await createExpenseService().deleteExpense(id)
  return NextResponse.json({ ok: true })
})
