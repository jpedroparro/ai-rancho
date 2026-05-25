import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-guard'
import { createFarmService } from '@/lib/services/farm'
import { createShearingService } from '@/lib/services/shearing'

export const GET = withAuth(async (req, _, userId) => {
  const { searchParams } = new URL(req.url)
  const farmIds = await createFarmService().resolveFarmIds(userId, searchParams.get('farmId'))
  const animalId = searchParams.get('animalId')
  const svc = createShearingService()
  if (animalId) return NextResponse.json(await svc.getByAnimal(animalId))
  return NextResponse.json(await svc.getAll(farmIds))
})

export const POST = withAuth(async (req, _, userId) => {
  const data = await req.json()
  if (!data.animalId || !data.date || !data.woolWeight) return NextResponse.json({ error: 'animalId, date e woolWeight sao obrigatorios' }, { status: 400 })
  const farmIds = await createFarmService().resolveFarmIds(userId, data.farmId)
  const record = await createShearingService().create({ ...data, farmId: farmIds[0] ?? null })
  return NextResponse.json(record, { status: 201 })
})
