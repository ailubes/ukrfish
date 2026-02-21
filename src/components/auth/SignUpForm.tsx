'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { signIn } from 'next-auth/react'
import { Eye, EyeOff } from 'lucide-react'

interface RegisterResponse {
  ok?: boolean
  error?: string
}

interface SignUpFormProps {
  callbackUrl: string
}

export function SignUpForm({ callbackUrl }: SignUpFormProps) {
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Паролі не співпадають.')
      return
    }

    setIsSubmitting(true)

    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email: email.trim(),
        password,
        organizationName: organizationName.trim() || undefined,
      }),
    })

    const payload = (await response.json().catch(() => ({}))) as RegisterResponse

    if (!response.ok || !payload.ok) {
      setError(payload.error ?? 'Не вдалося зареєструватися.')
      setIsSubmitting(false)
      return
    }

    const loginResult = await signIn('credentials', {
      email: email.trim(),
      password,
      redirect: false,
      callbackUrl,
    })

    if (!loginResult || loginResult.error) {
      setError('Акаунт створено, але автоматичний вхід не вдався. Спробуйте увійти вручну.')
      setIsSubmitting(false)
      return
    }

    router.push(loginResult.url ?? callbackUrl)
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <div className="w-full max-w-md border border-[#0047AB]/20 bg-white p-6 sm:p-8">
        <h1 className="text-2xl font-semibold text-[#002d6e] mb-2">Реєстрація</h1>
        <p className="text-sm text-gray-600 mb-6">Створіть акаунт для роботи з членством UKRFISH.</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm text-gray-700">Ім'я</span>
            <input
              type="text"
              required
              minLength={2}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#0047AB]"
              placeholder="Ваше ім'я"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-gray-700">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#0047AB]"
              placeholder="you@example.com"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-gray-700">Організація (необов'язково)</span>
            <input
              type="text"
              value={organizationName}
              onChange={(event) => setOrganizationName(event.target.value)}
              className="w-full border border-gray-300 px-3 py-2 focus:outline-none focus:border-[#0047AB]"
              placeholder="Назва організації"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-gray-700">Пароль</span>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full border border-gray-300 px-3 py-2 pr-11 focus:outline-none focus:border-[#0047AB]"
                placeholder="Мінімум 8 символів"
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-gray-500 hover:text-[#0047AB]"
                aria-label={showPassword ? 'Сховати пароль' : 'Показати пароль'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-gray-700">Повторіть пароль</span>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                required
                minLength={8}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full border border-gray-300 px-3 py-2 pr-11 focus:outline-none focus:border-[#0047AB]"
                placeholder="Повторіть пароль"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((value) => !value)}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-gray-500 hover:text-[#0047AB]"
                aria-label={showConfirmPassword ? 'Сховати пароль' : 'Показати пароль'}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#0047AB] text-white py-2.5 font-medium hover:bg-[#002d6e] disabled:opacity-60"
          >
            {isSubmitting ? 'Створюємо акаунт...' : 'Зареєструватися'}
          </button>
        </form>

        <p className="mt-5 text-sm text-gray-600">
          Вже маєте акаунт?{' '}
          <Link
            className="text-[#0047AB] hover:text-[#002d6e] font-medium"
            href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          >
            Увійти
          </Link>
        </p>
      </div>
    </div>
  )
}
