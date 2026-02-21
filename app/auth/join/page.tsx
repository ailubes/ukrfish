import { JoinSignUpForm } from '@/components/auth/JoinSignUpForm'

type PlanCode = 'start' | 'professional' | 'investor'

function normalizePlanCode(rawPlanCode: string | undefined): PlanCode {
  if (rawPlanCode === 'professional' || rawPlanCode === 'investor') {
    return rawPlanCode
  }
  return 'start'
}

function normalizeCallbackUrl(callbackUrl: string | undefined, planCode: PlanCode): string {
  const fallback = `/membership/apply?plan=${planCode}`
  if (!callbackUrl) {
    return fallback
  }

  if (!callbackUrl.startsWith('/')) {
    return fallback
  }

  return callbackUrl
}

interface JoinPageProps {
  searchParams?: Promise<{
    plan?: string
    callbackUrl?: string
  }>
}

export default async function JoinPage({ searchParams }: JoinPageProps) {
  const params = searchParams ? await searchParams : undefined
  const planCode = normalizePlanCode(params?.plan)
  const callbackUrl = normalizeCallbackUrl(params?.callbackUrl, planCode)

  return <JoinSignUpForm planCode={planCode} callbackUrl={callbackUrl} />
}
