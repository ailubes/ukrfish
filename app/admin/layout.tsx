import Link from 'next/link'
import { requireAdminPage } from '@/lib/admin-auth'
import { AdminSidebar } from './_components/admin-sidebar'

function adminRoleLabel(role: 'ADMIN' | 'SUPERADMIN'): string {
  return role === 'SUPERADMIN' ? 'Суперадмін' : 'Адміністратор'
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdminPage('/admin')
  const roleLabel = adminRoleLabel(user.role === 'SUPERADMIN' ? 'SUPERADMIN' : 'ADMIN')

  return (
    <div className="min-h-screen bg-[#f8fafc] lg:flex">
      <AdminSidebar />
      <div className="min-w-0 flex-1">
        <header className="border-b border-[#0047AB]/15 bg-white/95 px-4 py-4 shadow-sm sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.14em] text-[#0047AB]/80">Адміністративний контур</p>
              <h1 className="text-lg font-semibold text-[#002d6e]">Керування платформою UKRFISH</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                {roleLabel}
              </span>
              <Link className="rounded border border-[#0047AB]/30 px-3 py-1.5 text-sm text-[#0047AB] hover:bg-[#0047AB] hover:text-white" href="/">
                На сайт
              </Link>
            </div>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
