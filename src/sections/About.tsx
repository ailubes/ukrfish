import { Target, Shield, TrendingUp, Users, CheckCircle, Award, Calendar, MapPin } from 'lucide-react'

export default function About() {
  const missionPoints = [
    'Проведення необхідних законодавчих, фінансових та інституційних перетворень',
    'Впровадження організаційних заходів, спрямованих на сталий розвиток рибогосподарських підприємств',
    'Здійснення та захист прав і свобод працівників рибогосподарських підприємств',
    'Задоволення суспільних, наукових, соціальних, культурних, екологічних та інших інтересів членів асоціації',
  ]

  const values = [
    { icon: Shield, title: 'ЗАХИСТ', description: 'Захист інтересів підприємств рибної галузі на державному рівні' },
    { icon: TrendingUp, title: 'РОЗВИТОК', description: 'Сприяння сталому розвитку рибного господарства України' },
    { icon: Target, title: 'ЯКІСТЬ', description: 'Підвищення якості та конкурентоспроможності української рибної продукції' },
  ]

  const timeline = [
    { year: '2023', title: 'Заснування асоціації', description: 'Група провідних рибогосподарських підприємств України об\'єдналась для системних змін у галузі.' },
    { year: '2024', title: 'Перші досягнення', description: 'Активна адвокація інтересів галузі, перші зустрічі з державними органами, формування позиції.' },
    { year: '2025', title: 'Проривний рік', description: 'Великий аудит галузі, запуск аналітичного порталу, розширення членської бази до 27+ членів.' },
    { year: '2026', title: 'Масштабування', description: 'Планування масштабування діяльності, нові проєкти, міжнародне співробітництво.' },
  ]

  const structure = [
    { title: 'Загальні збори', description: 'Вищий орган управління асоціації' },
    { title: 'Правління', description: 'Керівний орган, що здійснює поточне управління' },
    { title: 'Виконавча дирекція', description: 'Оперативне управління та реалізація програм' },
    { title: 'Ревізійна комісія', description: 'Контроль за фінансовою діяльністю' },
  ]

  return (
    <div className="p-6 lg:p-8">
      <header className="section-header">
        <h2 className="font-light text-sm uppercase text-[#0047AB] mb-1 tracking-wider">Інформація про організацію</h2>
        <h3 className="text-2xl lg:text-3xl font-semibold text-[#1a1a1a]">Про Національну асоціацію</h3>
      </header>

      <div className="blueprint-panel mb-8 bg-gradient-to-br from-[#002d6e] to-[#0047AB] text-white border-none">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <h4 className="text-2xl lg:text-3xl font-bold mb-4">
              Громадська спілка<br />
              <span className="text-[#facc15]">"Риба України"</span>
            </h4>
            <p className="text-white/80 leading-relaxed mb-6">
              Національна асоціація виробників продукції аквакультури та рибальства 
              була заснована у <span className="text-[#facc15] font-mono">2023 році</span> групою провідних 
              рибогосподарських підприємств України, стурбованих необхідністю системних змін у галузі.
            </p>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-sm text-white/70">
                <Calendar className="w-4 h-4 text-[#facc15]" />
                <span>Заснована 2023</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/70">
                <MapPin className="w-4 h-4 text-[#facc15]" />
                <span>Київ, Україна</span>
              </div>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <div className="relative">
              <div className="w-48 h-48 lg:w-56 lg:h-56 border-4 border-[#facc15] rounded-full flex items-center justify-center">
                <img src="/logo.png" alt="UKRFISH" className="w-32 h-32 lg:w-40 lg:h-40 object-contain" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-[#facc15] text-[#002d6e] px-4 py-2 font-mono text-sm font-bold">
                UKRFISH
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 mb-8">
        <div className="blueprint-panel">
          <div className="panel-title">
            <span>НАША МІСІЯ</span>
          </div>
          <div className="space-y-6">
            <p className="text-gray-700 leading-relaxed text-lg">
              Наша місія – <strong className="text-[#002d6e]">сприяти державі Україна</strong> в забезпеченні її 
              продовольчої безпеки та незалежності в секторі рибопродукції шляхом:
            </p>
            <ul className="space-y-4">
              {missionPoints.map((point, index) => (
                <li key={index} className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-[#0047AB] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-700 leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <div className="blueprint-panel bg-gradient-to-br from-[#0047AB] to-[#002d6e] text-white">
            <div className="panel-title text-white">
              <span>СТАТИСТИКА</span>
            </div>
            <div className="space-y-6">
              <div className="text-center">
                <span className="font-mono text-6xl font-bold text-white">2023</span>
                <p className="text-sm mt-2 text-white/70">Рік заснування</p>
              </div>
              <div className="border-t border-white/20 pt-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <span className="font-mono text-3xl text-[#facc15]">27+</span>
                    <p className="text-xs mt-1 text-white/70">Членів</p>
                  </div>
                  <div>
                    <span className="font-mono text-3xl text-[#facc15]">5</span>
                    <p className="text-xs mt-1 text-white/70">Напрямків</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="blueprint-panel">
            <div className="panel-title">
              <span>СТРУКТУРА</span>
            </div>
            <div className="space-y-3">
              {structure.map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200">
                  <div className="w-8 h-8 bg-[#0047AB] flex items-center justify-center text-white font-mono text-xs">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-[#002d6e] block">{item.title}</span>
                    <span className="text-xs text-gray-500">{item.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="panel-title mb-6">
          <span>НАШІ ЦІННОСТІ</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {values.map((value, index) => {
            const Icon = value.icon
            return (
              <div key={index} className="blueprint-panel text-center group hover:-translate-y-2 transition-all duration-500">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#0047AB] to-[#002d6e] flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-lg">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-mono text-lg text-[#0047AB] mb-2">{value.title}</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{value.description}</p>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="blueprint-panel">
          <div className="panel-title">
            <span>ХРОНОЛОГІЯ</span>
          </div>
          <div className="py-4">
            {timeline.map((item, index) => (
              <div key={index} className="relative pl-8 pb-8 border-l-2 border-[#0047AB]/20 last:pb-0">
                <div className="absolute left-0 top-0 w-4 h-4 -translate-x-[9px] bg-[#facc15] border-2 border-[#0047AB]" />
                <span className="font-mono text-sm text-[#0047AB] mb-1 block">{item.year}</span>
                <h4 className="text-lg font-semibold text-[#002d6e] mb-2">{item.title}</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="blueprint-panel bg-gradient-to-br from-[#002d6e] to-[#0047AB] text-white flex flex-col justify-center">
          <div className="text-center lg:text-left">
            <Award className="w-12 h-12 text-[#facc15] mb-4 mx-auto lg:mx-0" />
            <blockquote className="text-xl lg:text-2xl italic mb-6 leading-relaxed">
              "Дякуємо всім членам ГС "Риба України" за те, що в такий важкий час для держави, 
              все ж таки знаходяться сили для того, аби розвивати нашу галузь."
            </blockquote>
            <cite className="text-[#facc15] not-italic font-semibold text-lg">
              — Ольга Капустіна
            </cite>
            <p className="text-white/60 text-sm mt-1">Керівник виконавчої дирекції</p>
          </div>
        </div>
      </div>

      <div className="blueprint-panel mb-8">
        <div className="panel-title">
          <span>ПРИНЦИПИ РОБОТИ</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-gray-50 border border-gray-200">
            <h5 className="font-semibold text-[#002d6e] mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-[#0047AB]" />
              Баланс інтересів
            </h5>
            <p className="text-sm text-gray-600 leading-relaxed">
              Ми керуємося принципами балансу економічної доцільності та соціальної справедливості, 
              прагнемо до побудови громадянського суспільства.
            </p>
          </div>
          <div className="p-6 bg-gray-50 border border-gray-200">
            <h5 className="font-semibold text-[#002d6e] mb-3 flex items-center gap-2">
              <Target className="w-5 h-5 text-[#0047AB]" />
              Міжнародне право
            </h5>
            <p className="text-sm text-gray-600 leading-relaxed">
              Сприяння розвитку міжнародного права в Україні та інтеграція до європейських 
              стандартів у сфері рибальства.
            </p>
          </div>
        </div>
      </div>

      <div className="blueprint-panel border-2 border-[#facc15]">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div>
            <h4 className="text-xl font-semibold text-[#002d6e] mb-2">Приєднуйтесь до нашої спільноти!</h4>
            <p className="text-gray-600">
              Запрошуємо підприємства рибної галузі, науковців, експертів та всіх зацікавлених осіб 
              приєднуватись до нашої спільноти.
            </p>
          </div>
          <button className="btn-primary whitespace-nowrap">
            Стати членом
            <TrendingUp className="w-4 h-4" />
          </button>
        </div>
      </div>

      <footer className="mt-12 pt-6 border-t-2 border-[#0047AB] flex flex-col lg:flex-row justify-between gap-4 text-xs font-mono text-[#0047AB]">
        <div>© 2025 Громадська спілка "Риба України"</div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2"><span className="map-marker" />UKRFISH.ORG</span>
        </div>
      </footer>
    </div>
  )
}
