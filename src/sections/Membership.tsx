import { useState } from 'react'
import { Check, ArrowRight, ArrowLeft, Users, Building2, Crown, Star, HelpCircle, X } from 'lucide-react'
import { type MembershipPlanCode } from '../lib/membership'

interface MembershipPlanProps {
  code: MembershipPlanCode
  name: string
  price: string
  period: string
  description: string
  features: string[]
  featured?: boolean
  icon: typeof Users
  onSelectPlan: (planCode: MembershipPlanCode) => void
}

function navigateInApp(path: string) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

function MembershipPlan({
  code,
  name,
  price,
  period,
  description,
  features,
  featured = false,
  icon: Icon,
  onSelectPlan,
}: MembershipPlanProps) {
  return (
    <div className={`membership-card ${featured ? 'featured' : ''}`}>
      {featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-[#facc15] text-[#002d6e] text-xs font-bold uppercase tracking-wider flex items-center gap-1">
          <Star className="w-3 h-3" />
          Рекомендовано
        </div>
      )}
      <div className="text-center mb-8">
        <div className={`w-16 h-16 mx-auto mb-4 flex items-center justify-center ${featured ? 'bg-[#facc15]' : 'bg-gradient-to-br from-[#0047AB] to-[#002d6e]'}`}>
          <Icon className={`w-8 h-8 ${featured ? 'text-[#002d6e]' : 'text-white'}`} />
        </div>
        <h4 className={`font-mono text-xl mb-2 ${featured ? 'text-white' : 'text-[#002d6e]'}`}>{name}</h4>
        <div className="flex items-baseline justify-center gap-1 mb-3">
          <span className={`font-mono text-5xl font-bold ${featured ? 'text-[#facc15]' : 'text-[#0047AB]'}`}>{price}</span>
          <span className={`text-sm ${featured ? 'text-white/70' : 'text-gray-500'}`}>{period}</span>
        </div>
        <p className={`text-sm ${featured ? 'text-white/70' : 'text-gray-500'}`}>{description}</p>
      </div>
      <ul className="space-y-4 mb-8">
        {features.map((feature, idx) => (
          <li key={idx} className="flex items-start gap-3">
            <Check className={`w-5 h-5 mt-0.5 flex-shrink-0 ${featured ? 'text-[#facc15]' : 'text-[#0047AB]'}`} />
            <span className={`text-sm ${featured ? 'text-white/90' : 'text-gray-600'}`}>{feature}</span>
          </li>
        ))}
      </ul>
      <button type="button" className={`w-full py-4 flex items-center justify-center gap-2 font-medium transition-all duration-300 ${
        featured 
          ? 'bg-[#facc15] text-[#002d6e] hover:bg-white' 
          : 'bg-gradient-to-r from-[#0047AB] to-[#002d6e] text-white hover:shadow-lg'
      }`}
      onClick={() => onSelectPlan(code)}>
        Обрати
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}

interface MembershipProps {
  onSelectPlan: (planCode: MembershipPlanCode) => void
}

interface BillingOption {
  id: string
  months: number
  amount: number
  label: string
  description?: string
}

function formatMembershipPrice(amount: number): string {
  return `₴${amount.toLocaleString('uk-UA')}`
}

function getMonthsLabel(months: number): string {
  const mod10 = months % 10
  const mod100 = months % 100

  if (mod10 === 1 && mod100 !== 11) {
    return 'місяць'
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return 'місяці'
  }
  return 'місяців'
}

export default function Membership({ onSelectPlan }: MembershipProps) {
  const [showModal, setShowModal] = useState(false)
  const [selectedPlanCode, setSelectedPlanCode] = useState<MembershipPlanCode>('professional')
  const [selectedBillingOptionId, setSelectedBillingOptionId] = useState('professional-quarterly')
  const [selectedPlanViewCode, setSelectedPlanViewCode] = useState<MembershipPlanCode | null>(null)

  const plans = [
    {
      code: 'start' as const,
      name: 'Старт',
      price: formatMembershipPrice(0),
      period: 'в місяць',
      description: 'Прекрасний пакет для тих, хто тільки починає свою справу',
      icon: Users,
      billingOptions: [
        {
          id: 'start-12',
          months: 12,
          amount: 0,
          label: '12 місяців',
          description: 'Безкоштовний пакет',
        },
      ] satisfies BillingOption[],
      features: [
        'Брати участь в засіданнях',
        'Доступ до новин та статей',
        'Інформаційна розсилка',
        'Базова консультаційна підтримка',
      ],
    },
    {
      code: 'professional' as const,
      name: 'Професіонал',
      price: formatMembershipPrice(1500),
      period: 'за 3 місяці',
      description: 'Пакет для тих, хто вже займається рибогосподарською діяльністю',
      icon: Building2,
      featured: true,
      billingOptions: [
        {
          id: 'professional-quarterly',
          months: 3,
          amount: 1500,
          label: '3 місяці',
          description: `${formatMembershipPrice(1500)} (мінімальний період)`,
        },
        {
          id: 'professional-annual',
          months: 12,
          amount: 5000,
          label: '12 місяців',
          description: `${formatMembershipPrice(5000)} (ціна 10 місяців)`,
        },
      ] satisfies BillingOption[],
      features: [
        'Все, що в пакеті Старт',
        'Доступ до закритих матеріалів',
        'Право голосу на установчих зборах',
        'Розміщення оголошень в "Рибний ринок"',
        'Участь в семінарах',
        'Пріоритетна консультаційна підтримка',
      ],
    },
    {
      code: 'investor' as const,
      name: 'Інвестор',
      price: formatMembershipPrice(5000),
      period: 'в місяць',
      description: 'Для компаній, котрі інвестують в рибне господарство',
      icon: Crown,
      billingOptions: [
        {
          id: 'investor-monthly',
          months: 1,
          amount: 5000,
          label: '1 місяць',
          description: `${formatMembershipPrice(5000)} / міс`,
        },
        {
          id: 'investor-annual',
          months: 12,
          amount: 50000,
          label: '12 місяців',
          description: `${formatMembershipPrice(50000)} (економія ${formatMembershipPrice(10000)})`,
        },
      ] satisfies BillingOption[],
      features: [
        'Все, що в пакеті Професіонал',
        'Право участі в управлінні спілкою',
        'Цілодобова юридична підтримка',
        'Персональні консультації',
        'Доступ до ексклюзивних подій',
        'Представництво інтересів на міжнародному рівні',
      ],
    },
  ]
  const selectedPlan = plans.find((plan) => plan.code === selectedPlanCode) ?? plans[0]
  const selectedBillingOption =
    selectedPlan.billingOptions.find((option) => option.id === selectedBillingOptionId) ??
    selectedPlan.billingOptions[0]
  const totalPrice = selectedBillingOption.amount
  const selectedMonths = selectedBillingOption.months

  const pricingNote =
    selectedPlan.code === 'professional' && selectedMonths === 12
      ? `Річна оплата зі знижкою: ${formatMembershipPrice(5000)} замість ${formatMembershipPrice(6000)}.`
      : selectedPlan.code === 'investor' && selectedMonths === 12
        ? `Річна оплата зі знижкою: ${formatMembershipPrice(50000)} замість ${formatMembershipPrice(60000)}.`
        : null

  const membershipConditions = [
    'Згода з Статутом та внутрішніми документами асоціації',
    'Сплата щорічних членських внесків',
    'Відповідність критеріям членства, встановленим Правлінням',
  ]

  const memberTypes = [
    { title: 'Юридичні особи', description: 'Суб\'єкти господарювання, що здійснюють діяльність у сфері рибальства, аквакультури, переробки та реалізації рибопродукції' },
    { title: 'Фізичні особи', description: 'Науковці, експерти, представники громадських організацій, інші зацікавлені особи' },
  ]

  const memberRights = [
    'Брати участь в управлінні справами асоціації',
    'Обирати та бути обраними до керівних органів',
    'Отримувати інформаційну, консультативну та організаційну підтримку',
    'Використовувати символіку та бренд асоціації',
    'Отримувати переваги та пільги, передбачені членством',
  ]

  const memberDuties = [
    'Дотримуватись Статуту та внутрішніх документів асоціації',
    'Сплачувати членські внески у встановлені терміни',
    'Активно сприяти реалізації статутних цілей і завдань асоціації',
    'Утримуватись від дій, що можуть завдати шкоди асоціації',
  ]

  const capabilitiesByPlan: Record<MembershipPlanCode, string[]> = {
    start: [
      'Читати всі новини та аналітику асоціації в особистому кабінеті.',
      'Брати участь у відкритих засіданнях та обговореннях.',
      'Отримувати базові консультації та інформаційні розсилки.',
    ],
    professional: [
      'Публікувати пропозиції в модулі "Рибний ринок".',
      'Отримати доступ до закритих матеріалів та галузевих шаблонів.',
      'Голосувати на установчих зборах та брати участь у семінарах.',
      'Працювати з пріоритетною консультаційною підтримкою.',
    ],
    investor: [
      'Керувати стратегічною участю у роботі асоціації.',
      'Отримати цілодобову юридичну підтримку та персональні консультації.',
      'Мати доступ до ексклюзивних подій і міжнародного представництва.',
      'Використовувати повний набір професійних та інвесторських функцій системи.',
    ],
  }

  function openPlanDetails(planCode: MembershipPlanCode) {
    const plan = plans.find((item) => item.code === planCode)
    if (!plan) {
      return
    }

    setSelectedPlanCode(plan.code)
    setSelectedBillingOptionId(plan.billingOptions[0]?.id ?? '')
    setSelectedPlanViewCode(plan.code)
  }

  if (selectedPlanViewCode) {
    return (
      <div className="p-6 lg:p-8">
        <header className="section-header">
          <h2 className="font-light text-sm uppercase text-[#0047AB] mb-1 tracking-wider">Деталі плану</h2>
          <h3 className="text-2xl lg:text-3xl font-semibold text-[#1a1a1a]">План «{selectedPlan.name}»</h3>
        </header>

        <div className="mb-6">
          <button
            type="button"
            onClick={() => setSelectedPlanViewCode(null)}
            className="inline-flex items-center gap-2 px-4 py-2 border border-[#0047AB]/30 text-[#0047AB] hover:bg-[#0047AB] hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            До всіх планів
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 mb-8">
          <div className="blueprint-panel">
            <h4 className="text-2xl font-semibold text-[#002d6e] mb-2">{selectedPlan.name}</h4>
            <p className="text-gray-700 mb-4">{selectedPlan.description}</p>
            <div className="inline-flex items-baseline gap-2 mb-6">
              <span className="font-mono text-4xl font-bold text-[#0047AB]">{selectedPlan.price}</span>
              <span className="text-sm text-gray-500">{selectedPlan.period}</span>
            </div>

            <div>
              <p className="font-mono text-xs tracking-wider text-[#0047AB] mb-3">ЩО ВИ МОЖЕТЕ РОБИТИ В СИСТЕМІ</p>
              <div className="grid grid-cols-1 gap-3">
                {capabilitiesByPlan[selectedPlan.code].map((capability, index) => (
                  <div key={index} className="p-3 border border-[#0047AB]/20 bg-[#f8fbff]">
                    <p className="text-sm text-gray-700 flex items-start gap-2">
                      <Check className="w-4 h-4 mt-0.5 text-[#0047AB] flex-shrink-0" />
                      <span>{capability}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <p className="font-mono text-xs tracking-wider text-[#0047AB] mb-3">ВКЛЮЧЕНІ ПЕРЕВАГИ</p>
              <ul className="space-y-2">
                {selectedPlan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <Check className="w-4 h-4 mt-0.5 text-[#0047AB] flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="blueprint-panel membership-price-calculator">
            <p className="font-mono text-xs tracking-wider text-[#0047AB] mb-3">РОЗРАХУНОК ВНЕСКУ</p>
            <div className="grid grid-cols-1 gap-3">
              {selectedPlan.billingOptions.map((option) => {
                const isActive = option.id === selectedBillingOption.id

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedBillingOptionId(option.id)}
                    className={`membership-billing-option ${isActive ? 'active' : ''}`}
                  >
                    <span className="block font-semibold text-sm">{option.label}</span>
                    <span className="block text-lg font-bold mt-1">{formatMembershipPrice(option.amount)}</span>
                    {option.description && (
                      <span className="block text-xs mt-1 text-gray-500">{option.description}</span>
                    )}
                  </button>
                )
              })}
            </div>

            <div className="mt-4 p-4 bg-[#f4f8ff] border border-[#0047AB]/20">
              <p className="text-sm text-gray-700">
                Вартість пакету <strong>{selectedPlan.name}</strong> за {selectedMonths} {getMonthsLabel(selectedMonths)}:
                {' '}
                <strong className="text-[#002d6e]">{formatMembershipPrice(totalPrice)}</strong>
              </p>
              {pricingNote && <p className="text-xs text-[#0047AB] mt-2">{pricingNote}</p>}
            </div>

            <button
              type="button"
              className="btn-primary w-full mt-5"
              onClick={() => onSelectPlan(selectedPlan.code)}
            >
              Долучитися
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setSelectedPlanViewCode(null)}
              className="w-full mt-3 px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Порівняти інші плани
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      <header className="section-header">
        <h2 className="font-light text-sm uppercase text-[#0047AB] mb-1 tracking-wider">Членство в асоціації</h2>
        <h3 className="text-2xl lg:text-3xl font-semibold text-[#1a1a1a]">Плани членства</h3>
      </header>

      <div className="blueprint-panel mb-8">
        <p className="text-gray-700 leading-relaxed text-lg">
          Асоціація <strong className="text-[#002d6e]">"Риба України"</strong> запрошує до членства 
          рибогосподарські підприємства, науковців, експертів та інших зацікавлених осіб, 
          які поділяють наші цілі та принципи.
        </p>
      </div>

      <div className="text-center mb-10">
        <h4 className="text-xl font-semibold text-[#002d6e] mb-2">Вартість членства</h4>
        <p className="text-gray-500">Маленька вартість, але велика користь</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-12">
        {plans.map((plan) => (
          <MembershipPlan key={plan.code} {...plan} onSelectPlan={openPlanDetails} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="blueprint-panel">
          <div className="panel-title">
            <span>УМОВИ ЧЛЕНСТВА</span>
          </div>
          <ul className="space-y-4">
            {membershipConditions.map((condition, index) => (
              <li key={index} className="flex items-start gap-4">
                <div className="w-8 h-8 bg-gradient-to-br from-[#0047AB] to-[#002d6e] flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs font-mono">{String(index + 1).padStart(2, '0')}</span>
                </div>
                <span className="text-gray-700 leading-relaxed">{condition}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="blueprint-panel">
          <div className="panel-title">
            <span>ЧЛЕНИ АСОЦІАЦІЇ</span>
          </div>
          <div className="space-y-4">
            {memberTypes.map((type, index) => (
              <div key={index} className="p-4 bg-gray-50 border border-gray-200 hover:border-[#0047AB] transition-colors">
                <h5 className="font-semibold text-[#002d6e] mb-2">{type.title}</h5>
                <p className="text-sm text-gray-600">{type.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="blueprint-panel border-l-4 border-l-[#facc15]">
          <div className="panel-title">
            <span>ПРАВА ЧЛЕНІВ</span>
          </div>
          <ul className="space-y-3">
            {memberRights.map((right, index) => (
              <li key={index} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#facc15] mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700">{right}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="blueprint-panel">
          <div className="panel-title">
            <span>ОБОВ'ЯЗКИ ЧЛЕНІВ</span>
          </div>
          <ul className="space-y-3">
            {memberDuties.map((duty, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="w-5 h-5 border-2 border-[#0047AB] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[#0047AB] text-xs font-bold">{index + 1}</span>
                </div>
                <span className="text-sm text-gray-700">{duty}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="blueprint-panel bg-gradient-to-br from-[#002d6e] to-[#0047AB] text-white mb-8">
        <div className="flex flex-col lg:flex-row items-center gap-6">
          <div className="flex-1">
            <h4 className="text-xl font-semibold mb-4">Не переконані?</h4>
            <p className="text-white/80 leading-relaxed text-lg">
              То чекайте, коли вашу діяльність на <span className="text-[#facc15] font-bold">100%</span> доведуть 
              до печального фіналу різні громадські організації, котрі створені для того, 
              аби вбити рибну галузь!
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-[#facc15] text-[#002d6e] font-semibold hover:bg-white transition-colors flex items-center gap-2"
          >
            <HelpCircle className="w-5 h-5" />
            Дізнатися більше
          </button>
        </div>
      </div>

      <div className="blueprint-panel border-2 border-[#facc15]">
        <div className="text-center">
          <h4 className="text-xl font-semibold text-[#002d6e] mb-4">Зацікавлені в членстві?</h4>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Якщо ви зацікавлені в членстві або маєте додаткові запитання, будь ласка, 
            зв'яжіться з нами за контактною інформацією, розміщеною на сайті.
          </p>
          <button type="button" className="btn-primary" onClick={() => navigateInApp('/contact')}>
            Зв'язатися з нами
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full p-6 relative">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 w-8 h-8 bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-xl font-semibold text-[#002d6e] mb-4">Чому варто приєднатися?</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#0047AB] mt-0.5" />
                <span className="text-gray-700">Вплив на галузеву політику та законодавство</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#0047AB] mt-0.5" />
                <span className="text-gray-700">Доступ до ексклюзивної інформації та аналітики</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#0047AB] mt-0.5" />
                <span className="text-gray-700">Нетворкінг з ключовими гравцями ринку</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-5 h-5 text-[#0047AB] mt-0.5" />
                <span className="text-gray-700">Юридична підтримка та захист інтересів</span>
              </li>
            </ul>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="mt-6 w-full py-3 bg-[#0047AB] text-white font-medium hover:bg-[#002d6e] transition-colors"
            >
              Зрозуміло
            </button>
          </div>
        </div>
      )}

      <footer className="mt-12 pt-6 border-t-2 border-[#0047AB] flex flex-col lg:flex-row justify-between gap-4 text-xs font-mono text-[#0047AB]">
        <div>© 2025 Громадська спілка "Риба України"</div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2"><span className="map-marker" />3 плани членства</span>
        </div>
      </footer>
    </div>
  )
}
