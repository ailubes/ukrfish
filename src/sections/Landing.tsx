import { ArrowRight, Compass, LogIn, Map, ShieldCheck, Users } from 'lucide-react'

export default function Landing() {
  return (
    <div className="p-6 lg:p-8 space-y-8">
      <section className="blueprint-panel overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-[#0047AB]/6 via-transparent to-[#facc15]/10" />
        <div className="relative z-10">
          <p className="text-xs tracking-[0.18em] uppercase text-[#0047AB]/70 mb-3">Ласкаво просимо до платформи</p>
          <h1 className="text-3xl lg:text-5xl font-bold text-[#002d6e] leading-tight max-w-4xl">
            Єдина цифрова точка для обліку водних ресурсів, промислу та членства в «Риба України»
          </h1>
          <p className="text-[#002d6e]/75 mt-4 max-w-3xl">
            Почніть роботу з ключового кроку - авторизуйтеся, щоб отримати персональний доступ до кабінету, заявок і робочих інструментів.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="/auth/signin?callbackUrl=%2Fcabinet"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-sm bg-[#002d6e] text-white hover:bg-[#002d6e]/90 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Увійти до кабінету
            </a>
            <a href="/map" className="inline-flex items-center gap-2 px-5 py-3 rounded-sm border-2 border-[#002d6e]/25 text-[#002d6e] hover:border-[#002d6e] transition-colors">
              <Map className="w-4 h-4" />
              Переглянути карту
            </a>
            <a href="/membership" className="inline-flex items-center gap-2 px-5 py-3 rounded-sm border-2 border-[#facc15] text-[#002d6e] bg-[#facc15]/20 hover:bg-[#facc15]/30 transition-colors">
              <Users className="w-4 h-4" />
              Подати заявку на членство
            </a>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            icon: LogIn,
            title: '1. Авторизація',
            text: 'Увійдіть у систему, щоб відкрити персональний кабінет і безпечний доступ до даних.',
          },
          {
            icon: Compass,
            title: '2. Оберіть напрям',
            text: 'Працюйте з картою, аналітикою або сценарієм членства залежно від вашої ролі.',
          },
          {
            icon: ShieldCheck,
            title: '3. Почніть роботу',
            text: 'Подавайте заявки, відстежуйте статуси, аналізуйте дані та взаємодійте зі спільнотою.',
          },
        ].map((step) => (
          <div key={step.title} className="blueprint-panel p-5">
            <step.icon className="w-6 h-6 text-[#0047AB] mb-3" />
            <h2 className="font-semibold text-[#002d6e] mb-2">{step.title}</h2>
            <p className="text-sm text-[#002d6e]/75">{step.text}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <a href="/analytics" className="blueprint-panel p-5 hover:border-[#002d6e]/35 transition-colors">
          <h3 className="font-semibold text-[#002d6e] mb-2">Аналітика</h3>
          <p className="text-sm text-[#002d6e]/70">Зведені показники ринку, категорії продукції та динаміка закупівель.</p>
          <span className="inline-flex items-center gap-1 text-sm text-[#0047AB] mt-4">Відкрити <ArrowRight className="w-4 h-4" /></span>
        </a>
        <a href="/map" className="blueprint-panel p-5 hover:border-[#002d6e]/35 transition-colors">
          <h3 className="font-semibold text-[#002d6e] mb-2">Карта об'єктів</h3>
          <p className="text-sm text-[#002d6e]/70">Водні об'єкти, місця базування та користувачі промислу на інтерактивній карті.</p>
          <span className="inline-flex items-center gap-1 text-sm text-[#0047AB] mt-4">Відкрити <ArrowRight className="w-4 h-4" /></span>
        </a>
        <a href="/news" className="blueprint-panel p-5 hover:border-[#002d6e]/35 transition-colors">
          <h3 className="font-semibold text-[#002d6e] mb-2">Оновлення та новини</h3>
          <p className="text-sm text-[#002d6e]/70">Слідкуйте за ключовими подіями, змінами в секторі та анонсами спілки.</p>
          <span className="inline-flex items-center gap-1 text-sm text-[#0047AB] mt-4">Відкрити <ArrowRight className="w-4 h-4" /></span>
        </a>
      </section>
    </div>
  )
}
