import Link from 'next/link'
import { Shield, Users } from 'lucide-react'
import { requireAdminPage } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { HelpTooltip } from '../_components/help-tooltip'
import { updateUserRoleAction } from '../actions'

function roleLabel(role: 'USER' | 'ADMIN' | 'SUPERADMIN'): string {
  if (role === 'SUPERADMIN') return 'Суперадмін'
  if (role === 'ADMIN') return 'Адміністратор'
  return 'Користувач'
}

function roleBadgeClass(role: 'USER' | 'ADMIN' | 'SUPERADMIN'): string {
  if (role === 'SUPERADMIN') return 'border-purple-200 bg-purple-50 text-purple-700'
  if (role === 'ADMIN') return 'border-blue-200 bg-blue-50 text-blue-700'
  return 'border-gray-200 bg-gray-50 text-gray-600'
}

export default async function AdminUsersPage() {
  await requireAdminPage('/admin/users')

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      memberships: {
        take: 1,
        orderBy: { createdAt: 'desc' },
        include: { plan: true },
      },
      organizations: {
        include: { organization: true },
      },
    },
  })

  const totalUsers = users.length
  const adminUsers = users.filter((user) => user.role !== 'USER').length
  const activeMemberships = users.filter((user) => user.memberships[0]?.status === 'ACTIVE').length

  return (
    <section className="space-y-6">
      <header className="rounded border border-[#0047AB]/15 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[#0047AB]/75">Керування доступом</p>
            <h2 className="mt-1 text-2xl font-semibold text-[#1a1a1a]">Користувачі та ролі</h2>
            <p className="mt-1 text-sm text-gray-600">Керуйте ролями користувачів, перевіряйте членство та переходьте до рахунків.</p>
          </div>
          <Link href="/admin/help" className="inline-flex items-center gap-2 rounded border border-[#0047AB]/25 px-3 py-2 text-sm text-[#0047AB] hover:bg-[#0047AB] hover:text-white">
            <Shield className="h-4 w-4" />
            Інструкція
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded border border-[#0047AB]/15 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-[#0047AB]/70">Усього користувачів</p>
          <p className="mt-2 text-2xl font-semibold text-[#002d6e]">{totalUsers}</p>
        </div>
        <div className="rounded border border-[#0047AB]/15 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-[#0047AB]/70">Адміністратори</p>
          <p className="mt-2 text-2xl font-semibold text-[#002d6e]">{adminUsers}</p>
        </div>
        <div className="rounded border border-[#0047AB]/15 bg-white p-4">
          <p className="text-xs uppercase tracking-[0.12em] text-[#0047AB]/70">Активні членства</p>
          <p className="mt-2 text-2xl font-semibold text-[#002d6e]">{activeMemberships}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <p className="inline-flex items-center gap-2 text-sm font-medium text-[#1a1a1a]">
            <Users className="h-4 w-4 text-[#0047AB]" />
            Реєстр користувачів
          </p>
          <HelpTooltip text="Тільки суперадмін може призначати або редагувати роль Суперадмін." />
        </div>
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-[#f8fafc] text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Користувач</th>
              <th className="px-4 py-3">Роль</th>
              <th className="px-4 py-3">Організація</th>
              <th className="px-4 py-3">Членство</th>
              <th className="px-4 py-3">Рахунки</th>
              <th className="px-4 py-3">Створено</th>
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
                    <form action={updateUserRoleAction} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="userId" value={user.id} />
                      <select name="role" defaultValue={user.role} className="rounded border border-gray-300 px-2 py-1 text-sm">
                        <option value="USER">Користувач</option>
                        <option value="ADMIN">Адміністратор</option>
                        <option value="SUPERADMIN">Суперадмін</option>
                      </select>
                      <button type="submit" className="rounded bg-[#0047AB] px-3 py-1 text-xs font-medium text-white hover:bg-[#002d6e]">
                        Зберегти
                      </button>
                    </form>
                    <span className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${roleBadgeClass(user.role)}`}>
                      {roleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{primaryOrg}</td>
                  <td className="px-4 py-3">
                    {latestMembership ? (
                      <div>
                        <div className="font-medium text-gray-900">{latestMembership.plan.name}</div>
                        <div className="text-xs text-gray-500">{latestMembership.status}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">Немає членства</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/invoices?userId=${encodeURIComponent(user.id)}`} className="text-xs text-[#0047AB] hover:text-[#002d6e] hover:underline">
                      Перейти до рахунків
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(user.createdAt).toLocaleString('uk-UA')}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
