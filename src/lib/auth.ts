import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import { createUserService } from './services/user'

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/auth/login' },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),

    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const userService = createUserService()
        const user = await userService.findByEmail(credentials.email)
        if (!user || !user.password) return null

        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) return null

        return { id: user.id, email: user.email, name: user.name, role: user.role, farmName: user.farmName }
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const userService = createUserService()
        const existing = await userService.findByEmail(user.email!)
        if (!existing) {
          await userService.createOAuthUser({ name: user.name ?? null, email: user.email! })
        }
      }
      return true
    },

    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.farmName = (user as any).farmName
      }
      // Enrich token from DB on first Google sign-in (role/farmName not in Google profile)
      if (!token.role) {
        const userService = createUserService()
        const dbUser = await userService.findByEmail(token.email!)
        if (dbUser) {
          token.id = dbUser.id
          token.role = dbUser.role
          token.farmName = dbUser.farmName
        }
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.sub ?? token.id
        ;(session.user as any).role = token.role
        ;(session.user as any).farmName = token.farmName
      }
      return session
    },
  },
}
