import { JoinSignUpForm } from '@/components/auth/JoinSignUpForm'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

function resolvePlanCode(rawPlanCode: string | undefined, availablePlanCodes: string[]): string {
  if (rawPlanCode && availablePlanCodes.includes(rawPlanCode)) {
    return rawPlanCode
  }

  return availablePlanCodes[0] ?? ''
}

function normalizeCallbackUrl(callbackUrl: string | undefined, planCode: string): string {
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
  const session = await auth()
  const params = searchParams ? await searchParams : undefined
  const plans = await prisma.membershipPlan.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      code: { in: ['start', 'professional', 'investor'] },
    },
    orderBy: { monthlyPriceUah: 'asc' },
    select: { code: true, name: true, monthlyPriceUah: true, yearlyFreeMonths: true },
  })

  if (plans.length === 0) {
    throw new Error('No active membership plans available')
  }

  const planCode = resolvePlanCode(
    params?.plan,
    plans.map((plan) => plan.code),
  )
  const selectedPlan = plans.find((plan) => plan.code === planCode) ?? plans[0]
  const callbackUrl = normalizeCallbackUrl(params?.callbackUrl, planCode)

  if (session?.user?.id) {
    redirect(callbackUrl)
  }

  return <JoinSignUpForm planName={selectedPlan.name} monthlyPriceUah={selectedPlan.monthlyPriceUah} yearlyFreeMonths={selectedPlan.yearlyFreeMonths} callbackUrl={callbackUrl} />
}
