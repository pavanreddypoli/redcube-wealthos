import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Allocation, RiskProfile } from '@/types'

// ─── Tailwind class merger ────────────────────────────────────────────────────

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Number formatters ────────────────────────────────────────────────────────

export function formatCurrency(value: number, compact = false): string {
  if (compact) {
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`
    if (value >= 1_000_000)     return `$${(value / 1_000_000).toFixed(1)}M`
    if (value >= 1_000)         return `$${(value / 1_000).toFixed(0)}K`
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  }).format(new Date(iso))
}

// ─── Assessment scoring ───────────────────────────────────────────────────────

export function computeRiskProfile(score: number): RiskProfile {
  if (score < 25)  return 'conservative'
  if (score < 50)  return 'moderate'
  if (score < 75)  return 'aggressive'
  return 'very_aggressive'
}

export function getAllocationForProfile(profile: RiskProfile): Allocation {
  const allocations: Record<RiskProfile, Allocation> = {
    conservative:    { us_equities: 20, intl_equities: 10, fixed_income: 55, alternatives: 5,  cash: 10 },
    moderate:        { us_equities: 40, intl_equities: 20, fixed_income: 30, alternatives: 5,  cash: 5  },
    aggressive:      { us_equities: 55, intl_equities: 25, fixed_income: 12, alternatives: 6,  cash: 2  },
    very_aggressive: { us_equities: 65, intl_equities: 25, fixed_income: 5,  alternatives: 4,  cash: 1  },
  }
  return allocations[profile]
}

export const RISK_LABELS: Record<RiskProfile, string> = {
  conservative:    'Conservative',
  moderate:        'Moderate',
  aggressive:      'Aggressive',
  very_aggressive: 'Very Aggressive',
}

export const RISK_COLORS: Record<RiskProfile, string> = {
  conservative:    'text-blue-600 bg-blue-50',
  moderate:        'text-amber-600 bg-amber-50',
  aggressive:      'text-orange-600 bg-orange-50',
  very_aggressive: 'text-red-600 bg-red-50',
}
