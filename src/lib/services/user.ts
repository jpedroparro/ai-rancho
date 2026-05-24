import { createUserRepository } from '../repositories/user'
import type { IUserRepository } from '../types'

export function createUserService(repo: IUserRepository = createUserRepository()) {
  return {
    findByEmail: (email: string) => repo.findByEmail(email),
    findById: (id: string) => repo.findById(id),

    createCredentialsUser: async (
      data: { name: string; email: string; hashedPassword: string; farmName?: string }
    ) =>
      repo.create({
        name: data.name,
        email: data.email,
        password: data.hashedPassword,
        role: 'ADMIN',
        farmName: data.farmName ?? null,
        provider: 'credentials',
      }),

    createOAuthUser: async (data: { name: string | null; email: string }) =>
      repo.create({
        name: data.name,
        email: data.email,
        password: '',
        role: 'ADMIN',
        farmName: null,
        provider: 'google',
      }),
  }
}
