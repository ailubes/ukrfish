import { NextResponse } from 'next/server'
import { requireAuthUserId } from '@/lib/membership-access'
import {
  ensureUniqueOrganizationSlug,
  getUserOrganization,
  organizationProfileSchema,
  profileIsInvoiceReady,
} from '@/lib/organization'
import { ensureMembershipInitialInvoice } from '@/lib/invoice'
import { toEnglishSlug } from '@/lib/slug'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const userId = await requireAuthUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Необхідна авторизація.' }, { status: 401 })
  }

  const organization = await getUserOrganization(userId)
  if (!organization) {
    return NextResponse.json({ organization: null }, { status: 200 })
  }

  return NextResponse.json({
    organization: {
      ...organization,
      invoiceReady: profileIsInvoiceReady(organization),
    },
  })
}

export async function PUT(request: Request) {
  const userId = await requireAuthUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Необхідна авторизація.' }, { status: 401 })
  }

  const organization = await getUserOrganization(userId)
  if (!organization) {
    return NextResponse.json({ error: 'Організацію не знайдено для вашого членства.' }, { status: 404 })
  }

  const body = await request.json().catch(() => null)
  const parsed = organizationProfileSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Невалідні дані профілю організації.' }, { status: 400 })
  }

  const requestedSlug = toEnglishSlug(parsed.data.slug)
  if (!requestedSlug) {
    return NextResponse.json({ error: 'Слаг має містити латинські символи або цифри.' }, { status: 400 })
  }

  const slug = await ensureUniqueOrganizationSlug(requestedSlug, organization.id)

  const updated = await prisma.organization.update({
    where: { id: organization.id },
    data: {
      name: parsed.data.name,
      entityType: parsed.data.entityType,
      legalName: parsed.data.legalName || parsed.data.name,
      slug,
      legalAddress: parsed.data.legalAddress,
      postalAddress: parsed.data.postalAddress || null,
      edrpou: parsed.data.edrpou,
      vatNumber: parsed.data.vatNumber || null,
      iban: parsed.data.iban,
      bankName: parsed.data.bankName,
      mfo: parsed.data.mfo || null,
      signatoryName: parsed.data.signatoryName || null,
      signatoryPosition: parsed.data.signatoryPosition || null,
      contactName: parsed.data.contactName || null,
      contactRole: parsed.data.contactRole || null,
      contactEmail: parsed.data.contactEmail || null,
      contactPhone: parsed.data.contactPhone || null,
      websiteUrl: parsed.data.websiteUrl || null,
      facebookUrl: parsed.data.facebookUrl || null,
      instagramUrl: parsed.data.instagramUrl || null,
      linkedinUrl: parsed.data.linkedinUrl || null,
      youtubeUrl: parsed.data.youtubeUrl || null,
      telegramUrl: parsed.data.telegramUrl || null,
      description: parsed.data.description || null,
      offersSummary: parsed.data.offersSummary || null,
      kvedCodes: parsed.data.kvedCodes || null,
      isPublicProfile: parsed.data.isPublicProfile,
      isPublicContacts: parsed.data.isPublicContacts,
      isPublicMarketplace: parsed.data.isPublicMarketplace,
      profileStatus: 'SUBMITTED',
    },
  })

  if (profileIsInvoiceReady(updated)) {
    const activeMembership = await prisma.membership.findFirst({
      where: {
        userId,
        organizationId: updated.id,
        status: 'ACTIVE',
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    })

    if (activeMembership) {
      await ensureMembershipInitialInvoice({
        membershipId: activeMembership.id,
        actorId: userId,
        note: 'Автоматично сформовано після заповнення реквізитів організації.',
      })
    }
  }

  return NextResponse.json({
    ok: true,
    organization: {
      ...updated,
      invoiceReady: profileIsInvoiceReady(updated),
    },
  })
}
