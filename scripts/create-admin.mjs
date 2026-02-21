import { randomBytes, scryptSync } from 'node:crypto'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const KEY_LENGTH = 64
const ALLOWED_ROLES = new Set(['ADMIN', 'SUPERADMIN'])

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = scryptSync(password, salt, KEY_LENGTH).toString('hex')
  return `scrypt:${salt}:${derivedKey}`
}

function getArg(flag) {
  const index = process.argv.indexOf(flag)
  if (index === -1) {
    return ''
  }

  return String(process.argv[index + 1] ?? '').trim()
}

function getRequiredValue(name, argValue, envValue) {
  const value = (argValue || envValue || '').trim()
  if (!value) {
    throw new Error(`Missing required value: ${name}`)
  }
  return value
}

function printUsage() {
  console.log('Usage: npm run admin:create -- --email <email> --password <password> [--name <name>] [--role ADMIN|SUPERADMIN]')
  console.log('Env alternative: ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME, ADMIN_ROLE')
}

async function main() {
  try {
    const email = getRequiredValue('email', getArg('--email'), process.env.ADMIN_EMAIL).toLowerCase()
    const password = getRequiredValue('password', getArg('--password'), process.env.ADMIN_PASSWORD)
    const name = (getArg('--name') || process.env.ADMIN_NAME || '').trim() || null
    const roleRaw = (getArg('--role') || process.env.ADMIN_ROLE || 'SUPERADMIN').trim().toUpperCase()

    if (password.length < 8 || password.length > 72) {
      throw new Error('Password must be between 8 and 72 characters')
    }

    if (!ALLOWED_ROLES.has(roleRaw)) {
      throw new Error('Role must be ADMIN or SUPERADMIN')
    }

    const passwordHash = hashPassword(password)
    const existingUser = await prisma.user.findUnique({ where: { email } })

    const user = existingUser
      ? await prisma.user.update({
          where: { email },
          data: {
            passwordHash,
            role: roleRaw,
            ...(name ? { name } : {}),
          },
        })
      : await prisma.user.create({
          data: {
            email,
            passwordHash,
            role: roleRaw,
            ...(name ? { name } : {}),
          },
        })

    console.log(existingUser ? 'Updated existing admin user.' : 'Created new admin user.')
    console.log(`Email: ${user.email}`)
    console.log(`Role: ${user.role}`)
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  printUsage()
  process.exit(1)
})
