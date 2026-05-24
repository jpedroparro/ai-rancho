import { NextResponse } from 'next/server'
import { withAuth } from '@/lib/api-guard'
import { createInventoryService } from '@/lib/services/inventory'

export const PATCH = withAuth(async (req, ctx, _userId) => {
  const id = ctx.params?.id as string
  const body = await req.json()
  const svc = createInventoryService()

  if (body.delta !== undefined) {
    const updated = await svc.updateQuantity(id, body.delta)
    return NextResponse.json(updated)
  }

  const existing = await svc.getItemById(id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const updated = await svc.updateItem(id, body)
  return NextResponse.json(updated)
})

export const DELETE = withAuth(async (_req, ctx, _userId) => {
  const id = ctx.params?.id as string
  const svc = createInventoryService()
  const existing = await svc.getItemById(id)
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  await svc.deleteItem(id)
  return NextResponse.json({ ok: true })
})
