import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-guard'
import { createFarmService } from '@/lib/services/farm'
import { createProductionCostService } from '@/lib/services/production-cost'

export const GET = withAuth(async (req, _, userId) => {
  const url = new URL(req.url)
  const farmId = url.searchParams.get('farmId')
  const start  = url.searchParams.get('start') ?? new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]
  const end    = url.searchParams.get('end')   ?? new Date().toISOString().split('T')[0]

  const farmIds = await createFarmService().resolveFarmIds(userId, farmId)
  const svc = createProductionCostService()

  const [summary, perAnimal, monthly] = await Promise.all([
    svc.getCostPerLiter({ farmIds, start, end }),
    svc.getCostPerAnimal({ farmIds, start, end }),
    svc.getMonthlySummary({ farmIds, start, end }),
  ])

  return NextResponse.json({ summary, perAnimal, monthly })
})
