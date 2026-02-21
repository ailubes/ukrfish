import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { z } from 'zod'
import { type UserRole } from '@prisma/client'
import { prisma } from './prisma'
import { verifyPassword } from './password'

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
})

const authSecret =
  process.env.AUTH_SECRET ??
  process.env.NEXTAUTH_SECRET ??
  (process.env.NODE_ENV !== 'production' ? 'dev-auth-secret-change-me' : undefined)

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: authSecret,
  trustHost: process.env.AUTH_TRUST_HOST === 'true' || process.env.NODE_ENV !== 'production',
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/auth/signin',
  },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        const parsed = credentialsSchema.safeParse(credentials)
        if (!parsed.success) {
          return null
        }

        const email = parsed.data.email.toLowerCase().trim()
        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user?.passwordHash) {
          return null
        }

        const isValidPassword = await verifyPassword(user.passwordHash, parsed.data.password)
        if (!isValidPassword) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user?.id) {
        token.sub = user.id
      }

      const userRole = (user as { role?: UserRole | null } | undefined)?.role
      if (userRole) {
        token.role = userRole
      } else if (token.sub && !token.role) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true },
        })

        if (dbUser?.role) {
          token.role = dbUser.role
        }
      }

      return token
    },
    session: ({ session, token }) => {
      if (session.user && token.sub) {
        session.user.id = token.sub
      }
      if (session.user && token.role) {
        session.user.role = token.role
      }
      return session
    },
  },
})
