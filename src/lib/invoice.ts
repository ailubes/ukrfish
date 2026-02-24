import { type MembershipBillingCycle, type Prisma } from '@prisma/client'
import { calculateInvoiceAmountMinor } from '@/lib/billing'
import { requireBillingIssuerSettings, toIssuerSnapshot } from '@/lib/billing-issuer'
import { prisma } from '@/lib/prisma'

const MILLIS_PER_DAY = 24 * 60 * 60 * 1000

function invoiceNumberFromDate(date: Date, sequence: number): string {
  const year = date.getFullYear()
  return `UKRF-${year}-${String(sequence).padStart(6, '0')}`
}

export async function nextInvoiceNumber(): Promise<string> {
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

interface EnsureInitialMembershipInvoiceParams {
  membershipId: string
  actorId: string
}

export async function ensureInitialMembershipInvoice({
  membershipId,
  actorId,
}: EnsureInitialMembershipInvoiceParams) {
  const existing = await prisma.invoice.findFirst({
    where: {
      membershipId,
      type: 'MEMBERSHIP_FEE',
    },
    orderBy: { createdAt: 'asc' },
  })

  if (existing) {
    return { created: false, invoice: existing }
  }

  const membership = await prisma.membership.findUnique({
    where: { id: membershipId },
    include: {
      plan: true,
    },
  })

  if (!membership) {
    throw new Error('Membership not found for invoice creation')
  }

  const billingCycle = (membership.billingCycle ?? 'YEARLY') as MembershipBillingCycle
  const amountMinor = calculateInvoiceAmountMinor(
    membership.plan.monthlyPriceUah,
    billingCycle,
    membership.plan.yearlyFreeMonths,
  )
  const now = new Date()
  const dueAt = amountMinor === 0 ? now : new Date(now.getTime() + 14 * MILLIS_PER_DAY)
  const issuerSettings = await requireBillingIssuerSettings()
  const number = await nextInvoiceNumber()
  const status = amountMinor === 0 ? 'PAID' : 'ISSUED'
  const issuerSnapshot = toIssuerSnapshot(issuerSettings)

  const invoice = await prisma.invoice.create({
    data: {
      number,
      status,
      type: 'MEMBERSHIP_FEE',
      userId: membership.userId,
      membershipId: membership.id,
      organizationId: membership.organizationId,
      billingCycle,
      amountMinor,
      paidMinor: amountMinor === 0 ? amountMinor : 0,
      issuedAt: now,
      dueAt,
      paidAt: amountMinor === 0 ? now : null,
      note:
        amountMinor === 0
          ? `Рахунок сформовано автоматично (${issuerSettings.shortName}), сума 0 грн.`
          : `Рахунок сформовано автоматично (${issuerSettings.shortName}).`,
      metadata: {
        issuer: issuerSnapshot,
      } as unknown as Prisma.InputJsonValue,
      createdById: actorId,
      updatedById: actorId,
    },
  })

  await prisma.billingEvent.create({
    data: {
      invoiceId: invoice.id,
      actorId,
      type: 'INVOICE_CREATED',
      note: `Автоматично створено рахунок ${number}`,
    },
  })

  return { created: true, invoice }
}
