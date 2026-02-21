import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const now = new Date()

  const result = await prisma.invoice.updateMany({
    where: {
      status: {
        in: ['ISSUED', 'PARTIALLY_PAID'],
      },
      dueAt: {
        lt: now,
      },
    },
    data: {
      status: 'OVERDUE',
    },
  })

  console.log(JSON.stringify({ ok: true, updated: result.count, checkedAt: now.toISOString() }))
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error(error)
    await prisma.$disconnect()
    process.exit(1)
  })
