import { Scale, Building2, Shield, GraduationCap, Globe, ArrowRight, CheckCircle, Leaf, FileText, TrendingUp } from 'lucide-react'

interface ActivityCardProps {
  number: string
  title: string
  items: string[]
  icon: typeof Scale
}

function ActivityCard({ number, title, items, icon: Icon }: ActivityCardProps) {
  return (
    <div className="blueprint-panel group hover:-translate-y-2 transition-all duration-500">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-14 h-14 bg-gradient-to-br from-[#0047AB] to-[#002d6e] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-500 shadow-lg">
          <Icon className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1">
          <span className="font-mono text-3xl text-[#0047AB] block">{number}</span>
          <h4 className="text-lg font-semibold text-[#002d6e] mt-1 leading-tight">{title}</h4>
        </div>
      </div>
      <ul className="space-y-3">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-3 text-sm text-gray-600">
            <CheckCircle className="w-4 h-4 text-[#facc15] mt-0.5 flex-shrink-0" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Activities() {
  const activities = [
    {
      number: '01',
      title: 'Законодавча та фінансова підтримка рибогосподарських підприємств',
      icon: Scale,
      items: [
        'Ініціювання та супровід прийняття законодавчих актів, спрямованих на покращення умов функціонування рибної галузі',
        'Розробка та лобіювання впровадження державних програм фінансової підтримки рибогосподарських підприємств',
        'Надання консультацій та експертної допомоги членам асоціації щодо залучення інвестицій та кредитування',
        'Адвокація інтересів галузі на державному рівні',
      ],
    },
    {
      number: '02',
      title: 'Інституційні перетворення в рибній галузі',
      icon: Building2,
      items: [
        'Сприяння реформуванню системи державного управління рибним господарством',
        'Участь у формуванні державної політики у сфері рибальства та аквакультури',
        'Розробка пропозицій щодо вдосконалення інституційної структури галузі',
        'Оптимізація процесів управління водними біоресурсами',
      ],
    },
    {
      number: '03',
      title: 'Захист прав та інтересів членів асоціації',
      icon: Shield,
      items: [
        'Представлення та лобіювання інтересів членів асоціації на державному та міжнародному рівнях',
        'Надання юридичної допомоги та консультацій щодо захисту прав рибогосподарських підприємств',
        'Посередництво у вирішенні спорів та конфліктів за участю членів асоціації',
        'Захист прав працівників галузі',
      ],
    },
    {
      number: '04',
      title: 'Освітня та наукова діяльність',
      icon: GraduationCap,
      items: [
        'Організація тематичних конференцій, семінарів, круглих столів',
        'Проведення досліджень, аналітичних робіт та публікація їх результатів',
        'Співпраця з профільними науковими установами та закладами освіти',
        'Підвищення кваліфікації фахівців галузі',
      ],
    },
    {
      number: '05',
      title: 'Міжнародне співробітництво',
      icon: Globe,
      items: [
        'Налагодження партнерських зв\'язків з іноземними асоціаціями та організаціями',
        'Обмін досвідом, залучення кращих світових практик у рибну галузь України',
        'Представлення інтересів українських рибогосподарських підприємств на міжнародному рівні',
        'Участь у міжнародних проєктах та програмах',
      ],
    },
    {
      number: '06',
      title: 'Екологічна сталість',
      icon: Leaf,
      items: [
        'Забезпечення екологічно сталого та відповідального управління рибними ресурсами',
        'Програми з відновлення популяцій цінних видів риб',
        'Контроль за дотриманням норм вилову та охорони водних біоресурсів',
        'Просвітницька діяльність щодо збереження водних екосистем',
      ],
    },
  ]

  const achievements = [
    { number: '45+', label: 'Публікацій', icon: FileText },
    { number: '12', label: 'Аналітичних досліджень', icon: TrendingUp },
    { number: '8', label: 'Регіонів присутності', icon: Globe },
    { number: '5', label: 'Напрямків роботи', icon: Scale },
  ]

  return (
    <div className="p-6 lg:p-8">
      <header className="section-header">
        <h2 className="font-light text-sm uppercase text-[#0047AB] mb-1 tracking-wider">Напрямки роботи</h2>
        <h3 className="text-2xl lg:text-3xl font-semibold text-[#1a1a1a]">Діяльність асоціації</h3>
      </header>

      <div className="blueprint-panel mb-8">
        <p className="text-gray-700 leading-relaxed text-lg">
          Національна асоціація <strong className="text-[#002d6e]">"Риба України"</strong> зосереджує свою діяльність 
          на ключових напрямках, які сприяють сталому розвитку рибної галузі України, підвищенню її 
          конкурентоспроможності та забезпеченню продовольчої безпеки держави.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {achievements.map((item, index) => {
          const Icon = item.icon
          return (
            <div key={index} className="blueprint-panel text-center py-6 hover:-translate-y-1 transition-transform duration-300">
              <Icon className="w-8 h-8 text-[#0047AB] mx-auto mb-3" />
              <span className="font-mono text-3xl font-bold text-[#002d6e] block">{item.number}</span>
              <span className="text-xs text-gray-500 uppercase tracking-wider">{item.label}</span>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {activities.map((activity, index) => (
          <ActivityCard key={index} {...activity} />
        ))}
      </div>

      <div className="mb-8">
        <div className="panel-title mb-6">
          <span>КЛЮЧОВІ ПРОЄКТИ</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="blueprint-panel border-l-4 border-l-[#0047AB]">
            <h5 className="font-semibold text-[#002d6e] mb-3">СудноКонтроль</h5>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              Мобільний сервіс для моніторингу та управління маломірними суднами, 
              який може стати основою єдиного електронного реєстру в Україні.
            </p>
            <span className="text-xs text-[#0047AB] font-mono">2025</span>
          </div>
          <div className="blueprint-panel border-l-4 border-l-[#facc15]">
            <h5 className="font-semibold text-[#002d6e] mb-3">Піленгас-Відродження</h5>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              Програма відновлення популяції піленгасу в чорноморських лиманах 
              як альтернатива імпорту та збереження екології.
            </p>
            <span className="text-xs text-[#0047AB] font-mono">2025-2026</span>
          </div>
          <div className="blueprint-panel border-l-4 border-l-[#0047AB]">
            <h5 className="font-semibold text-[#002d6e] mb-3">АКВА-ЗРОСТАННЯ</h5>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              Державна цільова програма розвитку сталої аквакультури та 
              рибного господарства України на 2026–2030 роки.
            </p>
            <span className="text-xs text-[#0047AB] font-mono">2026-2030</span>
          </div>
        </div>
      </div>

      <div className="blueprint-panel bg-gradient-to-br from-[#0047AB] to-[#002d6e] text-white">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <h4 className="text-xl font-semibold mb-4">Реалізація наших напрямків діяльності</h4>
            <p className="text-white/80 leading-relaxed mb-6">
              Дозволить досягти сталого розвитку рибної галузі України, підвищити її 
              конкурентоспроможність та забезпечити продовольчу безпеку держави.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#facc15]" />
                <span className="text-sm">Сталий розвиток</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#facc15]" />
                <span className="text-sm">Екологічна відповідальність</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#facc15]" />
                <span className="text-sm">Економічне зростання</span>
              </div>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="text-center">
              <div className="w-32 h-32 border-4 border-[#facc15] rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-16 h-16 text-white" />
              </div>
              <p className="text-[#facc15] font-mono text-lg">РОЗВИТОК ГАЛУЗІ</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 blueprint-panel border-2 border-[#facc15]">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div>
            <h4 className="text-xl font-semibold text-[#002d6e] mb-2">Приєднуйтесь до спільноти!</h4>
            <p className="text-gray-600">
              Прагнете розвитку рибної галузі? Шукаєте платформу для співпраці та захисту своїх інтересів? 
              Спілка "Риба України" відкрита для вас!
            </p>
          </div>
          <button className="btn-primary whitespace-nowrap bg-[#facc15] text-[#002d6e] hover:bg-[#fde047]">
            Хочу приєднатися
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <footer className="mt-12 pt-6 border-t-2 border-[#0047AB] flex flex-col lg:flex-row justify-between gap-4 text-xs font-mono text-[#0047AB]">
        <div>© 2025 Громадська спілка "Риба України"</div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2"><span className="map-marker" />6 напрямків діяльності</span>
        </div>
      </footer>
    </div>
  )
}
