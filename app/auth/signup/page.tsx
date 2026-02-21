import { SignUpForm } from '@/components/auth/SignUpForm'

function normalizeCallbackUrl(callbackUrl: string | undefined): string {
  if (!callbackUrl) {
    return '/cabinet'
  }

  if (!callbackUrl.startsWith('/')) {
    return '/cabinet'
  }

  return callbackUrl
}
interface SignUpPageProps {
  searchParams?: Promise<{
    callbackUrl?: string
  }>
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const params = searchParams ? await searchParams : undefined
  const callbackUrl = normalizeCallbackUrl(params?.callbackUrl)

  return (
    <SignUpForm callbackUrl={callbackUrl} />
  )
}
