import { NextResponse } from 'next/server'
import { withAuth, validationError } from '@/lib/api-guard'
import { createSaleService } from '@/lib/services/sale'
import { createFarmService } from '@/lib/services/farm'
import { validateSale } from '@/lib/validation'

export const GET = withAuth(async (req, _, userId) => {
  const { searchParams } = new URL(req.url)
  const farmIds = await createFarmService().resolveFarmIds(userId, searchParams.get('farmId'))
  return NextResponse.json(await createSaleService().getSales(farmIds))
})

export const POST = withAuth(async (req, _, userId) => {
  const data = await req.json()
  const check = validateSale(data)
  if (!check.ok) return validationError(check.error)

  const farmIds = await createFarmService().resolveFarmIds(userId, data.farmId)
  const farmId = farmIds[0] ?? null

  const sale = await createSaleService().createSale({ ...data, farmId })
  return NextResponse.json(sale, { status: 201 })
})
