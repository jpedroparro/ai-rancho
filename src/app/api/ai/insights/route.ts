import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-guard'
import { createFarmService } from '@/lib/services/farm'
import { generateInsights } from '@/lib/services/insights'

export const GET = withAuth(async (req, _, userId) => {
  const farmId = new URL(req.url).searchParams.get('farmId')
  const farmIds = await createFarmService().resolveFarmIds(userId, farmId)
  const insights = await generateInsights(farmIds)
  return NextResponse.json(insights)
})
