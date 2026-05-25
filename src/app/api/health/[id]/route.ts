import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-guard'
import { createFarmService } from '@/lib/services/farm'
import { createHealthService } from '@/lib/services/health'

export const DELETE = withAuth(async (_req, { params }) => {
  await createHealthService().delete(params.id)
  return NextResponse.json({ ok: true })
})
