'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Clock3, Lock, ShieldCheck, UserRound } from 'lucide-react'
import {
  MEMBERSHIP_FEATURE_LABELS,
  type MembershipFeatureCode,
} from '../lib/membership'
import { formatMoneyUahFromMinor, statusLabelUk } from '../lib/billing'

type UserRole = 'USER' | 'ADMIN' | 'SUPERADMIN'

interface CurrentUser {
  id: string
  email: string
  name: string | null
  role: UserRole
}

interface MembershipPayload {
  membership: null | {
    id: string
    status: MembershipStatus
    billingCycle: 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | null
    startsAt: string | null
    endsAt: string | null
    createdAt: string
    plan: {
      code: string
      name: string
      description: string
      monthlyPriceUah: number
    }
    organization: {
      id: string
      name: string
      slug: string | null
    } | null
  }
  features: Array<{
    code: string
    label: string
  }>
}

type MembershipStatus = 'PENDING_REVIEW' | 'ACTIVE' | 'DENIED' | 'CANCELED' | 'EXPIRED'

interface MemberDashboardProps {
  currentUser: CurrentUser | null
}

interface MyInvoiceItem {
  id: string
  number: string
  status: string
  billingCycle: 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | null
  amountMinor: number
  paidMinor: number
  dueAt: string | null
  membership: {
    plan: {
      name: string
      code: string
    }
  } | null
}

interface MyPaymentItem {
  id: string
  status: string
  method: string
  amountMinor: number
  paidAt: string | null
  payerReference: string | null
  invoice: {
    id: string
    number: string
  }
}

interface OrganizationProfile {
  id: string
  name: string
  entityType: 'FOP' | 'COMPANY' | 'GOVERNMENT' | 'SCIENTIFIC' | 'LAWMAKER'
  slug: string | null
  legalName: string | null
  legalAddress: string | null
  edrpou: string | null
  iban: string | null
  bankName: string | null
  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null
  websiteUrl: string | null
  description: string | null
  offersSummary: string | null
  kvedCodes: string | null
  logoUrl: string | null
  isPublicProfile: boolean
  isPublicContacts: boolean
  isPublicMarketplace: boolean
  invoiceReady: boolean
}

interface OrganizationTeamUser {
  id: string
  name: string | null
  email: string
  userRole: UserRole
  organizationRole: 'OWNER' | 'ADMIN' | 'MARKETPLACE_MANAGER' | 'MEMBER'
  joinedAt: string
}

interface OrganizationTeamPayload {
  organization: {
    id: string
    name: string
    planCode: string
    planName: string
    seatsLimit: number
    seatsUsed: number
    seatsAvailable: number
    actorRole: 'OWNER' | 'ADMIN' | 'MARKETPLACE_MANAGER' | 'MEMBER'
  }
  users: OrganizationTeamUser[]
}

interface MarketplaceListingItem {
  id: string
  title: string
  slug: string
  type: 'GOOD' | 'SERVICE'
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  shortDescription: string | null
  description: string
  priceMinor: number | null
  currency: string
  archivedReason: 'MANUAL' | 'BILLING_SUSPENDED' | null
}

const ALL_FEATURES = Object.keys(MEMBERSHIP_FEATURE_LABELS) as MembershipFeatureCode[]

const ROLE_LABELS: Record<UserRole, string> = {
  USER: 'Користувач',
  ADMIN: 'Адміністратор',
  SUPERADMIN: 'Суперадмін',
}

const STATUS_LABELS: Record<MembershipStatus | 'NONE', string> = {
  NONE: 'Не подано заявку',
  PENDING_REVIEW: 'Очікує підтвердження',
  ACTIVE: 'Активне',
  DENIED: 'Відхилено',
  CANCELED: 'Скасовано',
  EXPIRED: 'Завершено',
}

function isAdmin(role: UserRole | undefined): boolean {
  return role === 'ADMIN' || role === 'SUPERADMIN'
}

function getRoleBadgeClass(role: UserRole): string {
  if (role === 'SUPERADMIN') {
    return 'border-purple-200 bg-purple-50 text-purple-700'
  }

  if (role === 'ADMIN') {
    return 'border-blue-200 bg-blue-50 text-blue-700'
  }

  return 'border-gray-200 bg-gray-50 text-gray-600'
}

export default function MemberDashboard({ currentUser }: MemberDashboardProps) {
  const [data, setData] = useState<MembershipPayload | null>(null)
  const [invoices, setInvoices] = useState<MyInvoiceItem[]>([])
  const [payments, setPayments] = useState<MyPaymentItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [organization, setOrganization] = useState<OrganizationProfile | null>(null)
  const [listings, setListings] = useState<MarketplaceListingItem[]>([])
  const [team, setTeam] = useState<OrganizationTeamPayload | null>(null)
  const [orgNotice, setOrgNotice] = useState('')
  const [listingNotice, setListingNotice] = useState('')
  const [teamNotice, setTeamNotice] = useState('')

  useEffect(() => {
    let cancelled = false

    setIsLoading(true)
    setError('')

      void Promise.all([
      fetch('/api/me/membership', {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
      }).then(async (response) => {
        if (!response.ok) {
          throw new Error('Не вдалося завантажити дані членства.')
        }
        return response.json() as Promise<MembershipPayload>
      }),
      fetch('/api/me/invoices', {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
      }).then(async (response) => {
        if (!response.ok) {
          return { invoices: [] as MyInvoiceItem[] }
        }
        return response.json() as Promise<{ invoices: MyInvoiceItem[] }>
      }),
      fetch('/api/me/payments', {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
      }).then(async (response) => {
        if (!response.ok) {
          return { payments: [] as MyPaymentItem[] }
        }
        return response.json() as Promise<{ payments: MyPaymentItem[] }>
      }),
      fetch('/api/me/organization', {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
      }).then(async (response) => {
        if (!response.ok) {
          return { organization: null as OrganizationProfile | null }
        }
        return response.json() as Promise<{ organization: OrganizationProfile | null }>
      }),
      fetch('/api/me/marketplace/listings', {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
      }).then(async (response) => {
        if (!response.ok) {
          return { listings: [] as MarketplaceListingItem[] }
        }
        return response.json() as Promise<{ listings: MarketplaceListingItem[] }>
      }),
      fetch('/api/me/organization/users', {
        method: 'GET',
        credentials: 'same-origin',
        cache: 'no-store',
      }).then(async (response) => {
        if (!response.ok) {
          return null
        }
        return response.json() as Promise<OrganizationTeamPayload>
      }),
    ])
      .then(([membershipPayload, invoicesPayload, paymentsPayload, organizationPayload, listingsPayload, teamPayload]) => {
        if (!cancelled) {
          setData(membershipPayload)
          setInvoices(invoicesPayload.invoices || [])
          setPayments(paymentsPayload.payments || [])
          setOrganization(organizationPayload.organization || null)
          setListings(listingsPayload.listings || [])
          setTeam(teamPayload)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError('Помилка завантаження членства. Спробуйте оновити сторінку.')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const membership = data?.membership ?? null
  const status = membership?.status ?? 'NONE'
  const role = currentUser?.role ?? 'USER'
  const roleLabel = ROLE_LABELS[role]
  const userName = currentUser?.name?.trim() || 'Без імені'
  const userEmail = currentUser?.email ?? '—'
  const plan = membership?.plan ?? {
    code: 'default',
    name: 'Базовий',
    description: 'План не вибрано',
    monthlyPriceUah: 0,
  }
  const marketplaceLimitByPlanCode: Record<string, number> = {
    professional: 100,
    investor: 1000,
  }
  const marketplaceLimit = marketplaceLimitByPlanCode[plan.code] ?? 0
  const canManageMarketplaceByPlan = marketplaceLimit > 0
  const activeMarketplaceListings = listings.filter((item) => item.status === 'DRAFT' || item.status === 'PUBLISHED').length
  const marketplaceAtLimit = canManageMarketplaceByPlan && activeMarketplaceListings >= marketplaceLimit
  const organizationInvoiceReady = organization?.invoiceReady ?? false
  const hasAdditionalTeamMembers = (team?.users.length ?? 0) > 1
  const hasMarketplaceListing = listings.length > 0
  const showOnboarding = status === 'NONE' || status === 'PENDING_REVIEW' || !organization || !organizationInvoiceReady

  const enabledFeatureCodes = useMemo(
    () => new Set((data?.features || []).map((feature) => feature.code)),
    [data?.features],
  )

  const featureLabelByCode = useMemo(() => {
    const map = new Map<string, string>()
    ;(data?.features || []).forEach((feature) => {
      map.set(feature.code, feature.label)
    })
    return map
  }, [data?.features])

  async function saveOrganizationProfile(formData: FormData) {
    setOrgNotice('')

    const payload = {
      name: String(formData.get('name') ?? ''),
      entityType: String(formData.get('entityType') ?? 'COMPANY'),
      legalName: String(formData.get('legalName') ?? ''),
      slug: String(formData.get('slug') ?? ''),
      legalAddress: String(formData.get('legalAddress') ?? ''),
      postalAddress: String(formData.get('postalAddress') ?? ''),
      edrpou: String(formData.get('edrpou') ?? ''),
      vatNumber: String(formData.get('vatNumber') ?? ''),
      iban: String(formData.get('iban') ?? ''),
      bankName: String(formData.get('bankName') ?? ''),
      mfo: String(formData.get('mfo') ?? ''),
      signatoryName: String(formData.get('signatoryName') ?? ''),
      signatoryPosition: String(formData.get('signatoryPosition') ?? ''),
      contactName: String(formData.get('contactName') ?? ''),
      contactRole: String(formData.get('contactRole') ?? ''),
      contactEmail: String(formData.get('contactEmail') ?? ''),
      contactPhone: String(formData.get('contactPhone') ?? ''),
      websiteUrl: String(formData.get('websiteUrl') ?? ''),
      facebookUrl: String(formData.get('facebookUrl') ?? ''),
      instagramUrl: String(formData.get('instagramUrl') ?? ''),
      linkedinUrl: String(formData.get('linkedinUrl') ?? ''),
      youtubeUrl: String(formData.get('youtubeUrl') ?? ''),
      telegramUrl: String(formData.get('telegramUrl') ?? ''),
      description: String(formData.get('description') ?? ''),
      offersSummary: String(formData.get('offersSummary') ?? ''),
      kvedCodes: String(formData.get('kvedCodes') ?? ''),
      isPublicProfile: formData.get('isPublicProfile') === 'on',
      isPublicContacts: formData.get('isPublicContacts') === 'on',
      isPublicMarketplace: formData.get('isPublicMarketplace') === 'on',
    }

    const response = await fetch('/api/me/organization', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const result = (await response.json().catch(() => ({}))) as {
      organization?: OrganizationProfile
      error?: string
    }

    if (!response.ok || !result.organization) {
      setOrgNotice(result.error || 'Не вдалося зберегти профіль організації.')
      return
    }

    setOrganization(result.organization)
    setOrgNotice('Профіль організації оновлено.')
  }

  async function uploadOrganizationLogo(formData: FormData) {
    setOrgNotice('')

    const response = await fetch('/api/me/organization/logo', {
      method: 'POST',
      body: formData,
    })

    const result = (await response.json().catch(() => ({}))) as { logoUrl?: string; error?: string }
    if (!response.ok || !result.logoUrl) {
      setOrgNotice(result.error || 'Не вдалося завантажити логотип.')
      return
    }

    setOrganization((previous) => (previous ? { ...previous, logoUrl: result.logoUrl ?? null } : previous))
    setOrgNotice('Логотип завантажено.')
  }

  async function createListing(formData: FormData) {
    setListingNotice('')

    const payload = {
      title: String(formData.get('title') ?? ''),
      slug: String(formData.get('slug') ?? ''),
      type: String(formData.get('type') ?? 'GOOD'),
      shortDescription: String(formData.get('shortDescription') ?? ''),
      description: String(formData.get('description') ?? ''),
      priceMinor: Number(String(formData.get('priceUah') ?? '0') || 0) * 100,
      currency: 'UAH',
      unit: String(formData.get('unit') ?? ''),
      minimumOrder: String(formData.get('minimumOrder') ?? ''),
      location: String(formData.get('location') ?? ''),
      contactName: String(formData.get('contactName') ?? ''),
      contactPhone: String(formData.get('contactPhone') ?? ''),
      contactEmail: String(formData.get('contactEmail') ?? ''),
      websiteUrl: String(formData.get('websiteUrl') ?? ''),
      coverImageUrl: String(formData.get('coverImageUrl') ?? ''),
      isPublic: formData.get('isPublic') === 'on',
      status: String(formData.get('status') ?? 'DRAFT'),
    }

    const response = await fetch('/api/me/marketplace/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const result = (await response.json().catch(() => ({}))) as {
      listing?: MarketplaceListingItem
      error?: string
    }
    if (!response.ok || !result.listing) {
      setListingNotice(result.error || 'Не вдалося створити позицію маркетплейсу.')
      return
    }

    setListings((previous) => [result.listing as MarketplaceListingItem, ...previous])
    setListingNotice('Позицію додано.')
  }

  async function archiveListing(listingId: string) {
    setListingNotice('')
    const response = await fetch(`/api/me/marketplace/listings/${encodeURIComponent(listingId)}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      setListingNotice('Не вдалося архівувати позицію.')
      return
    }

    setListings((previous) => previous.filter((item) => item.id !== listingId))
    setListingNotice('Позицію архівовано.')
  }

  async function addOrganizationUser(formData: FormData) {
    setTeamNotice('')

    const payload = {
      name: String(formData.get('name') ?? ''),
      email: String(formData.get('email') ?? ''),
      password: String(formData.get('password') ?? ''),
      organizationRole: String(formData.get('organizationRole') ?? 'MEMBER'),
    }

    const response = await fetch('/api/me/organization/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    const result = (await response.json().catch(() => ({}))) as {
      error?: string
      user?: OrganizationTeamUser
    }

    if (!response.ok || !result.user) {
      setTeamNotice(result.error || 'Не вдалося додати користувача.')
      return
    }

    const refreshed = await fetch('/api/me/organization/users', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
    })

    if (refreshed.ok) {
      const refreshedPayload = (await refreshed.json()) as OrganizationTeamPayload
      setTeam(refreshedPayload)
    }

    setTeamNotice('Користувача додано до організації.')
  }

  async function restoreSuspendedListings() {
    setListingNotice('')

    const response = await fetch('/api/me/marketplace/listings/restore', {
      method: 'POST',
      credentials: 'same-origin',
    })

    const result = (await response.json().catch(() => ({}))) as {
      restored?: number
      skipped?: number
      error?: string
    }

    if (!response.ok) {
      setListingNotice(result.error || 'Не вдалося відновити оголошення.')
      return
    }

    const refreshed = await fetch('/api/me/marketplace/listings', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
    })

    if (refreshed.ok) {
      const refreshedPayload = (await refreshed.json()) as { listings: MarketplaceListingItem[] }
      setListings(refreshedPayload.listings || [])
    }

    if ((result.skipped || 0) > 0) {
      setListingNotice(`Відновлено ${result.restored || 0}. Пропущено ${result.skipped || 0} через ліміт плану.`)
      return
    }

    setListingNotice(`Відновлено оголошень: ${result.restored || 0}.`)
  }

  return (
    <div className="p-6 lg:p-8">
      <header className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="section-header mb-0">
          <h2 className="mb-1 text-sm font-light uppercase tracking-wider text-[#0047AB]">Особистий кабінет</h2>
          <h3 className="text-2xl font-semibold text-[#1a1a1a] lg:text-3xl">Ваше членство та доступи</h3>
        </div>

        <div className="blueprint-panel min-w-[260px] border-[#0047AB]/20 bg-white/90 p-4">
          <p className="text-xs uppercase tracking-wide text-[#0047AB]/80">Профіль</p>
          <p className="mt-1 text-sm font-semibold text-[#002d6e]">{userName}</p>
          <p className="text-xs text-gray-500">{userEmail}</p>
          <Link href="/settings" className="mt-2 inline-flex text-xs text-[#0047AB] hover:underline">Налаштування профілю</Link>
          <span className={`mt-3 inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getRoleBadgeClass(role)}`}>
            {roleLabel}
          </span>
        </div>
      </header>

      <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="blueprint-panel">
          <div className="mb-2 flex items-center gap-3">
            <UserRound className="h-5 w-5 text-[#0047AB]" />
            <h4 className="font-semibold text-[#002d6e]">Профіль</h4>
          </div>
          <p className="text-sm text-gray-700">{userName}</p>
          <p className="text-sm text-gray-500">{userEmail}</p>
          <Link href="/settings" className="mt-2 inline-flex text-xs text-[#0047AB] hover:underline">Налаштування профілю</Link>
          <span className={`mt-2 inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${getRoleBadgeClass(role)}`}>
            {roleLabel}
          </span>
        </div>

        <div className="blueprint-panel">
          <div className="mb-2 flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-[#0047AB]" />
            <h4 className="font-semibold text-[#002d6e]">Поточний план</h4>
          </div>
          <p className="font-mono text-2xl text-[#0047AB]">{plan.name}</p>
          <p className="text-sm text-gray-600">{plan.description}</p>
        </div>

        <div className="blueprint-panel">
          <div className="mb-2 flex items-center gap-3">
            <Clock3 className="h-5 w-5 text-[#0047AB]" />
            <h4 className="font-semibold text-[#002d6e]">Статус заявки</h4>
          </div>
          <p className="text-sm text-gray-700">{STATUS_LABELS[status]}</p>
          <p className="mt-1 text-xs text-gray-500">
            {status === 'ACTIVE'
              ? 'Всі доступи вашого плану активні.'
              : 'Після підтвердження адміністратором вам буде відкрито всі доступи плану.'}
          </p>
        </div>
      </div>

      {showOnboarding && (
        <div className="blueprint-panel mb-8 border-[#facc15] bg-[#fffdf6]">
          <div className="panel-title">
            <span>ОНБОРДИНГ</span>
          </div>
          <p className="mb-4 text-sm text-gray-700">
            Щоб швидше пройти модерацію та отримати рахунок (навіть для безкоштовного плану), виконайте кроки нижче.
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className={`border p-3 ${organization ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
              <p className="text-sm font-medium text-[#002d6e]">1. Додайте організацію</p>
              <p className="text-xs text-gray-600">{organization ? 'Готово' : 'Потрібно створити або заповнити профіль організації.'}</p>
            </div>
            <div className={`border p-3 ${organizationInvoiceReady ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
              <p className="text-sm font-medium text-[#002d6e]">2. Дані для рахунку</p>
              <p className="text-xs text-gray-600">{organizationInvoiceReady ? 'Готово' : 'Заповніть реквізити, щоб виставити рахунок після погодження.'}</p>
            </div>
            <div className={`border p-3 ${hasAdditionalTeamMembers ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
              <p className="text-sm font-medium text-[#002d6e]">3. Додайте контакти/команду</p>
              <p className="text-xs text-gray-600">{hasAdditionalTeamMembers ? 'Додаткові користувачі додані.' : 'Опційно: запросіть колег у вашу організацію.'}</p>
            </div>
            <div className={`border p-3 ${hasMarketplaceListing ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
              <p className="text-sm font-medium text-[#002d6e]">4. Перший продукт у маркетплейсі</p>
              <p className="text-xs text-gray-600">{hasMarketplaceListing ? 'Позиція вже додана.' : 'Для Start доступний перегляд. Для публікації перейдіть на платний план.'}</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href="/membership/apply?plan=start" className="inline-flex items-center rounded border border-[#0047AB] px-3 py-2 text-xs font-medium text-[#0047AB] hover:bg-[#0047AB] hover:text-white">
              Заповнити заявку
            </a>
            <a href="/marketplace" className="inline-flex items-center rounded border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100">
              Перейти в маркетплейс
            </a>
            <a href="/membership" className="inline-flex items-center rounded bg-[#0047AB] px-3 py-2 text-xs font-medium text-white hover:bg-[#002d6e]">
              Переглянути апгрейд плану
            </a>
          </div>
        </div>
      )}

      {isAdmin(role) && (
        <div className="blueprint-panel mb-8 border-[#0047AB]/25 bg-[#0047AB]/[0.04]">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-[#0047AB]">Адміністрування</p>
              <p className="text-sm text-[#002d6e]">Керуйте користувачами, ролями та заявками на членство.</p>
            </div>
            <Link href="/admin/users" className="inline-flex items-center justify-center rounded border border-[#0047AB] px-4 py-2 text-sm font-medium text-[#0047AB] transition-colors hover:bg-[#0047AB] hover:text-white">
              Відкрити адмін-панель
            </Link>
          </div>
        </div>
      )}

      <div className="blueprint-panel mb-8">
        <div className="panel-title">
          <span>ДОСТУПНІ ФУНКЦІЇ ЗА ПЛАНОМ</span>
        </div>

        {isLoading ? (
          <p className="text-sm text-[#002d6e]">Завантаження функцій членства...</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {ALL_FEATURES.map((featureCode) => {
              const enabled = enabledFeatureCodes.has(featureCode)
              return (
                <div
                  key={featureCode}
                  className={`flex items-center justify-between border p-3 ${enabled ? 'border-[#0047AB]/30 bg-[#0047AB]/5' : 'border-gray-200 bg-gray-50'}`}
                >
                  <span className={`text-sm ${enabled ? 'text-[#002d6e]' : 'text-gray-500'}`}>
                    {featureLabelByCode.get(featureCode) || MEMBERSHIP_FEATURE_LABELS[featureCode]}
                  </span>
                  {enabled ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <Lock className="h-4 w-4 text-gray-400" />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {!membership && !isLoading && !error && (
        <div className="blueprint-panel border-2 border-[#facc15]">
          <div className="panel-title">
            <span>ЗАЯВКА НА ЧЛЕНСТВО</span>
          </div>
          <p className="mb-4 text-sm text-gray-600">
            У вас ще немає активної або очікуючої заявки. Подайте заявку, щоб отримати доступи платформи.
          </p>
          <Link href="/membership/apply?plan=start" className="btn-primary inline-flex items-center justify-center">
            Подати заявку
          </Link>
        </div>
      )}

      {organization && (
        <div className="blueprint-panel mb-8">
          <div className="panel-title">
            <span>ПРОФІЛЬ ОРГАНІЗАЦІЇ</span>
          </div>
          <p className="mb-3 text-xs text-gray-500">Публічна сторінка: {organization.slug ? `/membership/${organization.slug}` : 'не налаштовано'}</p>
          {orgNotice && <p className="mb-3 text-sm text-[#0047AB]">{orgNotice}</p>}

          <form
            action={async (formData) => {
              await saveOrganizationProfile(formData)
            }}
            className="grid grid-cols-1 gap-3 md:grid-cols-2"
          >
            <label className="text-sm text-gray-700">
              Назва
              <input name="name" defaultValue={organization.name} required className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
            </label>
            <label className="text-sm text-gray-700">
              Тип організації
              <select name="entityType" defaultValue={organization.entityType || 'COMPANY'} className="mt-1 w-full rounded border border-gray-300 px-3 py-2">
                <option value="FOP">ФОП</option>
                <option value="COMPANY">Компанія</option>
                <option value="GOVERNMENT">Державна установа</option>
                <option value="SCIENTIFIC">Наукова установа</option>
                <option value="LAWMAKER">Законотворчий орган</option>
              </select>
            </label>
            <label className="text-sm text-gray-700">
              Юридична назва
              <input name="legalName" defaultValue={organization.legalName || ''} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
            </label>
            <label className="text-sm text-gray-700">
              Slug
              <input name="slug" defaultValue={organization.slug || ''} required className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
            </label>
            <label className="text-sm text-gray-700">
              ЄДРПОУ
              <input name="edrpou" defaultValue={organization.edrpou || ''} required className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
            </label>
            <label className="text-sm text-gray-700 md:col-span-2">
              Юридична адреса
              <input name="legalAddress" defaultValue={organization.legalAddress || ''} required className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
            </label>
            <label className="text-sm text-gray-700">
              IBAN
              <input name="iban" defaultValue={organization.iban || ''} required className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
            </label>
            <label className="text-sm text-gray-700">
              Банк
              <input name="bankName" defaultValue={organization.bankName || ''} required className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
            </label>
            <label className="text-sm text-gray-700">
              Контактний email
              <input type="email" name="contactEmail" defaultValue={organization.contactEmail || ''} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
            </label>
            <label className="text-sm text-gray-700">
              Контактний телефон
              <input name="contactPhone" defaultValue={organization.contactPhone || ''} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
            </label>
            <label className="text-sm text-gray-700">
              Website
              <input type="url" name="websiteUrl" defaultValue={organization.websiteUrl || ''} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
            </label>
            <label className="text-sm text-gray-700">
              KVED
              <input name="kvedCodes" defaultValue={organization.kvedCodes || ''} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
            </label>
            <label className="text-sm text-gray-700 md:col-span-2">
              Опис
              <textarea name="description" defaultValue={organization.description || ''} rows={3} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" name="isPublicProfile" defaultChecked={organization.isPublicProfile} /> Публічний профіль
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" name="isPublicContacts" defaultChecked={organization.isPublicContacts} /> Публічні контакти
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700 md:col-span-2">
              <input type="checkbox" name="isPublicMarketplace" defaultChecked={organization.isPublicMarketplace} /> Публічний маркетплейс
            </label>

            <input type="hidden" name="postalAddress" value="" />
            <input type="hidden" name="vatNumber" value="" />
            <input type="hidden" name="mfo" value="" />
            <input type="hidden" name="signatoryName" value="" />
            <input type="hidden" name="signatoryPosition" value="" />
            <input type="hidden" name="contactName" value="" />
            <input type="hidden" name="contactRole" value="" />
            <input type="hidden" name="facebookUrl" value="" />
            <input type="hidden" name="instagramUrl" value="" />
            <input type="hidden" name="linkedinUrl" value="" />
            <input type="hidden" name="youtubeUrl" value="" />
            <input type="hidden" name="telegramUrl" value="" />
            <input type="hidden" name="offersSummary" value="" />

            <div className="md:col-span-2 flex justify-end">
              <button type="submit" className="rounded bg-[#0047AB] px-4 py-2 text-sm text-white hover:bg-[#002d6e]">Зберегти профіль</button>
            </div>
          </form>

          <form
            action={async (formData) => {
              await uploadOrganizationLogo(formData)
            }}
            className="mt-4 flex items-center gap-3"
          >
            <input type="file" name="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" required className="text-sm" />
            <button type="submit" className="rounded border border-[#0047AB] px-3 py-1.5 text-xs text-[#0047AB] hover:bg-[#0047AB] hover:text-white">Завантажити логотип</button>
            {organization.logoUrl && <img src={organization.logoUrl} alt="logo" className="h-10 w-10 rounded border border-gray-200 object-cover" />}
          </form>
        </div>
      )}

      {team && (
        <div className="blueprint-panel mb-8">
          <div className="panel-title">
            <span>КОРИСТУВАЧІ ОРГАНІЗАЦІЇ</span>
          </div>
          <p className="mb-2 text-sm text-gray-700">
            План: <span className="font-medium text-[#002d6e]">{team.organization.planName}</span> •
            {' '}Користувачів: <span className="font-medium">{team.organization.seatsUsed}/{team.organization.seatsLimit}</span>
          </p>
          <p className="mb-4 text-xs text-gray-500">
            Ліміт користувачів включає власника організації.
          </p>
          {teamNotice && <p className="mb-3 text-sm text-[#0047AB]">{teamNotice}</p>}

          <form
            action={async (formData) => {
              await addOrganizationUser(formData)
            }}
            className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3"
          >
            <label className="text-sm text-gray-700">
              Ім'я
              <input name="name" required minLength={2} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
            </label>
            <label className="text-sm text-gray-700">
              Email
              <input type="email" name="email" required className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
            </label>
            <label className="text-sm text-gray-700">
              Пароль
              <input type="password" name="password" required minLength={8} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
            </label>
            <label className="text-sm text-gray-700">
              Роль в організації
              <select name="organizationRole" defaultValue="MEMBER" className="mt-1 w-full rounded border border-gray-300 px-3 py-2">
                <option value="MEMBER">MEMBER</option>
                <option value="MARKETPLACE_MANAGER">MARKETPLACE_MANAGER</option>
              </select>
            </label>
            <div className="md:col-span-3 flex justify-end">
              <button
                type="submit"
                disabled={team.organization.seatsUsed >= team.organization.seatsLimit}
                className="rounded bg-[#0047AB] px-4 py-2 text-sm text-white hover:bg-[#002d6e] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Додати користувача
              </button>
            </div>
          </form>

          <div className="space-y-2">
            {team.users.map((member) => (
              <div key={member.id} className="flex flex-col gap-1 border border-[#0047AB]/15 p-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="font-medium text-gray-900">{member.name || 'Без імені'}</p>
                  <p className="text-xs text-gray-500">{member.email}</p>
                </div>
                <div className="text-xs text-gray-600">
                  <p>Роль в організації: {member.organizationRole}</p>
                  <p>Додано: {new Date(member.joinedAt).toLocaleDateString('uk-UA')}</p>
                </div>
              </div>
            ))}
            {team.users.length === 0 && <p className="text-sm text-gray-500">Поки що в організації немає користувачів.</p>}
          </div>
        </div>
      )}

      {organization && (
        <div className="blueprint-panel mb-8">
          <div className="panel-title">
            <span>МОЇ ПОЗИЦІЇ МАРКЕТПЛЕЙСУ</span>
          </div>
          {listingNotice && <p className="mb-3 text-sm text-[#0047AB]">{listingNotice}</p>}

          <p className="mb-3 text-xs text-gray-500">
            Публікація доступна лише для платних планів: Professional (до 100) та Investor (до 1000).
          </p>
          {plan.code === 'start' && (
            <div className="mb-3 rounded border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800">
              План Start має перегляд маркетплейсу без публікації. Для продажу товарів та послуг оновіть план до Professional або Investor.
            </div>
          )}
          <p className="mb-3 text-xs text-gray-500">
            Активні позиції: {activeMarketplaceListings}/{marketplaceLimit || 0}
          </p>
          <div className="mb-3 flex justify-end">
            <button type="button" onClick={() => void restoreSuspendedListings()} className="rounded border border-[#0047AB]/30 px-3 py-1.5 text-xs text-[#0047AB] hover:bg-[#0047AB] hover:text-white">
              Відновити призупинені оголошення
            </button>
          </div>

          {!canManageMarketplaceByPlan && (
            <p className="mb-3 text-sm text-amber-700">Ваш поточний план дозволяє лише перегляд маркетплейсу.</p>
          )}

          <form
            action={async (formData) => {
              await createListing(formData)
            }}
            className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2"
          >
            <label className="text-sm text-gray-700">Назва<input name="title" required className="mt-1 w-full rounded border border-gray-300 px-3 py-2" /></label>
            <label className="text-sm text-gray-700">Slug<input name="slug" required className="mt-1 w-full rounded border border-gray-300 px-3 py-2" /></label>
            <label className="text-sm text-gray-700">Тип<select name="type" defaultValue="GOOD" className="mt-1 w-full rounded border border-gray-300 px-3 py-2"><option value="GOOD">Товар</option><option value="SERVICE">Послуга</option></select></label>
            <label className="text-sm text-gray-700">Ціна, грн<input name="priceUah" type="number" min={0} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" /></label>
            <label className="text-sm text-gray-700 md:col-span-2">Короткий опис<input name="shortDescription" className="mt-1 w-full rounded border border-gray-300 px-3 py-2" /></label>
            <label className="text-sm text-gray-700 md:col-span-2">Опис<textarea name="description" required minLength={10} rows={3} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" /></label>
            <label className="text-sm text-gray-700">Статус<select name="status" defaultValue="DRAFT" className="mt-1 w-full rounded border border-gray-300 px-3 py-2"><option value="DRAFT">Чернетка</option><option value="PUBLISHED">Опублікувати</option></select></label>
            <label className="inline-flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" name="isPublic" defaultChecked /> Публічно</label>
            <input type="hidden" name="unit" value="" />
            <input type="hidden" name="minimumOrder" value="" />
            <input type="hidden" name="location" value="" />
            <input type="hidden" name="contactName" value="" />
            <input type="hidden" name="contactPhone" value="" />
            <input type="hidden" name="contactEmail" value="" />
            <input type="hidden" name="websiteUrl" value="" />
            <input type="hidden" name="coverImageUrl" value="" />
            <div className="md:col-span-2 flex justify-end">
              <button type="submit" disabled={!canManageMarketplaceByPlan || marketplaceAtLimit} className="rounded bg-[#0047AB] px-4 py-2 text-sm text-white hover:bg-[#002d6e] disabled:cursor-not-allowed disabled:opacity-60">Додати позицію</button>
            </div>
          </form>

          <div className="space-y-2">
            {listings.map((listing) => (
              <div key={listing.id} className="flex flex-col justify-between gap-2 border border-[#0047AB]/15 p-3 lg:flex-row lg:items-center">
                <div>
                  <p className="font-medium text-gray-900">{listing.title}</p>
                  <p className="text-xs text-gray-500">/{listing.slug} • {listing.type} • {listing.status}{listing.archivedReason === 'BILLING_SUSPENDED' ? ' • BILLING_SUSPENDED' : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">{listing.priceMinor !== null ? formatMoneyUahFromMinor(listing.priceMinor) : '—'}</span>
                  <button onClick={() => void archiveListing(listing.id)} className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50">Архівувати</button>
                </div>
              </div>
            ))}
            {listings.length === 0 && <p className="text-sm text-gray-500">Поки що немає позицій.</p>}
          </div>
        </div>
      )}

      <div className="blueprint-panel mb-8">
        <div className="panel-title">
          <span>МОЇ РАХУНКИ</span>
        </div>
        {invoices.length === 0 ? (
          <p className="text-sm text-gray-600">У вас ще немає рахунків на оплату.</p>
        ) : (
          <div className="space-y-2">
            {invoices.slice(0, 8).map((invoice) => (
              <div key={invoice.id} className="flex flex-col justify-between gap-2 border border-[#0047AB]/15 p-3 lg:flex-row lg:items-center">
                <div>
                  <p className="font-mono text-xs text-[#002d6e]">{invoice.number}</p>
                  <p className="text-sm text-gray-700">{invoice.membership?.plan.name ?? 'План не задано'}</p>
                </div>
                <div className="text-sm text-gray-700">
                  <p>Сума: {formatMoneyUahFromMinor(invoice.amountMinor)}</p>
                  <p>Сплачено: {formatMoneyUahFromMinor(invoice.paidMinor)}</p>
                </div>
                <div className="text-sm text-gray-700">
                  <p>Статус: {statusLabelUk(invoice.status)}</p>
                  <p>До: {invoice.dueAt ? new Date(invoice.dueAt).toLocaleDateString('uk-UA') : '—'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="blueprint-panel">
        <div className="panel-title">
          <span>МОЇ ПЛАТЕЖІ</span>
        </div>
        <p className="mb-3 text-xs text-gray-500">Річний рахунок формується за правилами обраного плану.</p>
        {payments.length === 0 ? (
          <p className="text-sm text-gray-600">Платежі ще не зафіксовані.</p>
        ) : (
          <div className="space-y-2">
            {payments.slice(0, 8).map((payment) => (
              <div key={payment.id} className="flex flex-col justify-between gap-2 border border-[#0047AB]/15 p-3 lg:flex-row lg:items-center">
                <p className="font-mono text-xs text-[#002d6e]">{payment.invoice.number}</p>
                <p className="text-sm text-gray-700">{formatMoneyUahFromMinor(payment.amountMinor)}</p>
                <p className="text-sm text-gray-700">{statusLabelUk(payment.status)}</p>
                <p className="text-xs text-gray-500">{payment.paidAt ? new Date(payment.paidAt).toLocaleDateString('uk-UA') : '—'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
