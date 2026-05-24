import { NextResponse } from 'next/server'
import { withAuth, validationError, notFound } from '@/lib/api-guard'
import { createFarmService } from '@/lib/services/farm'

type Ctx = { params: { id: string } }

export const PUT = withAuth<Ctx>(async (req, { params }, userId) => {
  const data = await req.json()
  if (!data.name?.trim()) return validationError('Nome da fazenda é obrigatório')

  const service = createFarmService()
  const existing = await service.getFarmById(params.id)
  if (!existing || existing.userId !== userId) return notFound()

  const farm = await service.updateFarm(params.id, {
    name: data.name.trim(),
    location: data.location ?? null,
    hectares: data.hectares ? parseFloat(data.hectares) : null,
    description: data.description ?? null,
  })
  return NextResponse.json(farm)
})

export const DELETE = withAuth<Ctx>(async (_req, { params }, userId) => {
  const service = createFarmService()
  const existing = await service.getFarmById(params.id)
  if (!existing || existing.userId !== userId) return notFound()

  await service.deleteFarm(params.id)
  return NextResponse.json({ ok: true })
})
