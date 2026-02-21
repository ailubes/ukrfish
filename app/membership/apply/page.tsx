import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { MembershipApplicationForm } from '@/components/membership/MembershipApplicationForm'
import { type MembershipPlanCode } from '@/lib/membership'

function normalizePlanCode(rawPlanCode: string | undefined): MembershipPlanCode {
  if (rawPlanCode === 'professional' || rawPlanCode === 'investor') {
    return rawPlanCode
  }
  return 'start'
}

interface MembershipApplyPageProps {
  searchParams?: Promise<{
    plan?: string
  }>
}

export default async function MembershipApplyPage({ searchParams }: MembershipApplyPageProps) {
  const session = await auth()

  const params = searchParams ? await searchParams : undefined
  const planCode = normalizePlanCode(params?.plan)

  if (!session?.user?.email) {
    const callback = `/membership/apply?plan=${encodeURIComponent(planCode)}`
    redirect(`/auth/signin?callbackUrl=${encodeURIComponent(callback)}`)
  }

  return (
    <MembershipApplicationForm
      planCode={planCode}
      userEmail={session.user.email}
      userName={session.user.name ?? ''}
    />
  )
}
