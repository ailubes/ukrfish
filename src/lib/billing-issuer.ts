import { prisma } from '@/lib/prisma'

export const BILLING_ISSUER_SINGLETON_ID = 'default'

export interface BillingIssuerSnapshot {
  legalName: string
  shortName: string
  legalAddress: string
  edrpou: string
  iban: string
  bankName: string
  mfo: string | null
  vatNumber: string | null
  signatoryName: string | null
  signatoryPosition: string | null
  email: string | null
  phone: string | null
  website: string | null
}

export interface BillingIssuerSettingsRow extends BillingIssuerSnapshot {
  id: string
  createdAt: Date
  updatedAt: Date
}

export function normalizeOptional(value: string | null | undefined): string | null {
  const normalized = value?.trim()
  return normalized ? normalized : null
}

export function sanitizeIban(value: string): string {
  return value.trim().toUpperCase()
}

function normalizeRow(row: Record<string, unknown>): BillingIssuerSettingsRow {
  return {
    id: String(row.id),
    legalName: String(row.legalName),
    shortName: String(row.shortName),
    legalAddress: String(row.legalAddress),
    edrpou: String(row.edrpou),
    iban: String(row.iban),
    bankName: String(row.bankName),
    mfo: typeof row.mfo === 'string' ? row.mfo : null,
    vatNumber: typeof row.vatNumber === 'string' ? row.vatNumber : null,
    signatoryName: typeof row.signatoryName === 'string' ? row.signatoryName : null,
    signatoryPosition: typeof row.signatoryPosition === 'string' ? row.signatoryPosition : null,
    email: typeof row.email === 'string' ? row.email : null,
    phone: typeof row.phone === 'string' ? row.phone : null,
    website: typeof row.website === 'string' ? row.website : null,
    createdAt: row.createdAt instanceof Date ? row.createdAt : new Date(String(row.createdAt)),
    updatedAt: row.updatedAt instanceof Date ? row.updatedAt : new Date(String(row.updatedAt)),
  }
}

export async function getBillingIssuerSettings(): Promise<BillingIssuerSettingsRow | null> {
  const rows = await prisma.$queryRaw<Array<Record<string, unknown>>>`
    SELECT
      "id",
      "legalName",
      "shortName",
      "legalAddress",
      "edrpou",
      "iban",
      "bankName",
      "mfo",
      "vatNumber",
      "signatoryName",
      "signatoryPosition",
      "email",
      "phone",
      "website",
      "createdAt",
      "updatedAt"
    FROM "BillingIssuerSettings"
    WHERE "id" = ${BILLING_ISSUER_SINGLETON_ID}
    LIMIT 1
  `

  if (rows.length === 0) {
    return null
  }

  return normalizeRow(rows[0])
}

export async function requireBillingIssuerSettings(): Promise<BillingIssuerSettingsRow> {
  const settings = await getBillingIssuerSettings()
  if (!settings) {
    throw new Error('Заповніть реквізити виставника в /admin/settings')
  }

  return settings
}

export function toIssuerSnapshot(settings: BillingIssuerSettingsRow): BillingIssuerSnapshot {
  return {
    legalName: settings.legalName,
    shortName: settings.shortName,
    legalAddress: settings.legalAddress,
    edrpou: settings.edrpou,
    iban: settings.iban,
    bankName: settings.bankName,
    mfo: settings.mfo,
    vatNumber: settings.vatNumber,
    signatoryName: settings.signatoryName,
    signatoryPosition: settings.signatoryPosition,
    email: settings.email,
    phone: settings.phone,
    website: settings.website,
  }
}
