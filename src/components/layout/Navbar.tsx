'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { BarChart3, Menu, X } from 'lucide-react'
import { useState } from 'react'

const NAV_LINKS = [
  { label: 'Features',  href: '/#features'  },
  { label: 'Pricing',   href: '/#pricing'   },
  { label: 'About',     href: '/#about'     },
]

export function Navbar() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-semibold text-gray-900">
          <span className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-white" />
          </span>
          <span>RedCube <span className="text-brand-600">WealthOS</span></span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/auth/login">
            <Button variant="ghost" size="sm">Sign in</Button>
          </Link>
          <Link href="/assessment">
            <Button size="sm">Start free assessment</Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 space-y-3 animate-fade-in">
          {NAV_LINKS.map(l => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="block text-sm text-gray-700 hover:text-brand-600 py-1"
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-2 flex flex-col gap-2">
            <Link href="/auth/login" onClick={() => setOpen(false)}>
              <Button variant="secondary" size="sm" className="w-full">Sign in</Button>
            </Link>
            <Link href="/assessment" onClick={() => setOpen(false)}>
              <Button size="sm" className="w-full">Start free assessment</Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
