import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'

const KEY_LENGTH = 64

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = scryptSync(password, salt, KEY_LENGTH).toString('hex')
  return `scrypt:${salt}:${derivedKey}`
}

export async function verifyPassword(storedHash: string, password: string): Promise<boolean> {
  const parts = storedHash.split(':')
  if (parts.length !== 3 || parts[0] !== 'scrypt') {
    return false
  }

  const [, salt, keyHex] = parts
  const derivedKey = scryptSync(password, salt, KEY_LENGTH)
  const storedKey = Buffer.from(keyHex, 'hex')

  if (storedKey.length !== derivedKey.length) {
    return false
  }

  return timingSafeEqual(storedKey, derivedKey)
}
