import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const plans = [
  { code: 'start', name: 'Старт', description: 'Для старту в асоціації', monthlyPriceUah: 0 },
  { code: 'professional', name: 'Професіонал', description: 'Для активних учасників ринку', monthlyPriceUah: 500 },
  { code: 'investor', name: 'Інвестор', description: 'Для інвесторів та стратегічних партнерів', monthlyPriceUah: 5000 },
]

const featureLabels = {
  meetings: 'Участь у засіданнях',
  news_and_articles: 'Доступ до новин та статей',
  email_updates: 'Інформаційна розсилка',
  basic_support: 'Базова консультаційна підтримка',
  private_materials: 'Доступ до закритих матеріалів',
  voting_rights: 'Право голосу на установчих зборах',
  marketplace_posts: 'Розміщення оголошень у "Рибний ринок"',
  seminars: 'Участь в семінарах',
  priority_support: 'Пріоритетна консультаційна підтримка',
  governance_participation: 'Право участі в управлінні спілкою',
  legal_support_24_7: 'Цілодобова юридична підтримка',
  personal_consulting: 'Персональні консультації',
  exclusive_events: 'Доступ до ексклюзивних подій',
  international_advocacy: 'Представництво інтересів на міжнародному рівні',
}

const planFeatures = {
  start: ['meetings', 'news_and_articles', 'email_updates', 'basic_support'],
  professional: [
    'meetings',
    'news_and_articles',
    'email_updates',
    'basic_support',
    'private_materials',
    'voting_rights',
    'marketplace_posts',
    'seminars',
    'priority_support',
  ],
  investor: [
    'meetings',
    'news_and_articles',
    'email_updates',
    'basic_support',
    'private_materials',
    'voting_rights',
    'marketplace_posts',
    'seminars',
    'priority_support',
    'governance_participation',
    'legal_support_24_7',
    'personal_consulting',
    'exclusive_events',
    'international_advocacy',
  ],
}

async function main() {
  for (const plan of plans) {
    await prisma.membershipPlan.upsert({
      where: { code: plan.code },
      create: plan,
      update: {
        name: plan.name,
        description: plan.description,
        monthlyPriceUah: plan.monthlyPriceUah,
        isActive: true,
      },
    })
  }

  for (const [code, label] of Object.entries(featureLabels)) {
    await prisma.feature.upsert({
      where: { code },
      create: { code, label },
      update: { label },
    })
  }

  await prisma.planFeature.deleteMany()

  for (const [planCode, features] of Object.entries(planFeatures)) {
    const plan = await prisma.membershipPlan.findUnique({ where: { code: planCode } })
    if (!plan) continue

    for (const featureCode of features) {
      const feature = await prisma.feature.findUnique({ where: { code: featureCode } })
      if (!feature) continue

      await prisma.planFeature.create({
        data: {
          planId: plan.id,
          featureId: feature.id,
        },
      })
    }
  }
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
