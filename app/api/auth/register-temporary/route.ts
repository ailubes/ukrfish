import { NextResponse } from 'next/server'
import { randomBytes } from 'node:crypto'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { hashPassword } from '@/lib/password'

const registerTemporarySchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  organizationName: z.string().min(2).max(200).optional(),
})

function generateTemporaryPassword(): string {
  // 12 chars gives enough entropy and is easy to type once.
  return randomBytes(9).toString('base64url').slice(0, 12)
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = registerTemporarySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Невалідні дані для швидкої реєстрації.' }, { status: 400 })
    }

    const email = parsed.data.email.toLowerCase().trim()
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Користувач з таким email вже існує. Увійдіть у ваш акаунт.' },
        { status: 409 },
      )
    }

    const temporaryPassword = generateTemporaryPassword()
    const passwordHash = await hashPassword(temporaryPassword)

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

    return NextResponse.json(
      {
        ok: true,
        userId: user.id,
        email: user.email,
        temporaryPassword,
      },
      { status: 201 },
    )
  } catch {
    return NextResponse.json(
      { error: 'Помилка сервера під час швидкої реєстрації.' },
      { status: 500 },
    )
  }
}
