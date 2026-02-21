'use client'

import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { ArrowRight, CheckCircle2, KeyRound, ShieldCheck, UserRound } from 'lucide-react'

interface JoinSignUpFormProps {
  planCode: 'start' | 'professional' | 'investor'
  callbackUrl: string
}

interface RegisterTemporaryResponse {
  ok?: boolean
  error?: string
  email?: string
  temporaryPassword?: string
}

const PLAN_NAMES: Record<JoinSignUpFormProps['planCode'], string> = {
  start: 'Старт',
  professional: 'Професіонал',
  investor: 'Інвестор',
}

const PLAN_BILLING_HINTS: Record<JoinSignUpFormProps['planCode'], string> = {
  start: 'Безкоштовний план для старту',
  professional: '3 міс — ₴1,500 або 12 міс — ₴5,000',
  investor: '1 міс — ₴5,000 або 12 міс — ₴50,000',
}

export function JoinSignUpForm({ planCode, callbackUrl }: JoinSignUpFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [temporaryPassword, setTemporaryPassword] = useState('')
  const [createdEmail, setCreatedEmail] = useState('')
  const [copied, setCopied] = useState(false)

  async function copyPassword() {
    if (!temporaryPassword) {
      return
    }
    await navigator.clipboard.writeText(temporaryPassword)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1200)
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)

    const response = await fetch('/api/auth/register-temporary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        organizationName: organizationName.trim() || undefined,
      }),
    })

    const payload = (await response.json().catch(() => ({}))) as RegisterTemporaryResponse

    if (!response.ok || !payload.ok || !payload.temporaryPassword || !payload.email) {
      setError(payload.error ?? 'Не вдалося створити тимчасовий акаунт.')
      setIsSubmitting(false)
      return
    }

    setCreatedEmail(payload.email)
    setTemporaryPassword(payload.temporaryPassword)
    setIsSubmitting(false)
  }

  if (temporaryPassword && createdEmail) {
    const signInUrl = `/auth/signin?email=${encodeURIComponent(createdEmail)}&callbackUrl=${encodeURIComponent(callbackUrl)}`

    return (
      <div className="min-h-screen bg-[linear-gradient(145deg,#f8fafc_0%,#eef5ff_65%,#fdf8e6_100%)] px-4 py-8 sm:py-12">
        <div className="mx-auto w-full max-w-2xl border border-[#0047AB]/20 bg-white p-6 shadow-[0_18px_50px_rgba(0,71,171,0.12)] sm:p-8">
          <div className="mb-4 inline-flex items-center gap-2 border border-green-600/20 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700">
            <CheckCircle2 className="h-4 w-4" />
            Крок 1 завершено
          </div>
          <h1 className="mb-2 text-2xl font-semibold text-[#002d6e]">Тимчасовий пароль створено</h1>
          <p className="mb-6 text-sm text-gray-600">
            Для плану <strong>{PLAN_NAMES[planCode]}</strong> використайте ці дані для входу, а далі заповніть повну форму членства.
          </p>

          <div className="mb-5 rounded border border-[#0047AB]/30 bg-[#f8fbff] p-4">
            <p className="mb-1 text-xs text-gray-500">Email</p>
            <p className="mb-3 font-medium text-gray-800">{createdEmail}</p>
            <p className="mb-1 text-xs text-gray-500">Тимчасовий пароль</p>
            <p className="font-mono text-lg text-[#002d6e] break-all">{temporaryPassword}</p>
          </div>

          <div className="mb-4 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={copyPassword}
              className="inline-flex flex-1 items-center justify-center gap-2 border border-[#0047AB] px-4 py-2.5 text-sm font-medium text-[#0047AB] transition-colors hover:bg-[#0047AB] hover:text-white"
            >
              <KeyRound className="h-4 w-4" />
              {copied ? 'Скопійовано' : 'Скопіювати пароль'}
            </button>
            <Link
              href={signInUrl}
              className="inline-flex flex-1 items-center justify-center gap-2 bg-[#0047AB] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#002d6e]"
            >
              Перейти до входу
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <p className="text-xs text-gray-500">
            Після входу система автоматично перенаправить вас на форму заявки.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(145deg,#f8fafc_0%,#eef5ff_65%,#fdf8e6_100%)] px-4 py-8 sm:py-12">
      <div className="mx-auto grid w-full max-w-5xl overflow-hidden border border-[#0047AB]/20 bg-white shadow-[0_18px_50px_rgba(0,71,171,0.12)] lg:grid-cols-[1.05fr_1fr]">
        <aside className="border-b border-[#0047AB]/15 bg-gradient-to-br from-[#002d6e] to-[#0047AB] p-6 text-white sm:p-8 lg:border-b-0 lg:border-r lg:border-[#facc15]/30">
          <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 text-xs font-medium tracking-wide">
            <ShieldCheck className="h-4 w-4 text-[#facc15]" />
            ШВИДКИЙ ВХІД ДО ЧЛЕНСТВА
          </div>
          <h1 className="mt-4 text-2xl font-semibold leading-tight sm:text-3xl">
            Почнімо оформлення плану «{PLAN_NAMES[planCode]}»
          </h1>
          <p className="mt-3 text-sm text-white/80">
            {PLAN_BILLING_HINTS[planCode]}
          </p>

          <div className="mt-7 space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 inline-flex h-7 w-7 items-center justify-center bg-[#facc15] text-xs font-bold text-[#002d6e]">1</div>
              <p className="text-sm text-white/90">Створіть тимчасовий акаунт за 30 секунд</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 inline-flex h-7 w-7 items-center justify-center bg-white/15 text-xs font-bold text-white">2</div>
              <p className="text-sm text-white/90">Увійдіть із тимчасовим паролем</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 inline-flex h-7 w-7 items-center justify-center bg-white/15 text-xs font-bold text-white">3</div>
              <p className="text-sm text-white/90">Заповніть повну форму заявки на членство</p>
            </div>
          </div>

          <div className="mt-8 border border-white/20 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-wider text-white/70">Обраний план</p>
            <p className="mt-1 text-lg font-semibold">{PLAN_NAMES[planCode]}</p>
            <p className="mt-1 text-sm text-white/75">{PLAN_BILLING_HINTS[planCode]}</p>
          </div>
        </aside>

        <section className="p-6 sm:p-8">
          <h2 className="text-2xl font-semibold text-[#002d6e]">Швидка реєстрація</h2>
          <p className="mt-2 text-sm text-gray-600">
            Заповніть дані нижче, і ми одразу створимо для вас тимчасовий пароль.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Ім&apos;я</span>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  required
                  minLength={2}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full border border-gray-300 py-2.5 pl-10 pr-3 focus:border-[#0047AB] focus:outline-none"
                  placeholder="Ваше ім'я"
                  autoComplete="name"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full border border-gray-300 px-3 py-2.5 focus:border-[#0047AB] focus:outline-none"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </label>

            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Організація (необов&apos;язково)</span>
              <input
                type="text"
                value={organizationName}
                onChange={(event) => setOrganizationName(event.target.value)}
                className="w-full border border-gray-300 px-3 py-2.5 focus:border-[#0047AB] focus:outline-none"
                placeholder="Назва організації"
                autoComplete="organization"
              />
            </label>

            {error && (
              <p className="border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 bg-[#0047AB] py-2.5 font-medium text-white transition-colors hover:bg-[#002d6e] disabled:opacity-60"
            >
              {isSubmitting ? 'Створюємо...' : 'Отримати тимчасовий пароль'}
              {!isSubmitting && <ArrowRight className="h-4 w-4" />}
            </button>

            <p className="text-xs text-gray-500">
              Натискаючи кнопку, ви переходите до етапу входу і завершення заявки.
            </p>
          </form>
        </section>
      </div>
    </div>
  )
}
