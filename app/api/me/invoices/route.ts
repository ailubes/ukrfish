import { NextResponse } from 'next/server'
import { requireAuthUserId } from '@/lib/membership-access'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const userId = await requireAuthUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Необхідна авторизація.' }, { status: 401 })
  }

  const invoices = await prisma.invoice.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      number: true,
      status: true,
      billingCycle: true,
      amountMinor: true,
      paidMinor: true,
      dueAt: true,
      issuedAt: true,
      createdAt: true,
      membership: {
        select: {
          plan: {
            select: {
              name: true,
              code: true,
            },
          },
        },
      },
    },
    take: 50,
  })

  return NextResponse.json({ invoices }, { status: 200 })
}
