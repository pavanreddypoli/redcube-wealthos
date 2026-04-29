'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, MessageSquare, FileText,
  ShieldCheck, BarChart3, Settings, LogOut,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const NAV = [
  { label: 'Dashboard',  href: '/dashboard',   icon: LayoutDashboard },
  { label: 'Clients',    href: '/dashboard/clients',  icon: Users },
  { label: 'AI Advisor', href: '/dashboard/advisor',  icon: MessageSquare },
  { label: 'Documents',  href: '/dashboard/documents', icon: FileText },
  { label: 'Compliance', href: '/dashboard/compliance', icon: ShieldCheck },
  { label: 'Results',    href: '/results',     icon: BarChart3 },
]

export function Sidebar() {
  const pathname = usePathname()
  const router   = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <aside className="w-56 flex-shrink-0 bg-gray-950 text-white flex flex-col min-h-screen">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-md bg-brand-600 flex items-center justify-center">
            <BarChart3 className="w-3.5 h-3.5 text-white" />
          </span>
          <div>
            <p className="text-xs font-semibold text-brand-400 leading-none">RedCube</p>
            <p className="text-xs text-gray-400 leading-none mt-0.5">WealthOS</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {NAV.map(item => {
          const active = pathname === item.href
          const Icon   = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                active
                  ? 'bg-brand-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-4 border-t border-gray-800 space-y-0.5">
        <Link
          href="/dashboard/settings"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  )
}
