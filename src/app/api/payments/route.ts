import { NextResponse } from 'next/server'
import { withAuth, validationError } from '@/lib/api-guard'
import { createEmployeeService } from '@/lib/services/employee'
import { validatePayment } from '@/lib/validation'

export const GET = withAuth(async () => {
  return NextResponse.json(await createEmployeeService().getPayments())
})

export const POST = withAuth(async (req) => {
  const data = await req.json()
  const check = validatePayment(data)
  if (!check.ok) return validationError(check.error)

  const payment = await createEmployeeService().createPayment(data)
  return NextResponse.json(payment, { status: 201 })
})
