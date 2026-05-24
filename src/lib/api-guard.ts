import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from './auth'

type Handler<C = any> = (req: Request, ctx: C) => Promise<Response>
type AuthHandler<C = any> = (req: Request, ctx: C, userId: string) => Promise<Response>

/** Wraps an API route handler requiring a valid session. Returns 401 otherwise. */
export function withAuth<C = any>(handler: AuthHandler<C>): Handler<C> {
  return async (req: Request, ctx: C) => {
    try {
      const session = await getServerSession(authOptions)
      if (!session?.user) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
      }
      const userId = (session.user as any).id as string
      return handler(req, ctx, userId)
    } catch {
      return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
    }
  }
}

/** Returns a 422 Unprocessable Entity response for validation errors. */
export function validationError(message: string): Response {
  return NextResponse.json({ error: message }, { status: 422 })
}

/** Returns a 404 Not Found response. */
export function notFound(): Response {
  return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
}
