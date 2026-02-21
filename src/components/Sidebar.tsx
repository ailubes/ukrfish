import type { Section } from '../App'
import { House, LayoutDashboard, Info, Briefcase, Users, Newspaper, Mail, Map, UserRoundCog, Shield } from 'lucide-react'

interface SidebarProps {
  activeSection: Section
  onSectionChange: (section: Section) => void
  isMobileOpen: boolean
  onMobileClose: () => void
  canAccessCabinet: boolean
  isAdmin: boolean
}

const navItems: { id: Section; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'landing', label: 'Головна', icon: House },
  { id: 'dashboard', label: 'Аналітика', icon: LayoutDashboard },
  { id: 'map', label: 'Карта', icon: Map },
  { id: 'about', label: 'Про нас', icon: Info },
  { id: 'activities', label: 'Діяльність', icon: Briefcase },
  { id: 'membership', label: 'Членство', icon: Users },
  { id: 'cabinet', label: 'Кабінет', icon: UserRoundCog },
  { id: 'news', label: 'Новини', icon: Newspaper },
  { id: 'contact', label: 'Контакт', icon: Mail },
]

export default function Sidebar({
  activeSection,
  onSectionChange,
  isMobileOpen,
  onMobileClose,
  canAccessCabinet,
  isAdmin,
}: SidebarProps) {
  const visibleNavItems = navItems.filter((item) => item.id !== 'cabinet' || canAccessCabinet)

  const handleNavClick = (section: Section) => {
    onSectionChange(section)
    onMobileClose()
  }

  return (
    <>
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside 
        className={`
          fixed left-0 top-0 h-screen w-[280px] bg-[#002d6e] text-white flex flex-col gap-6 z-50 
          border-r-4 border-[#facc15] transition-transform duration-500 ease-out
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="logo-area mx-5 mt-5">
          <div className="flex items-center">
            <img src="/logo.png" alt="UKRFISH Logo" className="block h-auto w-full max-w-[180px] object-contain" />
          </div>
          <h1 className="text-sm font-bold tracking-tight leading-tight text-[#facc15] mt-3">
            ГРОМАДСЬКА СПІЛКА<br />
            <span className="text-white font-light text-xs tracking-wider">"РИБА УКРАЇНИ"</span>
          </h1>
        </div>

        <nav className="flex-1 px-3 overflow-y-auto">
          <ul className="space-y-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon
              const isActive = activeSection === item.id
              return (
                <li key={item.id}>
                  <button
                    onClick={() => handleNavClick(item.id)}
                    className={`sidebar-nav-item w-full text-left rounded-sm ${isActive ? 'active bg-white/10' : ''}`}
                  >
                    <Icon className={`w-4 h-4 mr-3 transition-colors ${isActive ? 'text-[#facc15]' : ''}`} />
                    <span className={isActive ? 'text-white font-medium' : ''}>{item.label}</span>
                    {isActive && <span className="ml-auto w-1.5 h-1.5 bg-[#facc15] rounded-full" />}
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="px-5 pb-4">
          {isAdmin && (
            <a
              href="/admin/users"
              className="mb-4 inline-flex w-full items-center justify-center gap-2 border border-[#facc15]/60 bg-[#facc15]/10 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#facc15] transition-all hover:bg-[#facc15] hover:text-[#002d6e]"
            >
              <Shield className="h-4 w-4" />
              Адмін-панель
            </a>
          )}
          <div className="flex gap-2 mb-4">
            <SocialLink href="https://facebook.com" icon="facebook" />
            <SocialLink href="https://linkedin.com" icon="linkedin" />
            <SocialLink href="https://t.me/ukrfish2050" icon="telegram" />
          </div>
        </div>

        <div className="mt-auto px-5 pb-5 border-t border-white/10 pt-4">
          <div className="text-[10px] opacity-60 font-mono leading-relaxed">
            REF_SYSTEM: WGS84<br />
            VER: 2025.1.0<br />
            COORD: 50.45N, 30.52E
          </div>
        </div>
      </aside>
    </>
  )
}

function SocialLink({ href, icon }: { href: string; icon: string }) {
  const icons: Record<string, React.ReactNode> = {
    facebook: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    linkedin: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>
    ),
    telegram: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
    ),
  }

  return (
    <a 
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="w-9 h-9 border border-white/20 flex items-center justify-center hover:border-[#facc15] hover:bg-white/5 transition-all duration-300 hover:scale-110"
    >
      {icons[icon]}
    </a>
  )
}
