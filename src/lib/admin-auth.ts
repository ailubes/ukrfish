import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { type User, type UserRole } from '@prisma/client'

const ADMIN_ROLES: UserRole[] = ['ADMIN', 'SUPERADMIN']

function getBootstrapAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

function isAdminRole(role: UserRole): boolean {
  return ADMIN_ROLES.includes(role)
}

export interface AdminContext {
  user: User
}

async function maybePromoteBootstrapAdmin(user: User): Promise<User> {
  const bootstrapEmails = getBootstrapAdminEmails()
  if (
    user.email &&
    bootstrapEmails.includes(user.email.toLowerCase()) &&
    user.role === 'USER'
  ) {
    return prisma.user.update({
      where: { id: user.id },
      data: { role: 'ADMIN' },
    })
  }

  return user
}

export async function getAdminContext(): Promise<{
  kind: 'authorized'
  context: AdminContext
} | {
  kind: 'unauthenticated'
} | {
  kind: 'forbidden'
}> {
  const session = await auth()
  if (!session?.user?.id) {
    return { kind: 'unauthenticated' }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  })

  if (!user) {
    return { kind: 'unauthenticated' }
  }

  const normalizedUser = await maybePromoteBootstrapAdmin(user)
  if (!isAdminRole(normalizedUser.role)) {
    return { kind: 'forbidden' }
  }

  return {
    kind: 'authorized',
    context: { user: normalizedUser },
  }
}

export async function requireAdminPage(callbackPath: string): Promise<AdminContext> {
  const context = await getAdminContext()
  if (context.kind === 'unauthenticated') {
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(callbackPath)}`)
  }
  if (context.kind === 'forbidden') {
    redirect('/?error=admin_forbidden')
  }
  return context.context
}
