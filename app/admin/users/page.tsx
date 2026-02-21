import { requireAdminPage } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { updateUserRoleAction } from '../actions'

export default async function AdminUsersPage() {
  await requireAdminPage('/admin/users')

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      memberships: {
        take: 1,
        orderBy: { createdAt: 'desc' },
        include: {
          plan: true,
        },
      },
      organizations: {
        include: {
          organization: true,
        },
      },
    },
  })

  return (
    <section className="space-y-4">
      <header>
        <h2 className="text-2xl font-semibold text-[#1a1a1a]">Users</h2>
        <p className="text-sm text-gray-600">
          Manage user roles and review the current membership snapshot.
        </p>
      </header>

      <div className="overflow-hidden rounded border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Organization</th>
              <th className="px-4 py-3">Membership</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => {
              const latestMembership = user.memberships[0] ?? null
              const primaryOrg = user.organizations[0]?.organization.name ?? '—'

              return (
                <tr key={user.id} className="align-top">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{user.name ?? 'Без імені'}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <form action={updateUserRoleAction} className="flex items-center gap-2">
                      <input type="hidden" name="userId" value={user.id} />
                      <select
                        name="role"
                        defaultValue={user.role}
                        className="rounded border border-gray-300 px-2 py-1 text-sm"
                      >
                        <option value="USER">USER</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="SUPERADMIN">SUPERADMIN</option>
                      </select>
                      <button
                        type="submit"
                        className="rounded bg-[#0047AB] px-3 py-1 text-xs font-medium text-white hover:bg-[#002d6e]"
                      >
                        Save
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{primaryOrg}</td>
                  <td className="px-4 py-3">
                    {latestMembership ? (
                      <div>
                        <div className="font-medium text-gray-900">{latestMembership.plan.name}</div>
                        <div className="text-xs text-gray-500">{latestMembership.status}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">No membership</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {new Date(user.createdAt).toLocaleString('uk-UA')}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
