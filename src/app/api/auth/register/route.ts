import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createUserService } from '@/lib/services/user'
import { createFarmService } from '@/lib/services/farm'
import { validateRegister } from '@/lib/validation'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const check = validateRegister(body)
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: 422 })

    const { name, email, password, farmName } = body
    const userService = createUserService()

    const existing = await userService.findByEmail(email)
    if (existing) return NextResponse.json({ error: 'Email já cadastrado' }, { status: 409 })

    const hashedPassword = await bcrypt.hash(password, 12)
    const user = await userService.createCredentialsUser({ name, email, hashedPassword, farmName })

    // Auto-create a default farm for the new user
    await createFarmService().createFarm(user.id, {
      name: farmName ?? `Fazenda de ${name ?? email}`,
    })

    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
