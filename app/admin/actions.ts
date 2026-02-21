'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { getAdminContext } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

const updateUserRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['USER', 'ADMIN', 'SUPERADMIN']),
})

const updateMembershipStatusSchema = z.object({
  membershipId: z.string().min(1),
  status: z.enum(['PENDING_REVIEW', 'ACTIVE', 'DENIED', 'CANCELED', 'EXPIRED']),
})

const updateMembershipPlanSchema = z.object({
  membershipId: z.string().min(1),
  planCode: z.enum(['start', 'professional', 'investor']),
})

export async function updateUserRoleAction(formData: FormData) {
  const admin = await getAdminContext()
  if (admin.kind !== 'authorized') {
    throw new Error('Unauthorized')
  }

  const parsed = updateUserRoleSchema.safeParse({
    userId: String(formData.get('userId') ?? ''),
    role: String(formData.get('role') ?? ''),
  })

  if (!parsed.success) {
    throw new Error('Invalid role update payload')
  }

  const actor = admin.context.user
  const target = await prisma.user.findUnique({ where: { id: parsed.data.userId } })
  if (!target) {
    throw new Error('User not found')
  }

  if (actor.role !== 'SUPERADMIN' && parsed.data.role === 'SUPERADMIN') {
    throw new Error('Only SUPERADMIN can grant SUPERADMIN role')
  }

  if (actor.role !== 'SUPERADMIN' && target.role === 'SUPERADMIN') {
    throw new Error('Only SUPERADMIN can modify SUPERADMIN users')
  }

  await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { role: parsed.data.role },
  })

  revalidatePath('/admin/users')
}

export async function updateMembershipStatusAction(formData: FormData) {
  const admin = await getAdminContext()
  if (admin.kind !== 'authorized') {
    throw new Error('Unauthorized')
  }

  const parsed = updateMembershipStatusSchema.safeParse({
    membershipId: String(formData.get('membershipId') ?? ''),
    status: String(formData.get('status') ?? ''),
  })

  if (!parsed.success) {
    throw new Error('Invalid membership status payload')
  }

  const membership = await prisma.membership.findUnique({
    where: { id: parsed.data.membershipId },
  })

  if (!membership) {
    throw new Error('Membership not found')
  }

  await prisma.membership.update({
    where: { id: membership.id },
    data: {
      status: parsed.data.status,
      approvedAt: parsed.data.status === 'ACTIVE' ? new Date() : membership.approvedAt,
      approvedById: parsed.data.status === 'ACTIVE' ? admin.context.user.id : membership.approvedById,
      startsAt:
        parsed.data.status === 'ACTIVE' && !membership.startsAt
          ? new Date()
          : membership.startsAt,
    },
  })

  const eventByStatus = {
    PENDING_REVIEW: 'APPLIED',
    ACTIVE: 'APPROVED',
    DENIED: 'DENIED',
    CANCELED: 'CANCELED',
    EXPIRED: 'EXPIRED',
  } as const

  await prisma.membershipEvent.create({
    data: {
      membershipId: membership.id,
      actorId: admin.context.user.id,
      type: eventByStatus[parsed.data.status],
      note: `Статус змінено адміністратором на ${parsed.data.status}`,
    },
  })

  revalidatePath('/admin/memberships')
  revalidatePath('/admin/users')
}

export async function updateMembershipPlanAction(formData: FormData) {
  const admin = await getAdminContext()
  if (admin.kind !== 'authorized') {
    throw new Error('Unauthorized')
  }

  const parsed = updateMembershipPlanSchema.safeParse({
    membershipId: String(formData.get('membershipId') ?? ''),
    planCode: String(formData.get('planCode') ?? ''),
  })

  if (!parsed.success) {
    throw new Error('Invalid membership plan payload')
  }

  const membership = await prisma.membership.findUnique({
    where: { id: parsed.data.membershipId },
  })
  if (!membership) {
    throw new Error('Membership not found')
  }

  const plan = await prisma.membershipPlan.findUnique({
    where: { code: parsed.data.planCode },
  })
  if (!plan) {
    throw new Error('Plan not found')
  }

  await prisma.membership.update({
    where: { id: membership.id },
    data: {
      planId: plan.id,
    },
  })

  await prisma.membershipEvent.create({
    data: {
      membershipId: membership.id,
      actorId: admin.context.user.id,
      type: 'PLAN_CHANGED',
      note: `План змінено адміністратором на ${plan.code}`,
    },
  })

  revalidatePath('/admin/memberships')
  revalidatePath('/admin/users')
}
