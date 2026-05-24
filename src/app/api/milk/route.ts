import { NextResponse } from 'next/server'
import { withAuth, validationError } from '@/lib/api-guard'
import { createMilkService } from '@/lib/services/milk'
import { createFarmService } from '@/lib/services/farm'
import { validateMilkRecord } from '@/lib/validation'

export const GET = withAuth(async (req, _, userId) => {
  const { searchParams } = new URL(req.url)
  const days = Math.min(Math.max(parseInt(searchParams.get('days') ?? '30'), 1), 365)
  const farmIds = await createFarmService().resolveFarmIds(userId, searchParams.get('farmId'))
  return NextResponse.json(await createMilkService().getRecords(days, farmIds))
})

export const POST = withAuth(async (req, _, userId) => {
  const data = await req.json()
  const check = validateMilkRecord(data)
  if (!check.ok) return validationError(check.error)

  const farmIds = await createFarmService().resolveFarmIds(userId, data.farmId)
  const farmId = farmIds[0] ?? null

  const record = await createMilkService().createRecord({ ...data, farmId })
  return NextResponse.json(record, { status: 201 })
})
