import type { ScoreResults } from '@/lib/scoring'

// ── Types ──────────────────────────────────────────────────────────────────────

export interface PillarScores {
  protect: number
  grow: number
  legacy: number
}

interface ProductRow {
  name: string
  status: 'Recommended' | 'Consider' | 'Not applicable'
  rationale: string
}

export interface AssessmentForPDF {
  clientName: string
  clientEmail: string | null
  riskProfile: string
  overallScore: number
  scoreResults: ScoreResults | null
  answers: Record<string, unknown>
  createdAt: string
  assessmentId?: string
  advisorName?: string | null
}

// ── Shared helpers ─────────────────────────────────────────────────────────────

function n(val: unknown): number { return parseFloat(String(val ?? '0')) || 0 }
function clamp(v: number): number { return Math.max(0, Math.min(100, Math.round(v))) }
function fmt$(v: unknown): string { const x = n(v); return x ? `$${x.toLocaleString()}` : '—' }
function capWords(s: string): string { return s.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) }

function scoreRGB(score: number): [number, number, number] {
  if (score >= 80) return [22, 163, 74]
  if (score >= 50) return [245, 158, 11]
  return [239, 68, 68]
}

function score2status(score: number, labels: [string, string, string]): string {
  if (score >= 80) return labels[0]
  if (score >= 50) return labels[1]
  return labels[2]
}

function computePillars(sr: ScoreResults | null): PillarScores {
  if (!sr) return { protect: 0, grow: 0, legacy: 0 }
  return {
    protect: clamp((sr.sub_scores.insurance + sr.sub_scores.estate) / 2),
    grow:    clamp((sr.sub_scores.investments + sr.sub_scores.retirement + sr.sub_scores.cashflow + sr.sub_scores.tax) / 4),
    legacy:  clamp(sr.sub_scores.estate),
  }
}

function getAge(dob: unknown): number | null {
  if (!dob) return null
  const birth = new Date(String(dob))
  const diff  = Date.now() - birth.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
}

// ── Findings helpers ───────────────────────────────────────────────────────────

function getProtectFindings(a: Record<string, unknown>): string[] {
  const f: string[] = []
  if (a.hasLifeInsurance !== 'yes')                                              f.push('No life insurance detected')
  if (a.hasDisabilityInsurance !== 'yes' && a.hasDisabilityInsurance !== 'employer') f.push('No disability insurance')
  if (!a.hasHealthInsurance || a.hasHealthInsurance === 'none')                  f.push('No health insurance coverage')
  if (a.hasLongTermCare !== 'yes')                                               f.push('No long-term care insurance')
  if (a.hasWill !== 'yes')                                                       f.push('No will on file')
  if (a.hasPOA !== 'yes')                                                        f.push('No power of attorney')
  if (a.hasHealthcareDirective !== 'yes')                                        f.push('No healthcare directive')
  return f.length ? f.slice(0, 5) : ['Core protection coverage appears adequate']
}

function getGrowFindings(a: Record<string, unknown>): string[] {
  const f: string[] = []
  if (a.maxing401k === 'no')                                                     f.push('Not maximizing 401(k) contributions')
  const accounts = Array.isArray(a.retirementAccounts) ? a.retirementAccounts as string[] : []
  if (!accounts.includes('roth_ira') && !accounts.includes('roth401k'))          f.push('No Roth account detected')
  if (n(a.currentRetirementSavings) === 0)                                       f.push('No current retirement savings')
  if (a.hasbudget !== 'yes')                                                     f.push('No formal monthly budget')
  const bracket = parseInt(String(a.taxBracket ?? '0'))
  if (bracket >= 22 && a.taxLossHarvesting !== 'yes')                            f.push('Tax-loss harvesting opportunity identified')
  return f.length ? f.slice(0, 5) : ['Growth trajectory appears solid']
}

function getLegacyFindings(a: Record<string, unknown>): string[] {
  const f: string[] = []
  if (a.hasTrust !== 'yes')                                                      f.push('No living trust established')
  if (a.hasBeneficiaries !== 'yes')                                              f.push('Beneficiary designations may be outdated')
  const estateVal    = n(a.estateValue)
  const lifeCoverage = n(a.lifeCoverageAmount)
  if (estateVal > 500_000 && lifeCoverage < estateVal * 0.5)                    f.push('Estate value may exceed life insurance coverage')
  if (a.lastReviewedEstate === 'never' || a.lastReviewedEstate === '5yr+')       f.push('Estate plan not reviewed recently')
  if (a.hasEstateAttorney !== 'yes')                                             f.push('No estate attorney on file')
  return f.length ? f.slice(0, 4) : ['Core legacy documents present']
}

// ── Advisor product recommendation tables ──────────────────────────────────────

function getProtectProducts(a: Record<string, unknown>): ProductRow[] {
  const hasLife = a.hasLifeInsurance === 'yes'
  const hasDI   = a.hasDisabilityInsurance === 'yes' || a.hasDisabilityInsurance === 'employer'
  const hasLTC  = a.hasLongTermCare === 'yes'
  const hasHI   = a.hasHealthInsurance && a.hasHealthInsurance !== 'none'
  const hasUmb  = a.hasUmbrella === 'yes'
  const lifeType = String(a.lifeInsuranceType ?? '')
  const hasDepend = n(a.dependents) > 0
  const hasBizInc = a.hasBusinessIncome === 'yes'

  return [
    { name: 'Term Life Insurance',
      status: !hasLife ? 'Recommended' : (lifeType === 'term' ? 'Consider' : 'Not applicable'),
      rationale: !hasLife ? 'No life insurance found — immediate coverage gap for income replacement' : lifeType === 'term' ? 'Review coverage amount and remaining term' : 'Whole/permanent life already in place' },
    { name: 'Whole Life Insurance',
      status: !hasLife ? 'Consider' : 'Not applicable',
      rationale: !hasLife && hasDepend ? 'Permanent coverage provides lifelong protection and cash value accumulation' : 'Evaluate need based on estate and legacy goals' },
    { name: 'Universal Life Insurance',
      status: !hasLife ? 'Consider' : 'Not applicable',
      rationale: 'Flexible premiums and adjustable death benefit — suitable if income varies' },
    { name: 'Indexed Universal Life (IUL)',
      status: !hasLife ? 'Recommended' : 'Consider',
      rationale: !hasLife ? 'Provides death benefit plus tax-advantaged cash value with downside protection' : 'Evaluate IUL as supplement to existing coverage for growth component' },
    { name: 'Variable Universal Life (VUL)',
      status: !hasLife && a.riskTolerance === 'aggressive' ? 'Consider' : 'Not applicable',
      rationale: 'Market-linked cash value — suitable only for aggressive risk tolerance' },
    { name: 'Disability Insurance',
      status: !hasDI ? 'Recommended' : 'Consider',
      rationale: !hasDI ? 'No disability coverage — income is completely unprotected if unable to work' : 'Review own-occupation definition and benefit period' },
    { name: 'Critical Illness Insurance',
      status: 'Consider',
      rationale: 'Lump-sum payout on diagnosis of cancer, heart attack, stroke — fills gap not covered by health insurance' },
    { name: 'Long-Term Care Insurance',
      status: !hasLTC ? 'Recommended' : 'Not applicable',
      rationale: !hasLTC ? 'No LTC coverage — nursing home costs can exceed $100K/year and deplete assets rapidly' : 'LTC coverage in place — review benefit period and inflation rider' },
    { name: 'Health Insurance',
      status: !hasHI ? 'Recommended' : 'Not applicable',
      rationale: !hasHI ? 'No health insurance detected — critical coverage gap' : 'Health insurance in place' },
    { name: 'Accident Insurance',
      status: 'Consider',
      rationale: 'Low-cost supplemental coverage for accidental injury — fills gap in existing health/disability coverage' },
    { name: 'Income Replacement Insurance',
      status: !hasDI ? 'Consider' : 'Not applicable',
      rationale: 'Short-term income replacement to bridge gap before long-term disability benefits begin' },
    { name: 'Key Person Insurance',
      status: hasBizInc ? 'Recommended' : 'Not applicable',
      rationale: hasBizInc ? 'Business income detected — key person coverage protects business continuity' : 'Not applicable — no business income reported' },
    { name: 'Umbrella Liability Insurance',
      status: !hasUmb ? 'Consider' : 'Not applicable',
      rationale: !hasUmb ? 'Umbrella policy extends liability coverage above auto/home limits — important as net worth grows' : 'Umbrella coverage in place' },
  ]
}

function getGrowProducts(a: Record<string, unknown>): ProductRow[] {
  const accounts   = Array.isArray(a.retirementAccounts) ? a.retirementAccounts as string[] : []
  const has401k    = accounts.includes('401k')
  const hasRoth    = accounts.includes('roth_ira') || accounts.includes('roth401k')
  const hasIRA     = accounts.includes('traditional_ira')
  const hasSEP     = accounts.includes('sep_ira')
  const hasHSA     = accounts.includes('hsa')
  const is529      = accounts.includes('529')
  const hasDep     = n(a.dependents) > 0
  const selfEmpl   = a.employmentStatus === 'self_employed' || a.hasBusinessIncome === 'yes'
  const bracket    = parseInt(String(a.taxBracket ?? '0'))
  const risk       = String(a.riskTolerance ?? 'moderate')
  const horizon    = String(a.investmentHorizon ?? '')
  const isConserv  = risk === 'conservative' || risk === 'moderate'
  const longHorizon = horizon === '10-20' || horizon === '20+'

  return [
    { name: '401(k) / 403(b)',
      status: has401k ? 'Consider' : 'Recommended',
      rationale: !has401k ? 'No 401(k) detected — maximize employer match immediately' : a.maxing401k === 'no' ? '401(k) exists but not maxing contributions — increase to annual limit ($23,000 in 2024)' : 'Maxing 401(k) — excellent. Review investment allocation.' },
    { name: 'Roth IRA',
      status: !hasRoth ? 'Recommended' : 'Consider',
      rationale: !hasRoth ? 'No Roth account — open Roth IRA for tax-free retirement income ($7,000/year limit in 2024)' : 'Roth in place — consider backdoor Roth if income limits apply' },
    { name: 'Traditional IRA',
      status: !hasIRA && !hasRoth ? 'Consider' : 'Not applicable',
      rationale: 'Tax-deductible contributions reduce current taxable income — review deductibility based on income and plan coverage' },
    { name: 'SEP IRA',
      status: selfEmpl && !hasSEP ? 'Recommended' : 'Not applicable',
      rationale: selfEmpl ? 'Self-employed detected — SEP IRA allows up to 25% of net earnings ($66,000 max in 2024)' : 'Not applicable — requires self-employment income' },
    { name: 'HSA (Health Savings Account)',
      status: !hasHSA && a.hasHealthInsurance === 'hdhp' ? 'Recommended' : 'Consider',
      rationale: 'Triple tax advantage — pre-tax contributions, tax-free growth, tax-free withdrawals for medical. Invest excess for retirement' },
    { name: '529 College Savings Plan',
      status: hasDep && !is529 ? 'Recommended' : hasDep ? 'Consider' : 'Not applicable',
      rationale: hasDep ? 'Dependents detected — 529 provides tax-free growth for education expenses' : 'Consider for future education funding needs' },
    { name: 'Taxable Brokerage Account',
      status: 'Consider',
      rationale: 'Flexible after-tax investing with no contribution limits — use after maxing tax-advantaged accounts' },
    { name: 'Mutual Funds / ETFs',
      status: 'Recommended',
      rationale: 'Core diversified holdings — low-cost index ETFs provide broad market exposure appropriate for most investors' },
    { name: 'Fixed Annuity',
      status: isConserv ? 'Consider' : 'Not applicable',
      rationale: isConserv ? 'Guaranteed fixed rate — suitable for conservative investors seeking predictable income' : 'Not aligned with aggressive risk profile' },
    { name: 'Fixed Indexed Annuity (FIA)',
      status: isConserv && longHorizon ? 'Recommended' : 'Consider',
      rationale: isConserv && longHorizon ? 'Principal protection + market-linked growth — ideal for conservative long-term investors' : 'Consider for a portion of portfolio seeking downside protection' },
    { name: 'MYGA (Multi-Year Guaranteed Annuity)',
      status: isConserv ? 'Consider' : 'Not applicable',
      rationale: 'CD-like fixed rate for 3-10 years with tax-deferred growth — suitable for short/medium-term conservative allocation' },
    { name: 'IUL (Growth Component)',
      status: bracket >= 22 ? 'Consider' : 'Not applicable',
      rationale: bracket >= 22 ? `Tax bracket ${bracket}% — IUL cash value grows tax-deferred with tax-free loans, valuable for high earners` : 'Evaluate if tax bracket increases' },
    { name: 'Robo Advisory Portfolio',
      status: 'Consider',
      rationale: 'Low-cost automated rebalancing — suitable for hands-off investors with straightforward portfolios' },
    { name: 'VUL (Growth Component)',
      status: risk === 'aggressive' || risk === 'very_aggressive' ? 'Consider' : 'Not applicable',
      rationale: 'Market-linked growth inside life insurance wrapper — for aggressive investors seeking tax-deferred growth' },
  ]
}

function getLegacyProducts(a: Record<string, unknown>): ProductRow[] {
  const hasWill    = a.hasWill === 'yes'
  const hasTrust   = a.hasTrust === 'yes'
  const hasPOA     = a.hasPOA === 'yes'
  const hasHCD     = a.hasHealthcareDirective === 'yes'
  const hasLife    = a.hasLifeInsurance === 'yes'
  const hasBizInc  = a.hasBusinessIncome === 'yes'
  const estateVal  = n(a.estateValue)
  const largeEstate = estateVal > 1_000_000
  const hasDep     = n(a.dependents) > 0

  return [
    { name: 'Last Will & Testament',
      status: !hasWill ? 'Recommended' : 'Consider',
      rationale: !hasWill ? 'No will on file — critical gap. Assets will pass through probate without direction' : 'Review will for accuracy — recommend review every 3-5 years or after major life event' },
    { name: 'Revocable Living Trust',
      status: !hasTrust && (largeEstate || hasDep) ? 'Recommended' : 'Consider',
      rationale: !hasTrust && largeEstate ? 'Estate value exceeds $1M — trust avoids costly probate and provides privacy' : !hasTrust && hasDep ? 'Dependents detected — trust provides structured inheritance and protects minor children' : 'Consider trust as estate grows above $500K' },
    { name: 'Irrevocable Trust',
      status: largeEstate ? 'Consider' : 'Not applicable',
      rationale: largeEstate ? 'Large estate — irrevocable trust can remove assets from taxable estate, reducing estate tax exposure' : 'Evaluate when estate exceeds federal estate tax threshold' },
    { name: 'Power of Attorney (Financial)',
      status: !hasPOA ? 'Recommended' : 'Not applicable',
      rationale: !hasPOA ? 'No POA in place — without this, court must appoint guardian if client becomes incapacitated' : 'Financial POA in place — review agent designation' },
    { name: 'Healthcare Directive / Living Will',
      status: !hasHCD ? 'Recommended' : 'Not applicable',
      rationale: !hasHCD ? 'No healthcare directive — medical decisions left to courts if client cannot communicate wishes' : 'Healthcare directive in place — confirm it meets state requirements' },
    { name: 'Life Insurance (Legacy / IUL)',
      status: !hasLife ? 'Recommended' : 'Consider',
      rationale: !hasLife ? 'No life insurance — proceeds could fund estate taxes, equalize inheritance, or provide legacy gifts' : 'Review death benefit for estate transfer strategy' },
    { name: 'Annuity Beneficiary Structure',
      status: 'Consider',
      rationale: 'Review annuity beneficiary designations — improper structuring can trigger immediate taxation for heirs' },
    { name: 'Charitable Remainder Trust',
      status: largeEstate ? 'Consider' : 'Not applicable',
      rationale: largeEstate ? 'Large estate — CRT converts appreciated assets to income stream, reduces estate taxes, provides charitable deduction' : 'Evaluate for philanthropic goals' },
    { name: 'Estate Freeze / Gifting Strategies',
      status: largeEstate ? 'Consider' : 'Not applicable',
      rationale: largeEstate ? 'Annual gift exclusion ($18,000/person in 2024) — systematic gifting reduces taxable estate over time' : 'Not a current priority' },
    { name: 'Business Succession Plan',
      status: hasBizInc ? 'Recommended' : 'Not applicable',
      rationale: hasBizInc ? 'Business income detected — buy-sell agreement funded by life insurance ensures smooth ownership transfer' : 'Not applicable — no business income reported' },
  ]
}

// ── Top priority recommendations for advisor ───────────────────────────────────

function getAdvisorPriorityRecs(a: Record<string, unknown>, sr: ScoreResults | null): Array<{priority: string; category: string; product: string; rationale: string; impact: string}> {
  const recs: Array<{priority: string; category: string; product: string; rationale: string; impact: string}> = []

  if (a.hasLifeInsurance !== 'yes') {
    const dep = n(a.dependents)
    const income = n(a.grossIncome)
    recs.push({ priority: 'High', category: 'Protection', product: 'Term Life / IUL',
      rationale: `Client has no life insurance and ${dep > 0 ? `${dep} dependent(s)` : 'dependents potentially unprotected'}. Annual income of ${fmt$(income)} would be lost to family if client were to pass.`,
      impact: `Closes a ${fmt$(income * 10)} income replacement gap (10x income rule)` })
  }

  if (a.hasDisabilityInsurance !== 'yes' && a.hasDisabilityInsurance !== 'employer') {
    recs.push({ priority: 'High', category: 'Protection', product: 'Own-Occupation Disability Insurance',
      rationale: `Client has no disability coverage. With gross income of ${fmt$(a.grossIncome)}, inability to work would immediately impact financial stability.`,
      impact: `Replaces 60-70% of income (${fmt$(n(a.grossIncome) * 0.65 / 12)}/month) during disability` })
  }

  if (a.maxing401k === 'no') {
    recs.push({ priority: 'High', category: 'Growth', product: 'Maximize 401(k)',
      rationale: 'Client is not maximizing 401(k) contributions. Every dollar not contributed represents missed tax deduction and compound growth.',
      impact: 'Increasing to annual limit could add $200K+ in additional retirement savings over 10 years' })
  }

  const accounts = Array.isArray(a.retirementAccounts) ? a.retirementAccounts as string[] : []
  if (!accounts.includes('roth_ira') && !accounts.includes('roth401k')) {
    recs.push({ priority: 'High', category: 'Growth', product: 'Roth IRA',
      rationale: 'No Roth account detected. Tax-free growth is one of the most valuable retirement planning tools available.',
      impact: '$7,000/year for 20 years at 7% = $340K in tax-free retirement income' })
  }

  if (a.hasTrust !== 'yes' && n(a.estateValue) > 500_000) {
    recs.push({ priority: 'Medium', category: 'Legacy', product: 'Revocable Living Trust',
      rationale: `Estate value of ${fmt$(a.estateValue)} warrants trust planning to avoid probate and provide efficient wealth transfer.`,
      impact: 'Probate costs typically 3-8% of estate — trust saves $15K-$120K+ in this case' })
  }

  if (a.hasWill !== 'yes') {
    recs.push({ priority: 'High', category: 'Legacy', product: 'Last Will & Testament',
      rationale: 'Client has no will on file. Assets will be distributed per state intestacy laws, potentially against client wishes.',
      impact: 'Ensures assets pass to intended beneficiaries — prevents court-supervised distribution' })
  }

  if (a.hasLongTermCare !== 'yes') {
    recs.push({ priority: 'Medium', category: 'Protection', product: 'Long-Term Care Insurance',
      rationale: 'No LTC coverage detected. Average nursing home cost exceeds $100K/year and can rapidly deplete retirement assets.',
      impact: 'Protects $400K-$800K in assets from potential LTC expenditure' })
  }

  const bracket = parseInt(String(a.taxBracket ?? '0'))
  if (bracket >= 24 && a.hasAccountant !== 'yes') {
    recs.push({ priority: 'Medium', category: 'Tax', product: 'CPA Engagement',
      rationale: `Client in ${bracket}% bracket with no accountant. Professional tax planning typically saves multiples of the fee.`,
      impact: 'Estimated $2,000-$10,000+ in annual tax savings through deductions, timing strategies, and entity structuring' })
  }

  if (!accounts.includes('roth_ira') && n(a.grossIncome) > 100_000) {
    recs.push({ priority: 'Medium', category: 'Tax', product: 'Backdoor Roth Conversion',
      rationale: 'High income client without Roth. Backdoor Roth strategy allows Roth funding regardless of income limits.',
      impact: 'Tax-free growth on $7,000+ per year compounding over working years' })
  }

  // Fill to 10 from scoring engine
  if (sr?.recommendations) {
    const sorted = [...sr.recommendations].sort((a, b) => {
      const ord: Record<string, number> = { high: 0, medium: 1, low: 2 }
      return (ord[a.priority] ?? 2) - (ord[b.priority] ?? 2)
    })
    for (const r of sorted) {
      if (recs.length >= 10) break
      const already = recs.some(x => x.rationale.includes(r.message.substring(0, 20)))
      if (!already) {
        recs.push({ priority: r.priority, category: r.category, product: r.category,
          rationale: r.message, impact: 'See full analysis in report' })
      }
    }
  }

  return recs.slice(0, 10)
}

// ── Retirement projection ──────────────────────────────────────────────────────

function retirementProjection(a: Record<string, unknown>): string {
  const currentSavings = n(a.currentRetirementSavings)
  const monthlyContrib = n(a.monthlyRetirementContrib)
  const retireAge      = n(a.retirementAge) || 65
  const dob            = a.dob ? new Date(String(a.dob)) : null
  const currentAge     = dob ? Math.floor((Date.now() - dob.getTime()) / (1000 * 60 * 60 * 24 * 365.25)) : 40
  const yearsToRetire  = Math.max(0, retireAge - currentAge)
  const r              = 0.06 / 12 // 6% annual, monthly
  const months         = yearsToRetire * 12

  if (months <= 0) return 'Client is at or past retirement age.'

  const futureValue = currentSavings * Math.pow(1 + r, months) + monthlyContrib * ((Math.pow(1 + r, months) - 1) / r)
  const goalIncome  = n(a.retirementIncomeGoal) || n(a.grossIncome) * 0.8
  const nestedEgg   = goalIncome * 25 // 4% withdrawal rule

  return `Projected balance at age ${retireAge}: ${fmt$(futureValue)} | Target nest egg (4% rule on $${Math.round(goalIncome).toLocaleString()}/yr): ${fmt$(nestedEgg)} | Gap: ${futureValue >= nestedEgg ? 'None — on track' : fmt$(nestedEgg - futureValue) + ' shortfall'}`
}

// ── FULL REGULATORY DISCLAIMER ────────────────────────────────────────────────

const ADVISOR_DISCLAIMER = `This report is prepared by WealthPlanrAI LLC for use by licensed financial professionals only. It does not constitute a solicitation or offer to buy or sell any security or insurance product. All recommendations are based on self-reported client data and have not been independently verified. Past performance is not indicative of future results. All investments involve risk including possible loss of principal.

Insurance products including life insurance, annuities, IUL, FIA, VUL, and disability insurance are subject to underwriting approval and policy terms. Insurance products are not FDIC insured and are not bank deposits or obligations.

Securities products including mutual funds, ETFs, stocks, and variable products may only be offered by registered representatives of a FINRA member broker-dealer. Fixed insurance products may be offered by licensed insurance agents.

This analysis is for informational purposes only. WealthPlanrAI advisors must conduct their own suitability analysis in accordance with FINRA Rule 2111, SEC Regulation Best Interest, and applicable state regulations before making any product recommendations. All client information must be independently verified.

WealthPlanrAI LLC is not a registered investment advisor or broker-dealer. This report does not establish a fiduciary relationship. Licensed advisors using this report remain solely responsible for all recommendations made to clients.

© WealthPlanrAI LLC. Confidential. For licensed professional use only.`

const CLIENT_DISCLAIMER = `This financial assessment summary is prepared by WealthPlanrAI LLC and is for informational and educational purposes only. It does not constitute investment advice, insurance advice, legal advice, or tax advice. The information provided is based solely on self-reported data and has not been independently verified. Past performance is not indicative of future results. All investment strategies involve risk, including possible loss of principal. Insurance products and annuities involve risks and limitations — please read all product materials carefully before purchasing. WealthPlanrAI advisors may be licensed insurance agents and/or registered investment advisors. This summary does not establish an advisor-client relationship. Please consult with a licensed financial advisor, attorney, and tax professional before making any financial decisions.`

// ── generateClientPDF — 4-page client-friendly summary ────────────────────────

export async function generateClientPDF(assessment: AssessmentForPDF): Promise<Buffer> {
  const { jsPDF }  = await import('jspdf')
  const autoTable  = (await import('jspdf-autotable')).default

  const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W    = doc.internal.pageSize.getWidth()
  const H    = doc.internal.pageSize.getHeight()
  const BLUE: [number, number, number]  = [37, 99, 235]
  const NAVY: [number, number, number]  = [30, 58, 138]
  const DARK: [number, number, number]  = [17, 24, 39]
  const GRAY: [number, number, number]  = [107, 114, 128]
  const LGRAY: [number, number, number] = [229, 231, 235]

  const a      = assessment.answers
  const sr     = assessment.scoreResults
  const date   = new Date(assessment.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const pillars = computePillars(sr)
  const overall = assessment.overallScore

  function footer() {
    const pg = doc.getNumberOfPages()
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...GRAY)
    doc.text('WealthPlanrAI — Your Personal Financial Summary', 14, H - 8)
    doc.text(`Page ${pg} of 4`, W - 14, H - 8, { align: 'right' })
  }

  function newPage() { doc.addPage(); footer() }

  // ── PAGE 1: Cover ────────────────────────────────────────────────────────────

  doc.setFillColor(...NAVY)
  doc.rect(0, 0, W, 100, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(191, 219, 254)
  doc.text('WEALTHPLANRAI', 14, 22)

  doc.setFontSize(28)
  doc.setTextColor(255, 255, 255)
  doc.text('Your Financial', 14, 42)
  doc.text('Health Summary', 14, 55)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(147, 197, 253)
  doc.text('Confidential — Prepared exclusively for you', 14, 70)

  doc.setFontSize(9)
  doc.setTextColor(191, 219, 254)
  doc.text(`${assessment.clientName}  ·  ${date}`, 14, 85)

  // Pillars tagline
  doc.setFillColor(30, 58, 138)
  doc.rect(0, 100, W, 18, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(147, 197, 253)
  doc.text('PROTECT   |   GROW   |   LEAVE A LEGACY', W / 2, 111, { align: 'center' })

  // Score circle
  doc.setFillColor(...BLUE)
  doc.circle(W - 35, 140, 25, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(26)
  doc.setTextColor(255, 255, 255)
  doc.text(String(overall), W - 35, 145, { align: 'center' })
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('/ 100', W - 35, 153, { align: 'center' })
  doc.setFontSize(8)
  doc.text('Overall Score', W - 35, 160, { align: 'center' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(...DARK)
  doc.text('Your Financial Health Score', 14, 136)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...GRAY)
  doc.text('Based on the WealthPlanrAI Three Pillars framework', 14, 143)
  doc.text('Risk Profile: ' + capWords(assessment.riskProfile), 14, 151)
  doc.text('Completed: ' + date, 14, 158)

  // Intro text
  doc.setFontSize(10)
  doc.setTextColor(...DARK)
  const intro = `Dear ${assessment.clientName.split(' ')[0]},\n\nThank you for completing your WealthPlanrAI financial health assessment. This personalized summary evaluates your financial position across our Three Pillars — PROTECT, GROW, and LEAVE A LEGACY — and provides clear, actionable steps tailored to your situation.\n\nA WealthPlanrAI advisor will reach out within 1 business day to walk through your results and build your plan.`
  const introLines = doc.splitTextToSize(intro, W - 28) as string[]
  doc.text(introLines, 14, 175)

  footer()

  // ── PAGE 2: Financial Snapshot ───────────────────────────────────────────────

  newPage()
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...NAVY)
  doc.text('Your Financial Snapshot', 14, 22)

  doc.setDrawColor(...LGRAY)
  doc.setLineWidth(0.5)
  doc.line(14, 25, W - 14, 25)

  const age = getAge(a.dob)
  const personalRows: [string, string][] = [
    ['Name',              assessment.clientName],
    ['Age',               age ? `${age} years old` : String(a.dob ?? '—')],
    ['State',             String(a.state ?? '—')],
    ['Marital Status',    capWords(String(a.maritalStatus ?? '—'))],
    ['Employment Status', capWords(String(a.employmentStatus ?? '—'))],
    ['Dependents',        String(a.dependents ?? '0')],
  ]

  autoTable(doc, {
    startY: 30,
    head: [['Personal Details', '']],
    body: personalRows,
    theme: 'striped',
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 65, textColor: GRAY }, 1: { textColor: DARK } },
    margin: { left: 14, right: 14 },
  })

  const y1 = (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 80

  const financialRows: [string, string][] = [
    ['Annual Income',          fmt$(a.grossIncome)],
    ['Monthly Expenses',       fmt$(a.monthlyExpenses)],
    ['Monthly Savings',        fmt$(a.monthlySavings)],
    ['Investable Assets',      fmt$(a.investableAssets)],
    ['Retirement Savings',     fmt$(a.currentRetirementSavings)],
    ['Emergency Fund',         `${String(a.emergencyFundMonths ?? '0')} months`],
  ]

  autoTable(doc, {
    startY: y1 + 6,
    head: [['Financial Overview', '']],
    body: financialRows,
    theme: 'striped',
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: BLUE, textColor: [255, 255, 255], fontStyle: 'bold' },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 65, textColor: GRAY }, 1: { textColor: DARK } },
    margin: { left: 14, right: 14 },
  })

  const y2 = (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 160
  const overallRGB = scoreRGB(overall)

  doc.setFillColor(248, 250, 252)
  doc.roundedRect(14, y2 + 8, W - 28, 22, 3, 3, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...DARK)
  doc.text('Overall Health Score:', 20, y2 + 22)
  doc.setFontSize(18)
  doc.setTextColor(...overallRGB)
  doc.text(`${overall} / 100`, 80, y2 + 22)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...GRAY)
  doc.text(`(${capWords(assessment.riskProfile)} Investor Profile)`, 120, y2 + 22)

  // ── PAGE 3: Three Pillars ────────────────────────────────────────────────────

  newPage()
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...NAVY)
  doc.text('Three Pillars Assessment', 14, 22)
  doc.setDrawColor(...LGRAY)
  doc.line(14, 25, W - 14, 25)

  const pillarDefs = [
    { label: 'PILLAR 1 — PROTECT',        score: pillars.protect, statuses: ['Fully Protected',  'Partially Protected', 'Needs Protection'] as [string,string,string], findings: getProtectFindings(a) },
    { label: 'PILLAR 2 — GROW',           score: pillars.grow,    statuses: ['Strong Growth',    'Moderate Growth',     'Growth Gap'] as [string,string,string],       findings: getGrowFindings(a) },
    { label: 'PILLAR 3 — LEAVE A LEGACY', score: pillars.legacy,  statuses: ['Legacy Ready',     'Partial Legacy Plan', 'Legacy Gap'] as [string,string,string],        findings: getLegacyFindings(a) },
  ]

  let y3 = 32
  for (const p of pillarDefs) {
    const rgb = scoreRGB(p.score)
    const status = score2status(p.score, p.statuses)

    doc.setFillColor(...NAVY)
    doc.rect(14, y3, W - 28, 8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(255, 255, 255)
    doc.text(p.label, 18, y3 + 5.5)

    // Score
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...rgb)
    doc.text(`${p.score}`, 18, y3 + 22)
    doc.setFontSize(10)
    doc.setTextColor(...GRAY)
    doc.text('/ 100', 30, y3 + 22)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...DARK)
    doc.text(status, 55, y3 + 22)

    y3 += 30

    // Findings — plain English for clients
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...DARK)
    for (const f of p.findings.slice(0, 3)) {
      if (y3 > H - 40) break
      const symbol = p.score >= 80 ? '✓' : '→'
      doc.text(`${symbol}  ${f}`, 18, y3)
      y3 += 6
    }
    y3 += 8
  }

  // ── PAGE 4: Priority Actions + Disclaimer ────────────────────────────────────

  newPage()
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(...NAVY)
  doc.text('Your Priority Actions', 14, 22)
  doc.setDrawColor(...LGRAY)
  doc.line(14, 25, W - 14, 25)

  const topRecs = sr?.recommendations
    ? [...sr.recommendations]
        .sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] ?? 2) - ({ high: 0, medium: 1, low: 2 }[b.priority] ?? 2))
        .slice(0, 5)
    : []

  let y4 = 32
  if (topRecs.length === 0) {
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(10)
    doc.setTextColor(...GRAY)
    doc.text('No specific recommendations generated.', 14, y4)
    y4 += 12
  } else {
    for (let i = 0; i < topRecs.length; i++) {
      const rec = topRecs[i]
      doc.setFillColor(37, 99, 235)
      doc.circle(20, y4 + 1, 4, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.setTextColor(255, 255, 255)
      doc.text(String(i + 1), 20, y4 + 2.5, { align: 'center' })

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(...DARK)
      const lines = doc.splitTextToSize(rec.message, W - 40) as string[]
      doc.text(lines, 28, y4 + 2)
      y4 += lines.length * 5.5 + 6
    }
  }

  // CTA
  y4 += 4
  doc.setFillColor(239, 246, 255)
  doc.roundedRect(14, y4, W - 28, 24, 3, 3, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...NAVY)
  doc.text('Next Step: Connect With Your Advisor', W / 2, y4 + 9, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...GRAY)
  doc.text('A WealthPlanrAI advisor will contact you within 1 business day to build your personalized plan.', W / 2, y4 + 17, { align: 'center' })

  // Disclaimer
  y4 += 32
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(7.5)
  doc.setTextColor(156, 163, 175)
  const dlines = doc.splitTextToSize(CLIENT_DISCLAIMER, W - 28) as string[]
  doc.text(dlines, 14, y4)

  return Buffer.from(doc.output('arraybuffer'))
}

// ── generateAdvisorPDF — 8-page professional report ───────────────────────────

export async function generateAdvisorPDF(assessment: AssessmentForPDF): Promise<Buffer> {
  const { jsPDF } = await import('jspdf')
  const autoTable = (await import('jspdf-autotable')).default

  const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W    = doc.internal.pageSize.getWidth()
  const H    = doc.internal.pageSize.getHeight()
  const BLUE: [number, number, number]  = [37, 99, 235]
  const NAVY: [number, number, number]  = [30, 58, 138]
  const DARK: [number, number, number]  = [17, 24, 39]
  const GRAY: [number, number, number]  = [107, 114, 128]
  const LGRAY: [number, number, number] = [229, 231, 235]

  const a       = assessment.answers
  const sr      = assessment.scoreResults
  const date    = new Date(assessment.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  const pillars = computePillars(sr)
  const overall = assessment.overallScore

  const totalPages = 8

  function footer(pageTitle: string) {
    const pg = doc.getNumberOfPages()
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...GRAY)
    doc.text(`WealthPlanrAI — Confidential Advisor Report — ${pageTitle}`, 14, H - 8)
    doc.text(`${assessment.clientName}  |  Page ${pg} of ${totalPages}`, W - 14, H - 8, { align: 'right' })
  }

  function newPage(title: string) { doc.addPage(); footer(title) }

  function sectionHeader(text: string, y: number): number {
    doc.setFillColor(...BLUE)
    doc.rect(14, y, W - 28, 8, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9.5)
    doc.setTextColor(255, 255, 255)
    doc.text(text.toUpperCase(), 18, y + 5.5)
    return y + 12
  }

  function productTable(products: ProductRow[], startY: number): number {
    const rows = products.map(p => [p.name, p.status, p.rationale])
    autoTable(doc, {
      startY,
      head: [['Product / Strategy', 'Recommendation', 'Rationale']],
      body: rows,
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3, lineColor: LGRAY, lineWidth: 0.2 },
      headStyles: { fillColor: NAVY, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8.5 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 52, textColor: DARK },
        1: { cellWidth: 30, halign: 'center', fontStyle: 'bold', textColor: DARK },
        2: { textColor: GRAY },
      },
      margin: { left: 14, right: 14 },
    })
    return (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? startY + 80
  }

  // ── PAGE 1: Cover ─────────────────────────────────────────────────────────────

  doc.setFillColor(...NAVY)
  doc.rect(0, 0, W, 90, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(147, 197, 253)
  doc.text('WEALTHPLANRAI — CONFIDENTIAL ADVISOR REPORT', 14, 20)

  doc.setFontSize(22)
  doc.setTextColor(255, 255, 255)
  doc.text('Client Assessment Report', 14, 40)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(191, 219, 254)
  doc.text('For licensed financial professional use only', 14, 54)
  doc.text(`Assessment Date: ${date}`, 14, 62)
  if (assessment.assessmentId) doc.text(`Assessment ID: ${assessment.assessmentId}`, 14, 70)
  if (assessment.advisorName)  doc.text(`Prepared for: ${assessment.advisorName}`, 14, 78)

  // Client card
  doc.setFillColor(248, 250, 252)
  doc.roundedRect(14, 100, W - 28, 60, 4, 4, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(...DARK)
  doc.text(assessment.clientName, 22, 118)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(...GRAY)
  doc.text(`Email: ${assessment.clientEmail ?? '—'}`, 22, 128)
  doc.text(`Risk Profile: ${capWords(assessment.riskProfile)}`, 22, 137)
  doc.text(`Investment Horizon: ${capWords(String(a.investmentHorizon ?? '—'))}`, 22, 146)

  doc.setFillColor(...BLUE)
  doc.circle(W - 35, 130, 22, 'F')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(24)
  doc.setTextColor(255, 255, 255)
  doc.text(String(overall), W - 35, 135, { align: 'center' })
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('/ 100', W - 35, 143, { align: 'center' })
  doc.text('Overall', W - 35, 150, { align: 'center' })

  footer('Cover')

  // ── PAGE 2: Client Profile ────────────────────────────────────────────────────

  newPage('Client Profile')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(...NAVY)
  doc.text('Client Profile', 14, 20)

  let y = 28
  y = sectionHeader('Personal Information', y)

  const age = getAge(a.dob)
  const personalRows: [string, string][] = [
    ['Full Name',         assessment.clientName],
    ['Email',             assessment.clientEmail ?? '—'],
    ['Date of Birth',     String(a.dob ?? '—') + (age ? ` (Age ${age})` : '')],
    ['Marital Status',    capWords(String(a.maritalStatus ?? '—'))],
    ['Dependents',        String(a.dependents ?? '0')],
    ['Employment Status', capWords(String(a.employmentStatus ?? '—'))],
    ['Occupation',        String(a.occupation ?? '—')],
    ['State',             String(a.state ?? '—')],
  ]

  autoTable(doc, {
    startY: y, body: personalRows, theme: 'striped',
    styles: { fontSize: 9.5, cellPadding: 3.5 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55, textColor: GRAY }, 1: { textColor: DARK } },
    margin: { left: 14, right: 14 },
  })

  y = (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 50
  y += 6
  y = sectionHeader('Financial Overview', y)

  const accounts = Array.isArray(a.retirementAccounts) ? (a.retirementAccounts as string[]).join(', ') : String(a.retirementAccounts ?? '—')
  const financialRows: [string, string][] = [
    ['Annual Gross Income',        fmt$(a.grossIncome)],
    ['Spouse/Partner Income',      fmt$(a.spouseIncome)],
    ['Other Income',               fmt$(a.otherIncome)],
    ['Monthly Expenses',           fmt$(a.monthlyExpenses)],
    ['Monthly Savings',            fmt$(a.monthlySavings)],
    ['Emergency Fund',             `${String(a.emergencyFundMonths ?? '0')} months`],
    ['Investable Assets',          fmt$(a.investableAssets)],
    ['Current Retirement Savings', fmt$(a.currentRetirementSavings)],
    ['Monthly Retirement Contrib', fmt$(a.monthlyRetirementContrib)],
    ['Tax Bracket',                `${String(a.taxBracket ?? '—')}%`],
    ['Filing Status',              capWords(String(a.filingStatus ?? '—'))],
    ['Retirement Accounts',        accounts],
    ['Home Ownership',             capWords(String(a.homeOwnership ?? '—'))],
    ['Home Value',                 fmt$(a.homeValue)],
    ['Mortgage Balance',           fmt$(a.mortgageBalance)],
  ]

  autoTable(doc, {
    startY: y, body: financialRows, theme: 'striped',
    styles: { fontSize: 9.5, cellPadding: 3.5 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 70, textColor: GRAY }, 1: { textColor: DARK } },
    margin: { left: 14, right: 14 },
  })

  // ── PAGE 3: Protection Analysis ───────────────────────────────────────────────

  newPage('Protection Analysis')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(...NAVY)
  doc.text('PILLAR 1 — PROTECT', 14, 20)

  const rgb1 = scoreRGB(pillars.protect)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  doc.setTextColor(...rgb1)
  doc.text(`${pillars.protect}`, 14, 36)
  doc.setFontSize(11)
  doc.setTextColor(...GRAY)
  doc.text('/ 100  —  ' + score2status(pillars.protect, ['Fully Protected', 'Partially Protected', 'Needs Protection']), 32, 36)

  y = 44
  y = sectionHeader('Coverage Gaps Identified', y)

  const protectFindings = getProtectFindings(a)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(...DARK)
  for (const f of protectFindings) {
    doc.text(`• ${f}`, 18, y); y += 6
  }
  y += 6

  y = sectionHeader('Recommended Protection Products', y)
  const protectProds = getProtectProducts(a)
  productTable(protectProds, y)

  // ── PAGE 4: Growth Analysis ───────────────────────────────────────────────────

  newPage('Growth Analysis')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(...NAVY)
  doc.text('PILLAR 2 — GROW', 14, 20)

  const rgb2 = scoreRGB(pillars.grow)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  doc.setTextColor(...rgb2)
  doc.text(`${pillars.grow}`, 14, 36)
  doc.setFontSize(11)
  doc.setTextColor(...GRAY)
  doc.text('/ 100  —  ' + score2status(pillars.grow, ['Strong Growth', 'Moderate Growth', 'Growth Gap']), 32, 36)

  y = 44
  y = sectionHeader('Current Growth Assessment', y)
  const growFindings = getGrowFindings(a)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(...DARK)
  for (const f of growFindings) { doc.text(`• ${f}`, 18, y); y += 6 }
  y += 4

  y = sectionHeader('Retirement Projection (6% avg return)', y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(...DARK)
  const projLines = doc.splitTextToSize(retirementProjection(a), W - 32) as string[]
  doc.text(projLines, 18, y)
  y += projLines.length * 5.5 + 8

  y = sectionHeader('Recommended Growth Products', y)
  const growProds = getGrowProducts(a)
  productTable(growProds, y)

  // ── PAGE 5: Legacy Analysis ───────────────────────────────────────────────────

  newPage('Legacy Analysis')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(...NAVY)
  doc.text('PILLAR 3 — LEAVE A LEGACY', 14, 20)

  const rgb3 = scoreRGB(pillars.legacy)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  doc.setTextColor(...rgb3)
  doc.text(`${pillars.legacy}`, 14, 36)
  doc.setFontSize(11)
  doc.setTextColor(...GRAY)
  doc.text('/ 100  —  ' + score2status(pillars.legacy, ['Legacy Ready', 'Partial Legacy Plan', 'Legacy Gap']), 32, 36)

  y = 44
  y = sectionHeader('Estate Planning Checklist', y)

  const estateChecks: [string, string][] = [
    ['Last Will & Testament',   a.hasWill === 'yes'               ? '✓ In place'  : '✗ Missing'],
    ['Living Trust',            a.hasTrust === 'yes'              ? '✓ In place'  : '✗ Not established'],
    ['Power of Attorney',       a.hasPOA === 'yes'                ? '✓ In place'  : '✗ Missing'],
    ['Healthcare Directive',    a.hasHealthcareDirective === 'yes' ? '✓ In place'  : '✗ Missing'],
    ['Beneficiary Designations',a.hasBeneficiaries === 'yes'      ? '✓ Updated'   : '✗ May be outdated'],
    ['Estate Attorney',         a.hasEstateAttorney === 'yes'     ? '✓ Retained'  : '✗ None on file'],
    ['Last Estate Review',      String(a.lastReviewedEstate ?? 'Never')],
    ['Estimated Estate Value',  fmt$(a.estateValue)],
  ]

  autoTable(doc, {
    startY: y, body: estateChecks, theme: 'striped',
    styles: { fontSize: 9.5, cellPadding: 3.5 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 65, textColor: GRAY }, 1: { textColor: DARK } },
    margin: { left: 14, right: 14 },
  })

  y = (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 140
  y += 8
  y = sectionHeader('Recommended Legacy Products', y)
  const legacyProds = getLegacyProducts(a)
  productTable(legacyProds, y)

  // ── PAGE 6: Priority Recommendations ─────────────────────────────────────────

  newPage('Priority Recommendations')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(...NAVY)
  doc.text('Priority Recommendations', 14, 20)

  y = 28
  const priorityRecs = getAdvisorPriorityRecs(a, sr)

  for (let i = 0; i < priorityRecs.length; i++) {
    if (y > H - 50) { newPage('Priority Recommendations (cont.)'); y = 20 }
    const rec = priorityRecs[i]
    const priorityColor: [number, number, number] = rec.priority === 'High' ? [239, 68, 68] : rec.priority === 'Medium' ? [245, 158, 11] : [107, 114, 128]

    doc.setFillColor(...priorityColor)
    doc.roundedRect(14, y, 18, 7, 2, 2, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(255, 255, 255)
    doc.text(rec.priority.toUpperCase(), 23, y + 4.8, { align: 'center' })

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(...DARK)
    doc.text(`${i + 1}. ${rec.product}`, 36, y + 5)

    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8)
    doc.setTextColor(...GRAY)
    doc.text(rec.category, 36, y + 10)

    y += 14
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...DARK)
    const ratLines = doc.splitTextToSize(rec.rationale, W - 30) as string[]
    doc.text(ratLines, 18, y)
    y += ratLines.length * 4.5 + 3

    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8.5)
    doc.setTextColor(22, 163, 74)
    doc.text(`Impact: ${rec.impact}`, 18, y)
    y += 10

    doc.setDrawColor(...LGRAY)
    doc.line(14, y, W - 14, y)
    y += 6
  }

  // ── PAGE 7: Advisor Talking Points ────────────────────────────────────────────

  newPage('Advisor Talking Points')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.setTextColor(...NAVY)
  doc.text('Advisor Talking Points & Next Steps', 14, 20)

  y = 28
  y = sectionHeader('Client\'s Stated Priorities', y)

  const priority1 = capWords(String(a.topPriority1 ?? '—'))
  const priority2 = capWords(String(a.topPriority2 ?? '—'))
  const priority3 = capWords(String(a.topPriority3 ?? '—'))
  const concern   = String(a.biggestConcern ?? '—')
  const timeline  = capWords(String(a.timelineToStart ?? '—'))
  const notes     = String(a.additionalNotes ?? '—')

  const priorityTable: [string, string][] = [
    ['Top Priority #1',   priority1],
    ['Top Priority #2',   priority2],
    ['Top Priority #3',   priority3],
    ['Timeline to Start', timeline],
  ]

  autoTable(doc, {
    startY: y, body: priorityTable, theme: 'striped',
    styles: { fontSize: 10, cellPadding: 4 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 55, textColor: GRAY }, 1: { textColor: DARK } },
    margin: { left: 14, right: 14 },
  })

  y = (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y + 40
  y += 8
  y = sectionHeader('Client\'s Biggest Concern', y)

  doc.setFillColor(239, 246, 255)
  doc.roundedRect(14, y, W - 28, 16, 3, 3, 'F')
  doc.setFont('helvetica', 'italic')
  doc.setFontSize(10)
  doc.setTextColor(...NAVY)
  const concernLines = doc.splitTextToSize(`"${concern}"`, W - 36) as string[]
  doc.text(concernLines, 20, y + 8)
  y += 22

  y = sectionHeader('5 Conversation Starters', y)

  const starters = [
    `"${assessment.clientName.split(' ')[0]}, you mentioned your biggest concern is ${concern.toLowerCase()} — let's start by building a plan around that."`,
    `"Your top priority is ${priority1.toLowerCase()} — here's exactly what we recommend as a first step."`,
    `"You scored ${overall}/100 overall. The quickest wins are in ${pillars.protect < pillars.grow ? 'protection' : 'growth'} — let's tackle those first."`,
    `"You mentioned you want to start ${timeline.toLowerCase()} — let's get something on paper today."`,
    `"Based on your profile, there are ${priorityRecs.filter(r => r.priority === 'High').length} high-priority actions. Here's what I'd prioritize in the first 30 days."`,
  ]

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(...DARK)
  for (let i = 0; i < starters.length; i++) {
    if (y > H - 50) { newPage('Advisor Talking Points (cont.)'); y = 20 }
    const lines = doc.splitTextToSize(`${i + 1}. ${starters[i]}`, W - 30) as string[]
    doc.text(lines, 18, y)
    y += lines.length * 5.5 + 4
  }

  if (notes && notes !== '—') {
    y += 4
    y = sectionHeader('Client Additional Notes', y)
    const nlines = doc.splitTextToSize(notes, W - 28) as string[]
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(...DARK)
    doc.text(nlines, 14, y)
  }

  // ── PAGE 8: Regulatory Disclaimer ─────────────────────────────────────────────

  newPage('Regulatory Disclaimer')
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(...DARK)
  doc.text('Regulatory Disclaimer', 14, 22)

  doc.setDrawColor(...LGRAY)
  doc.line(14, 26, W - 14, 26)

  const dlines = doc.splitTextToSize(ADVISOR_DISCLAIMER, W - 28) as string[]
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(...GRAY)
  doc.text(dlines, 14, 34)

  const endY = 34 + dlines.length * 4.2 + 14
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(...DARK)
  doc.text('WealthPlanrAI LLC', 14, endY)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(...GRAY)
  doc.text('support@wealthplanrai.com', 14, endY + 7)
  doc.text('www.wealthplanrai.com', 14, endY + 13)
  doc.text(`Report generated: ${date}`, 14, endY + 19)

  return Buffer.from(doc.output('arraybuffer'))
}

// ── Legacy export: keep old name working for backward compatibility ─────────────

export async function generateAssessmentPDF(assessment: AssessmentForPDF): Promise<Buffer> {
  return generateAdvisorPDF(assessment)
}

// ── Form extract helpers (exported for view page) ─────────────────────────────

export function formatRaw(value: string): string {
  const map: Record<string, string> = {
    'yes': 'Yes', 'no': 'No', 'unsure': 'Not sure',
    'employer': 'Through employer', 'marketplace': 'ACA Marketplace',
    'medicare': 'Medicare', 'none': 'None',
    'single': 'Single', 'married': 'Married', 'divorced': 'Divorced',
    'widowed': 'Widowed', 'partnered': 'Domestic Partner',
    'employed': 'Employed (W-2)', 'self_employed': 'Self-Employed',
    'business_owner': 'Business Owner', 'retired': 'Retired',
    'unemployed': 'Not Currently Employed',
    'conservative': 'Conservative', 'moderate': 'Moderate',
    'moderately_aggressive': 'Moderately Aggressive',
    'aggressive': 'Aggressive', 'very_aggressive': 'Very Aggressive',
    'own': 'Own outright', 'mortgage': 'Own with mortgage', 'rent': 'Renting',
    'fixed_30': '30-year Fixed', 'fixed_15': '15-year Fixed',
    'arm': 'Adjustable Rate (ARM)',
    'mfj': 'Married Filing Jointly', 'mfs': 'Married Filing Separately',
    'hoh': 'Head of Household',
    'yes_rental': 'Yes — rental property', 'yes_vacation': 'Yes — vacation home',
    'within_1yr': 'Within the last year', '1_3yr': '1-3 years ago',
    '3_5yr': '3-5 years ago', '5yr+': 'More than 5 years ago',
    'never': 'Never / No plan',
    'asap': 'As soon as possible', '1month': 'Within 1 month',
    '3months': '1-3 months', '6months': '3-6 months',
    'exploring': 'Just exploring',
    'term': 'Term Life', 'whole': 'Whole Life',
    'universal': 'Universal Life', 'group': 'Group / Employer',
    'self': 'Self-file', 'informal': 'Informally',
    'beginner': 'Beginner', 'some': 'Some experience',
    'experienced': 'Experienced', 'professional': 'Professional level',
    'all_cash': 'All cash', 'balanced': '60/40 Balanced',
    'growth': 'Mostly equities', 'all_equities': 'All equities',
    'income': 'Income generation', 'preservation': 'Capital preservation',
    'previously': 'Previously had one', 'na': 'Not applicable',
    '401k': '401(k)', 'roth401k': 'Roth 401(k)',
    'ira': 'Traditional IRA', 'roth_ira': 'Roth IRA',
    'sep_ira': 'SEP IRA', 'pension': 'Pension', '403b': '403(b)',
    'outdated': 'Yes, but outdated',
    'retirement': 'Retirement planning', 'debt': 'Eliminating debt',
    'savings': 'Building savings', 'insurance': 'Insurance & protection',
    'estate': 'Estate planning', 'tax': 'Reducing taxes',
    'investments': 'Growing investments', 'education': 'Education funding',
    'home': 'Buying a home',
    'referral': 'Friend/colleague referral', 'google': 'Google search',
    'linkedin': 'LinkedIn', 'advisor': 'From my advisor',
    'event': 'Event or conference', 'other': 'Other',
    '4-6': '4-6 months', '6+': '6+ months',
    '1-3': '1-3 years', '3-5': '3-5 years',
    '5-10': '5-10 years', '10-20': '10-20 years', '20+': '20+ years',
  }
  return map[value.toLowerCase()] || value
}

export function formatVal(value: unknown): string {
  if (value === null || value === undefined || value === '') return 'Not provided'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (Array.isArray(value)) {
    if (value.length === 0) return 'None selected'
    return value.map(v => formatRaw(String(v))).join(', ')
  }
  return formatRaw(String(value))
}

export function formatMoney(value: unknown): string {
  if (!value || value === '') return 'Not provided'
  const num = parseFloat(String(value).replace(/[^0-9.]/g, ''))
  if (isNaN(num)) return 'Not provided'
  return '$' + num.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

// ── generateFormExtractPDF — raw form data extract for advisor ─────────────────

export async function generateFormExtractPDF(assessment: AssessmentForPDF): Promise<Buffer> {
  const { jsPDF }  = await import('jspdf')
  const autoTable  = (await import('jspdf-autotable')).default

  const doc  = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W    = doc.internal.pageSize.getWidth()
  const H    = doc.internal.pageSize.getHeight()
  const NAVY: [number, number, number] = [30,  58,  138]
  const DARK: [number, number, number] = [15,  23,   42]
  const GRAY: [number, number, number] = [100, 116, 139]
  const LGRAY:[number, number, number] = [229, 231, 235]

  const a    = assessment.answers
  const date = new Date(assessment.createdAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  })

  function renderFooter() {
    const pg = doc.getNumberOfPages()
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(...GRAY)
    doc.text('WealthPlanrAI — Client Assessment Data Extract — Confidential', 14, H - 8)
    doc.text(`Page ${pg}`, W - 14, H - 8, { align: 'right' })
  }

  function newPage() { doc.addPage(); renderFooter() }

  function suf(v: unknown, s: string): string {
    const x = formatVal(v)
    return x === 'Not provided' ? x : `${x}${s}`
  }

  function moneySuf(v: unknown, s: string): string {
    const m = formatMoney(v)
    return m === 'Not provided' ? m : `${m}${s}`
  }

  // ── PAGE 1: Cover ────────────────────────────────────────────────────────────

  doc.setFillColor(...NAVY)
  doc.rect(0, 0, W, 42, 'F')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(147, 197, 253)
  doc.text('WEALTHPLANRAI', 14, 16)

  doc.setFontSize(17)
  doc.setTextColor(255, 255, 255)
  doc.text('Client Assessment Data Extract', 14, 30)

  doc.setFont('helvetica', 'italic')
  doc.setFontSize(8.5)
  doc.setTextColor(191, 219, 254)
  doc.text('Confidential — For Licensed Advisor Use Only', 14, 39)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(20)
  doc.setTextColor(...DARK)
  doc.text(assessment.clientName, 14, 62)

  autoTable(doc, {
    startY: 68,
    body: [
      ['Email',          assessment.clientEmail ?? 'Not provided'],
      ['Phone',          formatVal(a.phone)],
      ['Date Submitted', date],
      ['Assessment ID',  assessment.assessmentId ?? 'N/A'],
    ] as [string, string][],
    theme: 'plain',
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50, textColor: GRAY },
      1: { textColor: DARK },
    },
    margin: { left: 14, right: 14 },
  })

  doc.setDrawColor(...NAVY)
  doc.setLineWidth(0.8)
  doc.line(14, 108, W - 14, 108)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.setTextColor(...NAVY)
  doc.text('CONFIDENTIAL — FOR LICENSED ADVISOR USE ONLY', W / 2, 115, { align: 'center' })

  renderFooter()

  // ── SECTIONS (one per page) ───────────────────────────────────────────────────

  const sections: { title: string; rows: [string, string][] }[] = [
    {
      title: 'SECTION 1 — PERSONAL INFORMATION',
      rows: [
        ['First Name',        formatVal(a.firstName)],
        ['Last Name',         formatVal(a.lastName)],
        ['Email',             formatVal(a.email)],
        ['Phone',             formatVal(a.phone)],
        ['Date of Birth',     formatVal(a.dob)],
        ['State',             formatVal(a.state)],
        ['Marital Status',    formatVal(a.maritalStatus)],
        ['Dependents',        formatVal(a.dependents)],
        ['Employment Status', formatVal(a.employmentStatus)],
        ['Occupation',        formatVal(a.occupation)],
      ],
    },
    {
      title: 'SECTION 2 — CASH FLOW',
      rows: [
        ['Annual Gross Income',     formatMoney(a.grossIncome)],
        ['Spouse/Partner Income',   formatMoney(a.spouseIncome)],
        ['Other Annual Income',     formatMoney(a.otherIncome)],
        ['Total Monthly Expenses',  formatMoney(a.monthlyExpenses)],
        ['Monthly Savings',         formatMoney(a.monthlySavings)],
        ['Emergency Fund Coverage', suf(a.emergencyFundMonths, ' months')],
        ['Follows a Budget',        formatVal(a.hasbudget)],
      ],
    },
    {
      title: 'SECTION 3 — PROTECTION & INSURANCE',
      rows: [
        ['Life Insurance',           formatVal(a.hasLifeInsurance)],
        ['Life Insurance Type',      formatVal(a.lifeInsuranceType)],
        ['Coverage Amount',          formatMoney(a.lifeCoverageAmount)],
        ['Disability Insurance',     formatVal(a.hasDisabilityInsurance)],
        ['Health Insurance',         formatVal(a.hasHealthInsurance)],
        ['Long-Term Care Insurance', formatVal(a.hasLongTermCare)],
        ['Umbrella Policy',          formatVal(a.hasUmbrella)],
      ],
    },
    {
      title: 'SECTION 4 — RETIREMENT PLANNING',
      rows: [
        ['Target Retirement Age',      formatVal(a.retirementAge)],
        ['Desired Monthly Income',     formatMoney(a.retirementIncomeGoal)],
        ['Current Retirement Savings', formatMoney(a.currentRetirementSavings)],
        ['Monthly Contributions',      formatMoney(a.monthlyRetirementContrib)],
        ['Retirement Accounts',        formatVal(a.retirementAccounts)],
        ['Has Pension',                formatVal(a.hasPension)],
        ['Social Security Estimate',   moneySuf(a.socialSecurityEstimate, '/mo')],
      ],
    },
    {
      title: 'SECTION 5 — INVESTMENTS',
      rows: [
        ['Total Investable Assets', formatMoney(a.investableAssets)],
        ['Investment Horizon',      formatVal(a.investmentHorizon)],
        ['Risk Tolerance',          formatVal(a.riskTolerance)],
        ['Investment Experience',   formatVal(a.investmentExperience)],
        ['Current Allocation',      formatVal(a.currentAllocation)],
        ['Investment Goal',         formatVal(a.investmentGoal)],
        ['Currently Has Advisor',   formatVal(a.hasAdvisor)],
      ],
    },
    {
      title: 'SECTION 6 — MORTGAGE & REAL ESTATE',
      rows: [
        ['Home Ownership',        formatVal(a.homeOwnership)],
        ['Estimated Home Value',  formatMoney(a.homeValue)],
        ['Mortgage Balance',      formatMoney(a.mortgageBalance)],
        ['Interest Rate',         suf(a.mortgageRate, '%')],
        ['Mortgage Type',         formatVal(a.mortgageType)],
        ['Monthly Payment',       formatMoney(a.monthlyMortgage)],
        ['Years Remaining',       formatVal(a.yearsRemaining)],
        ['Additional Properties', formatVal(a.hasSecondProperty)],
      ],
    },
    {
      title: 'SECTION 7 — TAX PLANNING',
      rows: [
        ['Filing Status',                   formatVal(a.filingStatus)],
        ['Federal Tax Bracket',             suf(a.taxBracket, '%')],
        ['Federal Taxes Last Year',         formatMoney(a.lastYearTaxes)],
        ['Pays Quarterly Taxes',            formatVal(a.estimatedTaxes)],
        ['Works with CPA',                  formatVal(a.hasAccountant)],
        ['Tax-Loss Harvesting Interest',    formatVal(a.taxLossHarvesting)],
        ['Business/Self-Employment Income', formatVal(a.hasBusinessIncome)],
        ['Maxing 401(k)',                   formatVal(a.maxing401k)],
      ],
    },
    {
      title: 'SECTION 8 — ESTATE PLANNING',
      rows: [
        ['Has Will',                 formatVal(a.hasWill)],
        ['Has Living Trust',         formatVal(a.hasTrust)],
        ['Power of Attorney',        formatVal(a.hasPOA)],
        ['Healthcare Directive',     formatVal(a.hasHealthcareDirective)],
        ['Estimated Estate Value',   formatMoney(a.estateValue)],
        ['Beneficiaries Up to Date', formatVal(a.hasBeneficiaries)],
        ['Last Estate Plan Review',  formatVal(a.lastReviewedEstate)],
        ['Has Estate Attorney',      formatVal(a.hasEstateAttorney)],
      ],
    },
    {
      title: 'SECTION 9 — PRIORITIES & GOALS',
      rows: [
        ['Top Priority',              formatVal(a.topPriority1)],
        ['Second Priority',           formatVal(a.topPriority2)],
        ['Third Priority',            formatVal(a.topPriority3)],
        ['Biggest Financial Concern', formatVal(a.biggestConcern)],
        ['Timeline to Start',         formatVal(a.timelineToStart)],
        ['How They Heard About Us',   formatVal(a.referralSource)],
        ['Additional Notes',          formatVal(a.additionalNotes)],
      ],
    },
  ]

  for (const section of sections) {
    newPage()
    autoTable(doc, {
      startY: 20,
      head: [[{ content: section.title, colSpan: 2, styles: { fillColor: NAVY, textColor: [255, 255, 255] as [number,number,number], fontStyle: 'bold' as const, fontSize: 10, halign: 'left' as const } }]],
      body: section.rows,
      theme: 'striped',
      styles: { fontSize: 9.5, cellPadding: 4 },
      columnStyles: {
        0: { fontStyle: 'bold' as const, cellWidth: 64, textColor: GRAY, fontSize: 9 },
        1: { textColor: DARK },
      },
      margin: { left: 14, right: 14 },
    })
  }

  // ── LAST PAGE: Disclaimer ─────────────────────────────────────────────────────

  newPage()

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.setTextColor(...DARK)
  doc.text('Important Notice', 14, 28)

  doc.setDrawColor(...LGRAY)
  doc.setLineWidth(0.5)
  doc.line(14, 32, W - 14, 32)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9.5)
  doc.setTextColor(...GRAY)
  const dlines = doc.splitTextToSize(
    'This document contains self-reported information provided by the client during the WealthPlanrAI financial assessment. All information has been provided voluntarily and has not been independently verified. This document is for licensed advisor use only. WealthPlanrAI LLC. Confidential.',
    W - 28,
  ) as string[]
  doc.text(dlines, 14, 42)

  return Buffer.from(doc.output('arraybuffer'))
}
