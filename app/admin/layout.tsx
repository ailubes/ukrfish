import Link from 'next/link'
import { requireAdminPage } from '@/lib/admin-auth'

function adminRoleLabel(role: 'ADMIN' | 'SUPERADMIN'): string {
  return role === 'SUPERADMIN' ? 'Суперадмін' : 'Адміністратор'
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdminPage('/admin')
  const roleLabel = adminRoleLabel(user.role === 'SUPERADMIN' ? 'SUPERADMIN' : 'ADMIN')

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="border-b border-[#0047AB]/20 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold text-[#002d6e]">UKRFISH Admin</h1>
              <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                {roleLabel}
              </span>
            </div>
            <nav className="flex items-center gap-3 text-sm">
              <Link className="text-[#0047AB] hover:text-[#002d6e]" href="/admin/users">
                Users
              </Link>
              <Link className="text-[#0047AB] hover:text-[#002d6e]" href="/admin/memberships">
                Memberships
              </Link>
              <Link className="text-gray-500 hover:text-gray-700" href="/">
                Frontend
              </Link>
            </nav>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  )
}
