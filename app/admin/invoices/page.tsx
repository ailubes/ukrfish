import { requireAdminPage } from '@/lib/admin-auth'
import { cycleLabelUk, formatMoneyUahFromMinor, statusLabelUk } from '@/lib/billing'
import { prisma } from '@/lib/prisma'
import { HelpTooltip } from '../_components/help-tooltip'
import { cancelInvoiceAction, createInvoiceAction } from '../actions'
import { type InvoiceStatus, type Prisma } from '@prisma/client'

interface AdminInvoicesPageProps {
  searchParams?: Promise<{
    userId?: string
    status?: string
    q?: string
    page?: string
  }>
}

const PAGE_SIZE = 20

const INVOICE_STATUSES: InvoiceStatus[] = [
  'DRAFT',
  'ISSUED',
  'PARTIALLY_PAID',
  'PAID',
  'OVERDUE',
  'CANCELED',
  'VOID',
]

function isInvoiceStatus(value: string): value is InvoiceStatus {
  return INVOICE_STATUSES.includes(value as InvoiceStatus)
}

function statusBadgeClass(status: string): string {
  if (status === 'PAID') return 'bg-green-100 text-green-700'
  if (status === 'PARTIALLY_PAID') return 'bg-blue-100 text-blue-700'
  if (status === 'ISSUED') return 'bg-amber-100 text-amber-700'
  if (status === 'CANCELED' || status === 'VOID') return 'bg-gray-100 text-gray-700'
  if (status === 'OVERDUE') return 'bg-red-100 text-red-700'
  return 'bg-slate-100 text-slate-700'
}

export default async function AdminInvoicesPage({ searchParams }: AdminInvoicesPageProps) {
  await requireAdminPage('/admin/invoices')

  const params = searchParams ? await searchParams : undefined
  const userIdFilter = params?.userId?.trim() || undefined
  const statusFilter = params?.status?.trim() || 'all'
  const query = params?.q?.trim() || ''
  const page = Math.max(1, Number.parseInt(params?.page ?? '1', 10) || 1)

  const where: Prisma.InvoiceWhereInput = {
    ...(userIdFilter ? { userId: userIdFilter } : {}),
    ...(isInvoiceStatus(statusFilter)
      ? { status: statusFilter }
      : {}),
    ...(query
      ? {
          OR: [
            { number: { contains: query } },
            { user: { email: { contains: query } } },
            { user: { name: { contains: query } } },
            { membership: { plan: { name: { contains: query } } } },
          ],
        }
      : {}),
  }

  const [memberships, invoices, totalInvoices] = await Promise.all([
    prisma.membership.findMany({
      where: {
        status: { in: ['PENDING_REVIEW', 'ACTIVE'] },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        plan: true,
        organization: true,
      },
    }),
    prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        membership: {
          include: {
            plan: true,
          },
        },
      },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.invoice.count({ where }),
  ])

  const totalPages = Math.max(1, Math.ceil(totalInvoices / PAGE_SIZE))
  const hasPrevPage = page > 1
  const hasNextPage = page < totalPages

  function hrefWith(next: { page?: number; status?: string; q?: string; userId?: string }): string {
    const p = new URLSearchParams()
    const resolvedPage = next.page ?? page
    const resolvedStatus = next.status ?? statusFilter
    const resolvedQuery = next.q ?? query
    const resolvedUserId = next.userId ?? userIdFilter

    if (resolvedPage > 1) p.set('page', String(resolvedPage))
    if (resolvedStatus && resolvedStatus !== 'all') p.set('status', resolvedStatus)
    if (resolvedQuery) p.set('q', resolvedQuery)
    if (resolvedUserId) p.set('userId', resolvedUserId)

    const qs = p.toString()
    return qs ? `/admin/invoices?${qs}` : '/admin/invoices'
  }

  return (
    <section className="space-y-5">
      <header className="rounded border border-[#0047AB]/15 bg-white p-5">
        <h2 className="text-2xl font-semibold text-[#1a1a1a]">Рахунки на оплату членства</h2>
        <p className="text-sm text-gray-600">Створюйте рахунки для учасників і контролюйте їх поточний статус.</p>
      </header>

      <div className="rounded border border-gray-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-[#002d6e]">Новий рахунок</p>
          <HelpTooltip text="Для річного циклу сума рахується як 10 місяців, а не 12." />
        </div>
        <form action={createInvoiceAction} className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="text-sm text-gray-700">
            Членство
            <select name="membershipId" required className="mt-1 w-full rounded border border-gray-300 px-3 py-2">
              <option value="">Оберіть членство</option>
              {memberships.map((membership) => (
                <option key={membership.id} value={membership.id}>
                  {(membership.user.name ?? membership.user.email) + ' — ' + membership.plan.name}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-gray-700">
            Цикл оплати
            <select name="billingCycle" defaultValue="MONTHLY" className="mt-1 w-full rounded border border-gray-300 px-3 py-2">
              <option value="MONTHLY">Щомісяця</option>
              <option value="QUARTERLY">Щокварталу</option>
              <option value="YEARLY">Щороку (10 міс.)</option>
            </select>
          </label>

          <label className="text-sm text-gray-700">
            Тип рахунку
            <select name="type" defaultValue="MEMBERSHIP_FEE" className="mt-1 w-full rounded border border-gray-300 px-3 py-2">
              <option value="MEMBERSHIP_FEE">Членський внесок</option>
              <option value="ADJUSTMENT">Коригування</option>
              <option value="PENALTY">Штраф</option>
              <option value="OTHER">Інше</option>
            </select>
          </label>

          <label className="text-sm text-gray-700">
            Сплатити до
            <input type="date" name="dueAt" required className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
          </label>

          <label className="text-sm text-gray-700 md:col-span-2">
            Примітка
            <textarea name="note" rows={2} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" placeholder="Реквізити, призначення платежу, додаткові умови" />
          </label>

          <div className="md:col-span-2 flex justify-end">
            <button type="submit" className="rounded bg-[#0047AB] px-4 py-2 text-sm font-medium text-white hover:bg-[#002d6e]">
              Створити рахунок
            </button>
          </div>
        </form>
      </div>

      <div className="overflow-hidden rounded border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <p className="text-sm font-medium text-[#1a1a1a]">Останні рахунки</p>
          <HelpTooltip text="Статус 'Частково сплачено' з'являється автоматично після підтвердження частини платежів." />
        </div>

        <form method="GET" className="grid grid-cols-1 gap-3 border-b border-gray-100 bg-[#f8fafc] px-4 py-3 md:grid-cols-4">
          <input type="hidden" name="userId" value={userIdFilter ?? ''} />
          <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Пошук
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Номер рахунку, ім'я, email"
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm normal-case"
            />
          </label>
          <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Статус
            <select name="status" defaultValue={statusFilter} className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm normal-case">
              <option value="all">Усі статуси</option>
              {INVOICE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {statusLabelUk(status)}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end gap-2 md:col-span-2">
            <button type="submit" className="rounded bg-[#0047AB] px-3 py-2 text-sm font-medium text-white hover:bg-[#002d6e]">
              Застосувати
            </button>
            <a href="/admin/invoices" className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100">
              Скинути
            </a>
          </div>
        </form>

        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Номер</th>
              <th className="px-4 py-3">Користувач</th>
              <th className="px-4 py-3">План / Цикл</th>
              <th className="px-4 py-3">Сума</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3">Дедлайн</th>
              <th className="px-4 py-3">Дії</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td className="px-4 py-3 font-mono text-xs text-[#002d6e]">{invoice.number}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{invoice.user.name ?? 'Без імені'}</div>
                  <div className="text-xs text-gray-500">{invoice.user.email}</div>
                </td>
                <td className="px-4 py-3 text-gray-700">
                  <div>{invoice.membership?.plan.name ?? '—'}</div>
                  <div className="text-xs text-gray-500">
                    {invoice.billingCycle ? cycleLabelUk(invoice.billingCycle) : 'Цикл не задано'}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{formatMoneyUahFromMinor(invoice.amountMinor)}</div>
                  <div className="text-xs text-gray-500">Сплачено: {formatMoneyUahFromMinor(invoice.paidMinor)}</div>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded px-2 py-1 text-xs font-medium ${statusBadgeClass(invoice.status)}`}>
                    {statusLabelUk(invoice.status)}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {invoice.dueAt ? new Date(invoice.dueAt).toLocaleDateString('uk-UA') : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <form action={cancelInvoiceAction}>
                      <input type="hidden" name="invoiceId" value={invoice.id} />
                      <button type="submit" className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 hover:bg-red-50">
                        Скасувати
                      </button>
                    </form>
                    <a href={`/admin/payments?invoiceId=${encodeURIComponent(invoice.id)}`} className="rounded border border-[#0047AB]/30 px-2 py-1 text-xs text-[#0047AB] hover:bg-[#0047AB] hover:text-white">
                      Платежі
                    </a>
                  </div>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                  За поточними фільтрами рахунків не знайдено.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-sm">
          <p className="text-gray-600">
            Показано {invoices.length} з {totalInvoices}
          </p>
          <div className="flex items-center gap-2">
            <a
              href={hrefWith({ page: page - 1 })}
              aria-disabled={!hasPrevPage}
              className={`rounded border px-3 py-1.5 ${hasPrevPage ? 'border-gray-300 text-gray-700 hover:bg-gray-100' : 'cursor-not-allowed border-gray-200 text-gray-400'}`}
            >
              Назад
            </a>
            <span className="text-gray-600">
              Сторінка {page} / {totalPages}
            </span>
            <a
              href={hrefWith({ page: page + 1 })}
              aria-disabled={!hasNextPage}
              className={`rounded border px-3 py-1.5 ${hasNextPage ? 'border-gray-300 text-gray-700 hover:bg-gray-100' : 'cursor-not-allowed border-gray-200 text-gray-400'}`}
            >
              Далі
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
