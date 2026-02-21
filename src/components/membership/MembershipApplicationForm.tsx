'use client'

import { FormEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { type MembershipPlanCode } from '@/lib/membership'

interface MembershipApplicationFormProps {
  planCode: MembershipPlanCode
  userEmail: string
  userName: string
}

interface ApplyResponse {
  ok?: boolean
  membershipId?: string
  error?: string
}

const PLAN_LABELS: Record<MembershipPlanCode, string> = {
  start: 'Старт',
  professional: 'Професіонал',
  investor: 'Інвестор',
}

export function MembershipApplicationForm({
  planCode,
  userEmail,
  userName,
}: MembershipApplicationFormProps) {
  const router = useRouter()
  const [fullName, setFullName] = useState(userName)
  const [organizationName, setOrganizationName] = useState('')
  const [legalType, setLegalType] = useState<'fop' | 'ltd'>('fop')
  const [contactPhone, setContactPhone] = useState('')
  const [kvedCodes, setKvedCodes] = useState('')
  const [iban, setIban] = useState('')
  const [bankName, setBankName] = useState('')
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'QUARTERLY' | 'YEARLY'>('MONTHLY')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const planLabel = useMemo(() => PLAN_LABELS[planCode], [planCode])

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    const response = await fetch('/api/membership/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planCode,
        billingCycle,
        organizationName: organizationName.trim() || undefined,
        legalType,
        contactPhone: contactPhone.trim() || undefined,
        kvedCodes: kvedCodes.trim() || undefined,
        iban: iban.trim() || undefined,
        bankName: bankName.trim() || undefined,
        applicantName: fullName.trim() || undefined,
        notes: notes.trim() || undefined,
      }),
    })

    const payload = (await response.json().catch(() => ({}))) as ApplyResponse

    if (!response.ok || !payload.ok) {
      setError(payload.error ?? 'Не вдалося подати заявку.')
      setIsSubmitting(false)
      return
    }

    router.push('/cabinet')
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 sm:p-8">
      <div className="mx-auto max-w-2xl border border-[#0047AB]/20 bg-white p-6 sm:p-8">
        <h1 className="text-2xl font-semibold text-[#002d6e] mb-2">Повна форма заявки</h1>
        <p className="text-sm text-gray-600 mb-6">
          Ви подаєте заявку на план <strong>{planLabel}</strong>.
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1 block text-sm text-gray-700">ПІБ / Контактна особа</span>
              <input
                type="text"
                required
                minLength={2}
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#0047AB]"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-gray-700">Email</span>
              <input
                type="email"
                disabled
                value={userEmail}
                className="w-full border border-gray-200 bg-gray-100 px-3 py-2 text-gray-600"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-sm text-gray-700">Організація</span>
            <input
              type="text"
              required
              minLength={2}
              value={organizationName}
              onChange={(event) => setOrganizationName(event.target.value)}
              className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#0047AB]"
              placeholder="Назва юридичної особи / ФОП"
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1 block text-sm text-gray-700">Тип суб'єкта</span>
              <select
                value={legalType}
                onChange={(event) => setLegalType(event.target.value as 'fop' | 'ltd')}
                className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#0047AB]"
              >
                <option value="fop">ФОП</option>
                <option value="ltd">ТОВ</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-gray-700">Телефон</span>
              <input
                type="text"
                required
                value={contactPhone}
                onChange={(event) => setContactPhone(event.target.value)}
                className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#0047AB]"
                placeholder="+380..."
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1 block text-sm text-gray-700">КВЕД коди</span>
              <input
                type="text"
                required
                value={kvedCodes}
                onChange={(event) => setKvedCodes(event.target.value)}
                className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#0047AB]"
                placeholder="03.22, 10.20"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-gray-700">Цикл оплати</span>
              <select
                value={billingCycle}
                onChange={(event) =>
                  setBillingCycle(event.target.value as 'MONTHLY' | 'QUARTERLY' | 'YEARLY')
                }
                className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#0047AB]"
              >
                <option value="MONTHLY">Щомісяця</option>
                <option value="QUARTERLY">Щокварталу</option>
                <option value="YEARLY">Щороку</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="mb-1 block text-sm text-gray-700">IBAN</span>
              <input
                type="text"
                required
                value={iban}
                onChange={(event) => setIban(event.target.value)}
                className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#0047AB]"
                placeholder="UA..."
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm text-gray-700">Банк</span>
              <input
                type="text"
                required
                value={bankName}
                onChange={(event) => setBankName(event.target.value)}
                className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#0047AB]"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-sm text-gray-700">Додаткові нотатки</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#0047AB]"
              rows={4}
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#0047AB] text-white py-2.5 font-medium hover:bg-[#002d6e] disabled:opacity-60"
          >
            {isSubmitting ? 'Надсилаємо...' : 'Подати заявку'}
          </button>
        </form>
      </div>
    </div>
  )
}
