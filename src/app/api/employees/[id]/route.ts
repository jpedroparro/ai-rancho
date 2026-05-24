import { NextResponse } from 'next/server'
import { withAuth, validationError, notFound } from '@/lib/api-guard'
import { createEmployeeService } from '@/lib/services/employee'
import { validateEmployee } from '@/lib/validation'

type Ctx = { params: { id: string } }

export const PUT = withAuth<Ctx>(async (req, { params }) => {
  const data = await req.json()
  const check = validateEmployee(data)
  if (!check.ok) return validationError(check.error)

  const service = createEmployeeService()
  const existing = await service.getEmployeeById(params.id)
  if (!existing) return notFound()

  const employee = await service.updateEmployee(params.id, data)
  return NextResponse.json(employee)
})

export const DELETE = withAuth<Ctx>(async (_req, { params }) => {
  await createEmployeeService().deactivateEmployee(params.id)
  return NextResponse.json({ ok: true })
})
