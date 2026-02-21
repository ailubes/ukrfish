import { requireAdminPage } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { updateMembershipPlanAction, updateMembershipStatusAction } from '../actions'

function statusBadgeClass(status: string): string {
  if (status === 'ACTIVE') return 'bg-green-100 text-green-700'
  if (status === 'PENDING_REVIEW') return 'bg-amber-100 text-amber-700'
  if (status === 'DENIED') return 'bg-red-100 text-red-700'
  if (status === 'CANCELED') return 'bg-gray-100 text-gray-700'
  return 'bg-slate-100 text-slate-700'
}

export default async function AdminMembershipsPage() {
  await requireAdminPage('/admin/memberships')

  const [memberships, plans] = await Promise.all([
    prisma.membership.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        organization: true,
        plan: true,
      },
    }),
    prisma.membershipPlan.findMany({
      where: { isActive: true },
      orderBy: { monthlyPriceUah: 'asc' },
    }),
  ])

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-2xl font-semibold text-[#1a1a1a]">Memberships</h2>
        <p className="text-sm text-gray-600">
          Review applications, approve/deny statuses, and change plans.
        </p>
      </header>

      <div className="overflow-hidden rounded border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Organization</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {memberships.map((membership) => (
              <tr key={membership.id} className="align-top">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{membership.user.name ?? 'Без імені'}</div>
                  <div className="text-xs text-gray-500">{membership.user.email}</div>
                </td>
                <td className="px-4 py-3 text-gray-700">{membership.organization?.name ?? '—'}</td>
                <td className="px-4 py-3">
                  <form action={updateMembershipPlanAction} className="flex items-center gap-2">
                    <input type="hidden" name="membershipId" value={membership.id} />
                    <select
                      name="planCode"
                      defaultValue={membership.plan.code}
                      className="rounded border border-gray-300 px-2 py-1 text-sm"
                    >
                      {plans.map((plan) => (
                        <option key={plan.id} value={plan.code}>
                          {plan.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="submit"
                      className="rounded border border-[#0047AB] px-3 py-1 text-xs text-[#0047AB] hover:bg-[#0047AB] hover:text-white"
                    >
                      Update
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded px-2 py-1 text-xs font-medium ${statusBadgeClass(membership.status)}`}>
                    {membership.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {new Date(membership.createdAt).toLocaleString('uk-UA')}
                </td>
                <td className="px-4 py-3">
                  <form action={updateMembershipStatusAction} className="flex flex-wrap gap-2">
                    <input type="hidden" name="membershipId" value={membership.id} />
                    <button
                      type="submit"
                      name="status"
                      value="ACTIVE"
                      className="rounded bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      type="submit"
                      name="status"
                      value="PENDING_REVIEW"
                      className="rounded bg-amber-500 px-3 py-1 text-xs font-medium text-white hover:bg-amber-600"
                    >
                      Pending
                    </button>
                    <button
                      type="submit"
                      name="status"
                      value="DENIED"
                      className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700"
                    >
                      Deny
                    </button>
                    <button
                      type="submit"
                      name="status"
                      value="CANCELED"
                      className="rounded bg-gray-600 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      name="status"
                      value="EXPIRED"
                      className="rounded bg-slate-600 px-3 py-1 text-xs font-medium text-white hover:bg-slate-700"
                    >
                      Expire
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
