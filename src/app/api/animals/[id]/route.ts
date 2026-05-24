import { NextResponse } from 'next/server'
import { withAuth, validationError, notFound } from '@/lib/api-guard'
import { createAnimalService } from '@/lib/services/animal'
import { validateAnimal } from '@/lib/validation'

type Ctx = { params: { id: string } }

export const GET = withAuth<Ctx>(async (_req, { params }) => {
  const animal = await createAnimalService().getAnimalById(params.id)
  if (!animal) return notFound()
  return NextResponse.json(animal)
})

export const PUT = withAuth<Ctx>(async (req, { params }) => {
  const data = await req.json()
  const check = validateAnimal(data)
  if (!check.ok) return validationError(check.error)

  const service = createAnimalService()
  const existing = await service.getAnimalById(params.id)
  if (!existing) return notFound()

  const animal = await service.updateAnimal(params.id, data)
  return NextResponse.json(animal)
})

export const DELETE = withAuth<Ctx>(async (_req, { params }) => {
  const service = createAnimalService()
  const existing = await service.getAnimalById(params.id)
  if (!existing) return notFound()

  await service.deleteAnimal(params.id)
  return NextResponse.json({ ok: true })
})
