import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function isAuthorized(request: Request): boolean {
  const secret = process.env.BILLING_CRON_SECRET
  if (!secret) {
    return false
  }

  const headerSecret = request.headers.get('x-cron-secret')
  if (headerSecret && headerSecret === secret) {
    return true
  }

  const url = new URL(request.url)
  const querySecret = url.searchParams.get('secret')
  return querySecret === secret
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()

  const result = await prisma.invoice.updateMany({
    where: {
      status: { in: ['ISSUED', 'PARTIALLY_PAID'] },
      dueAt: { lt: now },
    },
    data: {
      status: 'OVERDUE',
    },
  })

  return NextResponse.json(
    {
      ok: true,
      updated: result.count,
      checkedAt: now.toISOString(),
    },
    { status: 200 },
  )
}
