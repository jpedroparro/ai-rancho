import { NextResponse } from 'next/server'
import { withAuth, validationError } from '@/lib/api-guard'
import { createEmployeeService } from '@/lib/services/employee'
import { createFarmService } from '@/lib/services/farm'
import { validateEmployee } from '@/lib/validation'

export const GET = withAuth(async (req, _, userId) => {
  const { searchParams } = new URL(req.url)
  const farmIds = await createFarmService().resolveFarmIds(userId, searchParams.get('farmId'))
  return NextResponse.json(await createEmployeeService().getEmployees(farmIds))
})

export const POST = withAuth(async (req, _, userId) => {
  const data = await req.json()
  const check = validateEmployee(data)
  if (!check.ok) return validationError(check.error)

  const farmIds = await createFarmService().resolveFarmIds(userId, data.farmId)
  const farmId = farmIds[0] ?? null

  const employee = await createEmployeeService().createEmployee({ ...data, farmId })
  return NextResponse.json(employee, { status: 201 })
})
