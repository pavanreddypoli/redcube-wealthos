'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { signOut } from '@/app/auth/actions'
import {
  LayoutDashboard, Users, ClipboardList, BarChart3,
  Settings, LogOut, CreditCard, UserCircle, Bell,
} from 'lucide-react'

const NAV = [
  { label: 'Dashboard',   href: '/dashboard',          icon: LayoutDashboard },
  { label: 'Clients',     href: '/dashboard/clients',  icon: Users },
  { label: 'Assessments', href: '/assessment',         icon: ClipboardList },
  { label: 'Reports',     href: '/dashboard/reports',  icon: BarChart3 },
  { label: 'My Profile',  href: '/dashboard/profile',  icon: UserCircle },
  { label: 'Settings',    href: '/dashboard/settings', icon: Settings },
  { label: 'Billing',     href: '/settings/billing',   icon: CreditCard },
]

const TYPE_BADGE: Record<string, string> = {
  'Financial Advisor': 'FA',
  'Financial Planner': 'FP',
}

interface Props {
  children: React.ReactNode
  userEmail?: string
  userName?: string | null
  advisorType?: string | null
}

export function DashboardShell({ children, userEmail, userName, advisorType }: Props) {
  const pathname = usePathname()

  async function handleSignOut() {
    await signOut()
    window.location.href = '/'
  }

  const displayName = userName ?? userEmail?.split('@')[0] ?? 'Advisor'
  const initials = userName
    ? userName.trim().split(/\s+/).map(n => n[0] ?? '').join('').toUpperCase().slice(0, 2)
    : (userEmail?.[0]?.toUpperCase() ?? 'A')

  const typeBadge = advisorType ? (TYPE_BADGE[advisorType] ?? null) : null
  const profileComplete = !!(userName && advisorType && advisorType !== 'client')

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside className="w-[220px] flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">

        {/* Logo */}
        <div className="px-5 h-14 flex items-center border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-brand-600 text-[18px] leading-none font-bold">■</span>
            <div>
              <p className="text-[13px] font-bold text-gray-900 leading-none tracking-tight">RedCube</p>
              <p className="text-[10px] text-gray-400 leading-none mt-0.5">WealthOS</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {NAV.map(({ label, href, icon: Icon }) => {
            const active =
              href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                  active
                    ? 'bg-brand-600 text-white'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100',
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className="px-3 pb-4 pt-3 border-t border-gray-100 space-y-0.5">
          <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="text-[12px] font-semibold text-gray-800 truncate leading-none">{displayName}</p>
                {typeBadge && (
                  <span className="text-[9px] font-bold bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded-full flex-shrink-0 leading-none">
                    {typeBadge}
                  </span>
                )}
              </div>
              {userEmail && (
                <p className="text-[10px] text-gray-400 truncate leading-none mt-0.5">{userEmail}</p>
              )}
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Main area ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 px-6 h-14 flex items-center justify-between flex-shrink-0">
          <h1 className="font-heading text-base font-semibold text-gray-900">
            Welcome back, <span className="text-brand-600">{displayName}</span>
          </h1>
          <div className="flex items-center gap-3">
            <button className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
              {initials}
            </div>
          </div>
        </header>

        {/* Profile incomplete banner */}
        {!profileComplete && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between flex-shrink-0">
            <p className="text-xs text-amber-800 font-medium">
              Complete your advisor profile to appear in the client advisor dropdown.
            </p>
            <Link
              href="/dashboard/profile"
              className="text-xs font-semibold text-amber-700 hover:text-amber-900 whitespace-nowrap ml-4 underline underline-offset-2"
            >
              Complete Profile →
            </Link>
          </div>
        )}

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

    </div>
  )
}
