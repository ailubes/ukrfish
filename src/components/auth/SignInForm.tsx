'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { signIn } from 'next-auth/react'
import { Eye, EyeOff } from 'lucide-react'

interface SignInFormProps {
  callbackUrl: string
  initialError?: string
  initialEmail?: string
}

function resolveSignInError(errorCode?: string | null): string {
  if (!errorCode) {
    return 'Невірний email або пароль.'
  }

  if (errorCode === 'CredentialsSignin') {
    return 'Невірний email або пароль.'
  }

  if (errorCode === 'Configuration') {
    return 'Помилка конфігурації авторизації. Перевірте AUTH_SECRET та DATABASE_URL.'
  }

  return `Помилка входу: ${errorCode}`
}

export function SignInForm({ callbackUrl, initialError = '', initialEmail = '' }: SignInFormProps) {
  const router = useRouter()

  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState(initialError)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')

    const result = await signIn('credentials', {
      email: email.trim(),
      password,
      redirect: false,
      callbackUrl,
    })

    if (!result || result.error) {
      setError(resolveSignInError(result?.error))
      setIsSubmitting(false)
      return
    }

    router.push(result.url ?? callbackUrl)
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-4">
      <div className="w-full max-w-md border border-[#0047AB]/20 bg-white p-6 sm:p-8">
        <h1 className="text-2xl font-semibold text-[#002d6e] mb-2">Вхід</h1>
        <p className="text-sm text-gray-600 mb-6">Увійдіть у ваш кабінет UKRFISH.</p>

        <form onSubmit={onSubmit} className="space-y-4">
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
            <span className="mb-1 block text-sm text-gray-700">Пароль</span>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full border border-gray-300 px-3 py-2 pr-11 focus:outline-none focus:border-[#0047AB]"
                placeholder="••••••••"
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

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#0047AB] text-white py-2.5 font-medium hover:bg-[#002d6e] disabled:opacity-60"
          >
            {isSubmitting ? 'Входимо...' : 'Увійти'}
          </button>
        </form>

        <p className="mt-5 text-sm text-gray-600">
          Немає акаунта?{' '}
          <Link
            className="text-[#0047AB] hover:text-[#002d6e] font-medium"
            href={`/auth/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          >
            Зареєструватися
          </Link>
        </p>
      </div>
    </div>
  )
}
