import { NextResponse } from 'next/server'
import { withAuth, validationError } from '@/lib/api-guard'
import { createFarmService } from '@/lib/services/farm'

export const GET = withAuth(async (_req, _, userId) => {
  const farms = await createFarmService().getFarms(userId)
  return NextResponse.json(farms)
})

export const POST = withAuth(async (req, _, userId) => {
  const data = await req.json()
  if (!data.name?.trim()) return validationError('Nome da fazenda é obrigatório')

  const farm = await createFarmService().createFarm(userId, {
    name: data.name.trim(),
    location: data.location ?? undefined,
    hectares: data.hectares ? parseFloat(data.hectares) : undefined,
    description: data.description ?? undefined,
  })
  return NextResponse.json(farm, { status: 201 })
})
