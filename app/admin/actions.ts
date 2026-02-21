'use server'

import { revalidatePath } from 'next/cache'
import { type InvoiceStatus, type MembershipBillingCycle, type PaymentStatus } from '@prisma/client'
import { z } from 'zod'
import { calculateInvoiceAmountMinor } from '@/lib/billing'
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

const updatePlanDetailsSchema = z.object({
  planCode: z.enum(['start', 'professional', 'investor']),
  name: z.string().min(2).max(120),
  description: z.string().min(2).max(300),
  monthlyPriceUah: z.coerce.number().int().min(0).max(500000),
  isActive: z.boolean(),
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

function invoiceNumberFromDate(date: Date, sequence: number): string {
  const year = date.getFullYear()
  return `UKRF-${year}-${String(sequence).padStart(6, '0')}`
}

async function nextInvoiceNumber(): Promise<string> {
  const now = new Date()
  const yearPrefix = `UKRF-${now.getFullYear()}-`
  const count = await prisma.invoice.count({
    where: {
      number: {
        startsWith: yearPrefix,
      },
    },
  })

  return invoiceNumberFromDate(now, count + 1)
}

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
    isActive: formData.get('isActive') === 'on',
  })

  if (!parsed.success) {
    throw new Error('Invalid plan payload')
  }

  await prisma.membershipPlan.update({
    where: { code: parsed.data.planCode },
    data: {
      name: parsed.data.name,
      description: parsed.data.description,
      monthlyPriceUah: parsed.data.monthlyPriceUah,
      isActive: parsed.data.isActive,
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
  const amountMinor = calculateInvoiceAmountMinor(membership.plan.monthlyPriceUah, cycle)
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
