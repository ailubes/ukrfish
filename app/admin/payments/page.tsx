import { requireAdminPage } from '@/lib/admin-auth'
import { formatMoneyUahFromMinor, statusLabelUk } from '@/lib/billing'
import { prisma } from '@/lib/prisma'
import { HelpTooltip } from '../_components/help-tooltip'
import { confirmPaymentAction, recordPaymentAction, rejectPaymentAction } from '../actions'
import { type PaymentStatus, type Prisma } from '@prisma/client'

interface AdminPaymentsPageProps {
  searchParams?: Promise<{
    invoiceId?: string
    status?: string
    q?: string
    page?: string
  }>
}

const PAGE_SIZE = 25
const PAYMENT_STATUSES: PaymentStatus[] = ['PENDING', 'CONFIRMED', 'REJECTED', 'FAILED', 'REFUNDED']

function isPaymentStatus(value: string): value is PaymentStatus {
  return PAYMENT_STATUSES.includes(value as PaymentStatus)
}

function paymentStatusClass(status: string): string {
  if (status === 'CONFIRMED') return 'bg-green-100 text-green-700'
  if (status === 'PENDING') return 'bg-amber-100 text-amber-700'
  if (status === 'REJECTED') return 'bg-red-100 text-red-700'
  return 'bg-slate-100 text-slate-700'
}

export default async function AdminPaymentsPage({ searchParams }: AdminPaymentsPageProps) {
  await requireAdminPage('/admin/payments')

  const params = searchParams ? await searchParams : undefined
  const invoiceIdFilter = params?.invoiceId?.trim() || undefined
  const statusFilter = params?.status?.trim() || 'all'
  const query = params?.q?.trim() || ''
  const page = Math.max(1, Number.parseInt(params?.page ?? '1', 10) || 1)

  const where: Prisma.PaymentWhereInput = {
    ...(invoiceIdFilter ? { invoiceId: invoiceIdFilter } : {}),
    ...(isPaymentStatus(statusFilter) ? { status: statusFilter } : {}),
    ...(query
      ? {
          OR: [
            { payerReference: { contains: query } },
            { invoice: { number: { contains: query } } },
            { invoice: { user: { email: { contains: query } } } },
            { invoice: { user: { name: { contains: query } } } },
          ],
        }
      : {}),
  }

  const [invoices, payments, totalPayments] = await Promise.all([
    prisma.invoice.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: true },
      take: 100,
    }),
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        invoice: {
          include: {
            user: true,
          },
        },
      },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.payment.count({ where }),
  ])

  const totalPages = Math.max(1, Math.ceil(totalPayments / PAGE_SIZE))
  const hasPrevPage = page > 1
  const hasNextPage = page < totalPages

  function hrefWith(next: { page?: number; status?: string; q?: string; invoiceId?: string }): string {
    const p = new URLSearchParams()
    const resolvedPage = next.page ?? page
    const resolvedStatus = next.status ?? statusFilter
    const resolvedQuery = next.q ?? query
    const resolvedInvoiceId = next.invoiceId ?? invoiceIdFilter

    if (resolvedPage > 1) p.set('page', String(resolvedPage))
    if (resolvedStatus && resolvedStatus !== 'all') p.set('status', resolvedStatus)
    if (resolvedQuery) p.set('q', resolvedQuery)
    if (resolvedInvoiceId) p.set('invoiceId', resolvedInvoiceId)

    const qs = p.toString()
    return qs ? `/admin/payments?${qs}` : '/admin/payments'
  }

  return (
    <section className="space-y-5">
      <header className="rounded border border-[#0047AB]/15 bg-white p-5">
        <h2 className="text-2xl font-semibold text-[#1a1a1a]">Платежі та верифікація</h2>
        <p className="text-sm text-gray-600">Додавайте отримані платежі вручну та підтверджуйте їх після перевірки.</p>
      </header>

      <div className="rounded border border-gray-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-[#002d6e]">Ручне додавання платежу</p>
          <HelpTooltip text="Платіж потрапляє в статус 'Очікує перевірки'. Після підтвердження сума зараховується до рахунку." />
        </div>

        <form action={recordPaymentAction} className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="text-sm text-gray-700">
            Рахунок
            <select name="invoiceId" required defaultValue={invoiceIdFilter ?? ''} className="mt-1 w-full rounded border border-gray-300 px-3 py-2">
              <option value="">Оберіть рахунок</option>
              {invoices.map((invoice) => (
                <option key={invoice.id} value={invoice.id}>
                  {invoice.number} — {invoice.user.email}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-gray-700">
            Сума, грн
            <input type="number" name="amountUah" step="0.01" min={0.01} required className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
          </label>

          <label className="text-sm text-gray-700">
            Метод
            <select name="method" defaultValue="BANK_TRANSFER" className="mt-1 w-full rounded border border-gray-300 px-3 py-2">
              <option value="BANK_TRANSFER">Банківський переказ</option>
              <option value="CARD">Картка</option>
              <option value="CASHLESS">Безготівково</option>
              <option value="OTHER">Інше</option>
            </select>
          </label>

          <label className="text-sm text-gray-700">
            Дата оплати
            <input type="date" name="paidAt" required className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
          </label>

          <label className="text-sm text-gray-700">
            Референс платежу
            <input type="text" name="payerReference" className="mt-1 w-full rounded border border-gray-300 px-3 py-2" placeholder="Номер транзакції/призначення" />
          </label>

          <label className="text-sm text-gray-700 md:col-span-2">
            Коментар перевірки
            <textarea name="proofNote" rows={2} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" placeholder="Текстове підтвердження: банк, платник, деталі звірки" />
          </label>

          <div className="md:col-span-2 flex justify-end">
            <button type="submit" className="rounded bg-[#0047AB] px-4 py-2 text-sm font-medium text-white hover:bg-[#002d6e]">
              Додати платіж
            </button>
          </div>
        </form>
      </div>

      <div className="overflow-hidden rounded border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <p className="text-sm font-medium text-[#1a1a1a]">Журнал платежів</p>
          <HelpTooltip text="Підтверджений платіж автоматично оновлює суму сплати і статус пов'язаного рахунку." />
        </div>

        <form method="GET" className="grid grid-cols-1 gap-3 border-b border-gray-100 bg-[#f8fafc] px-4 py-3 md:grid-cols-4">
          <input type="hidden" name="invoiceId" value={invoiceIdFilter ?? ''} />
          <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Пошук
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Референс, номер рахунку, email"
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm normal-case"
            />
          </label>
          <label className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Статус
            <select name="status" defaultValue={statusFilter} className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm normal-case">
              <option value="all">Усі статуси</option>
              {PAYMENT_STATUSES.map((status) => (
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
            <a href="/admin/payments" className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100">
              Скинути
            </a>
          </div>
        </form>

        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Рахунок</th>
              <th className="px-4 py-3">Платник</th>
              <th className="px-4 py-3">Сума</th>
              <th className="px-4 py-3">Статус</th>
              <th className="px-4 py-3">Референс</th>
              <th className="px-4 py-3">Дата</th>
              <th className="px-4 py-3">Дії</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td className="px-4 py-3 font-mono text-xs text-[#002d6e]">{payment.invoice.number}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{payment.invoice.user.name ?? 'Без імені'}</div>
                  <div className="text-xs text-gray-500">{payment.invoice.user.email}</div>
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">{formatMoneyUahFromMinor(payment.amountMinor)}</td>
                <td className="px-4 py-3">
                  <span className={`rounded px-2 py-1 text-xs font-medium ${paymentStatusClass(payment.status)}`}>
                    {statusLabelUk(payment.status)}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-600">{payment.payerReference || '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{payment.paidAt ? new Date(payment.paidAt).toLocaleDateString('uk-UA') : '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <form action={confirmPaymentAction}>
                      <input type="hidden" name="paymentId" value={payment.id} />
                      <button type="submit" className="rounded bg-green-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-green-700" disabled={payment.status !== 'PENDING'}>
                        Підтвердити
                      </button>
                    </form>
                    <form action={rejectPaymentAction}>
                      <input type="hidden" name="paymentId" value={payment.id} />
                      <button type="submit" className="rounded bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700" disabled={payment.status !== 'PENDING'}>
                        Відхилити
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {payments.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-500">
                  За поточними фільтрами платежів не знайдено.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-sm">
          <p className="text-gray-600">
            Показано {payments.length} з {totalPayments}
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
