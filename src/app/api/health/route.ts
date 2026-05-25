import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-guard'
import { createFarmService } from '@/lib/services/farm'
import { createHealthService } from '@/lib/services/health'

export const GET = withAuth(async (req, _, userId) => {
  const { searchParams } = new URL(req.url)
  const farmIds = await createFarmService().resolveFarmIds(userId, searchParams.get('farmId'))
  const animalId = searchParams.get('animalId') ?? undefined
  return NextResponse.json(await createHealthService().getAll({ farmIds, animalId }))
})

export const POST = withAuth(async (req, _, userId) => {
  const data = await req.json()
  if (!data.type || !data.title || !data.date) return NextResponse.json({ error: 'type, title e date sao obrigatorios' }, { status: 400 })
  const farmIds = await createFarmService().resolveFarmIds(userId, data.farmId)
  const event = await createHealthService().create({ ...data, farmId: farmIds[0] ?? null })
  return NextResponse.json(event, { status: 201 })
})
