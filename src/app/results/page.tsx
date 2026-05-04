import { Suspense } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ScoreRing } from './ScoreRing'
import { RISK_LABELS, formatDate } from '@/lib/utils'
import { AlertTriangle, ArrowRight, Calendar, Info, RefreshCw, User } from 'lucide-react'
import type { RiskProfile } from '@/types'
import type { ScoreResults, Recommendation } from '@/lib/scoring'
import type {
  ClientEducationalSummary,
  ClientPlanningTopic,
  ClientGoalSummary,
} from '@/lib/wealthplanr/client-view-translator'

// ── Types ─────────────────────────────────────────────────────────────────────

interface AssessmentRow {
  id: string
  full_name: string | null
  risk_profile: string
  score: number
  score_results: ScoreResults | null
  client_summary: ClientEducationalSummary | null
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

const AREA_ICON: Record<ClientPlanningTopic['area'], string> = {
  cash_flow:   '💵',
  retirement:  '🏖️',
  protection:  '🛡️',
  tax:         '🧾',
  estate:      '📋',
  investments: '📈',
  goals:       '🎯',
}

const RISK_BADGE: Record<string, string> = {
  conservative:    'bg-blue-100 text-blue-700 border border-blue-200',
  moderate:        'bg-amber-100 text-amber-700 border border-amber-200',
  aggressive:      'bg-orange-100 text-orange-700 border border-orange-200',
  very_aggressive: 'bg-red-100 text-red-700 border border-red-200',
}

const PRIORITY_CONFIG = {
  high:   { label: 'High',   badge: 'bg-red-100 text-red-700',     header: 'bg-red-50 border-red-200',     border: 'border-red-200'   },
  medium: { label: 'Medium', badge: 'bg-amber-100 text-amber-700', header: 'bg-amber-50 border-amber-200', border: 'border-amber-200' },
  low:    { label: 'Low',    badge: 'bg-slate-100 text-slate-600', header: 'bg-slate-50 border-slate-200', border: 'border-slate-200' },
} as const

const BAND_CONFIG: Record<string, { pill: string }> = {
  'strong':          { pill: 'bg-green-100 text-green-700' },
  'developing':      { pill: 'bg-blue-100 text-blue-700' },
  'needs attention': { pill: 'bg-amber-100 text-amber-700' },
  'priority area':   { pill: 'bg-red-100 text-red-700' },
}

const GOAL_STATUS_CLS: Record<ClientGoalSummary['educationalStatus'], string> = {
  'on a positive track':             'bg-green-100 text-green-700',
  'progressing':                     'bg-blue-100 text-blue-700',
  'may need attention':              'bg-amber-100 text-amber-700',
  'priority for advisor discussion': 'bg-red-100 text-red-700',
  'no progress data provided':       'bg-slate-100 text-slate-600',
}

// ── Score helpers ─────────────────────────────────────────────────────────────

function scoreColor(s: number): string {
  return s >= 75 ? '#2563eb' : s >= 50 ? '#f59e0b' : '#ef4444'
}

function scoreLabel(s: number): { text: string; cls: string } {
  if (s >= 75) return { text: 'Excellent',  cls: 'text-blue-600' }
  if (s >= 50) return { text: 'Good',       cls: 'text-amber-600' }
  if (s >= 25) return { text: 'Needs Work', cls: 'text-orange-600' }
  return             { text: 'Critical',    cls: 'text-red-600' }
}

function scoreBarColor(s: number): string {
  if (s >= 75) return 'bg-blue-500'
  if (s >= 50) return 'bg-amber-400'
  if (s >= 25) return 'bg-orange-400'
  return 'bg-red-500'
}

// ── hasClientSummary guard ────────────────────────────────────────────────────

function hasClientSummary(
  row: AssessmentRow,
): row is AssessmentRow & { client_summary: ClientEducationalSummary } {
  return (
    row.client_summary !== null &&
    typeof row.client_summary === 'object' &&
    Array.isArray((row.client_summary as ClientEducationalSummary).topicsForAdvisorDiscussion)
  )
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function PriorityBadge({ priority }: { priority: 'high' | 'medium' | 'low' }) {
  const cfg = PRIORITY_CONFIG[priority]
  return (
    <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold ${cfg.badge}`}>
      {cfg.label}
    </span>
  )
}

function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <svg className="w-10 h-10 animate-spin text-brand-300" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      <p className="text-sm text-gray-400">Loading your results…</p>
    </div>
  )
}

// ── Legacy sub-components (preserved for legacy view) ─────────────────────────

function SubScoreCard({ name, score }: { name: string; score: number }) {
  const meta = SUB_META[name] ?? { label: name, icon: '•', explanation: '' }
  const lbl  = scoreLabel(score)
  const bar  = scoreBarColor(score)
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

// ── Legacy view (assessments from before the D1 engine) ───────────────────────

function LegacyResultsContent({ row }: { row: AssessmentRow }) {
  const sr        = row.score_results
  const overall   = sr?.overall_score ?? row.score
  const ring      = scoreColor(overall)
  const riskLabel = RISK_LABELS[row.risk_profile as RiskProfile] ?? row.risk_profile
  const badgeCls  = RISK_BADGE[row.risk_profile] ?? 'bg-gray-100 text-gray-600 border border-gray-200'
  const dateStr   = formatDate(row.created_at)

  const subEntries = sr ? (Object.entries(sr.sub_scores) as [string, number][]) : []
  const gaps       = [...subEntries].sort((a, b) => a[1] - b[1]).slice(0, 3)

  const grouped: Record<'high' | 'medium' | 'low', Recommendation[]> = { high: [], medium: [], low: [] }
  if (sr?.recommendations) {
    for (const rec of sr.recommendations) grouped[rec.priority]?.push(rec)
  }
  const hasRecs = grouped.high.length + grouped.medium.length + grouped.low.length > 0

  return (
    <div className="space-y-6">

      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 border border-blue-200">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/70 border border-blue-200 flex items-center justify-center">
              <User className="w-4 h-4 text-blue-500" />
            </div>
            <span className="text-base font-semibold text-gray-900">{row.full_name ?? 'Your Assessment'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-500 text-xs">
            <Calendar className="w-3.5 h-3.5" /><span>{dateStr}</span>
          </div>
        </div>

        <ScoreRing score={overall} color={ring} />

        <div className="mt-6 flex flex-col items-center gap-3">
          <p className="text-sm font-medium text-gray-600 tracking-wide">Financial Health Score</p>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${badgeCls}`}>{riskLabel}</span>
          <p className="text-xs text-gray-500 text-center max-w-xs">Based on your complete financial assessment</p>
        </div>
      </div>

      {subEntries.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">Category scores</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {subEntries.map(([name, score]) => <SubScoreCard key={name} name={name} score={score} />)}
          </div>
        </section>
      )}

      {sr && sr.risk_flags.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">Areas needing attention</h2>
          <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden shadow-sm">
            {sr.risk_flags.map((flag, i) => (
              <div key={i} className={`flex items-start gap-3 px-5 py-3.5 ${i < sr.risk_flags.length - 1 ? 'border-b border-amber-100' : ''}`}>
                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-900 leading-snug">{flag}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {gaps.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">Top financial gaps</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {gaps.map(([name, score]) => <GapCard key={name} name={name} score={score} />)}
          </div>
        </section>
      )}

      {hasRecs && (
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">Recommended actions</h2>
          <div className="space-y-3">
            {(['high', 'medium', 'low'] as const).map(priority => {
              const recs = grouped[priority]
              if (!recs.length) return null
              const cfg = PRIORITY_CONFIG[priority]
              return (
                <div key={priority} className={`border ${cfg.border} rounded-2xl overflow-hidden shadow-sm`}>
                  <div className={`px-4 py-2.5 ${cfg.header} border-b ${cfg.border}`}>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">{cfg.label} priority</span>
                  </div>
                  <div className="bg-white divide-y divide-gray-100">
                    {recs.map((rec, i) => (
                      <div key={i} className="flex items-start gap-4 px-4 py-3.5">
                        <PriorityBadge priority={priority} />
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-0.5">{rec.category}</span>
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

      <section className="bg-brand-600 rounded-2xl p-8 text-center">
        <h2 className="font-heading text-2xl font-bold text-white mb-2">Ready to take action?</h2>
        <p className="text-brand-100 text-sm mb-6 max-w-md mx-auto">
          Schedule a free 30-minute call with a WealthPlanrAI advisor to build your personalized financial plan.
        </p>
        <Link href="/schedule" className="inline-flex items-center gap-2 px-7 py-3.5 bg-white hover:bg-brand-50 transition-colors text-brand-700 font-semibold text-sm rounded-xl">
          Schedule Advisor Call <ArrowRight className="w-4 h-4" />
        </Link>
        <p className="text-[11px] text-brand-200 mt-4">No obligation. For licensed financial professionals only.</p>
      </section>

      <div className="flex justify-center pb-2">
        <Link href="/assessment" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors">
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

// ── New educational view ───────────────────────────────────────────────────────

function EducationalResultsContent({
  row,
  cs,
}: {
  row: AssessmentRow
  cs: ClientEducationalSummary
}) {
  const overall = cs.overallEducationalScore
  const ring    = scoreColor(overall)
  const dateStr = formatDate(row.created_at)

  return (
    <div className="space-y-6">

      {/* Section 0 — Watermark banner */}
      <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl px-4 py-2.5 text-xs font-semibold uppercase tracking-widest flex items-center gap-2">
        <Info className="w-4 h-4 shrink-0" />
        {cs.watermark}
      </div>

      {/* Section 1 — Hero */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 border border-blue-200">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/70 border border-blue-200 flex items-center justify-center">
              <User className="w-4 h-4 text-blue-500" />
            </div>
            <span className="text-base font-semibold text-gray-900">{row.full_name ?? 'Your Assessment'}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-500 text-xs">
            <Calendar className="w-3.5 h-3.5" /><span>{dateStr}</span>
          </div>
        </div>

        <ScoreRing score={overall} color={ring} />

        <div className="mt-6 flex flex-col items-center gap-2 text-center">
          <p className="text-sm font-semibold text-gray-700 tracking-wide">Educational Reference Score</p>
          <p className="text-sm text-gray-600 leading-relaxed max-w-sm">{cs.overallScoreNarrative}</p>
          <p className="text-[11px] text-gray-400 italic max-w-xs leading-relaxed mt-1">{cs.scoreDisclaimer}</p>
        </div>
      </div>

      {/* Section 2 — Six area summaries */}
      {cs.areaSummaries.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">
            Planning area overview
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {cs.areaSummaries.map(area => {
              const band = BAND_CONFIG[area.qualitativeBand] ?? BAND_CONFIG['developing']
              const bar  = scoreBarColor(area.score)
              return (
                <div key={area.area} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl leading-none">{AREA_ICON[area.area] ?? '•'}</span>
                    <span className="text-sm font-semibold text-gray-700">{area.label}</span>
                  </div>
                  <div className="flex items-end justify-between">
                    <span className="text-3xl font-bold text-gray-900">{area.score}</span>
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${band.pill}`}>
                      {area.qualitativeBand}
                    </span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full ${bar} rounded-full`} style={{ width: `${area.score}%` }} />
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">{area.educationalNote}</p>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Section 3 — Topics for Advisor Discussion */}
      {cs.topicsForAdvisorDiscussion.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1 px-1">
            Topics to discuss with your advisor
          </h2>
          <p className="text-xs text-gray-500 mb-3 px-1">
            Educational planning topics flagged from your responses.
          </p>
          <div className="space-y-3">
            {cs.topicsForAdvisorDiscussion.map((topic, i) => {
              const pcfg = PRIORITY_CONFIG[topic.priorityForDiscussion]
              return (
                <div key={i} className={`bg-white rounded-2xl border ${pcfg.border} shadow-sm overflow-hidden`}>
                  <div className={`px-5 py-3 ${pcfg.header} border-b ${pcfg.border} flex items-center gap-2 flex-wrap`}>
                    <PriorityBadge priority={topic.priorityForDiscussion} />
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                      {topic.area.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="px-5 py-4 space-y-3">
                    <h3 className="text-base font-semibold text-gray-900">{topic.title}</h3>
                    <p className="text-sm text-gray-700 leading-relaxed">{topic.educationalSummary}</p>
                    <div>
                      <p className="text-xs font-semibold text-gray-500 mb-1">Why it matters</p>
                      <p className="text-sm text-gray-600 leading-relaxed">{topic.whyItMatters}</p>
                    </div>
                    <div className="border-l-4 border-brand-200 pl-3">
                      <p className="text-xs font-semibold text-gray-500 mb-1">What to discuss with your advisor</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{topic.whatToDiscussWithAdvisor}</p>
                    </div>
                    {topic.educationalFacts && topic.educationalFacts.length > 0 && (
                      <div className="space-y-2 pt-1">
                        {topic.educationalFacts.map((fact, fi) => (
                          <div key={fi} className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5">
                            <div className="flex items-baseline justify-between gap-2 mb-1">
                              <span className="text-xs font-semibold text-gray-600">{fact.label}</span>
                              <span className="text-sm font-bold text-gray-900">{fact.value}</span>
                            </div>
                            <p className="text-[11px] text-gray-400 italic leading-relaxed">{fact.educationalContext}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Section 4 — Goal Summaries */}
      {cs.goalEducationalSummaries.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">
            Goal summaries
          </h2>
          <div className="space-y-3">
            {cs.goalEducationalSummaries.map((goal, i) => {
              const statusCls = GOAL_STATUS_CLS[goal.educationalStatus] ?? 'bg-slate-100 text-slate-600'
              return (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                  <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{goal.goalLabel}</p>
                      <p className="text-xs text-gray-500">
                        {goal.goalYear} · {goal.yearsAway} year{goal.yearsAway !== 1 ? 's' : ''} away
                      </p>
                    </div>
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${statusCls}`}>
                      {goal.educationalStatus}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed mb-2">{goal.educationalNotes}</p>
                  {goal.approximateGap && (
                    <div className="bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mb-2">
                      <div className="flex items-baseline justify-between gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-amber-800">{goal.approximateGap.label}</span>
                        <span className="text-sm font-bold text-amber-900">{goal.approximateGap.value}</span>
                      </div>
                      <p className="text-[11px] text-amber-700 italic leading-relaxed">
                        {goal.approximateGap.educationalContext}
                      </p>
                    </div>
                  )}
                  <div className="border-l-4 border-brand-200 pl-3">
                    <p className="text-xs font-semibold text-gray-500 mb-0.5">Topic for advisor</p>
                    <p className="text-xs text-gray-700 leading-relaxed">{goal.topicForAdvisor}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Section 5 — Investment Framework Reference */}
      <section>
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">
          Investment framework reference
        </h2>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-0.5">Investment Framework Reference</p>
              <p className="text-xs text-gray-400 italic">Educational only — not a recommendation</p>
            </div>
            <span className="text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200 px-3 py-1 rounded-full">
              {cs.investmentFrameworkReference.educationalProfile}
            </span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed mb-3">
            {cs.investmentFrameworkReference.profileExplanation}
          </p>
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 mb-3">
            <p className="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
              Illustrative allocation range
            </p>
            <p className="text-sm text-gray-800 font-mono leading-relaxed">
              {cs.investmentFrameworkReference.illustrativeAllocationRange}
            </p>
          </div>
          <p className="text-[11px] text-gray-400 italic leading-relaxed">
            {cs.investmentFrameworkReference.disclaimer}
          </p>
        </div>
      </section>

      {/* Section 6 — Next Steps */}
      {cs.nextStepsEducational.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">Next steps</h2>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <ol className="space-y-3">
              {cs.nextStepsEducational.map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-brand-100 text-brand-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-700 leading-relaxed">{step}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* Section 7 — CTA */}
      <section className="bg-brand-600 rounded-2xl p-8 text-center">
        <h2 className="font-heading text-2xl font-bold text-white mb-2">Ready to talk to an advisor?</h2>
        <p className="text-brand-100 text-sm mb-6 max-w-md mx-auto">
          Schedule a free 30-minute conversation with a licensed financial advisor to discuss the topics in this educational summary.
        </p>
        <Link
          href="/schedule"
          className="inline-flex items-center gap-2 px-7 py-3.5 bg-white hover:bg-brand-50 transition-colors text-brand-700 font-semibold text-sm rounded-xl"
        >
          Schedule Advisor Conversation <ArrowRight className="w-4 h-4" />
        </Link>
        <p className="text-[11px] text-brand-200 mt-4">
          WealthPlanrAI is an educational platform. Advisors on our network are independently licensed.
        </p>
      </section>

      {/* Section 8 — Retake link */}
      <div className="flex justify-center pb-2">
        <Link href="/assessment" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors">
          <RefreshCw className="w-3.5 h-3.5" /> Retake assessment
        </Link>
      </div>

      {/* Section 9 — Full disclaimer footer */}
      <div className="border-t border-gray-100 pt-4">
        <p className="text-[11px] text-gray-400 italic leading-relaxed text-center pb-4">
          {cs.fullDisclaimer}
        </p>
      </div>

    </div>
  )
}

// ── Main results content (server component — chooses view based on data) ───────

async function ResultsContent({ id }: { id: string }) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('assessments')
    .select('id, full_name, client_summary, score_results, score, risk_profile, created_at')
    .eq('id', id)
    .single()

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-6 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
          <AlertTriangle className="w-7 h-7 text-red-400" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Assessment not found</h2>
          <p className="text-sm text-gray-500">
            We couldn&apos;t locate this assessment. It may have expired or the link is invalid.
          </p>
        </div>
        <Link
          href="/assessment"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-colors"
        >
          Retake assessment <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    )
  }

  const row = data as AssessmentRow

  return hasClientSummary(row)
    ? <EducationalResultsContent row={row} cs={row.client_summary} />
    : <LegacyResultsContent row={row} />
}

// ── Page shell ────────────────────────────────────────────────────────────────

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const { id } = await searchParams

  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      <header className="bg-white border-b border-gray-200 px-6 h-14 flex items-center justify-between sticky top-0 z-10">
        <Link href="/" className="flex items-center gap-2 text-[15px] text-gray-900 font-semibold">
          <span className="text-brand-600 text-lg leading-none">■</span>
          WealthPlanr<span className="font-bold text-brand-600">AI</span>
        </Link>
        <span className="text-[11px] text-gray-400 tracking-[1.2px] uppercase">Educational Summary</span>
      </header>

      <main className="mx-auto max-w-[900px] px-4 py-10">

        <div className="mb-7">
          <h1 className="font-heading text-2xl font-bold text-gray-900">Your Educational Financial Summary</h1>
          <p className="text-sm text-gray-600 leading-relaxed mt-2 max-w-2xl">
            This educational summary uses standardized planning frameworks to help you understand your current
            financial picture and prepare for a productive conversation with a licensed financial professional.
            It is NOT financial advice, does NOT recommend any specific investment or product, and is NOT
            a substitute for personalized professional guidance.
          </p>
        </div>

        <Suspense fallback={<Spinner />}>
          {id ? (
            <ResultsContent id={id} />
          ) : (
            <div className="flex flex-col items-center justify-center py-32 gap-6 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-gray-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">No assessment found</h2>
                <p className="text-sm text-gray-500">Complete the assessment to see your personalised results.</p>
              </div>
              <Link
                href="/assessment"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-600 text-white text-sm font-semibold rounded-xl hover:bg-brand-700 transition-colors"
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
