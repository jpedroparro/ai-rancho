import { NextResponse } from 'next/server'
import { withAuth, validationError } from '@/lib/api-guard'
import { createAnimalService } from '@/lib/services/animal'
import { createFarmService } from '@/lib/services/farm'
import { validateAnimal } from '@/lib/validation'

export const GET = withAuth(async (req, _, userId) => {
  const { searchParams } = new URL(req.url)
  const farmIds = await createFarmService().resolveFarmIds(userId, searchParams.get('farmId'))
  const animals = await createAnimalService().getAnimals({
    type: searchParams.get('type') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    farmIds,
  })
  return NextResponse.json(animals)
})

export const POST = withAuth(async (req, _, userId) => {
  const data = await req.json()
  const check = validateAnimal(data)
  if (!check.ok) return validationError(check.error)

  const farmIds = await createFarmService().resolveFarmIds(userId, data.farmId)
  const farmId = farmIds[0] ?? null

  const animal = await createAnimalService().createAnimal({ ...data, farmId })
  return NextResponse.json(animal, { status: 201 })
})
