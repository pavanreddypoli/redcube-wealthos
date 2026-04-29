import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ScoreRing } from './ScoreRing'
import { RISK_LABELS, formatDate } from '@/lib/utils'
import { AlertTriangle, ArrowRight, Calendar, RefreshCw, User } from 'lucide-react'
import type { RiskProfile } from '@/types'
import type { ScoreResults, Recommendation } from '@/lib/scoring'

// ── Types ─────────────────────────────────────────────────────────────────────

interface AssessmentRow {
  id: string
  full_name: string | null
  risk_profile: string
  score: number
  score_results: ScoreResults | null
  created_at: string
}

// ── Static lookup tables ───────────────────────────────────────────────────────

const SUB_META: Record<string, { label: string; icon: string; explanation: string }> = {
  cashflow:    { label: 'Cash Flow',   icon: '💵', explanation: 'Strong cash flow is the foundation of every financial plan.' },
  retirement:  { label: 'Retirement',  icon: '🏖️', explanation: 'Retirement savings compound over time — every year matters.' },
  insurance:   { label: 'Insurance',   icon: '🛡️', explanation: 'Insurance protects your wealth from unexpected events.' },
  tax:         { label: 'Tax',         icon: '🧾', explanation: 'Tax efficiency can add hundreds of thousands over a lifetime.' },
  estate:      { label: 'Estate',      icon: '📋', explanation: 'Estate planning ensures your wishes are carried out.' },
  investments: { label: 'Investments', icon: '📈', explanation: 'A clear investment strategy grows your wealth systematically.' },
}

const RISK_BADGE: Record<string, string> = {
  conservative:    'bg-blue-900/50 text-blue-300 border border-blue-700/50',
  moderate:        'bg-amber-900/50 text-amber-300 border border-amber-700/50',
  aggressive:      'bg-orange-900/50 text-orange-300 border border-orange-700/50',
  very_aggressive: 'bg-rose-900/50 text-rose-300 border border-rose-700/50',
}

const PRIORITY_CONFIG = {
  high:   { label: 'High',   badge: 'bg-rose-100 text-rose-700',   header: 'bg-rose-50 border-rose-200',  border: 'border-rose-200' },
  medium: { label: 'Medium', badge: 'bg-amber-100 text-amber-700',  header: 'bg-amber-50 border-amber-200', border: 'border-amber-200' },
  low:    { label: 'Low',    badge: 'bg-slate-100 text-slate-600',  header: 'bg-slate-50 border-slate-200', border: 'border-slate-200' },
} as const

// ── Score helpers ─────────────────────────────────────────────────────────────

function scoreColor(s: number): string {
  return s >= 75 ? '#10b981' : s >= 50 ? '#f59e0b' : '#f43f5e'
}

function scoreLabel(s: number): { text: string; cls: string } {
  if (s >= 75) return { text: 'Excellent',  cls: 'text-emerald-600' }
  if (s >= 50) return { text: 'Good',       cls: 'text-amber-600' }
  if (s >= 25) return { text: 'Needs Work', cls: 'text-orange-600' }
  return             { text: 'Critical',    cls: 'text-rose-600' }
}

function scoreBarColor(s: number): string {
  if (s >= 75) return 'bg-emerald-500'
  if (s >= 50) return 'bg-amber-400'
  if (s >= 25) return 'bg-orange-400'
  return 'bg-rose-500'
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SubScoreCard({ name, score }: { name: string; score: number }) {
  const meta  = SUB_META[name] ?? { label: name, icon: '•', explanation: '' }
  const lbl   = scoreLabel(score)
  const bar   = scoreBarColor(score)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <span className="text-2xl leading-none">{meta.icon}</span>
        <span className="text-sm font-semibold text-gray-700">{meta.label}</span>
      </div>
      <div className="flex items-end justify-between">
        <span className="text-3xl font-bold text-gray-900">{score}</span>
        <span className={`text-xs font-semibold ${lbl.cls}`}>{lbl.text}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${bar} rounded-full`} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}

function GapCard({ name, score }: { name: string; score: number }) {
  const meta = SUB_META[name] ?? { label: name, icon: '•', explanation: '' }
  const lbl  = scoreLabel(score)
  const bar  = scoreBarColor(score)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl leading-none">{meta.icon}</span>
          <span className="text-sm font-semibold text-gray-800">{meta.label}</span>
        </div>
        <span className={`text-sm font-bold ${lbl.cls}`}>{score}/100</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
        <div className={`h-full ${bar} rounded-full`} style={{ width: `${score}%` }} />
      </div>
      <p className="text-xs text-gray-500 leading-relaxed">{meta.explanation}</p>
    </div>
  )
}

function PriorityBadge({ priority }: { priority: 'high' | 'medium' | 'low' }) {
  const cfg = PRIORITY_CONFIG[priority]
  return (
    <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold ${cfg.badge}`}>
      {cfg.label}
    </span>
  )
}

// ── Spinner (for Suspense fallback) ───────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <svg className="w-10 h-10 animate-spin text-slate-300" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      <p className="text-sm text-gray-400">Loading your results…</p>
    </div>
  )
}

// ── Main results content (server) ─────────────────────────────────────────────

async function ResultsContent({ id }: { id: string }) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('assessments')
    .select('id, full_name, risk_profile, score, score_results, created_at')
    .eq('id', id)
    .single()

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-rose-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Assessment not found</h2>
          <p className="text-sm text-gray-500">We couldn't locate this assessment. It may have expired or the link is invalid.</p>
        </div>
        <Link
          href="/assessment"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white text-sm font-semibold rounded-xl hover:bg-rose-700 transition-colors"
        >
          Retake assessment <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    )
  }

  const row = data as AssessmentRow
  const sr  = row.score_results
  const overall = sr?.overall_score ?? row.score
  const ring    = scoreColor(overall)
  const riskLabel = RISK_LABELS[row.risk_profile as RiskProfile] ?? row.risk_profile
  const badgeCls  = RISK_BADGE[row.risk_profile] ?? 'bg-slate-700 text-slate-300 border border-slate-600'
  const dateStr   = formatDate(row.created_at)

  // Top-3 lowest sub-scores
  const subEntries = sr ? (Object.entries(sr.sub_scores) as [string, number][]) : []
  const gaps = [...subEntries].sort((a, b) => a[1] - b[1]).slice(0, 3)

  // Recommendations grouped by priority
  const grouped: Record<'high' | 'medium' | 'low', Recommendation[]> = { high: [], medium: [], low: [] }
  if (sr?.recommendations) {
    for (const rec of sr.recommendations) grouped[rec.priority]?.push(rec)
  }
  const hasRecs = grouped.high.length + grouped.medium.length + grouped.low.length > 0

  return (
    <div className="space-y-6">

      {/* ── Section 1: Hero score card ───────────────────────────────── */}
      <div className="bg-slate-900 rounded-2xl p-8 text-white">

        {/* Name + date */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
              <User className="w-4 h-4 text-slate-400" />
            </div>
            <span className="text-base font-semibold text-white">
              {row.full_name ?? 'Your Assessment'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400 text-xs">
            <Calendar className="w-3.5 h-3.5" />
            <span>{dateStr}</span>
          </div>
        </div>

        {/* Ring */}
        <ScoreRing score={overall} color={ring} />

        {/* Labels */}
        <div className="mt-6 flex flex-col items-center gap-3">
          <p className="text-sm font-medium text-slate-400 tracking-wide">Financial Health Score</p>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${badgeCls}`}>
            {riskLabel}
          </span>
          <p className="text-xs text-slate-500 text-center max-w-xs">
            Based on your complete financial assessment
          </p>
        </div>
      </div>

      {/* ── Section 2: Sub-score grid ────────────────────────────────── */}
      {subEntries.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">
            Category scores
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {subEntries.map(([name, score]) => (
              <SubScoreCard key={name} name={name} score={score} />
            ))}
          </div>
        </section>
      )}

      {/* ── Section 3: Risk flags ────────────────────────────────────── */}
      {sr && sr.risk_flags.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">
            Areas needing attention
          </h2>
          <div className="bg-rose-50 border border-rose-200 rounded-2xl overflow-hidden shadow-sm">
            {sr.risk_flags.map((flag, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 px-5 py-3.5 ${i < sr.risk_flags.length - 1 ? 'border-b border-rose-100' : ''}`}
              >
                <AlertTriangle className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
                <p className="text-sm text-rose-800 leading-snug">{flag}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Section 4: Top 3 financial gaps ─────────────────────────── */}
      {gaps.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">
            Top financial gaps
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {gaps.map(([name, score]) => (
              <GapCard key={name} name={name} score={score} />
            ))}
          </div>
        </section>
      )}

      {/* ── Section 5: Recommended actions ──────────────────────────── */}
      {hasRecs && (
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">
            Recommended actions
          </h2>
          <div className="space-y-3">
            {(['high', 'medium', 'low'] as const).map(priority => {
              const recs = grouped[priority]
              if (!recs.length) return null
              const cfg = PRIORITY_CONFIG[priority]
              return (
                <div key={priority} className={`border ${cfg.border} rounded-2xl overflow-hidden shadow-sm`}>
                  <div className={`px-4 py-2.5 ${cfg.header} border-b ${cfg.border}`}>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                      {cfg.label} priority
                    </span>
                  </div>
                  <div className="bg-white divide-y divide-gray-100">
                    {recs.map((rec, i) => (
                      <div key={i} className="flex items-start gap-4 px-4 py-3.5">
                        <PriorityBadge priority={priority} />
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">
                            {rec.category}
                          </span>
                          <p className="text-sm text-gray-700 leading-snug">{rec.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Section 6: CTA ──────────────────────────────────────────── */}
      <section className="bg-slate-900 rounded-2xl p-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Ready to take action?</h2>
        <p className="text-slate-400 text-sm mb-6 max-w-md mx-auto">
          Schedule a free 30-minute call with a RedCube advisor to build your personalized financial plan.
        </p>
        <Link
          href="/schedule"
          className="inline-flex items-center gap-2 px-7 py-3.5 bg-rose-600 hover:bg-rose-700 transition-colors text-white font-semibold text-sm rounded-xl"
        >
          Schedule Advisor Call <ArrowRight className="w-4 h-4" />
        </Link>
        <p className="text-[11px] text-slate-500 mt-4">
          No obligation. Licensed advisors. SEC &amp; FINRA compliant.
        </p>
      </section>

      {/* ── Section 7: Retake + Disclaimer ──────────────────────────── */}
      <div className="flex justify-center pb-2">
        <Link
          href="/assessment"
          className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retake assessment
        </Link>
      </div>

      <p className="text-[11px] text-gray-400 leading-relaxed text-center pb-4">
        This assessment is for informational purposes only and does not constitute financial, investment,
        tax, or legal advice. Past performance is not indicative of future results. Please consult a
        licensed financial advisor before making investment decisions.
      </p>

    </div>
  )
}

// ── Page shell ────────────────────────────────────────────────────────────────

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const { id } = await searchParams

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Dark navy header */}
      <header className="bg-slate-900 px-6 h-14 flex items-center justify-between sticky top-0 z-10">
        <Link href="/" className="flex items-center gap-2 text-[15px] text-white font-semibold">
          <span className="text-rose-500 text-lg leading-none">■</span>
          RedCube <span className="font-bold">WealthOS</span>
        </Link>
        <span className="text-[11px] text-slate-400 tracking-[1.2px] uppercase">Assessment Results</span>
      </header>

      <main className="mx-auto max-w-[900px] px-4 py-10">

        {/* Page title */}
        <div className="mb-7">
          <h1 className="text-2xl font-bold text-gray-900">Your Financial Health Report</h1>
          <p className="text-gray-500 mt-1 text-sm">
            A comprehensive snapshot of your financial wellbeing across six dimensions.
          </p>
        </div>

        <Suspense fallback={<Spinner />}>
          {id ? (
            <ResultsContent id={id} />
          ) : (
            <div className="flex flex-col items-center justify-center py-32 gap-6 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-slate-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">No assessment found</h2>
                <p className="text-sm text-gray-500">Complete the assessment to see your personalised results.</p>
              </div>
              <Link
                href="/assessment"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white text-sm font-semibold rounded-xl hover:bg-rose-700 transition-colors"
              >
                Take the assessment <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </Suspense>

      </main>
    </div>
  )
}
