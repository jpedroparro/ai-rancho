import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-guard'
import { createFarmService } from '@/lib/services/farm'
import { createInventoryService } from '@/lib/services/inventory'
import type { InventoryCategory } from '@/lib/types'

export const GET = withAuth(async (req, _, userId) => {
  const url = new URL(req.url)
  const farmId   = url.searchParams.get('farmId')
  const category = url.searchParams.get('category') as InventoryCategory | null
  const lowStock = url.searchParams.get('lowStock') === 'true'

  const farmIds = await createFarmService().resolveFarmIds(userId, farmId)
  const items = await createInventoryService().getItems({ farmIds, category: category ?? undefined, lowStock })
  return NextResponse.json(items)
})

export const POST = withAuth(async (req, _, userId) => {
  const body = await req.json()
  const { name, category, quantity, unit, minQuantity, costPerUnit, supplier, notes, farmId } = body
  if (!name || !category || quantity === undefined || !unit) {
    return NextResponse.json({ error: 'name, category, quantity e unit são obrigatórios' }, { status: 400 })
  }
  const farmIds = await createFarmService().resolveFarmIds(userId, farmId)
  const resolvedFarmId = farmIds?.[0] ?? null
  const item = await createInventoryService().createItem({ name, category, quantity, unit, minQuantity, costPerUnit, supplier, notes, farmId: resolvedFarmId ?? undefined })
  return NextResponse.json(item, { status: 201 })
})
