import { NextResponse } from 'next/server'
import { getLatestMembershipForUser, requireAuthUserId } from '@/lib/membership-access'

export async function GET() {
  const userId = await requireAuthUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Необхідна авторизація.' }, { status: 401 })
  }

  const membership = await getLatestMembershipForUser(userId)
  if (!membership) {
    return NextResponse.json(
      {
        membership: null,
        features: [],
      },
      { status: 200 },
    )
  }

  const features = membership.plan.features.map((entry) => ({
    code: entry.feature.code,
    label: entry.feature.label,
  }))

  return NextResponse.json(
    {
      membership: {
        id: membership.id,
        status: membership.status,
        billingCycle: membership.billingCycle,
        startsAt: membership.startsAt,
        endsAt: membership.endsAt,
        createdAt: membership.createdAt,
        plan: {
          code: membership.plan.code,
          name: membership.plan.name,
          description: membership.plan.description,
          monthlyPriceUah: membership.plan.monthlyPriceUah,
        },
      },
      features,
    },
    { status: 200 },
  )
}
