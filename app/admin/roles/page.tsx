import { requireAdminPage } from '@/lib/admin-auth'
import { prisma } from '@/lib/prisma'
import { HelpTooltip } from '../_components/help-tooltip'
import { updateUserRoleAction } from '../actions'

function roleLabel(role: 'USER' | 'ADMIN' | 'SUPERADMIN'): string {
  if (role === 'SUPERADMIN') return 'Суперадмін'
  if (role === 'ADMIN') return 'Адміністратор'
  return 'Користувач'
}

export default async function AdminRolesPage() {
  await requireAdminPage('/admin/roles')

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  })

  return (
    <section className="space-y-5">
      <header className="rounded border border-[#0047AB]/15 bg-white p-5">
        <h2 className="text-2xl font-semibold text-[#1a1a1a]">Керування ролями</h2>
        <p className="text-sm text-gray-600">Призначайте ролі користувачам та контролюйте рівні доступу.</p>
      </header>

      <div className="overflow-hidden rounded border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
          <p className="text-sm font-medium text-[#1a1a1a]">Список ролей</p>
          <HelpTooltip text="Роль 'Суперадмін' може призначати тільки чинний суперадмін." />
        </div>
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-500">
            <tr>
              <th className="px-4 py-3">Користувач</th>
              <th className="px-4 py-3">Поточна роль</th>
              <th className="px-4 py-3">Зміна ролі</th>
              <th className="px-4 py-3">Створено</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{user.name ?? 'Без імені'}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </td>
                <td className="px-4 py-3 text-gray-700">{roleLabel(user.role)}</td>
                <td className="px-4 py-3">
                  <form action={updateUserRoleAction} className="flex items-center gap-2">
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
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{new Date(user.createdAt).toLocaleString('uk-UA')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
