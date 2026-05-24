import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-guard'
import { createFarmService } from '@/lib/services/farm'
import { createCalendarService } from '@/lib/services/calendar'

export const GET = withAuth(async (req, _, userId) => {
  const url = new URL(req.url)
  const farmId = url.searchParams.get('farmId')
  const month = url.searchParams.get('month') ?? undefined   // YYYY-MM
  const year = url.searchParams.get('year')
    ? parseInt(url.searchParams.get('year')!)
    : undefined

  const farmIds = await createFarmService().resolveFarmIds(userId, farmId)
  const events = await createCalendarService().getAll({ farmIds, month, year })
  return NextResponse.json(events)
})

export const POST = withAuth(async (req, _, userId) => {
  const body = await req.json()
  const { title, description, eventType, date, animalId, farmId } = body

  if (!title || !eventType || !date) {
    return NextResponse.json({ error: 'title, eventType and date are required' }, { status: 400 })
  }

  const farmIds = await createFarmService().resolveFarmIds(userId, farmId)
  const resolvedFarmId = farmIds?.[0] ?? null

  const event = await createCalendarService().create(
    { title, description, eventType, date, animalId, farmId: resolvedFarmId ?? undefined },
    resolvedFarmId ?? undefined
  )
  return NextResponse.json(event, { status: 201 })
})
