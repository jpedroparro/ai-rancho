import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-guard'
import { createFarmService } from '@/lib/services/farm'
import { createSaleService } from '@/lib/services/sale'
import { createWeightService } from '@/lib/services/weight'
import { createHealthService } from '@/lib/services/health'
import { createReproductionService } from '@/lib/services/reproduction'
import { createMilkStockService } from '@/lib/services/milk-stock'
import { createMilkService } from '@/lib/services/milk'

export const GET = withAuth(async (req, _, userId) => {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') ?? 'movements'
  const farmIds = await createFarmService().resolveFarmIds(userId, searchParams.get('farmId'))

  let data: any[] = []
  if (type === 'sales')        data = await createSaleService().getSales(farmIds)
  else if (type === 'weights') data = await createWeightService().getAll(farmIds)
  else if (type === 'health')  data = await createHealthService().getAll({ farmIds })
  else if (type === 'reproduction') data = await createReproductionService().getAll(farmIds)
  else if (type === 'milk-stock') {
    const { movements } = await (async () => {
      const svc = createMilkStockService()
      return { movements: await svc.getMovements(farmIds) }
    })()
    data = movements
  } else if (type === 'milk') data = await createMilkService().getRecords(365, farmIds)

  return NextResponse.json({ type, count: data.length, data })
})
