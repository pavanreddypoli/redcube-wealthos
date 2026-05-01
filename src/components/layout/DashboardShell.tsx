'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { signOut } from '@/app/auth/actions'
import {
  LayoutDashboard, Users, ClipboardList, BarChart3,
  Settings, LogOut, CreditCard, UserCircle,
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

interface Props {
  children: React.ReactNode
  userEmail?: string
}

export function DashboardShell({ children, userEmail }: Props) {
  const pathname = usePathname()
  const initials = userEmail?.[0]?.toUpperCase() ?? 'A'

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

        {/* User + sign out */}
        <div className="px-3 pb-4 pt-3 border-t border-gray-100 space-y-0.5">
          {userEmail && (
            <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
              <div className="w-6 h-6 rounded-full bg-brand-600 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                {initials}
              </div>
              <p className="text-[11px] text-gray-500 truncate leading-none">{userEmail}</p>
            </div>
          )}
          <form action={signOut}>
            <button
              type="submit"
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* ── Main area ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

    </div>
  )
}
