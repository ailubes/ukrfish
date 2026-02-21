import { requireAdminPage } from '@/lib/admin-auth'

export default async function AdminHelpPage() {
  await requireAdminPage('/admin/help')

  return (
    <section className="space-y-5">
      <header className="rounded border border-[#0047AB]/15 bg-white p-5">
        <h2 className="text-2xl font-semibold text-[#1a1a1a]">Допомога та інструкції</h2>
        <p className="text-sm text-gray-600">Короткий гайд по роботі з адмін-панеллю UKRFISH.</p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <article className="rounded border border-gray-200 bg-white p-4">
          <h3 className="mb-2 text-lg font-semibold text-[#002d6e]">Як працює білінг</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>1. У розділі «Рахунки» створіть рахунок для потрібного членства.</li>
            <li>2. Вкажіть цикл оплати: місяць, квартал або рік.</li>
            <li>3. Для річної оплати система застосовує коефіцієнт 10 місяців.</li>
            <li>4. Після отримання платежу внесіть його вручну в розділі «Платежі».</li>
            <li>5. Підтвердіть платіж, щоб зарахувати його в рахунок.</li>
          </ul>
        </article>

        <article className="rounded border border-gray-200 bg-white p-4">
          <h3 className="mb-2 text-lg font-semibold text-[#002d6e]">Статуси рахунків</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li><strong>Чернетка</strong> — рахунок підготовлено, але ще не виставлено.</li>
            <li><strong>Виставлено</strong> — очікується оплата.</li>
            <li><strong>Частково сплачено</strong> — підтверджено частину платежів.</li>
            <li><strong>Сплачено</strong> — рахунок оплачений повністю.</li>
            <li><strong>Скасовано/Анульовано</strong> — рахунок не підлягає оплаті.</li>
          </ul>
        </article>

        <article className="rounded border border-gray-200 bg-white p-4">
          <h3 className="mb-2 text-lg font-semibold text-[#002d6e]">Статуси платежів</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li><strong>Очікує перевірки</strong> — зафіксований, але не верифікований платіж.</li>
            <li><strong>Підтверджено</strong> — сума зарахована в рахунок.</li>
            <li><strong>Відхилено</strong> — платіж не зараховується.</li>
          </ul>
        </article>

        <article className="rounded border border-gray-200 bg-white p-4">
          <h3 className="mb-2 text-lg font-semibold text-[#002d6e]">Ролі доступу</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li><strong>Адміністратор</strong> — керує членствами, рахунками та платежами.</li>
            <li><strong>Суперадмін</strong> — додатково керує критичними ролями та політиками доступу.</li>
            <li>Усі ключові зміни записуються в аудит.</li>
          </ul>
        </article>
      </div>
    </section>
  )
}
