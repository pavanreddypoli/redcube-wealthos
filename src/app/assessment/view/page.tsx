import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { PrintButton } from './PrintButton'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

function fmt(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (Array.isArray(value)) return value.length > 0 ? value.map(v => displayName(String(v))).join(', ') : '—'
  return displayName(String(value))
}

function fmtMoney(value: unknown): string {
  const n = Number(value)
  if (!value || isNaN(n)) return '—'
  return `$${n.toLocaleString('en-US')}`
}

function displayName(raw: string): string {
  const MAP: Record<string, string> = {
    single: 'Single', married: 'Married', divorced: 'Divorced', widowed: 'Widowed', separated: 'Separated',
    rent: 'Renting', own: 'Own Home', own_with_mortgage: 'Own (with Mortgage)', living_with_family: 'Living with Family',
    salaried: 'Salaried', self_employed: 'Self-Employed', business_owner: 'Business Owner', retired: 'Retired', part_time: 'Part-Time', unemployed: 'Unemployed',
    term: 'Term', whole: 'Whole Life', universal: 'Universal', none: 'None',
    hmo: 'HMO', ppo: 'PPO', hdhp: 'HDHP', employer: 'Employer-Sponsored', marketplace: 'Marketplace', medicare: 'Medicare', medicaid: 'Medicaid',
    conservative: 'Conservative', moderate: 'Moderate', aggressive: 'Aggressive', moderate_conservative: 'Moderate Conservative', moderate_aggressive: 'Moderate Aggressive',
    beginner: 'Beginner', intermediate: 'Intermediate', experienced: 'Experienced', expert: 'Expert',
    sell_all: 'Sell All', sell_some: 'Sell Some', hold: 'Hold', buy_more: 'Buy More',
    single_filer: 'Single Filer', married_jointly: 'Married Filing Jointly', married_separately: 'Married Filing Separately', head_of_household: 'Head of Household',
    bracket_10: '10%', bracket_12: '12%', bracket_22: '22%', bracket_24: '24%', bracket_32: '32%', bracket_35: '35%', bracket_37: '37%',
    less_than_1_year: 'Less than 1 year', one_to_three: '1–3 years', three_to_five: '3–5 years', five_to_ten: '5–10 years', more_than_ten: '10+ years',
    short_term: 'Short-Term (1–3 yrs)', medium_term: 'Medium-Term (3–10 yrs)', long_term: 'Long-Term (10+ yrs)',
    retirement_income: 'Retirement Income', wealth_building: 'Wealth Building', debt_freedom: 'Debt Freedom', protect_family: 'Protect Family',
    buy_home: 'Buy a Home', college_savings: 'College Savings', business_growth: 'Business Growth', estate_planning: 'Estate Planning',
    never_reviewed: 'Never Reviewed', over_5_years: '5+ Years Ago', three_to_5_years: '3–5 Years Ago', one_to_3_years: '1–3 Years Ago', within_1_year: 'Within Past Year',
    very_stressed: 'Very Stressed', somewhat_stressed: 'Somewhat Stressed', neutral: 'Neutral', not_concerned: 'Not Concerned', no_debt: 'No Debt',
  }
  return MAP[raw] ?? raw.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

interface Field { label: string; value: string }
interface Section { title: string; fields: Field[] }

function buildSections(answers: Record<string, unknown>): Section[] {
  const a = answers
  return [
    {
      title: '1. Personal Information',
      fields: [
        { label: 'Full Name',        value: fmt(a.fullName) },
        { label: 'Date of Birth',    value: fmt(a.dateOfBirth) },
        { label: 'Marital Status',   value: fmt(a.maritalStatus) },
        { label: 'Dependents',       value: fmt(a.dependents) },
        { label: 'Home Ownership',   value: fmt(a.homeOwnership) },
        { label: 'State',            value: fmt(a.state) },
        { label: 'Email',            value: fmt(a.email) },
        { label: 'Phone',            value: fmt(a.phone) },
      ],
    },
    {
      title: '2. Income & Assets',
      fields: [
        { label: 'Gross Income',         value: fmtMoney(a.grossIncome) },
        { label: 'Employment Type',      value: fmt(a.employmentType) },
        { label: 'Spouse/Partner Income',value: fmtMoney(a.spouseIncome) },
        { label: 'Monthly Savings',      value: fmtMoney(a.monthlySavings) },
        { label: 'Checking Balance',     value: fmtMoney(a.checkingBalance) },
        { label: 'Savings Balance',      value: fmtMoney(a.savingsBalance) },
        { label: 'Investable Assets',    value: fmtMoney(a.investableAssets) },
        { label: 'Real Estate Value',    value: fmtMoney(a.realEstate) },
        { label: 'Other Assets',         value: fmtMoney(a.otherAssets) },
      ],
    },
    {
      title: '3. Protection & Insurance',
      fields: [
        { label: 'Life Insurance Type',     value: fmt(a.lifeInsuranceType) },
        { label: 'Life Insurance Coverage', value: fmtMoney(a.lifeInsuranceCoverage) },
        { label: 'Disability Insurance',    value: fmt(a.hasDisabilityInsurance) },
        { label: 'Disability Coverage',     value: fmtMoney(a.disabilityCoverage) },
        { label: 'Long-Term Care',          value: fmt(a.hasLTC) },
        { label: 'LTC Coverage',            value: fmtMoney(a.ltcCoverage) },
        { label: 'Health Insurance',        value: fmt(a.hasHealthInsurance) },
        { label: 'Health Insurance Type',   value: fmt(a.healthInsuranceType) },
        { label: 'Umbrella Policy',         value: fmt(a.hasUmbrella) },
        { label: 'Umbrella Amount',         value: fmtMoney(a.umbrellaAmount) },
      ],
    },
    {
      title: '4. Debt & Liabilities',
      fields: [
        { label: 'Mortgage Balance',  value: fmtMoney(a.mortgageBalance) },
        { label: 'Mortgage Payment',  value: fmtMoney(a.mortgagePayment) },
        { label: 'Car Loan',          value: fmtMoney(a.carLoan) },
        { label: 'Credit Card Debt',  value: fmtMoney(a.creditCardDebt) },
        { label: 'Student Loans',     value: fmtMoney(a.studentLoans) },
        { label: 'Other Debt',        value: fmtMoney(a.otherDebt) },
        { label: 'Debt Stress Level', value: fmt(a.debtStressLevel) },
      ],
    },
    {
      title: '5. Investments & Retirement',
      fields: [
        { label: '401(k)/403(b)',               value: fmt(a.has401k) },
        { label: '401(k) Balance',              value: fmtMoney(a.balance401k) },
        { label: 'Roth IRA',                    value: fmt(a.hasRoth) },
        { label: 'Roth IRA Balance',            value: fmtMoney(a.rothBalance) },
        { label: 'Traditional IRA',             value: fmt(a.hasTraditionalIRA) },
        { label: 'IRA Balance',                 value: fmtMoney(a.iraBalance) },
        { label: 'Brokerage Account',           value: fmt(a.hasBrokerage) },
        { label: 'Brokerage Balance',           value: fmtMoney(a.brokerageBalance) },
        { label: 'Retirement Contribution %',   value: a.currentRetirementContribution ? `${a.currentRetirementContribution}%` : '—' },
        { label: 'Retirement Goal Age',         value: fmt(a.retirementGoalAge) },
        { label: 'Retirement Income Goal',      value: fmtMoney(a.retirementIncomeGoal) },
      ],
    },
    {
      title: '6. Tax Planning',
      fields: [
        { label: 'Tax Filing Status',   value: fmt(a.taxFilingStatus) },
        { label: 'Tax Bracket',         value: fmt(a.taxBracket) },
        { label: 'HSA Contributions',   value: fmt(a.contributeToHSA) },
        { label: 'HSA Balance',         value: fmtMoney(a.hsaBalance) },
        { label: 'Taxable Events',      value: fmt(a.hasTaxableEvents) },
        { label: 'Trust or Foundation', value: fmt(a.hasTrustOrFoundation) },
      ],
    },
    {
      title: '7. Estate Planning',
      fields: [
        { label: 'Has Will',                  value: fmt(a.hasWill) },
        { label: 'Has Trust',                 value: fmt(a.hasTrust) },
        { label: 'Power of Attorney',         value: fmt(a.hasPOA) },
        { label: 'Healthcare Directive',      value: fmt(a.hasHealthcareDirective) },
        { label: 'Beneficiaries Updated',     value: fmt(a.beneficiariesUpdated) },
        { label: 'Estate Plan Last Reviewed', value: fmt(a.estatePlanLastReviewed) },
      ],
    },
    {
      title: '8. Goals & Priorities',
      fields: [
        { label: 'Top Priority 1',   value: fmt(a.topPriority1) },
        { label: 'Top Priority 2',   value: fmt(a.topPriority2) },
        { label: 'Top Priority 3',   value: fmt(a.topPriority3) },
        { label: 'Biggest Concern',  value: fmt(a.biggestConcern) },
        { label: 'Goal Timeline',    value: fmt(a.goalTimeline) },
        { label: 'Planning Horizon', value: fmt(a.planningHorizon) },
      ],
    },
    {
      title: '9. Risk Tolerance & Behavior',
      fields: [
        { label: 'Risk Tolerance',          value: fmt(a.riskTolerance) },
        { label: 'Investment Experience',   value: fmt(a.investmentExperience) },
        { label: 'Market Drop Reaction',    value: fmt(a.marketDropReaction) },
        { label: 'Portfolio Drop Comfort',  value: a.portfolioDropComfort ? `${a.portfolioDropComfort}%` : '—' },
        { label: 'Past Investment Mistake', value: fmt(a.pastInvestmentMistake) },
      ],
    },
  ]
}

export default async function AssessmentViewPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>
}) {
  const { id } = await searchParams

  if (!id) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-white">Missing assessment ID.</p>
      </div>
    )
  }

  const supabase = adminClient()
  const { data, error } = await supabase
    .from('assessments')
    .select('id, full_name, email, risk_profile, score, answers, created_at')
    .eq('id', id)
    .single()

  if (error || !data) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-white">Assessment not found.</p>
      </div>
    )
  }

  const answers  = (data.answers ?? {}) as Record<string, unknown>
  const name     = (data.full_name as string | null) ?? 'Client'
  const email    = (data.email as string | null) ?? (answers.email as string | null) ?? null
  const score    = (data.score as number) ?? 0
  const risk     = (data.risk_profile as string | null) ?? ''
  const date     = data.created_at
    ? new Date(data.created_at as string).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : '—'

  const sections = buildSections(answers)
  const scoreColor = score >= 75 ? '#16a34a' : score >= 50 ? '#f59e0b' : '#ef4444'
  const riskLabel = risk.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .print-card { break-inside: avoid; }
        }
      `}</style>

      <div className="min-h-screen bg-slate-950 text-white">
        {/* Header */}
        <div style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 50%, #0F172A 100%)' }} className="px-6 py-8 border-b border-slate-800">
          <div className="max-w-4xl mx-auto">
            <div className="no-print flex items-center gap-3 mb-5">
              <Link
                href={`/results?id=${id}`}
                className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Back to Results
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <p className="text-blue-300 text-xs font-bold uppercase tracking-widest mb-1">Full Assessment View</p>
                <h1 className="text-2xl sm:text-3xl font-bold text-white" style={{ fontFamily: 'Sora, sans-serif' }}>{name}</h1>
                {email && <p className="text-slate-400 text-sm mt-1">{email}</p>}
                <p className="text-slate-500 text-xs mt-1">Completed {date}</p>
              </div>

              <div className="flex flex-col items-start sm:items-end gap-2">
                <div className="text-center bg-slate-800 border border-slate-700 rounded-xl px-5 py-3">
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Overall Score</p>
                  <p className="text-3xl font-black" style={{ color: scoreColor }}>{score}<span className="text-lg text-slate-400">/100</span></p>
                  <p className="text-xs text-slate-400 mt-0.5">{riskLabel}</p>
                </div>

                <div className="no-print flex gap-2">
                  <PrintButton />
                  <a
                    href={`/api/assessment/download-pdf?id=${id}&type=extract`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download PDF
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          {sections.map((section) => (
            <div key={section.title} className="print-card bg-slate-900 rounded-2xl overflow-hidden border border-slate-800">
              <div className="bg-slate-800 px-5 py-3 border-b border-slate-700">
                <h2 className="text-sm font-bold text-white uppercase tracking-wide">{section.title}</h2>
              </div>
              <div className="divide-y divide-slate-800">
                {section.fields.map((field) => (
                  <div key={field.label} className="flex items-start px-5 py-3 gap-4">
                    <span className="text-slate-400 text-sm w-48 flex-shrink-0">{field.label}</span>
                    <span className={`text-sm font-medium flex-1 ${field.value === '—' ? 'text-slate-600' : 'text-white'}`}>
                      {field.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <p className="no-print text-xs text-slate-600 text-center pb-8">
            Assessment ID: {id}
          </p>
        </div>
      </div>
    </>
  )
}
