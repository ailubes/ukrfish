'use client'

import { useCallback, useEffect, useState } from 'react'
import './App.css'
import Sidebar from './components/Sidebar'
import Dashboard from './sections/Dashboard'
import Landing from './sections/Landing'
import About from './sections/About'
import Activities from './sections/Activities'
import Membership from './sections/Membership'
import MemberDashboard from './sections/MemberDashboard'
import News from './sections/News'
import Contact from './sections/Contact'
import MapSection from './sections/MapSection'
import { fetchWpPostById } from './lib/wp'
import { type MembershipPlanCode } from './lib/membership'

export type Section = 'landing' | 'dashboard' | 'about' | 'activities' | 'membership' | 'marketplace' | 'cabinet' | 'news' | 'contact' | 'map'

interface ParsedRoute {
  section: Section
  newsSlug: string | null
  legacyPostId: number | null
  redirectTo: string | null
}

type AuthState = 'loading' | 'authenticated' | 'unauthenticated'
type UserRole = 'USER' | 'ADMIN' | 'SUPERADMIN'

interface CurrentUser {
  id: string
  email: string
  name: string | null
  role: UserRole
}

const SECTION_TO_PATH: Record<Section, string> = {
  landing: '/',
  dashboard: '/analytics',
  map: '/map',
  about: '/about',
  activities: '/activities',
  membership: '/membership',
  marketplace: '/marketplace',
  cabinet: '/cabinet',
  news: '/news',
  contact: '/contact',
}

const PATH_TO_SECTION = new Map<string, Section>(
  Object.entries(SECTION_TO_PATH).map(([section, path]) => [path, section as Section]),
)

function parseRouteFromLocation(currentLocation: Location): ParsedRoute {
  const url = new URL(currentLocation.href)
  const path = currentLocation.pathname.replace(/\/+$/, '') || '/'
  const wpPostId = url.searchParams.get('p')

  if (path.startsWith('/news/')) {
    const rawSlug = path.replace('/news/', '')
    return {
      section: 'news',
      newsSlug: rawSlug ? decodeURIComponent(rawSlug) : null,
      legacyPostId: null,
      redirectTo: null,
    }
  }

  if (path === '/news') {
    return { section: 'news', newsSlug: null, legacyPostId: null, redirectTo: null }
  }

  if (wpPostId && /^\d+$/.test(wpPostId)) {
    return {
      section: 'news',
      newsSlug: null,
      legacyPostId: Number.parseInt(wpPostId, 10),
      redirectTo: null,
    }
  }

  if (path === '/dashboard') {
    return {
      section: 'dashboard',
      newsSlug: null,
      legacyPostId: null,
      redirectTo: '/analytics',
    }
  }

  const directSection = PATH_TO_SECTION.get(path)
  if (directSection) {
    return { section: directSection, newsSlug: null, legacyPostId: null, redirectTo: null }
  }

  const segments = path.split('/').filter(Boolean)
  if (segments.length === 1) {
    const legacySlug = decodeURIComponent(segments[0])
    const encodedSlug = encodeURIComponent(legacySlug)
    return {
      section: 'news',
      newsSlug: legacySlug,
      legacyPostId: null,
      redirectTo: `/news/${encodedSlug}`,
    }
  }

  return { section: 'landing', newsSlug: null, legacyPostId: null, redirectTo: null }
}

function buildSignInUrl(callbackPath: string): string {
  return `/auth/signin?callbackUrl=${encodeURIComponent(callbackPath)}`
}

function App() {
  const [activeSection, setActiveSection] = useState<Section>('dashboard')
  const [activeNewsSlug, setActiveNewsSlug] = useState<string | null>(null)
  const [legacyPostId, setLegacyPostId] = useState<number | null>(null)
  const [isResolvingLegacyPost, setIsResolvingLegacyPost] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [authState, setAuthState] = useState<AuthState>('loading')
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 300)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    let isCancelled = false

    void fetch('/api/auth/session', {
      method: 'GET',
      credentials: 'same-origin',
      cache: 'no-store',
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((payload: { user?: CurrentUser } | null) => {
        if (isCancelled) {
          return
        }

        if (payload?.user?.id) {
          setCurrentUser(payload.user)
          setAuthState('authenticated')
          return
        }

        setCurrentUser(null)
        setAuthState('unauthenticated')
      })
      .catch(() => {
        if (!isCancelled) {
          setCurrentUser(null)
          setAuthState('unauthenticated')
        }
      })

    return () => {
      isCancelled = true
    }
  }, [])

  const syncRouteState = useCallback(() => {
    const route = parseRouteFromLocation(window.location)
    if (route.redirectTo) {
      window.history.replaceState({}, '', route.redirectTo)
    }

    setActiveSection(route.section)
    setActiveNewsSlug(route.newsSlug)
    setLegacyPostId(route.legacyPostId)
    setIsResolvingLegacyPost(route.legacyPostId !== null)
  }, [])

  useEffect(() => {
    syncRouteState()
    window.addEventListener('popstate', syncRouteState)
    return () => window.removeEventListener('popstate', syncRouteState)
  }, [syncRouteState])

  useEffect(() => {
    if (authState !== 'unauthenticated') {
      return
    }
    if (activeSection !== 'cabinet') {
      return
    }
    window.location.assign(buildSignInUrl('/cabinet'))
  }, [activeSection, authState])

  useEffect(() => {
    if (legacyPostId === null) {
      return
    }

    let isCancelled = false
    setIsResolvingLegacyPost(true)

    void fetchWpPostById(legacyPostId)
      .then((post) => {
        if (isCancelled) {
          return
        }

        if (post) {
          const targetPath = `/news/${encodeURIComponent(post.slug)}`
          window.history.replaceState({}, '', targetPath)
          setActiveNewsSlug(post.slug)
        } else {
          window.history.replaceState({}, '', '/news')
          setActiveNewsSlug(null)
        }

        setActiveSection('news')
      })
      .finally(() => {
        if (isCancelled) {
          return
        }

        setLegacyPostId(null)
        setIsResolvingLegacyPost(false)
      })

    return () => {
      isCancelled = true
    }
  }, [legacyPostId])

  const navigateToSection = useCallback((section: Section) => {
    if (section === 'cabinet' && authState !== 'authenticated') {
      window.location.assign(buildSignInUrl('/cabinet'))
      return
    }

    if (section === 'marketplace') {
      window.location.assign('/marketplace')
      return
    }

    const path = SECTION_TO_PATH[section]
    window.history.pushState({}, '', path)
    setActiveSection(section)
    setActiveNewsSlug(null)
    setLegacyPostId(null)
    setIsResolvingLegacyPost(false)
  }, [authState])

  const openNewsPost = useCallback((slug: string) => {
    const targetPath = `/news/${encodeURIComponent(slug)}`
    window.history.pushState({}, '', targetPath)
    setActiveSection('news')
    setActiveNewsSlug(slug)
    setLegacyPostId(null)
    setIsResolvingLegacyPost(false)
  }, [])

  const closeNewsPost = useCallback(() => {
    window.history.pushState({}, '', '/news')
    setActiveSection('news')
    setActiveNewsSlug(null)
  }, [])

  const selectMembershipPlan = useCallback((planCode: MembershipPlanCode) => {
    const applyTarget = `/membership/apply?plan=${encodeURIComponent(planCode)}`
    if (authState === 'authenticated') {
      window.location.assign(applyTarget)
      return
    }

    const joinTarget = `/auth/join?plan=${encodeURIComponent(planCode)}&callbackUrl=${encodeURIComponent(applyTarget)}`
    window.location.assign(joinTarget)
  }, [authState])

  const renderSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />
      case 'landing':
        return <Landing />
      case 'about':
        return <About />
      case 'activities':
        return <Activities />
      case 'membership':
        return <Membership onSelectPlan={selectMembershipPlan} />
      case 'marketplace':
        return (
          <div className="p-6 lg:p-8">
            <div className="blueprint-panel">
              <p className="text-gray-600">Відкриваємо маркетплейс...</p>
            </div>
          </div>
        )
      case 'cabinet':
        if (authState !== 'authenticated') {
          return (
            <div className="p-6 lg:p-8">
              <div className="blueprint-panel">
                <p className="text-gray-600">Перевірка доступу до кабінету...</p>
              </div>
            </div>
          )
        }
        return <MemberDashboard currentUser={currentUser} />
      case 'news':
        return (
          <News
            activeSlug={activeNewsSlug}
            onOpenPost={openNewsPost}
            onClosePost={closeNewsPost}
            isResolvingLegacyPost={isResolvingLegacyPost}
          />
        )
      case 'contact':
        return <Contact />
      case 'map':
        return <MapSection />
      default:
        return <Landing />
    }
  }

  return (
    <div className={`min-h-screen transition-all duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}>
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-[60] p-3 bg-[#002d6e] text-white rounded-sm"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="flex min-h-screen">
        <Sidebar 
          activeSection={activeSection} 
          onSectionChange={navigateToSection}
          isMobileOpen={isMobileMenuOpen}
          onMobileClose={() => setIsMobileMenuOpen(false)}
          canAccessCabinet={authState === 'authenticated'}
          isAdmin={currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERADMIN'}
        />
        <main className="flex-1 lg:ml-[280px] transition-all duration-500">
          <div key={activeSection} className="animate-fade-in-up">
            {renderSection()}
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
