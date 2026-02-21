'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Clock3, Lock, ShieldCheck, UserRound } from 'lucide-react'
import {
  MEMBERSHIP_FEATURE_LABELS,
  getPlanByCode,
  type MembershipFeatureCode,
  type MembershipPlanCode,
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
      code: MembershipPlanCode
      name: string
      description: string
      monthlyPriceUah: number
    }
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
      code: MembershipPlanCode
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
    ])
      .then(([membershipPayload, invoicesPayload, paymentsPayload]) => {
        if (!cancelled) {
          setData(membershipPayload)
          setInvoices(invoicesPayload.invoices || [])
          setPayments(paymentsPayload.payments || [])
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
  const plan = membership?.plan ?? getPlanByCode('start')

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
          <Link href="/membership" className="btn-primary inline-flex items-center justify-center">
            Подати заявку
          </Link>
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
        <p className="mb-3 text-xs text-gray-500">Річний рахунок розраховується як 10 місяців замість 12.</p>
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
