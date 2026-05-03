import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Shield, TrendingUp, Heart, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { ScoreResults } from '@/lib/scoring'
import { DownloadButton } from './DownloadButton'
import { AdvisorSelector } from './AdvisorSelector'

// ── Types ──────────────────────────────────────────────────────────────────────

interface AssessmentData {
  id: string
  full_name: string | null
  email: string | null
  risk_profile: string
  score: number
  score_results: ScoreResults | null
  answers: Record<string, unknown> | null
  created_at: string
}

interface PillarData {
  key: string
  name: string
  score: number
  statusLabel: string
  findings: string[]
  icon: React.ReactNode
  accent: string       // text color
  bgAccent: string     // icon bg color
  borderAccent: string // card left border
}

interface ProductRec {
  icon: string
  title: string
  explanation: string
  priority: 'High' | 'Medium' | 'Low'
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function n(val: unknown): number {
  return parseFloat(String(val ?? '0')) || 0
}

function clamp(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)))
}

function pillarStatus(score: number, labels: [string, string, string]): string {
  if (score >= 80) return labels[0]
  if (score >= 50) return labels[1]
  return labels[2]
}

function pillarStatusBadge(score: number): string {
  if (score >= 80) return 'bg-green-100 text-green-700 border border-green-200'
  if (score >= 50) return 'bg-amber-100 text-amber-700 border border-amber-200'
  return 'bg-red-100 text-red-700 border border-red-200'
}

function scoreBarColor(score: number): string {
  if (score >= 80) return 'bg-green-500'
  if (score >= 50) return 'bg-amber-400'
  return 'bg-red-500'
}

function computePillars(sr: ScoreResults | null, a: Record<string, unknown>): { protect: number; grow: number; legacy: number } {
  if (!sr) return { protect: 0, grow: 0, legacy: 0 }
  const protect = clamp((sr.sub_scores.insurance + sr.sub_scores.estate) / 2)
  const grow    = clamp((sr.sub_scores.investments + sr.sub_scores.retirement + sr.sub_scores.cashflow + sr.sub_scores.tax) / 4)
  const legacy  = clamp(sr.sub_scores.estate)
  void a
  return { protect, grow, legacy }
}

function getProtectFindings(a: Record<string, unknown>): string[] {
  const f: string[] = []
  if (a.hasLifeInsurance !== 'yes')                                      f.push('No life insurance detected')
  if (a.hasDisabilityInsurance !== 'yes' && a.hasDisabilityInsurance !== 'employer') f.push('No disability insurance coverage')
  if (!a.hasHealthInsurance || a.hasHealthInsurance === 'none')          f.push('No health insurance coverage')
  if (a.hasLongTermCare !== 'yes')                                       f.push('No long-term care insurance')
  if (a.hasWill !== 'yes')                                               f.push('No current will on file')
  if (a.hasPOA !== 'yes')                                                f.push('No power of attorney in place')
  if (a.hasHealthcareDirective !== 'yes')                                f.push('No healthcare directive')
  return f.length ? f.slice(0, 3) : ['Life insurance coverage in place', 'Core protection documents present', 'Review coverage limits annually']
}

function getGrowFindings(a: Record<string, unknown>): string[] {
  const f: string[] = []
  if (a.maxing401k === 'no')                                             f.push('Not maximizing 401(k) contributions')
  const accounts = (a.retirementAccounts as string[]) ?? []
  if (!accounts.includes('roth_ira') && !accounts.includes('roth401k')) f.push('No Roth account detected')
  if (n(a.currentRetirementSavings) === 0)                               f.push('No current retirement savings')
  if (a.hasbudget !== 'yes')                                             f.push('No formal monthly budget in place')
  const bracket = parseInt(String(a.taxBracket ?? '0'))
  if (bracket >= 22 && a.taxLossHarvesting !== 'yes')                    f.push('Tax-loss harvesting opportunity identified')
  return f.length ? f.slice(0, 3) : ['Retirement savings on track', 'Active investment strategy in place', 'Review allocation annually with advisor']
}

function getLegacyFindings(a: Record<string, unknown>): string[] {
  const f: string[] = []
  if (a.hasTrust !== 'yes')                                              f.push('No living trust established')
  if (a.hasBeneficiaries !== 'yes')                                     f.push('Beneficiary designations may be outdated')
  const estateVal    = n(a.estateValue)
  const lifeCoverage = n(a.lifeCoverageAmount)
  if (estateVal > 500_000 && lifeCoverage < estateVal * 0.5)            f.push('Estate value may exceed life insurance coverage')
  if (a.lastReviewedEstate === 'never' || a.lastReviewedEstate === '5yr+') f.push('Estate plan not reviewed recently')
  if (a.hasEstateAttorney !== 'yes')                                    f.push('No estate attorney on file')
  return f.length ? f.slice(0, 3) : ['Core estate documents present', 'Review beneficiary designations annually', 'Consider trust as estate grows']
}

function getProductRecs(a: Record<string, unknown>): ProductRec[] {
  const recs: ProductRec[] = []
  if (a.hasLifeInsurance !== 'yes')
    recs.push({ icon: '🛡️', title: 'Term Life Insurance or IUL', explanation: "Protect your family's financial future and replace lost income with cost-effective coverage.", priority: 'High' })
  if (a.maxing401k === 'no')
    recs.push({ icon: '📈', title: 'Maximize 401(k) Contributions', explanation: 'Reduce taxable income now and accelerate tax-deferred compound growth for retirement.', priority: 'High' })
  const accounts = (a.retirementAccounts as string[]) ?? []
  if (!accounts.includes('roth_ira') && !accounts.includes('roth401k'))
    recs.push({ icon: '🏦', title: 'Open a Roth IRA', explanation: 'Build tax-free retirement income — contributions grow and are withdrawn completely tax-free.', priority: 'High' })
  const risk    = a.riskTolerance as string
  const horizon = a.investmentHorizon as string
  if ((risk === 'conservative' || risk === 'moderate') && (horizon === '10-20' || horizon === '20+'))
    recs.push({ icon: '📊', title: 'Fixed Indexed Annuity (FIA)', explanation: 'Participate in market growth with principal protection — ideal for conservative long-term investors.', priority: 'Medium' })
  if (risk === 'conservative' && (horizon === '5-10' || horizon === '10-20' || horizon === '20+'))
    recs.push({ icon: '⚖️', title: 'Portfolio Rebalancing Toward Growth', explanation: 'Your long time horizon supports a more growth-oriented allocation to maximize long-term returns.', priority: 'Medium' })
  if (a.hasDisabilityInsurance !== 'yes' && a.hasDisabilityInsurance !== 'employer')
    recs.push({ icon: '🏥', title: 'Own-Occupation Disability Insurance', explanation: "Replace 60–70% of your income if you're unable to work in your specific occupation.", priority: 'High' })
  if (a.hasTrust !== 'yes' && n(a.estateValue) > 500_000)
    recs.push({ icon: '📋', title: 'Revocable Living Trust', explanation: 'Avoid costly probate and ensure your assets pass directly and privately to your beneficiaries.', priority: 'Medium' })
  return recs
}

function overallParagraph(firstName: string, overall: number, pillars: { protect: number; grow: number; legacy: number }, riskProfile: string): string {
  const protect = pillars.protect >= 80 ? 'strong protection coverage' : pillars.protect >= 50 ? 'partial protection coverage' : 'significant protection gaps'
  const grow    = pillars.grow >= 80 ? 'a solid growth trajectory' : pillars.grow >= 50 ? 'moderate growth progress' : 'meaningful growth opportunities to capture'
  const legacy  = pillars.legacy >= 80 ? 'a comprehensive legacy plan' : pillars.legacy >= 50 ? 'a partial legacy framework' : 'legacy planning gaps that need attention'
  const overall_str = overall >= 75 ? 'a strong overall foundation with targeted improvements available' : overall >= 50 ? 'a solid foundation with important gaps to address' : 'meaningful opportunities to strengthen your financial position across all areas'
  const risk    = riskProfile.replace('_', ' ')
  return `${firstName}'s financial assessment reveals ${overall_str}, with an overall score of ${overall}/100. The results show ${protect}, ${grow}, and ${legacy}. As a ${risk} investor, the recommendations below have been tailored to your risk profile and timeline. A WealthPlanrAI advisor will contact you within 1 business day to walk through a prioritized action plan.`
}

function topPriorityActions(sr: ScoreResults | null): { num: number; text: string }[] {
  if (!sr?.recommendations) return []
  const sorted = [...sr.recommendations].sort((a, b) => {
    const ord: Record<string, number> = { high: 0, medium: 1, low: 2 }
    return (ord[a.priority] ?? 2) - (ord[b.priority] ?? 2)
  })
  return sorted.slice(0, 3).map((r, i) => ({ num: i + 1, text: r.message }))
}

const PRIORITY_BADGE: Record<string, string> = {
  High:   'bg-red-100 text-red-700 border border-red-200',
  Medium: 'bg-amber-100 text-amber-700 border border-amber-200',
  Low:    'bg-slate-100 text-slate-600 border border-slate-200',
}

const DISCLAIMER = `This financial assessment summary is prepared by WealthPlanrAI LLC and is for informational and educational purposes only. It does not constitute investment advice, insurance advice, legal advice, or tax advice. The information provided is based solely on self-reported data and has not been independently verified. Past performance is not indicative of future results. All investment strategies involve risk, including possible loss of principal. Insurance products and annuities involve risks and limitations — please read all product materials carefully before purchasing. Fixed Indexed Annuities (FIAs) and Indexed Universal Life (IUL) policies are insurance products, not securities, and are not FDIC insured. Securities, when applicable, are offered through registered broker-dealers and are subject to FINRA and SEC regulations. WealthPlanrAI advisors may be licensed insurance agents and/or registered investment advisors. This summary does not establish an advisor-client relationship. Please consult with a licensed financial advisor, attorney, and tax professional before making any financial decisions. WealthPlanrAI LLC is not responsible for actions taken based on this summary without professional consultation.`

// ── Score illustration ────────────────────────────────────────────────────────

function ScoreIllustration({ score }: { score: number }) {
  if (score >= 75) {
    return (
      <div className="flex justify-center mb-4">
        <svg width="120" height="60" viewBox="0 0 120 60">
          <text x="10" y="30" fontSize="20">⭐</text>
          <text x="45" y="20" fontSize="28">🏆</text>
          <text x="85" y="30" fontSize="20">⭐</text>
          <circle cx="30" cy="10" r="3" fill="#FCD34D" opacity="0.6"/>
          <circle cx="90" cy="10" r="3" fill="#FCD34D" opacity="0.6"/>
          <circle cx="20" cy="45" r="2" fill="#60A5FA" opacity="0.5"/>
          <circle cx="100" cy="45" r="2" fill="#60A5FA" opacity="0.5"/>
        </svg>
      </div>
    )
  }
  if (score >= 50) {
    return (
      <div className="flex justify-center mb-4">
        <svg width="120" height="60" viewBox="0 0 120 60">
          <text x="45" y="40" fontSize="36">📊</text>
          <circle cx="25" cy="20" r="4" fill="#60A5FA" opacity="0.4"/>
          <circle cx="95" cy="20" r="4" fill="#60A5FA" opacity="0.4"/>
        </svg>
      </div>
    )
  }
  return (
    <div className="flex justify-center mb-4">
      <svg width="120" height="60" viewBox="0 0 120 60">
        <text x="45" y="40" fontSize="36">🎯</text>
        <circle cx="25" cy="20" r="4" fill="#FCA5A5" opacity="0.4"/>
        <circle cx="95" cy="20" r="4" fill="#FCA5A5" opacity="0.4"/>
      </svg>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default async function SummaryPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const { id } = await searchParams
  if (!id) redirect('/assessment')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('assessments')
    .select('id, full_name, email, risk_profile, score, score_results, answers, created_at')
    .eq('id', id)
    .single()

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center p-8">
          <p className="text-gray-500 mb-4">Assessment not found.</p>
          <Link href="/assessment" className="text-brand-600 hover:underline text-sm">Take a new assessment</Link>
        </div>
      </div>
    )
  }

  const row       = data as unknown as AssessmentData
  const answers   = (row.answers ?? {}) as Record<string, unknown>
  const sr        = row.score_results
  const overall   = sr?.overall_score ?? row.score
  const pillars   = computePillars(sr, answers)
  const firstName = (row.full_name ?? 'Your').split(' ')[0]
  const dateStr   = formatDate(row.created_at)
  const productRecs = getProductRecs(answers)
  const priorities  = topPriorityActions(sr)

  const pillarCards: PillarData[] = [
    {
      key:          'protect',
      name:         'PROTECT',
      score:        pillars.protect,
      statusLabel:  pillarStatus(pillars.protect, ['Fully Protected', 'Partially Protected', 'Needs Protection']),
      findings:     getProtectFindings(answers),
      icon:         <Shield className="w-6 h-6 text-blue-600" />,
      accent:       'text-blue-700',
      bgAccent:     'bg-blue-100',
      borderAccent: 'border-l-blue-500',
    },
    {
      key:          'grow',
      name:         'GROW',
      score:        pillars.grow,
      statusLabel:  pillarStatus(pillars.grow, ['Strong Growth', 'Moderate Growth', 'Growth Gap']),
      findings:     getGrowFindings(answers),
      icon:         <TrendingUp className="w-6 h-6 text-green-600" />,
      accent:       'text-green-700',
      bgAccent:     'bg-green-100',
      borderAccent: 'border-l-green-500',
    },
    {
      key:          'legacy',
      name:         'LEAVE A LEGACY',
      score:        pillars.legacy,
      statusLabel:  pillarStatus(pillars.legacy, ['Legacy Ready', 'Partial Legacy Plan', 'Legacy Gap']),
      findings:     getLegacyFindings(answers),
      icon:         <Heart className="w-6 h-6 text-purple-600" />,
      accent:       'text-purple-700',
      bgAccent:     'bg-purple-100',
      borderAccent: 'border-l-purple-500',
    },
  ]

  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 h-14 flex items-center justify-between sticky top-0 z-20">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-brand-600 text-lg font-bold leading-none">■</span>
          <span className="text-[15px] text-gray-900 font-semibold">WealthPlanr<span className="text-brand-600">AI</span></span>
        </Link>
        <span className="text-[11px] text-gray-400 tracking-[1.2px] uppercase">Financial Summary</span>
      </header>

      {/* Hero gradient */}
      <div className="px-4 sm:px-6 py-7 sm:py-10" style={{ background: 'linear-gradient(135deg, #0F172A, #1E3A8A, #2563EB)' }}>
        <div className="max-w-5xl mx-auto text-center">
          <ScoreIllustration score={overall} />
          <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest mb-3">
            Evaluated against the WealthPlanrAI Three Pillars
          </p>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-white mb-2">
            Your Financial Health Summary
          </h1>
          <p className="text-sm mb-1" style={{ color: 'rgba(191,219,254,0.7)' }}>
            {row.full_name ?? 'Assessment'} &nbsp;·&nbsp; {dateStr}
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">

        {/* ── Three Pillars ───────────────────────────────────────────────── */}
        <section>
          <h2 className="font-heading text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 px-1">
            The Three Pillars
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {pillarCards.map(p => (
              <div key={p.key} className={`bg-white rounded-2xl border border-gray-200 shadow-sm border-l-4 ${p.borderAccent} p-4 sm:p-6 flex flex-col`}>
                {/* Icon + Name */}
                <div className={`w-11 h-11 rounded-xl ${p.bgAccent} flex items-center justify-center mb-4`}>
                  {p.icon}
                </div>
                <p className={`font-heading text-sm font-bold tracking-wide mb-1 ${p.accent}`}>{p.name}</p>

                {/* Score */}
                <div className="flex items-end gap-1 mb-2">
                  <span className="text-4xl font-bold text-gray-900 leading-none">{p.score}</span>
                  <span className="text-gray-400 text-sm mb-0.5">/ 100</span>
                </div>

                {/* Bar */}
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                  <div className={`h-full ${scoreBarColor(p.score)} rounded-full`} style={{ width: `${p.score}%` }} />
                </div>

                {/* Status badge */}
                <span className={`self-start text-xs font-semibold px-2.5 py-1 rounded-full mb-4 ${pillarStatusBadge(p.score)}`}>
                  {p.statusLabel}
                </span>

                {/* Findings */}
                <ul className="space-y-2 flex-1">
                  {p.findings.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                      {p.score >= 80
                        ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        : <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      }
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ── Overall Summary Card ────────────────────────────────────────── */}
        <section className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border border-blue-200 p-4 sm:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Big score */}
            <div className="flex-shrink-0 text-center sm:text-left">
              <p className="text-xs font-semibold text-blue-500 uppercase tracking-widest mb-1">Overall Score</p>
              <div className="flex items-end gap-1">
                <span className="text-7xl font-bold text-gray-900 leading-none">{overall}</span>
                <span className="text-gray-400 text-lg mb-1">/ 100</span>
              </div>
              <p className="text-sm font-medium text-blue-600 mt-1 capitalize">{row.risk_profile.replace('_', ' ')} investor profile</p>
            </div>
            {/* Summary paragraph */}
            <div className="flex-1">
              <p className="text-sm text-gray-700 leading-relaxed">
                {overallParagraph(firstName, overall, pillars, row.risk_profile)}
              </p>
            </div>
          </div>

          {/* Top 3 priority actions */}
          {priorities.length > 0 && (
            <div className="mt-6 pt-6 border-t border-blue-200">
              <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3">Top Priority Actions</p>
              <ol className="space-y-2">
                {priorities.map(p => (
                  <li key={p.num} className="flex items-start gap-3 text-sm text-gray-700">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-brand-600 text-white text-[11px] font-bold flex items-center justify-center mt-0.5">
                      {p.num}
                    </span>
                    {p.text}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </section>

        {/* ── Product Recommendations ─────────────────────────────────────── */}
        {productRecs.length > 0 && (
          <section>
            <h2 className="font-heading text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 px-1">
              Recommended Strategies & Products
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {productRecs.map((rec, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-start gap-4">
                  <span className="text-2xl leading-none flex-shrink-0 mt-0.5">{rec.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-semibold text-gray-900">{rec.title}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_BADGE[rec.priority]}`}>
                        {rec.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed">{rec.explanation}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Advisor Selector ─────────────────────────────────────────────── */}
        <AdvisorSelector assessmentId={row.id} />

        {/* ── CTA Section ─────────────────────────────────────────────────── */}
        <section className="bg-brand-600 rounded-2xl p-4 sm:p-8 text-center">
          <h2 className="font-heading text-2xl font-bold text-white mb-2">
            Ready to build your personalized financial plan?
          </h2>
          <p className="text-brand-100 text-sm mb-6 max-w-md mx-auto">
            A WealthPlanrAI advisor will review your results and contact you within 1 business day.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-7 py-3 bg-white hover:bg-brand-50 transition-colors text-brand-700 font-semibold text-sm rounded-xl"
            >
              Return to Home <ArrowRight className="w-4 h-4" />
            </Link>
            <DownloadButton assessmentId={row.id} />
          </div>
          <p className="text-[11px] text-brand-200 mt-4">
            No obligation. Licensed advisors. SEC &amp; FINRA compliant.
          </p>
        </section>

        {/* ── Disclaimer ──────────────────────────────────────────────────── */}
        <div className="border border-gray-200 rounded-xl p-5 bg-white">
          <p className="text-[11px] text-gray-400 leading-relaxed text-center">
            {DISCLAIMER}
          </p>
        </div>

      </div>
    </div>
  )
}
