'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type ComponentType } from 'react'
import { BadgeCheck, CreditCard, FileText, HelpCircle, Layers3, LayoutDashboard, Shield, Users, Wallet } from 'lucide-react'

type NavItem = {
  href: string
  label: string
  icon: ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { href: '/admin/users', label: 'Користувачі', icon: Users },
  { href: '/admin/roles', label: 'Ролі', icon: Shield },
  { href: '/admin/memberships', label: 'Членства', icon: BadgeCheck },
  { href: '/admin/plans', label: 'Плани', icon: Layers3 },
  { href: '/admin/invoices', label: 'Рахунки', icon: FileText },
  { href: '/admin/payments', label: 'Платежі', icon: Wallet },
  { href: '/admin/help', label: 'Допомога', icon: HelpCircle },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-full border-r border-[#0047AB]/15 bg-[#002d6e] text-white lg:min-h-screen lg:w-[280px]">
      <div className="border-b border-white/10 px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded bg-[#facc15]/20">
            <LayoutDashboard className="h-5 w-5 text-[#facc15]" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-[#facc15]">UKRFISH</p>
            <p className="text-sm font-semibold">Панель управління</p>
          </div>
        </div>
      </div>

      <nav className="px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded px-3 py-2 text-sm transition-colors ${
                    isActive ? 'bg-white/15 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-[#facc15]' : ''}`} />
                  <span>{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="mt-6 border-t border-white/10 px-5 py-4 text-xs text-white/70">
        <p className="mb-1 inline-flex items-center gap-2">
          <CreditCard className="h-3.5 w-3.5 text-[#facc15]" />
          Ручна верифікація оплат
        </p>
        <p className="inline-flex items-center gap-2">
          <Shield className="h-3.5 w-3.5 text-[#facc15]" />
          Аудит змін у білінгу
        </p>
      </div>
    </aside>
  )
}
