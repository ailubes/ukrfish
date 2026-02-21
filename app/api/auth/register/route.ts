import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'

const registerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  organizationName: z.string().min(2).max(200).optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Невалідні дані реєстрації.' }, { status: 400 })
    }

    const email = parsed.data.email.toLowerCase().trim()
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: 'Користувач з таким email вже існує.' }, { status: 409 })
    }

    const passwordHash = await hashPassword(parsed.data.password)

    const user = await prisma.user.create({
      data: {
        email,
        name: parsed.data.name.trim(),
        passwordHash,
      },
    })

    if (parsed.data.organizationName) {
      const organization = await prisma.organization.create({
        data: { name: parsed.data.organizationName.trim() },
      })

      await prisma.organizationMember.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          role: 'OWNER',
        },
      })
    }

    return NextResponse.json({ ok: true, userId: user.id }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Помилка сервера під час реєстрації.' }, { status: 500 })
  }
}
