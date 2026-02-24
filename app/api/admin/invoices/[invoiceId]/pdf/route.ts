import { NextResponse } from 'next/server'
import { type MembershipBillingCycle } from '@prisma/client'
import { getAdminContext } from '@/lib/admin-auth'
import { getBillingIssuerSettings, toIssuerSnapshot, type BillingIssuerSnapshot } from '@/lib/billing-issuer'
import { buildInvoicePdf } from '@/lib/invoice-pdf'
import { prisma } from '@/lib/prisma'

function parseIssuerFromMetadata(metadata: unknown): BillingIssuerSnapshot | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return null
  }

  const issuer = (metadata as Record<string, unknown>).issuer
  if (!issuer || typeof issuer !== 'object' || Array.isArray(issuer)) {
    return null
  }

  const source = issuer as Record<string, unknown>
  const legalName = typeof source.legalName === 'string' ? source.legalName : null
  const shortName = typeof source.shortName === 'string' ? source.shortName : null
  const legalAddress = typeof source.legalAddress === 'string' ? source.legalAddress : null
  const edrpou = typeof source.edrpou === 'string' ? source.edrpou : null
  const iban = typeof source.iban === 'string' ? source.iban : null
  const bankName = typeof source.bankName === 'string' ? source.bankName : null

  if (!legalName || !shortName || !legalAddress || !edrpou || !iban || !bankName) {
    return null
  }

  return {
    legalName,
    shortName,
    legalAddress,
    edrpou,
    iban,
    bankName,
    mfo: typeof source.mfo === 'string' ? source.mfo : null,
    vatNumber: typeof source.vatNumber === 'string' ? source.vatNumber : null,
    signatoryName: typeof source.signatoryName === 'string' ? source.signatoryName : null,
    signatoryPosition: typeof source.signatoryPosition === 'string' ? source.signatoryPosition : null,
    email: typeof source.email === 'string' ? source.email : null,
    phone: typeof source.phone === 'string' ? source.phone : null,
    website: typeof source.website === 'string' ? source.website : null,
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ invoiceId: string }> },
) {
  const admin = await getAdminContext()
  if (admin.kind !== 'authorized') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { invoiceId } = await params
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      user: true,
      organization: true,
      membership: {
        include: {
          plan: true,
        },
      },
    },
  })

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  }

  const metadataIssuer = parseIssuerFromMetadata(invoice.metadata)
  let issuer = metadataIssuer

  if (!issuer) {
    const issuerSettings = await getBillingIssuerSettings()
    if (!issuerSettings) {
      return NextResponse.json({ error: 'Issuer settings are not configured' }, { status: 400 })
    }
    issuer = toIssuerSnapshot(issuerSettings)
  }

  const pdfBytes = await buildInvoicePdf({
    number: invoice.number,
    issuedAt: invoice.issuedAt,
    dueAt: invoice.dueAt,
    status: invoice.status,
    amountMinor: invoice.amountMinor,
    paidMinor: invoice.paidMinor,
    note: invoice.note,
    billingCycle: invoice.billingCycle as MembershipBillingCycle | null,
    userName: invoice.user.name,
    userEmail: invoice.user.email,
    organizationName: invoice.organization?.name ?? null,
    planName: invoice.membership?.plan.name ?? null,
    issuer,
  })

  const filename = `invoice-${invoice.number}.pdf`
  return new NextResponse(pdfBytes, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
