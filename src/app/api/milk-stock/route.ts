import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-guard'
import { createFarmService } from '@/lib/services/farm'
import { createMilkStockService } from '@/lib/services/milk-stock'

export const GET = withAuth(async (req, _, userId) => {
  const { searchParams } = new URL(req.url)
  const farmIds = await createFarmService().resolveFarmIds(userId, searchParams.get('farmId'))
  const svc = createMilkStockService()
  const [balance, movements] = await Promise.all([svc.getBalance(farmIds), svc.getMovements(farmIds)])
  return NextResponse.json({ balance, movements })
})

export const POST = withAuth(async (req, _, userId) => {
  const data = await req.json()
  if (!data.reason || !data.quantity || !data.date) return NextResponse.json({ error: 'reason, quantity e date sao obrigatorios' }, { status: 400 })
  const farmIds = await createFarmService().resolveFarmIds(userId, data.farmId)
  const svc = createMilkStockService()
  try {
    const mov = data.type === 'EXIT'
      ? await svc.addExit({ ...data, farmId: farmIds[0] ?? null })
      : await svc.addEntry({ ...data, farmId: farmIds[0] ?? null })
    return NextResponse.json(mov, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 422 })
  }
})
