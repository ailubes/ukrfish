export type MembershipPlanCode = 'start' | 'professional' | 'investor'

export interface MembershipPlanDefinition {
  code: MembershipPlanCode
  name: string
  monthlyPriceUah: number
  description: string
}

export type MembershipFeatureCode =
  | 'meetings'
  | 'news_and_articles'
  | 'email_updates'
  | 'basic_support'
  | 'private_materials'
  | 'voting_rights'
  | 'marketplace_posts'
  | 'seminars'
  | 'priority_support'
  | 'governance_participation'
  | 'legal_support_24_7'
  | 'personal_consulting'
  | 'exclusive_events'
  | 'international_advocacy'

export const MEMBERSHIP_FEATURE_LABELS: Record<MembershipFeatureCode, string> = {
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

export const MEMBERSHIP_PLANS: MembershipPlanDefinition[] = [
  {
    code: 'start',
    name: 'Старт',
    monthlyPriceUah: 0,
    description: 'Для старту в асоціації',
  },
  {
    code: 'professional',
    name: 'Професіонал',
    monthlyPriceUah: 500,
    description: 'Для активних учасників ринку',
  },
  {
    code: 'investor',
    name: 'Інвестор',
    monthlyPriceUah: 5000,
    description: 'Для інвесторів та стратегічних партнерів',
  },
]

const PLAN_FEATURES: Record<MembershipPlanCode, MembershipFeatureCode[]> = {
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

export function getPlanByCode(planCode: MembershipPlanCode): MembershipPlanDefinition {
  return MEMBERSHIP_PLANS.find((plan) => plan.code === planCode) ?? MEMBERSHIP_PLANS[0]
}

export function getPlanFeatures(planCode: MembershipPlanCode): MembershipFeatureCode[] {
  return PLAN_FEATURES[planCode]
}

export function hasPlanFeature(planCode: MembershipPlanCode, featureCode: MembershipFeatureCode): boolean {
  return PLAN_FEATURES[planCode].includes(featureCode)
}
