import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAuthUserId } from '@/lib/membership-access'
import { prisma } from '@/lib/prisma'

const applySchema = z.object({
  planCode: z.enum(['start', 'professional', 'investor']),
  billingCycle: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']).optional(),
  organizationId: z.string().optional(),
  organizationName: z.string().min(2).max(200).optional(),
  legalType: z.enum(['fop', 'ltd']).optional(),
  contactPhone: z.string().min(5).max(50).optional(),
  kvedCodes: z.string().max(200).optional(),
  iban: z.string().max(64).optional(),
  bankName: z.string().max(120).optional(),
  applicantName: z.string().min(2).max(120).optional(),
  notes: z.string().max(2000).optional(),
})

export async function POST(request: Request) {
  const userId = await requireAuthUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Необхідна авторизація.' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const parsed = applySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Невалідні дані заявки.' }, { status: 400 })
    }

    const plan = await prisma.membershipPlan.findUnique({
      where: { code: parsed.data.planCode },
    })

    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: 'Обраний план недоступний.' }, { status: 404 })
    }

    const existingOpenMembership = await prisma.membership.findFirst({
      where: {
        userId,
        status: { in: ['PENDING_REVIEW', 'ACTIVE'] },
      },
    })

    if (existingOpenMembership) {
      return NextResponse.json(
        { error: 'У вас вже є активна або очікуюча заявка на членство.' },
        { status: 409 },
      )
    }

    let effectiveOrganizationId = parsed.data.organizationId

    if (!effectiveOrganizationId && parsed.data.organizationName) {
      const organization = await prisma.organization.create({
        data: { name: parsed.data.organizationName.trim() },
      })

      await prisma.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId,
          role: 'OWNER',
        },
      })

      effectiveOrganizationId = organization.id
    }

    if (parsed.data.applicantName) {
      await prisma.user.update({
        where: { id: userId },
        data: { name: parsed.data.applicantName.trim() },
      })
    }

    const membership = await prisma.membership.create({
      data: {
        userId,
        organizationId: effectiveOrganizationId,
        planId: plan.id,
        status: 'PENDING_REVIEW',
        billingCycle: parsed.data.billingCycle,
      },
    })

    await prisma.membershipEvent.create({
      data: {
        membershipId: membership.id,
        actorId: userId,
        type: 'APPLIED',
        note: JSON.stringify({
          source: 'full_membership_form',
          legalType: parsed.data.legalType,
          contactPhone: parsed.data.contactPhone,
          kvedCodes: parsed.data.kvedCodes,
          iban: parsed.data.iban,
          bankName: parsed.data.bankName,
          notes: parsed.data.notes,
        }),
      },
    })

    return NextResponse.json({ ok: true, membershipId: membership.id }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Помилка сервера при подачі заявки.' }, { status: 500 })
  }
}
