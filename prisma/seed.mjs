import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const plans = [
  {
    code: 'start',
    name: 'Старт',
    description: 'Для старту в асоціації (до 1 користувача в організації)',
    monthlyPriceUah: 0,
    yearlyFreeMonths: 2,
    organizationUserLimit: 1,
  },
  {
    code: 'professional',
    name: 'Професіонал',
    description: 'Для активних учасників ринку (до 3 користувачів в організації)',
    monthlyPriceUah: 500,
    yearlyFreeMonths: 2,
    organizationUserLimit: 3,
  },
  {
    code: 'investor',
    name: 'Інвестор',
    description: 'Для інвесторів та стратегічних партнерів (до 10 користувачів в організації)',
    monthlyPriceUah: 5000,
    yearlyFreeMonths: 2,
    organizationUserLimit: 10,
  },
  {
    code: 'government_free',
    name: 'Державний (безкоштовно)',
    description: 'Для державних установ (до 10 користувачів в організації)',
    monthlyPriceUah: 0,
    yearlyFreeMonths: 0,
    organizationUserLimit: 10,
  },
  {
    code: 'science_free',
    name: 'Науковий (безкоштовно)',
    description: 'Для наукових установ (до 10 користувачів в організації)',
    monthlyPriceUah: 0,
    yearlyFreeMonths: 0,
    organizationUserLimit: 10,
  },
  {
    code: 'lawmakers_free',
    name: 'Законотворчий (безкоштовно)',
    description: 'Для законодавчих органів та профільних комітетів (до 10 користувачів в організації)',
    monthlyPriceUah: 0,
    yearlyFreeMonths: 0,
    organizationUserLimit: 10,
  },
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
  government_free: ['meetings', 'news_and_articles', 'email_updates', 'basic_support'],
  science_free: ['meetings', 'news_and_articles', 'email_updates', 'basic_support'],
  lawmakers_free: ['meetings', 'news_and_articles', 'email_updates', 'basic_support'],
}

async function main() {
  await prisma.$executeRaw`
    INSERT INTO "BillingIssuerSettings" (
      "id",
      "legalName",
      "shortName",
      "legalAddress",
      "edrpou",
      "iban",
      "bankName",
      "updatedAt"
    ) VALUES (
      'default',
      'Громадська спілка "Риба України"',
      'ГС "Риба України"',
      'Україна, м. Київ',
      '00000000',
      'UA000000000000000000000000000',
      'АТ "Умовний Банк"',
      NOW()
    )
    ON CONFLICT ("id") DO NOTHING
  `

  for (const plan of plans) {
    await prisma.membershipPlan.upsert({
      where: { code: plan.code },
      create: plan,
      update: {
        name: plan.name,
        description: plan.description,
        monthlyPriceUah: plan.monthlyPriceUah,
        yearlyFreeMonths: plan.yearlyFreeMonths,
        organizationUserLimit: plan.organizationUserLimit,
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
