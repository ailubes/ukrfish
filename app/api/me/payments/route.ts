import { NextResponse } from 'next/server'
import { requireAuthUserId } from '@/lib/membership-access'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const userId = await requireAuthUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Необхідна авторизація.' }, { status: 401 })
  }

  const payments = await prisma.payment.findMany({
    where: {
      invoice: {
        userId,
      },
    },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      status: true,
      method: true,
      amountMinor: true,
      paidAt: true,
      payerReference: true,
      createdAt: true,
      invoice: {
        select: {
          id: true,
          number: true,
        },
      },
    },
    take: 100,
  })

  return NextResponse.json({ payments }, { status: 200 })
}
