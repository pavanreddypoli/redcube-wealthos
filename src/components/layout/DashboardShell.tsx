'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/app/auth/actions'
import { useState } from 'react'
import {
  LayoutDashboard, Users, ClipboardList, BarChart3,
  Settings, LogOut, Menu, X, CreditCard, UserCircle,
  DollarSign, ShieldCheck,
} from 'lucide-react'

const NAV = [
  { label: 'Dashboard',   href: '/dashboard',            icon: LayoutDashboard },
  { label: 'Clients',     href: '/dashboard/clients',    icon: Users },
  { label: 'Assessments', href: '/assessment',           icon: ClipboardList },
  { label: 'Reports',     href: '/dashboard/reports',    icon: BarChart3 },
  { label: 'My Profile',  href: '/dashboard/profile',    icon: UserCircle },
  { label: 'Referrals',   href: '/dashboard/referrals',  icon: DollarSign },
  { label: 'Settings',    href: '/dashboard/settings',   icon: Settings },
  { label: 'Billing',     href: '/settings/billing',     icon: CreditCard },
]

interface Props {
  children: React.ReactNode
  userEmail?: string
  userName?: string | null
  advisorType?: string | null
  isAdmin?: boolean
}

export function DashboardShell({ children, userEmail, userName, advisorType, isAdmin }: Props) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const displayName = userName ?? userEmail?.split('@')[0] ?? 'Advisor'
  const initials = userName
    ? userName.trim().split(/\s+/).map(n => n[0] ?? '').join('').toUpperCase().slice(0, 2)
    : (userEmail?.[0]?.toUpperCase() ?? 'A')

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname === href || pathname.startsWith(href + '/')

  const NavLinks = ({ onNav }: { onNav?: () => void }) => (
    <>
      {NAV.map(({ label, href, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          onClick={onNav}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
            isActive(href)
              ? 'bg-brand-600 text-white'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Icon className="w-4 h-4 flex-shrink-0" />
          {label}
        </Link>
      ))}
      {isAdmin && (
        <Link
          href="/admin"
          onClick={onNav}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
            pathname.startsWith('/admin')
              ? 'bg-brand-600 text-white'
              : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4 flex-shrink-0" />
          Admin
        </Link>
      )}
    </>
  )

  return (
    <div className="flex h-screen bg-[#F8FAFC] overflow-hidden">

      {/* ── Desktop Sidebar ─────────────────────────────────────────── */}
      <aside className="hidden lg:flex w-[220px] flex-shrink-0 bg-white border-r border-gray-200 flex-col">
        {/* Logo */}
        <div className="px-5 h-14 flex items-center border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-brand-600 text-[18px] leading-none font-bold">■</span>
            <div>
              <p className="text-[13px] font-bold text-gray-900 leading-none tracking-tight">WealthPlanr<span className="text-brand-600">AI</span></p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <NavLinks />
        </nav>

        {/* User + sign out */}
        <div className="px-3 pb-4 pt-3 border-t border-gray-100 space-y-0.5">
          <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
            <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-gray-800 truncate leading-none">{displayName}</p>
              {userEmail && (
                <p className="text-[10px] text-gray-400 truncate leading-none mt-0.5">{userEmail}</p>
              )}
              {advisorType && advisorType !== 'client' && (
                <span className="text-[9px] font-bold bg-brand-100 text-brand-700 px-1.5 py-0.5 rounded-full leading-none">
                  {advisorType === 'Financial Advisor' ? 'FA' : 'FP'}
                </span>
              )}
            </div>
          </div>
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
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Mobile topbar */}
        <header className="lg:hidden bg-white border-b border-gray-200 h-14 flex items-center justify-between px-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-brand-600 text-lg font-bold leading-none">■</span>
            <span className="text-[14px] font-bold text-gray-900">WealthPlanr<span className="text-brand-600">AI</span></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-[11px] font-bold text-white">
              {initials}
            </div>
            <button
              onClick={() => setMobileOpen(true)}
              className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Desktop topbar */}
        <header className="hidden lg:flex bg-white border-b border-gray-200 px-6 h-14 items-center justify-between flex-shrink-0">
          <h1 className="text-base font-semibold text-gray-900">
            Welcome back, <span className="text-brand-600">{displayName}</span>
          </h1>
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-[11px] font-bold text-white">
            {initials}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* ── Mobile drawer overlay ────────────────────────────────────── */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <div className="fixed top-0 left-0 h-full w-[260px] bg-white border-r border-gray-200 z-50 flex flex-col shadow-xl">
            {/* Drawer header */}
            <div className="px-5 h-14 flex items-center justify-between border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-brand-600 text-lg font-bold leading-none">■</span>
                <span className="text-[14px] font-bold text-gray-900">WealthPlanr<span className="text-brand-600">AI</span></span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer nav */}
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
              <NavLinks onNav={() => setMobileOpen(false)} />
            </nav>

            {/* Drawer user + sign out */}
            <div className="px-3 pb-6 pt-3 border-t border-gray-100 space-y-0.5">
              <div className="flex items-center gap-2.5 px-3 py-2 mb-1">
                <div className="w-7 h-7 rounded-full bg-brand-600 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-gray-800 truncate">{displayName}</p>
                  {userEmail && (
                    <p className="text-[10px] text-gray-400 truncate">{userEmail}</p>
                  )}
                </div>
              </div>
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
          </div>
        </>
      )}
    </div>
  )
}
