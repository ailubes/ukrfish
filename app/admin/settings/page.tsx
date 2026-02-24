import { requireAdminPage } from '@/lib/admin-auth'
import { getBillingIssuerSettings } from '@/lib/billing-issuer'
import { upsertBillingIssuerSettingsAction } from '../actions'

export default async function AdminSettingsPage() {
  await requireAdminPage('/admin/settings')

  const issuer = await getBillingIssuerSettings()

  return (
    <section className="space-y-5">
      <header className="rounded border border-[#0047AB]/15 bg-white p-5">
        <h2 className="text-2xl font-semibold text-[#1a1a1a]">Налаштування білінгу</h2>
        <p className="text-sm text-gray-600">Єдиний профіль виставника для всіх рахунків платформи.</p>
      </header>

      <div className="rounded border border-gray-200 bg-white p-4">
        <p className="mb-3 text-sm font-semibold text-[#002d6e]">Реквізити виставника рахунків</p>
        <form action={upsertBillingIssuerSettingsAction} className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="text-sm text-gray-700">
            Юридична назва
            <input name="legalName" required minLength={2} defaultValue={issuer?.legalName ?? 'Громадська спілка "Риба України"'} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
          </label>

          <label className="text-sm text-gray-700">
            Коротка назва
            <input name="shortName" required minLength={2} defaultValue={issuer?.shortName ?? 'ГС "Риба України"'} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
          </label>

          <label className="text-sm text-gray-700 md:col-span-2">
            Юридична адреса
            <input name="legalAddress" required minLength={5} defaultValue={issuer?.legalAddress ?? ''} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
          </label>

          <label className="text-sm text-gray-700">
            ЄДРПОУ
            <input name="edrpou" required pattern="\d{8,10}" defaultValue={issuer?.edrpou ?? ''} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
          </label>

          <label className="text-sm text-gray-700">
            IBAN
            <input name="iban" required defaultValue={issuer?.iban ?? ''} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
          </label>

          <label className="text-sm text-gray-700">
            Банк
            <input name="bankName" required minLength={2} defaultValue={issuer?.bankName ?? ''} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
          </label>

          <label className="text-sm text-gray-700">
            МФО
            <input name="mfo" defaultValue={issuer?.mfo ?? ''} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
          </label>

          <label className="text-sm text-gray-700">
            Номер ПДВ
            <input name="vatNumber" defaultValue={issuer?.vatNumber ?? ''} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
          </label>

          <label className="text-sm text-gray-700">
            Підписант (ПІБ)
            <input name="signatoryName" defaultValue={issuer?.signatoryName ?? ''} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
          </label>

          <label className="text-sm text-gray-700">
            Посада підписанта
            <input name="signatoryPosition" defaultValue={issuer?.signatoryPosition ?? ''} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
          </label>

          <label className="text-sm text-gray-700">
            Email
            <input name="email" type="email" defaultValue={issuer?.email ?? ''} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
          </label>

          <label className="text-sm text-gray-700">
            Телефон
            <input name="phone" defaultValue={issuer?.phone ?? ''} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
          </label>

          <label className="text-sm text-gray-700 md:col-span-2">
            Website
            <input name="website" type="url" defaultValue={issuer?.website ?? ''} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
          </label>

          <div className="md:col-span-2 flex justify-end">
            <button type="submit" className="rounded bg-[#0047AB] px-4 py-2 text-sm font-medium text-white hover:bg-[#002d6e]">
              Зберегти реквізити
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
