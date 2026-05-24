import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-guard'
import { createCalendarService } from '@/lib/services/calendar'

export const PATCH = withAuth(async (req, ctx, _userId) => {
  const id = ctx.params?.id as string
  const body = await req.json()
  const svc = createCalendarService()
  const existing = await svc.getById(id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await svc.update(id, body)
  return NextResponse.json(updated)
})

export const DELETE = withAuth(async (_req, ctx, _userId) => {
  const id = ctx.params?.id as string
  const svc = createCalendarService()
  const existing = await svc.getById(id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await svc.delete(id)
  return NextResponse.json({ ok: true })
})
