import { cn } from '@/lib/utils'
import type { HTMLAttributes, InputHTMLAttributes, LabelHTMLAttributes, ReactNode } from 'react'

// ─── Card ─────────────────────────────────────────────────────────────────────

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  padding?: boolean
}

export function Card({ children, padding = true, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-200 shadow-sm',
        padding && 'p-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: string
  sub?: string
  trend?: 'up' | 'down' | 'neutral'
}

export function StatCard({ label, value, sub, trend }: StatCardProps) {
  return (
    <Card>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
      {sub && (
        <p className={cn(
          'mt-1 text-xs',
          trend === 'up'   && 'text-green-600',
          trend === 'down' && 'text-red-600',
          trend === 'neutral' && 'text-gray-500',
          !trend && 'text-gray-500'
        )}>
          {sub}
        </p>
      )}
    </Card>
  )
}

// ─── Badge ────────────────────────────────────────────────────────────────────

interface BadgeProps {
  children: ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

const badgeVariants = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-50  text-green-700',
  warning: 'bg-amber-50  text-amber-700',
  danger:  'bg-red-50    text-red-700',
  info:    'bg-blue-50   text-blue-700',
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      badgeVariants[variant],
      className
    )}>
      {children}
    </span>
  )
}

// ─── Input ────────────────────────────────────────────────────────────────────

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export function Input({ label, error, hint, className, id, ...props }: InputProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <input
        id={id}
        className={cn(
          'block w-full rounded-lg border px-3 py-2 text-sm text-gray-900',
          'placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500',
          'transition-colors',
          error
            ? 'border-red-400 focus:ring-red-400'
            : 'border-gray-300 focus:border-brand-500',
          className
        )}
        {...props}
      />
      {hint  && !error && <p className="text-xs text-gray-500">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

// ─── Select ───────────────────────────────────────────────────────────────────

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export function Select({ label, error, options, id, className, ...props }: SelectProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <select
        id={id}
        className={cn(
          'block w-full rounded-lg border px-3 py-2 text-sm text-gray-900',
          'focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors',
          error ? 'border-red-400' : 'border-gray-300',
          className
        )}
        {...props}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

// ─── Divider ──────────────────────────────────────────────────────────────────

export function Divider({ label }: { label?: string }) {
  if (!label) return <hr className="border-gray-200" />
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
      <div className="relative flex justify-center">
        <span className="px-3 bg-white text-xs text-gray-500">{label}</span>
      </div>
    </div>
  )
}
