'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Users, ClipboardList, BarChart3,
  Settings, LogOut,
} from 'lucide-react'

const NAV = [
  { label: 'Dashboard',   href: '/dashboard',          icon: LayoutDashboard },
  { label: 'Clients',     href: '/dashboard/clients',  icon: Users },
  { label: 'Assessments', href: '/assessment',         icon: ClipboardList },
  { label: 'Reports',     href: '/dashboard/reports',  icon: BarChart3 },
  { label: 'Settings',    href: '/dashboard/settings', icon: Settings },
]

interface Props {
  children: React.ReactNode
  userEmail?: string
}

export function DashboardShell({ children, userEmail }: Props) {
  const pathname = usePathname()
  const router   = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const initials = userEmail?.[0]?.toUpperCase() ?? 'A'

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside className="w-[220px] flex-shrink-0 bg-slate-900 text-white flex flex-col">

        {/* Logo */}
        <div className="px-5 h-14 flex items-center border-b border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-rose-500 text-[18px] leading-none font-bold">■</span>
            <div>
              <p className="text-[13px] font-bold text-white leading-none tracking-tight">RedCube</p>
              <p className="text-[10px] text-slate-400 leading-none mt-0.5">WealthOS</p>
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
                    ? 'bg-rose-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800',
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* User + sign out */}
        <div className="px-3 pb-4 pt-3 border-t border-slate-800 space-y-0.5">
          {userEmail && (
            <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
              <div className="w-6 h-6 rounded-full bg-rose-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                {initials}
              </div>
              <p className="text-[11px] text-slate-400 truncate leading-none">{userEmail}</p>
            </div>
          )}
          <button
            onClick={signOut}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            Sign out
          </button>
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
