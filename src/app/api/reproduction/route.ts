import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-guard'
import { createFarmService } from '@/lib/services/farm'
import { createReproductionService } from '@/lib/services/reproduction'

export const GET = withAuth(async (req, _, userId) => {
  const { searchParams } = new URL(req.url)
  const farmIds = await createFarmService().resolveFarmIds(userId, searchParams.get('farmId'))
  const animalId = searchParams.get('animalId')
  const svc = createReproductionService()
  if (animalId) return NextResponse.json(await svc.getByAnimal(animalId))
  return NextResponse.json(await svc.getAll(farmIds))
})

export const POST = withAuth(async (req, _, userId) => {
  const data = await req.json()
  if (!data.animalId || !data.type || !data.date) return NextResponse.json({ error: 'animalId, type e date sao obrigatorios' }, { status: 400 })
  const farmIds = await createFarmService().resolveFarmIds(userId, data.farmId)
  const event = await createReproductionService().create({ ...data, farmId: farmIds[0] ?? null })
  return NextResponse.json(event, { status: 201 })
})
