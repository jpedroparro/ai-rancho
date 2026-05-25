import { NextResponse } from 'next/server'
import { withAuth, validationError } from '@/lib/api-guard'
import { createMilkService } from '@/lib/services/milk'
import { createMilkStockService } from '@/lib/services/milk-stock'
import { createFarmService } from '@/lib/services/farm'
import { validateMilkRecord } from '@/lib/validation'

export const GET = withAuth(async (req, _, userId) => {
  const { searchParams } = new URL(req.url)
  const farmIds = await createFarmService().resolveFarmIds(userId, searchParams.get('farmId'))
  const start = searchParams.get('start')
  const end = searchParams.get('end')
  const milkService = createMilkService()
  if (start && end) return NextResponse.json(await milkService.getRecordsByDateRange(start, end, farmIds))
  const days = Math.min(Math.max(parseInt(searchParams.get('days') ?? '30'), 1), 365)
  return NextResponse.json(await milkService.getRecords(days, farmIds))
})

export const POST = withAuth(async (req, _, userId) => {
  const data = await req.json()
  const check = validateMilkRecord(data)
  if (!check.ok) return validationError(check.error)

  const farmIds = await createFarmService().resolveFarmIds(userId, data.farmId)
  const farmId = farmIds[0] ?? null

  const record = await createMilkService().createRecord({ ...data, farmId })

  // Auto-register production as stock entry
  if (record.total > 0) {
    await createMilkStockService().addEntry({ farmId: farmId ?? undefined, date: data.date, type: 'ENTRY', reason: 'PRODUCTION', quantity: record.total })
  }

  return NextResponse.json(record, { status: 201 })
})
