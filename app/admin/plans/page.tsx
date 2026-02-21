import { HelpTooltip } from '../_components/help-tooltip'
import { updateMembershipPlanDetailsAction } from '../actions'
import { requireAdminPage } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'

export default async function AdminPlansPage() {
  await requireAdminPage('/admin/plans')

  const plans = await prisma.membershipPlan.findMany({
    orderBy: { monthlyPriceUah: 'asc' },
  })

  return (
    <section className="space-y-5">
      <header className="rounded border border-[#0047AB]/15 bg-white p-5">
        <h2 className="text-2xl font-semibold text-[#1a1a1a]">Плани членства</h2>
        <p className="text-sm text-gray-600">Оновлюйте назви, ціни та активність тарифів. Річна оплата рахується як 10 місяців.</p>
      </header>

      <div className="space-y-4">
        {plans.map((plan) => (
          <div key={plan.id} className="rounded border border-gray-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-[#002d6e]">Код: {plan.code}</p>
              <HelpTooltip text="Місячна ціна використовується для розрахунку рахунків: місяць=1x, квартал=3x, рік=10x." />
            </div>
            <form action={updateMembershipPlanDetailsAction} className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input type="hidden" name="planCode" value={plan.code} />

              <label className="text-sm text-gray-700">
                Назва
                <input defaultValue={plan.name} name="name" required minLength={2} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
              </label>

              <label className="text-sm text-gray-700">
                Місячна ціна, грн
                <input defaultValue={plan.monthlyPriceUah} name="monthlyPriceUah" type="number" min={0} required className="mt-1 w-full rounded border border-gray-300 px-3 py-2" />
              </label>

              <label className="text-sm text-gray-700 md:col-span-2">
                Опис
                <textarea defaultValue={plan.description} name="description" required minLength={2} className="mt-1 w-full rounded border border-gray-300 px-3 py-2" rows={2} />
              </label>

              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" name="isActive" defaultChecked={plan.isActive} />
                План активний
              </label>

              <div className="flex items-center justify-end">
                <button type="submit" className="rounded bg-[#0047AB] px-4 py-2 text-sm font-medium text-white hover:bg-[#002d6e]">
                  Зберегти план
                </button>
              </div>
            </form>
          </div>
        ))}
      </div>
    </section>
  )
}
