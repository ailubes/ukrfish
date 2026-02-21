import { SignInForm } from '@/components/auth/SignInForm'

function normalizeCallbackUrl(callbackUrl: string | null): string {
  if (!callbackUrl) {
    return '/cabinet'
  }

  // Basic open-redirect protection for client-side navigation.
  if (!callbackUrl.startsWith('/')) {
    return '/cabinet'
  }

  return callbackUrl
}

function resolveErrorMessage(error: string | null): string {
  if (!error) {
    return ''
  }

  if (error === 'CredentialsSignin') {
    return 'Невірний email або пароль.'
  }

  return 'Не вдалося увійти. Спробуйте ще раз.'
}

interface SignInPageProps {
  searchParams?: Promise<{
    callbackUrl?: string
    error?: string
    email?: string
  }>
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = searchParams ? await searchParams : undefined
  const callbackUrl = normalizeCallbackUrl(params?.callbackUrl ?? null)
  const initialError = resolveErrorMessage(params?.error ?? null)
  const initialEmail = params?.email ?? ''

  return (
    <SignInForm callbackUrl={callbackUrl} initialError={initialError} initialEmail={initialEmail} />
  )
}
