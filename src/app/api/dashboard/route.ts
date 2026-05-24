import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-guard'
import { getDashboardData } from '@/lib/services/dashboard'
import { createFarmService } from '@/lib/services/farm'

export const GET = withAuth(async (req, _, userId) => {
  const { searchParams } = new URL(req.url)
  const farmService = createFarmService()
  const farmIds = await farmService.resolveFarmIds(userId, searchParams.get('farmId'))
  const data = await getDashboardData(farmIds)
  return NextResponse.json(data)
})
