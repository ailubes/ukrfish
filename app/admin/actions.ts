'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { type InvoiceStatus, type MembershipBillingCycle, type PaymentStatus } from '@prisma/client'
import { z } from 'zod'
import { calculateInvoiceAmountMinor } from '@/lib/billing'
import { getAdminContext } from '@/lib/admin-auth'
import { createHutkoCheckoutUrl } from '@/lib/hutko'
import { ensureMembershipInitialInvoice, nextInvoiceNumber } from '@/lib/invoice'
import { listingLimitByPlanCode } from '@/lib/marketplace-access'
import { ensureUniqueOrganizationSlug, profileIsInvoiceReady } from '@/lib/organization'
import { hashPassword } from '@/lib/password'
import { prisma } from '@/lib/prisma'
import { toEnglishSlug } from '@/lib/slug'

const updateUserRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['USER', 'ADMIN', 'SUPERADMIN']),
})

const createUserSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase().trim()),
  name: z.string().trim().min(2).max(120).optional(),
  password: z.string().min(8).max(72),
  role: z.enum(['USER', 'ADMIN', 'SUPERADMIN']),
})

const updateUserDetailsSchema = z.object({
  userId: z.string().min(1),
  email: z.string().email().transform((value) => value.toLowerCase().trim()),
  name: z.string().trim().min(2).max(120).optional(),
  password: z.string().trim().optional(),
})

const archiveUserSchema = z.object({
  userId: z.string().min(1),
})

const bulkUserRoleSchema = z.object({
  role: z.enum(['USER', 'ADMIN', 'SUPERADMIN']),
})

const updateMembershipStatusSchema = z.object({
  membershipId: z.string().min(1),
  status: z.enum(['PENDING_REVIEW', 'ACTIVE', 'DENIED', 'CANCELED', 'EXPIRED']),
})

const updateMembershipPlanSchema = z.object({
  membershipId: z.string().min(1),
  planCode: z.string().trim().regex(/^[a-z0-9-]{2,40}$/),
})

const updatePlanDetailsSchema = z.object({
  planCode: z.string().trim().regex(/^[a-z0-9-]{2,40}$/),
  name: z.string().min(2).max(120),
  description: z.string().min(2).max(300),
  monthlyPriceUah: z.coerce.number().int().min(0).max(500000),
  yearlyFreeMonths: z.coerce.number().int().min(0).max(11),
  organizationUserLimit: z.coerce.number().int().min(1).max(1000),
  isActive: z.boolean(),
})

const createPlanSchema = z.object({
  code: z.string().trim().regex(/^[a-z0-9-]{2,40}$/),
  name: z.string().min(2).max(120),
  description: z.string().min(2).max(300),
  monthlyPriceUah: z.coerce.number().int().min(0).max(500000),
  yearlyFreeMonths: z.coerce.number().int().min(0).max(11),
  organizationUserLimit: z.coerce.number().int().min(1).max(1000),
  isActive: z.boolean(),
})

const planCodeSchema = z.object({
  planCode: z.string().trim().regex(/^[a-z0-9-]{2,40}$/),
})

const createInvoiceSchema = z.object({
  membershipId: z.string().min(1),
  billingCycle: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']),
  dueAt: z.string().min(1),
  note: z.string().max(1000).optional(),
  type: z.enum(['MEMBERSHIP_FEE', 'ADJUSTMENT', 'PENALTY', 'OTHER']).default('MEMBERSHIP_FEE'),
})

const simpleInvoiceSchema = z.object({
  invoiceId: z.string().min(1),
})

const recordPaymentSchema = z.object({
  invoiceId: z.string().min(1),
  amountUah: z.coerce.number().positive().max(100000000),
  method: z.enum(['BANK_TRANSFER', 'CARD', 'CASHLESS', 'OTHER']),
  paidAt: z.string().min(1),
  payerReference: z.string().max(200).optional(),
  proofNote: z.string().max(2000).optional(),
})

const paymentDecisionSchema = z.object({
  paymentId: z.string().min(1),
  note: z.string().max(1000).optional(),
})

const verifyOrganizationSchema = z.object({
  organizationId: z.string().min(1),
})

const listingStatusSchema = z.object({
  listingId: z.string().min(1),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
})

const restoreMarketplaceOrgSchema = z.object({
  organizationId: z.string().min(1),
})

const createOrganizationSchema = z.object({
  name: z.string().trim().min(2).max(200),
  slug: z.string().trim().regex(/^[a-z0-9-]{2,80}$/),
  legalName: z.string().trim().max(200).optional(),
  edrpou: z.string().trim().regex(/^\d{8,10}$/),
  legalAddress: z.string().trim().min(5).max(500),
  iban: z.string().trim().regex(/^[A-Z]{2}[0-9A-Z]{13,32}$/),
  bankName: z.string().trim().min(2).max(200),
  contactEmail: z.string().trim().email().optional(),
  contactPhone: z.string().trim().max(50).optional(),
  websiteUrl: z.string().trim().url().optional(),
  isPublicProfile: z.boolean().default(false),
  isPublicContacts: z.boolean().default(false),
  isPublicMarketplace: z.boolean().default(false),
})

const createMembershipSchema = z.object({
  userId: z.string().min(1),
  organizationId: z.string().optional(),
  planCode: z.string().trim().regex(/^[a-z0-9-]{2,40}$/),
  status: z.enum(['PENDING_REVIEW', 'ACTIVE', 'DENIED', 'CANCELED', 'EXPIRED']),
  billingCycle: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']).optional(),
})

function normalizeInvoiceStatus(current: InvoiceStatus, paidMinor: number, amountMinor: number): InvoiceStatus {
  if (current === 'CANCELED' || current === 'VOID') {
    return current
  }

  if (paidMinor >= amountMinor && amountMinor > 0) {
    return 'PAID'
  }

  if (paidMinor > 0) {
    return 'PARTIALLY_PAID'
  }

  return 'ISSUED'
}

async function recalculateInvoiceFromConfirmedPayments(invoiceId: string): Promise<void> {
  const [invoice, confirmedAgg] = await Promise.all([
    prisma.invoice.findUnique({ where: { id: invoiceId } }),
    prisma.payment.aggregate({
      where: { invoiceId, status: 'CONFIRMED' },
      _sum: { amountMinor: true },
    }),
  ])

  if (!invoice) {
    return
  }

  const paidMinor = confirmedAgg._sum.amountMinor ?? 0
  const nextStatus = normalizeInvoiceStatus(invoice.status, paidMinor, invoice.amountMinor)

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      paidMinor,
      status: nextStatus,
      paidAt: nextStatus === 'PAID' ? new Date() : null,
    },
  })
}

async function countActiveSuperadmins(): Promise<number> {
  return prisma.user.count({
    where: {
      role: 'SUPERADMIN',
      deletedAt: null,
    },
  })
}

function normalizeReturnTo(rawReturnTo: FormDataEntryValue | null, fallbackPath: '/admin/users' | '/admin/roles'): string {
  const candidate = String(rawReturnTo ?? '').trim()
  if (!candidate) {
    return fallbackPath
  }

  if (!candidate.startsWith('/admin/users') && !candidate.startsWith('/admin/roles')) {
    return fallbackPath
  }

  return candidate
}

function withFlash(path: string, key: 'notice' | 'error', message: string): string {
  const [pathname, queryString = ''] = path.split('?')
  const params = new URLSearchParams(queryString)
  params.set(key, message)
  const qs = params.toString()
  return qs ? `${pathname}?${qs}` : pathname
}

function selectedUserIds(formData: FormData): string[] {
  const values = formData
    .getAll('userIds')
    .map((value) => String(value).trim())
    .filter(Boolean)

  return Array.from(new Set(values))
}

function rethrowIfRedirect(error: unknown): void {
  if (
    typeof error === 'object' &&
    error !== null &&
    'digest' in error &&
    String((error as { digest: unknown }).digest).startsWith('NEXT_REDIRECT')
  ) {
    throw error
  }
}

export async function updateUserRoleAction(formData: FormData) {
  const returnTo = normalizeReturnTo(formData.get('returnTo'), '/admin/users')

  try {
    const admin = await getAdminContext()
    if (admin.kind !== 'authorized') {
      redirect(withFlash(returnTo, 'error', 'Unauthorized'))
    }

    const parsed = updateUserRoleSchema.safeParse({
      userId: String(formData.get('userId') ?? ''),
      role: String(formData.get('role') ?? ''),
    })

    if (!parsed.success) {
      redirect(withFlash(returnTo, 'error', 'Invalid role update payload'))
    }

    const actor = admin.context.user
    const target = await prisma.user.findUnique({ where: { id: parsed.data.userId } })
    if (!target) {
      redirect(withFlash(returnTo, 'error', 'User not found'))
    }

    if (target.deletedAt) {
      redirect(withFlash(returnTo, 'error', 'Cannot modify archived user role'))
    }

    if (actor.role !== 'SUPERADMIN' && parsed.data.role === 'SUPERADMIN') {
      redirect(withFlash(returnTo, 'error', 'Only SUPERADMIN can grant SUPERADMIN role'))
    }

    if (actor.role !== 'SUPERADMIN' && target.role === 'SUPERADMIN') {
      redirect(withFlash(returnTo, 'error', 'Only SUPERADMIN can modify SUPERADMIN users'))
    }

    if (target.role === 'SUPERADMIN' && parsed.data.role !== 'SUPERADMIN') {
      const superadmins = await countActiveSuperadmins()
      if (superadmins <= 1) {
        redirect(withFlash(returnTo, 'error', 'Cannot remove role from the last active SUPERADMIN'))
      }
    }

    await prisma.user.update({
      where: { id: parsed.data.userId },
      data: { role: parsed.data.role },
    })

    revalidatePath('/admin/users')
    revalidatePath('/admin/roles')
    redirect(withFlash(returnTo, 'notice', 'Роль користувача оновлено'))
  } catch (error) {
    rethrowIfRedirect(error)
    const message = error instanceof Error ? error.message : 'Failed to update user role'
    redirect(withFlash(returnTo, 'error', message))
  }
}

export async function createUserAction(formData: FormData) {
  const returnTo = normalizeReturnTo(formData.get('returnTo'), '/admin/users')

  try {
    const admin = await getAdminContext()
    if (admin.kind !== 'authorized') {
      redirect(withFlash(returnTo, 'error', 'Unauthorized'))
    }

    const parsed = createUserSchema.safeParse({
      email: String(formData.get('email') ?? ''),
      name: String(formData.get('name') ?? '').trim() || undefined,
      password: String(formData.get('password') ?? ''),
      role: String(formData.get('role') ?? ''),
    })

    if (!parsed.success) {
      redirect(withFlash(returnTo, 'error', 'Invalid user payload'))
    }

    if (parsed.data.role === 'SUPERADMIN' && admin.context.user.role !== 'SUPERADMIN') {
      redirect(withFlash(returnTo, 'error', 'Only SUPERADMIN can create SUPERADMIN users'))
    }

    const existing = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    })

    const passwordHash = await hashPassword(parsed.data.password)

    if (existing && !existing.deletedAt) {
      redirect(withFlash(returnTo, 'error', 'User with this email already exists'))
    }

    if (existing && existing.deletedAt) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          email: parsed.data.email,
          name: parsed.data.name ?? null,
          passwordHash,
          role: parsed.data.role,
          deletedAt: null,
        },
      })
    } else {
      await prisma.user.create({
        data: {
          email: parsed.data.email,
          name: parsed.data.name ?? null,
          passwordHash,
          role: parsed.data.role,
        },
      })
    }

    revalidatePath('/admin/users')
    revalidatePath('/admin/roles')
    redirect(withFlash(returnTo, 'notice', 'Користувача створено'))
  } catch (error) {
    rethrowIfRedirect(error)
    const message = error instanceof Error ? error.message : 'Failed to create user'
    redirect(withFlash(returnTo, 'error', message))
  }
}

export async function updateUserDetailsAction(formData: FormData) {
  const returnTo = normalizeReturnTo(formData.get('returnTo'), '/admin/users')

  try {
    const admin = await getAdminContext()
    if (admin.kind !== 'authorized') {
      redirect(withFlash(returnTo, 'error', 'Unauthorized'))
    }

    const parsed = updateUserDetailsSchema.safeParse({
      userId: String(formData.get('userId') ?? ''),
      email: String(formData.get('email') ?? ''),
      name: String(formData.get('name') ?? '').trim() || undefined,
      password: String(formData.get('password') ?? '').trim() || undefined,
    })

    if (!parsed.success) {
      redirect(withFlash(returnTo, 'error', 'Invalid user update payload'))
    }

    const target = await prisma.user.findUnique({ where: { id: parsed.data.userId } })
    if (!target) {
      redirect(withFlash(returnTo, 'error', 'User not found'))
    }

    if (target.deletedAt) {
      redirect(withFlash(returnTo, 'error', 'Cannot update archived user'))
    }

    if (admin.context.user.role !== 'SUPERADMIN' && target.role === 'SUPERADMIN') {
      redirect(withFlash(returnTo, 'error', 'Only SUPERADMIN can modify SUPERADMIN users'))
    }

    const emailOwner = await prisma.user.findUnique({
      where: { email: parsed.data.email },
      select: { id: true },
    })

    if (emailOwner && emailOwner.id !== target.id) {
      redirect(withFlash(returnTo, 'error', 'Email is already used by another user'))
    }

    const passwordHash = parsed.data.password ? await hashPassword(parsed.data.password) : undefined

    await prisma.user.update({
      where: { id: target.id },
      data: {
        email: parsed.data.email,
        name: parsed.data.name ?? null,
        ...(passwordHash ? { passwordHash } : {}),
      },
    })

    revalidatePath('/admin/users')
    revalidatePath('/admin/roles')
    redirect(withFlash(returnTo, 'notice', 'Профіль користувача оновлено'))
  } catch (error) {
    rethrowIfRedirect(error)
    const message = error instanceof Error ? error.message : 'Failed to update user'
    redirect(withFlash(returnTo, 'error', message))
  }
}

export async function archiveUserAction(formData: FormData) {
  const returnTo = normalizeReturnTo(formData.get('returnTo'), '/admin/users')

  try {
    const admin = await getAdminContext()
    if (admin.kind !== 'authorized') {
      redirect(withFlash(returnTo, 'error', 'Unauthorized'))
    }

    const parsed = archiveUserSchema.safeParse({
      userId: String(formData.get('userId') ?? ''),
    })

    if (!parsed.success) {
      redirect(withFlash(returnTo, 'error', 'Invalid user id'))
    }

    const actor = admin.context.user
    const target = await prisma.user.findUnique({ where: { id: parsed.data.userId } })
    if (!target) {
      redirect(withFlash(returnTo, 'error', 'User not found'))
    }

    if (target.deletedAt) {
      redirect(withFlash(returnTo, 'notice', 'Користувач уже архівований'))
    }

    if (target.id === actor.id) {
      redirect(withFlash(returnTo, 'error', 'You cannot archive your own account'))
    }

    if (actor.role !== 'SUPERADMIN') {
      redirect(withFlash(returnTo, 'error', 'Only SUPERADMIN can archive users'))
    }

    if (target.role === 'SUPERADMIN') {
      const superadmins = await countActiveSuperadmins()
      if (superadmins <= 1) {
        redirect(withFlash(returnTo, 'error', 'Cannot archive the last active SUPERADMIN'))
      }
    }

    await prisma.$transaction([
      prisma.session.deleteMany({ where: { userId: target.id } }),
      prisma.account.deleteMany({ where: { userId: target.id } }),
      prisma.user.update({
        where: { id: target.id },
        data: {
          deletedAt: new Date(),
          role: 'USER',
        },
      }),
    ])

    revalidatePath('/admin/users')
    revalidatePath('/admin/roles')
    redirect(withFlash(returnTo, 'notice', 'Користувача архівовано'))
  } catch (error) {
    rethrowIfRedirect(error)
    const message = error instanceof Error ? error.message : 'Failed to archive user'
    redirect(withFlash(returnTo, 'error', message))
  }
}

export async function restoreUserAction(formData: FormData) {
  const returnTo = normalizeReturnTo(formData.get('returnTo'), '/admin/users')

  try {
    const admin = await getAdminContext()
    if (admin.kind !== 'authorized') {
      redirect(withFlash(returnTo, 'error', 'Unauthorized'))
    }

    if (admin.context.user.role !== 'SUPERADMIN') {
      redirect(withFlash(returnTo, 'error', 'Only SUPERADMIN can restore users'))
    }

    const parsed = archiveUserSchema.safeParse({
      userId: String(formData.get('userId') ?? ''),
    })

    if (!parsed.success) {
      redirect(withFlash(returnTo, 'error', 'Invalid user id'))
    }

    const target = await prisma.user.findUnique({ where: { id: parsed.data.userId } })
    if (!target) {
      redirect(withFlash(returnTo, 'error', 'User not found'))
    }

    await prisma.user.update({
      where: { id: target.id },
      data: {
        deletedAt: null,
      },
    })

    revalidatePath('/admin/users')
    revalidatePath('/admin/roles')
    redirect(withFlash(returnTo, 'notice', 'Користувача відновлено'))
  } catch (error) {
    rethrowIfRedirect(error)
    const message = error instanceof Error ? error.message : 'Failed to restore user'
    redirect(withFlash(returnTo, 'error', message))
  }
}

export async function bulkUpdateUserRoleAction(formData: FormData) {
  const returnTo = normalizeReturnTo(formData.get('returnTo'), '/admin/users')

  try {
    const admin = await getAdminContext()
    if (admin.kind !== 'authorized') {
      redirect(withFlash(returnTo, 'error', 'Unauthorized'))
    }

    const parsed = bulkUserRoleSchema.safeParse({
      role: String(formData.get('role') ?? ''),
    })
    if (!parsed.success) {
      redirect(withFlash(returnTo, 'error', 'Invalid target role'))
    }

    const ids = selectedUserIds(formData)
    if (ids.length === 0) {
      redirect(withFlash(returnTo, 'error', 'No users selected'))
    }

    const users = await prisma.user.findMany({ where: { id: { in: ids } } })
    if (users.length === 0) {
      redirect(withFlash(returnTo, 'error', 'No users found for bulk update'))
    }

    if (admin.context.user.role !== 'SUPERADMIN') {
      if (parsed.data.role === 'SUPERADMIN') {
        redirect(withFlash(returnTo, 'error', 'Only SUPERADMIN can grant SUPERADMIN role'))
      }
      if (users.some((user) => user.role === 'SUPERADMIN')) {
        redirect(withFlash(returnTo, 'error', 'Only SUPERADMIN can modify SUPERADMIN users'))
      }
    }

    if (parsed.data.role !== 'SUPERADMIN') {
      const superadminsToDemote = users.filter((user) => !user.deletedAt && user.role === 'SUPERADMIN').length
      if (superadminsToDemote > 0) {
        const totalSuperadmins = await countActiveSuperadmins()
        if (totalSuperadmins - superadminsToDemote < 1) {
          redirect(withFlash(returnTo, 'error', 'Cannot remove role from the last active SUPERADMIN'))
        }
      }
    }

    await prisma.user.updateMany({
      where: {
        id: { in: ids },
        deletedAt: null,
      },
      data: {
        role: parsed.data.role,
      },
    })

    revalidatePath('/admin/users')
    revalidatePath('/admin/roles')
    redirect(withFlash(returnTo, 'notice', 'Роль оновлено для вибраних користувачів'))
  } catch (error) {
    rethrowIfRedirect(error)
    const message = error instanceof Error ? error.message : 'Failed to bulk update roles'
    redirect(withFlash(returnTo, 'error', message))
  }
}

export async function bulkArchiveUsersAction(formData: FormData) {
  const returnTo = normalizeReturnTo(formData.get('returnTo'), '/admin/users')

  try {
    const admin = await getAdminContext()
    if (admin.kind !== 'authorized') {
      redirect(withFlash(returnTo, 'error', 'Unauthorized'))
    }
    if (admin.context.user.role !== 'SUPERADMIN') {
      redirect(withFlash(returnTo, 'error', 'Only SUPERADMIN can archive users'))
    }

    const ids = selectedUserIds(formData)
    if (ids.length === 0) {
      redirect(withFlash(returnTo, 'error', 'No users selected'))
    }

    const users = await prisma.user.findMany({ where: { id: { in: ids } } })
    const activeUsers = users.filter((user) => !user.deletedAt)
    if (activeUsers.length === 0) {
      redirect(withFlash(returnTo, 'error', 'No active users selected'))
    }

    if (activeUsers.some((user) => user.id === admin.context.user.id)) {
      redirect(withFlash(returnTo, 'error', 'You cannot archive your own account'))
    }

    const superadminsToArchive = activeUsers.filter((user) => user.role === 'SUPERADMIN').length
    if (superadminsToArchive > 0) {
      const totalSuperadmins = await countActiveSuperadmins()
      if (totalSuperadmins - superadminsToArchive < 1) {
        redirect(withFlash(returnTo, 'error', 'Cannot archive the last active SUPERADMIN'))
      }
    }

    await prisma.$transaction([
      prisma.session.deleteMany({ where: { userId: { in: activeUsers.map((user) => user.id) } } }),
      prisma.account.deleteMany({ where: { userId: { in: activeUsers.map((user) => user.id) } } }),
      prisma.user.updateMany({
        where: { id: { in: activeUsers.map((user) => user.id) } },
        data: {
          deletedAt: new Date(),
          role: 'USER',
        },
      }),
    ])

    revalidatePath('/admin/users')
    revalidatePath('/admin/roles')
    redirect(withFlash(returnTo, 'notice', 'Вибраних користувачів архівовано'))
  } catch (error) {
    rethrowIfRedirect(error)
    const message = error instanceof Error ? error.message : 'Failed to bulk archive users'
    redirect(withFlash(returnTo, 'error', message))
  }
}

export async function bulkRestoreUsersAction(formData: FormData) {
  const returnTo = normalizeReturnTo(formData.get('returnTo'), '/admin/users')

  try {
    const admin = await getAdminContext()
    if (admin.kind !== 'authorized') {
      redirect(withFlash(returnTo, 'error', 'Unauthorized'))
    }
    if (admin.context.user.role !== 'SUPERADMIN') {
      redirect(withFlash(returnTo, 'error', 'Only SUPERADMIN can restore users'))
    }

    const ids = selectedUserIds(formData)
    if (ids.length === 0) {
      redirect(withFlash(returnTo, 'error', 'No users selected'))
    }

    await prisma.user.updateMany({
      where: {
        id: { in: ids },
        deletedAt: { not: null },
      },
      data: {
        deletedAt: null,
      },
    })

    revalidatePath('/admin/users')
    revalidatePath('/admin/roles')
    redirect(withFlash(returnTo, 'notice', 'Вибраних користувачів відновлено'))
  } catch (error) {
    rethrowIfRedirect(error)
    const message = error instanceof Error ? error.message : 'Failed to bulk restore users'
    redirect(withFlash(returnTo, 'error', message))
  }
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
    include: {
      organization: true,
    },
  })

  if (!membership) {
    throw new Error('Membership not found')
  }

  if (parsed.data.status === 'ACTIVE') {
    if (!membership.organization) {
      throw new Error('Cannot activate membership without organization profile')
    }

    if (!profileIsInvoiceReady(membership.organization)) {
      throw new Error('Organization profile is incomplete for invoicing')
    }
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

  if (parsed.data.status === 'ACTIVE') {
    await ensureMembershipInitialInvoice({
      membershipId: membership.id,
      actorId: admin.context.user.id,
      note: 'Автоматично сформовано після погодження заявки адміністратором.',
    })
  }

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
  if (!plan || plan.deletedAt || !plan.isActive) {
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

export async function updateMembershipPlanDetailsAction(formData: FormData) {
  const admin = await getAdminContext()
  if (admin.kind !== 'authorized') {
    throw new Error('Unauthorized')
  }

  const parsed = updatePlanDetailsSchema.safeParse({
    planCode: String(formData.get('planCode') ?? ''),
    name: String(formData.get('name') ?? ''),
    description: String(formData.get('description') ?? ''),
    monthlyPriceUah: formData.get('monthlyPriceUah'),
    yearlyFreeMonths: formData.get('yearlyFreeMonths'),
    organizationUserLimit: formData.get('organizationUserLimit'),
    isActive: formData.get('isActive') === 'on',
  })

  if (!parsed.success) {
    throw new Error('Invalid plan payload')
  }

  const existingPlan = await prisma.membershipPlan.findUnique({
    where: { code: parsed.data.planCode },
  })

  if (!existingPlan) {
    throw new Error('Plan not found')
  }

  await prisma.membershipPlan.update({
    where: { id: existingPlan.id },
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      monthlyPriceUah: parsed.data.monthlyPriceUah,
      yearlyFreeMonths: parsed.data.yearlyFreeMonths,
      organizationUserLimit: parsed.data.organizationUserLimit,
      isActive: parsed.data.isActive,
    },
  })

  revalidatePath('/admin/plans')
  revalidatePath('/admin/memberships')
}

export async function createMembershipPlanAction(formData: FormData) {
  const admin = await getAdminContext()
  if (admin.kind !== 'authorized') {
    throw new Error('Unauthorized')
  }

  const parsed = createPlanSchema.safeParse({
    code: String(formData.get('code') ?? ''),
    name: String(formData.get('name') ?? ''),
    description: String(formData.get('description') ?? ''),
    monthlyPriceUah: formData.get('monthlyPriceUah'),
    yearlyFreeMonths: formData.get('yearlyFreeMonths'),
    organizationUserLimit: formData.get('organizationUserLimit'),
    isActive: formData.get('isActive') === 'on',
  })

  if (!parsed.success) {
    throw new Error('Invalid plan payload')
  }

  const existingPlan = await prisma.membershipPlan.findUnique({
    where: { code: parsed.data.code },
  })

  if (!existingPlan) {
    await prisma.membershipPlan.create({
      data: {
        code: parsed.data.code,
        name: parsed.data.name,
        description: parsed.data.description,
        monthlyPriceUah: parsed.data.monthlyPriceUah,
        yearlyFreeMonths: parsed.data.yearlyFreeMonths,
        organizationUserLimit: parsed.data.organizationUserLimit,
        isActive: parsed.data.isActive,
      },
    })
  } else if (existingPlan.deletedAt) {
    await prisma.membershipPlan.update({
      where: { id: existingPlan.id },
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        monthlyPriceUah: parsed.data.monthlyPriceUah,
        yearlyFreeMonths: parsed.data.yearlyFreeMonths,
        organizationUserLimit: parsed.data.organizationUserLimit,
        isActive: parsed.data.isActive,
        deletedAt: null,
      },
    })
  } else {
    throw new Error('Plan code already exists')
  }

  revalidatePath('/admin/plans')
  revalidatePath('/admin/memberships')
}

export async function archiveMembershipPlanAction(formData: FormData) {
  const admin = await getAdminContext()
  if (admin.kind !== 'authorized') {
    throw new Error('Unauthorized')
  }

  const parsed = planCodeSchema.safeParse({
    planCode: String(formData.get('planCode') ?? ''),
  })

  if (!parsed.success) {
    throw new Error('Invalid plan code')
  }

  const existingPlan = await prisma.membershipPlan.findUnique({
    where: { code: parsed.data.planCode },
  })

  if (!existingPlan) {
    throw new Error('Plan not found')
  }

  await prisma.membershipPlan.update({
    where: { id: existingPlan.id },
    data: {
      isActive: false,
      deletedAt: new Date(),
    },
  })

  revalidatePath('/admin/plans')
  revalidatePath('/admin/memberships')
}

export async function restoreMembershipPlanAction(formData: FormData) {
  const admin = await getAdminContext()
  if (admin.kind !== 'authorized') {
    throw new Error('Unauthorized')
  }

  const parsed = planCodeSchema.safeParse({
    planCode: String(formData.get('planCode') ?? ''),
  })

  if (!parsed.success) {
    throw new Error('Invalid plan code')
  }

  const existingPlan = await prisma.membershipPlan.findUnique({
    where: { code: parsed.data.planCode },
  })

  if (!existingPlan) {
    throw new Error('Plan not found')
  }

  await prisma.membershipPlan.update({
    where: { id: existingPlan.id },
    data: {
      deletedAt: null,
      isActive: true,
    },
  })

  revalidatePath('/admin/plans')
  revalidatePath('/admin/memberships')
}

export async function createInvoiceAction(formData: FormData) {
  const admin = await getAdminContext()
  if (admin.kind !== 'authorized') {
    throw new Error('Unauthorized')
  }

  const parsed = createInvoiceSchema.safeParse({
    membershipId: String(formData.get('membershipId') ?? ''),
    billingCycle: String(formData.get('billingCycle') ?? ''),
    dueAt: String(formData.get('dueAt') ?? ''),
    note: String(formData.get('note') ?? ''),
    type: String(formData.get('type') ?? 'MEMBERSHIP_FEE'),
  })

  if (!parsed.success) {
    throw new Error('Invalid invoice payload')
  }

  const membership = await prisma.membership.findUnique({
    where: { id: parsed.data.membershipId },
    include: { plan: true },
  })

  if (!membership) {
    throw new Error('Membership not found')
  }

  const cycle = parsed.data.billingCycle as MembershipBillingCycle
  const amountMinor = calculateInvoiceAmountMinor(
    membership.plan.monthlyPriceUah,
    cycle,
    membership.plan.yearlyFreeMonths,
  )
  const number = await nextInvoiceNumber()

  const invoice = await prisma.invoice.create({
    data: {
      number,
      status: 'ISSUED',
      type: parsed.data.type,
      userId: membership.userId,
      membershipId: membership.id,
      organizationId: membership.organizationId,
      billingCycle: cycle,
      amountMinor,
      dueAt: new Date(parsed.data.dueAt),
      issuedAt: new Date(),
      note: parsed.data.note || null,
      createdById: admin.context.user.id,
    },
  })

  await prisma.billingEvent.create({
    data: {
      invoiceId: invoice.id,
      actorId: admin.context.user.id,
      type: 'INVOICE_CREATED',
      note: `Створено рахунок ${number}`,
    },
  })

  revalidatePath('/admin/invoices')
  revalidatePath('/admin/users')
}

export async function cancelInvoiceAction(formData: FormData) {
  const admin = await getAdminContext()
  if (admin.kind !== 'authorized') {
    throw new Error('Unauthorized')
  }

  const parsed = simpleInvoiceSchema.safeParse({
    invoiceId: String(formData.get('invoiceId') ?? ''),
  })

  if (!parsed.success) {
    throw new Error('Invalid invoice id')
  }

  const invoice = await prisma.invoice.findUnique({ where: { id: parsed.data.invoiceId } })
  if (!invoice) {
    throw new Error('Invoice not found')
  }

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      status: 'CANCELED',
      updatedById: admin.context.user.id,
    },
  })

  await prisma.billingEvent.create({
    data: {
      invoiceId: invoice.id,
      actorId: admin.context.user.id,
      type: 'INVOICE_CANCELED',
      note: 'Рахунок скасовано адміністратором',
    },
  })

  revalidatePath('/admin/invoices')
}

export async function issueInvoiceViaHutkoAction(formData: FormData) {
  const admin = await getAdminContext()
  if (admin.kind !== 'authorized') {
    throw new Error('Unauthorized')
  }

  const parsed = simpleInvoiceSchema.safeParse({
    invoiceId: String(formData.get('invoiceId') ?? ''),
  })

  if (!parsed.success) {
    throw new Error('Invalid invoice id')
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: parsed.data.invoiceId },
    include: {
      user: true,
      membership: {
        include: {
          plan: true,
        },
      },
    },
  })

  if (!invoice) {
    throw new Error('Invoice not found')
  }

  if (invoice.status === 'CANCELED' || invoice.status === 'VOID') {
    throw new Error('Canceled or void invoice cannot be issued')
  }

  const outstandingMinor = Math.max(0, invoice.amountMinor - invoice.paidMinor)
  if (outstandingMinor <= 0) {
    throw new Error('Invoice is already fully paid')
  }

  const callbackUrl = process.env.HUTKO_CALLBACK_URL?.trim()
  if (!callbackUrl) {
    throw new Error('Missing required env: HUTKO_CALLBACK_URL')
  }

  const responseUrl = process.env.HUTKO_RESPONSE_URL?.trim()
  if (!responseUrl) {
    throw new Error('Missing required env: HUTKO_RESPONSE_URL')
  }

  const orderId = `${invoice.number}-${Date.now()}`
  const orderDesc = `Invoice ${invoice.number}`
  const merchantData = JSON.stringify({
    invoiceId: invoice.id,
    userId: invoice.userId,
    membershipId: invoice.membershipId,
  })

  const hutko = await createHutkoCheckoutUrl({
    order_id: orderId,
    order_desc: orderDesc,
    amount: outstandingMinor,
    currency: invoice.currency,
    response_url: responseUrl,
    server_callback_url: callbackUrl,
    merchant_data: merchantData,
    required_rectoken: 'Y',
  })

  const existingMetadata =
    invoice.metadata && typeof invoice.metadata === 'object' && !Array.isArray(invoice.metadata)
      ? (invoice.metadata as Record<string, unknown>)
      : {}

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: {
      metadata: {
        ...existingMetadata,
        hutko: {
          checkoutUrl: hutko.checkoutUrl,
          paymentId: hutko.paymentId,
          orderId,
          amountMinor: outstandingMinor,
          issuedAt: new Date().toISOString(),
        },
        paymentUrl: hutko.checkoutUrl,
      },
      updatedById: admin.context.user.id,
      status: invoice.status === 'DRAFT' ? 'ISSUED' : invoice.status,
      issuedAt: invoice.issuedAt ?? new Date(),
    },
  })

  await prisma.billingEvent.create({
    data: {
      invoiceId: invoice.id,
      actorId: admin.context.user.id,
      type: 'INVOICE_ISSUED',
      note: `Hutko checkout issued: ${hutko.checkoutUrl}`,
    },
  })

  revalidatePath('/admin/invoices')
}

export async function recordPaymentAction(formData: FormData) {
  const admin = await getAdminContext()
  if (admin.kind !== 'authorized') {
    throw new Error('Unauthorized')
  }

  const parsed = recordPaymentSchema.safeParse({
    invoiceId: String(formData.get('invoiceId') ?? ''),
    amountUah: formData.get('amountUah'),
    method: String(formData.get('method') ?? ''),
    paidAt: String(formData.get('paidAt') ?? ''),
    payerReference: String(formData.get('payerReference') ?? ''),
    proofNote: String(formData.get('proofNote') ?? ''),
  })

  if (!parsed.success) {
    throw new Error('Invalid payment payload')
  }

  const invoice = await prisma.invoice.findUnique({ where: { id: parsed.data.invoiceId } })
  if (!invoice) {
    throw new Error('Invoice not found')
  }

  const payment = await prisma.payment.create({
    data: {
      invoiceId: invoice.id,
      status: 'PENDING',
      method: parsed.data.method,
      amountMinor: Math.round(parsed.data.amountUah * 100),
      paidAt: new Date(parsed.data.paidAt),
      payerReference: parsed.data.payerReference || null,
      proofNote: parsed.data.proofNote || null,
    },
  })

  await prisma.billingEvent.create({
    data: {
      invoiceId: invoice.id,
      paymentId: payment.id,
      actorId: admin.context.user.id,
      type: 'PAYMENT_RECORDED',
      note: 'Платіж додано та очікує верифікації',
    },
  })

  revalidatePath('/admin/payments')
  revalidatePath('/admin/invoices')
}

async function resolvePaymentDecision(
  paymentId: string,
  status: Extract<PaymentStatus, 'CONFIRMED' | 'REJECTED'>,
  actorId: string,
  note?: string,
): Promise<void> {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } })
  if (!payment) {
    throw new Error('Payment not found')
  }

  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status,
      confirmedAt: status === 'CONFIRMED' ? new Date() : payment.confirmedAt,
      confirmedById: status === 'CONFIRMED' ? actorId : payment.confirmedById,
    },
  })

  await prisma.billingEvent.create({
    data: {
      invoiceId: payment.invoiceId,
      paymentId: payment.id,
      actorId,
      type: status === 'CONFIRMED' ? 'PAYMENT_CONFIRMED' : 'PAYMENT_REJECTED',
      note: note || (status === 'CONFIRMED' ? 'Платіж підтверджено адміністратором' : 'Платіж відхилено адміністратором'),
    },
  })

  await recalculateInvoiceFromConfirmedPayments(payment.invoiceId)
}

export async function confirmPaymentAction(formData: FormData) {
  const admin = await getAdminContext()
  if (admin.kind !== 'authorized') {
    throw new Error('Unauthorized')
  }

  const parsed = paymentDecisionSchema.safeParse({
    paymentId: String(formData.get('paymentId') ?? ''),
    note: String(formData.get('note') ?? ''),
  })

  if (!parsed.success) {
    throw new Error('Invalid payment approval payload')
  }

  await resolvePaymentDecision(parsed.data.paymentId, 'CONFIRMED', admin.context.user.id, parsed.data.note)

  revalidatePath('/admin/payments')
  revalidatePath('/admin/invoices')
}

export async function rejectPaymentAction(formData: FormData) {
  const admin = await getAdminContext()
  if (admin.kind !== 'authorized') {
    throw new Error('Unauthorized')
  }

  const parsed = paymentDecisionSchema.safeParse({
    paymentId: String(formData.get('paymentId') ?? ''),
    note: String(formData.get('note') ?? ''),
  })

  if (!parsed.success) {
    throw new Error('Invalid payment rejection payload')
  }

  await resolvePaymentDecision(parsed.data.paymentId, 'REJECTED', admin.context.user.id, parsed.data.note)

  revalidatePath('/admin/payments')
  revalidatePath('/admin/invoices')
}

export async function verifyOrganizationProfileAction(formData: FormData) {
  const admin = await getAdminContext()
  if (admin.kind !== 'authorized') {
    throw new Error('Unauthorized')
  }

  const parsed = verifyOrganizationSchema.safeParse({
    organizationId: String(formData.get('organizationId') ?? ''),
  })

  if (!parsed.success) {
    throw new Error('Invalid organization payload')
  }

  const organization = await prisma.organization.findUnique({ where: { id: parsed.data.organizationId } })
  if (!organization) {
    throw new Error('Organization not found')
  }

  await prisma.organization.update({
    where: { id: organization.id },
    data: {
      profileStatus: 'VERIFIED',
      approvedAt: new Date(),
      approvedById: admin.context.user.id,
    },
  })

  revalidatePath('/admin/organizations')
  revalidatePath('/admin/memberships')
}

export async function setMarketplaceListingStatusAction(formData: FormData) {
  const admin = await getAdminContext()
  if (admin.kind !== 'authorized') {
    throw new Error('Unauthorized')
  }

  const parsed = listingStatusSchema.safeParse({
    listingId: String(formData.get('listingId') ?? ''),
    status: String(formData.get('status') ?? ''),
  })

  if (!parsed.success) {
    throw new Error('Invalid listing payload')
  }

  const listing = await prisma.marketplaceListing.findUnique({ where: { id: parsed.data.listingId } })
  if (!listing) {
    throw new Error('Listing not found')
  }

  await prisma.marketplaceListing.update({
    where: { id: listing.id },
    data: {
      status: parsed.data.status,
      publishedAt: parsed.data.status === 'PUBLISHED' ? listing.publishedAt ?? new Date() : null,
      deletedAt: parsed.data.status === 'ARCHIVED' ? new Date() : null,
      archivedReason: parsed.data.status === 'ARCHIVED' ? listing.archivedReason || 'MANUAL' : null,
      billingSuspendedAt: parsed.data.status === 'ARCHIVED' ? listing.billingSuspendedAt : null,
      lastPublicStatusBeforeSuspend: parsed.data.status === 'ARCHIVED' ? listing.lastPublicStatusBeforeSuspend : null,
    },
  })

  revalidatePath('/admin/marketplace')
  revalidatePath('/marketplace')
}

export async function runMarketplaceSuspensionSweepAction() {
  const admin = await getAdminContext()
  if (admin.kind !== 'authorized') {
    throw new Error('Unauthorized')
  }

  const threshold = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const overdueOrganizations = await prisma.invoice.findMany({
    where: {
      organizationId: { not: null },
      status: { in: ['ISSUED', 'PARTIALLY_PAID', 'OVERDUE'] },
      dueAt: { lt: threshold },
    },
    select: { organizationId: true },
    distinct: ['organizationId'],
  })

  const organizationIds = overdueOrganizations
    .map((item) => item.organizationId)
    .filter((value): value is string => Boolean(value))

  let archivedListings = 0
  if (organizationIds.length > 0) {
    const publishedResult = await prisma.marketplaceListing.updateMany({
      where: {
        organizationId: { in: organizationIds },
        deletedAt: null,
        status: 'PUBLISHED',
      },
      data: {
        lastPublicStatusBeforeSuspend: 'PUBLISHED',
        archivedReason: 'BILLING_SUSPENDED',
        billingSuspendedAt: new Date(),
        status: 'ARCHIVED',
        isPublic: false,
      },
    })

    const draftResult = await prisma.marketplaceListing.updateMany({
      where: {
        organizationId: { in: organizationIds },
        deletedAt: null,
        status: 'DRAFT',
      },
      data: {
        lastPublicStatusBeforeSuspend: 'DRAFT',
        archivedReason: 'BILLING_SUSPENDED',
        billingSuspendedAt: new Date(),
        status: 'ARCHIVED',
        isPublic: false,
      },
    })

    archivedListings = publishedResult.count + draftResult.count
  }

  revalidatePath('/admin/marketplace')
  revalidatePath('/marketplace')
  redirect(`/admin/marketplace?sweep=1&orgs=${organizationIds.length}&archived=${archivedListings}`)
}

export async function restoreOrganizationMarketplaceListingsAction(formData: FormData) {
  const admin = await getAdminContext()
  if (admin.kind !== 'authorized') {
    throw new Error('Unauthorized')
  }

  const parsed = restoreMarketplaceOrgSchema.safeParse({
    organizationId: String(formData.get('organizationId') ?? ''),
  })

  if (!parsed.success) {
    throw new Error('Invalid organization payload')
  }

  const activeMembership = await prisma.membership.findFirst({
    where: {
      organizationId: parsed.data.organizationId,
      status: 'ACTIVE',
    },
    orderBy: { createdAt: 'desc' },
    include: { plan: true },
  })

  const listingLimit = listingLimitByPlanCode(activeMembership?.plan.code ?? null)
  if (listingLimit <= 0) {
    redirect('/admin/marketplace?restore=0&error=no-plan-access')
  }

  const activeListingsCount = await prisma.marketplaceListing.count({
    where: {
      organizationId: parsed.data.organizationId,
      deletedAt: null,
      status: { in: ['DRAFT', 'PUBLISHED'] },
    },
  })

  const suspended = await prisma.marketplaceListing.findMany({
    where: {
      organizationId: parsed.data.organizationId,
      deletedAt: null,
      status: 'ARCHIVED',
      archivedReason: 'BILLING_SUSPENDED',
    },
    orderBy: { updatedAt: 'asc' },
  })

  const availableSlots = Math.max(0, listingLimit - activeListingsCount)
  const toRestore = suspended.slice(0, availableSlots)

  if (toRestore.length > 0) {
    await prisma.$transaction(
      toRestore.map((listing) =>
        prisma.marketplaceListing.update({
          where: { id: listing.id },
          data: {
            status:
              listing.lastPublicStatusBeforeSuspend === 'PUBLISHED' ||
              listing.lastPublicStatusBeforeSuspend === 'DRAFT'
                ? listing.lastPublicStatusBeforeSuspend
                : 'DRAFT',
            archivedReason: null,
            billingSuspendedAt: null,
            lastPublicStatusBeforeSuspend: null,
            publishedAt:
              listing.lastPublicStatusBeforeSuspend === 'PUBLISHED'
                ? listing.publishedAt ?? new Date()
                : listing.publishedAt,
          },
        }),
      ),
    )
  }

  const skipped = Math.max(0, suspended.length - toRestore.length)

  revalidatePath('/admin/marketplace')
  revalidatePath('/marketplace')
  redirect(`/admin/marketplace?restore=1&restored=${toRestore.length}&skipped=${skipped}`)
}

export async function createOrganizationAction(formData: FormData) {
  const admin = await getAdminContext()
  if (admin.kind !== 'authorized') {
    throw new Error('Unauthorized')
  }

  const parsed = createOrganizationSchema.safeParse({
    name: String(formData.get('name') ?? ''),
    slug: String(formData.get('slug') ?? ''),
    legalName: String(formData.get('legalName') ?? '').trim() || undefined,
    edrpou: String(formData.get('edrpou') ?? ''),
    legalAddress: String(formData.get('legalAddress') ?? ''),
    iban: String(formData.get('iban') ?? '').toUpperCase(),
    bankName: String(formData.get('bankName') ?? ''),
    contactEmail: String(formData.get('contactEmail') ?? '').trim() || undefined,
    contactPhone: String(formData.get('contactPhone') ?? '').trim() || undefined,
    websiteUrl: String(formData.get('websiteUrl') ?? '').trim() || undefined,
    isPublicProfile: formData.get('isPublicProfile') === 'on',
    isPublicContacts: formData.get('isPublicContacts') === 'on',
    isPublicMarketplace: formData.get('isPublicMarketplace') === 'on',
  })

  if (!parsed.success) {
    throw new Error('Invalid organization payload')
  }

  const slug = await ensureUniqueOrganizationSlug(toEnglishSlug(parsed.data.slug))

  await prisma.organization.create({
    data: {
      name: parsed.data.name,
      legalName: parsed.data.legalName || parsed.data.name,
      slug,
      edrpou: parsed.data.edrpou,
      legalAddress: parsed.data.legalAddress,
      iban: parsed.data.iban,
      bankName: parsed.data.bankName,
      contactEmail: parsed.data.contactEmail || null,
      contactPhone: parsed.data.contactPhone || null,
      websiteUrl: parsed.data.websiteUrl || null,
      isPublicProfile: parsed.data.isPublicProfile,
      isPublicContacts: parsed.data.isPublicContacts,
      isPublicMarketplace: parsed.data.isPublicMarketplace,
      profileStatus: 'SUBMITTED',
    },
  })

  revalidatePath('/admin/organizations')
}

export async function createMembershipAction(formData: FormData) {
  const admin = await getAdminContext()
  if (admin.kind !== 'authorized') {
    throw new Error('Unauthorized')
  }

  const parsed = createMembershipSchema.safeParse({
    userId: String(formData.get('userId') ?? ''),
    organizationId: String(formData.get('organizationId') ?? '').trim() || undefined,
    planCode: String(formData.get('planCode') ?? ''),
    status: String(formData.get('status') ?? ''),
    billingCycle: String(formData.get('billingCycle') ?? '').trim() || undefined,
  })

  if (!parsed.success) {
    throw new Error('Invalid membership payload')
  }

  const user = await prisma.user.findUnique({ where: { id: parsed.data.userId } })
  if (!user || user.deletedAt) {
    throw new Error('User not found')
  }

  const plan = await prisma.membershipPlan.findUnique({ where: { code: parsed.data.planCode } })
  if (!plan || plan.deletedAt || !plan.isActive) {
    throw new Error('Plan not found')
  }

  let organizationId: string | null = null
  if (parsed.data.organizationId) {
    const organization = await prisma.organization.findUnique({ where: { id: parsed.data.organizationId } })
    if (!organization || organization.deletedAt) {
      throw new Error('Organization not found')
    }

    if (parsed.data.status === 'ACTIVE' && !profileIsInvoiceReady(organization)) {
      throw new Error('Organization profile is incomplete for invoicing')
    }

    organizationId = organization.id
  }

  const membership = await prisma.membership.create({
    data: {
      userId: user.id,
      organizationId,
      planId: plan.id,
      status: parsed.data.status,
      billingCycle: parsed.data.billingCycle,
      approvedAt: parsed.data.status === 'ACTIVE' ? new Date() : null,
      approvedById: parsed.data.status === 'ACTIVE' ? admin.context.user.id : null,
      startsAt: parsed.data.status === 'ACTIVE' ? new Date() : null,
    },
  })

  if (organizationId) {
    const member = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: user.id,
        },
      },
    })

    if (!member) {
      await prisma.organizationMember.create({
        data: {
          organizationId,
          userId: user.id,
          role: 'MEMBER',
        },
      })
    }
  }

  await prisma.membershipEvent.create({
    data: {
      membershipId: membership.id,
      actorId: admin.context.user.id,
      type: parsed.data.status === 'ACTIVE' ? 'APPROVED' : 'APPLIED',
      note: 'Членство створено вручну адміністратором',
    },
  })

  revalidatePath('/admin/memberships')
  revalidatePath('/admin/users')
}
