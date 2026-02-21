import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function requireAuthUserId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.id ?? null
}

export async function getLatestMembershipForUser(userId: string) {
  return prisma.membership.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      plan: {
        include: {
          features: {
            include: {
              feature: true,
            },
          },
        },
      },
    },
  })
}

export async function userHasFeature(userId: string, featureCode: string): Promise<boolean> {
  const membership = await prisma.membership.findFirst({
    where: {
      userId,
      status: 'ACTIVE',
    },
    orderBy: { createdAt: 'desc' },
    include: {
      plan: {
        include: {
          features: {
            include: { feature: true },
          },
        },
      },
    },
  })

  if (!membership) {
    return false
  }

  return membership.plan.features.some((planFeature) => planFeature.feature.code === featureCode)
}
