export interface Recommendation {
  priority: 'high' | 'medium' | 'low'
  category: string
  message: string
}

export interface ScoreResults {
  overall_score: number
  sub_scores: {
    cashflow: number
    retirement: number
    insurance: number
    tax: number
    estate: number
    investments: number
  }
  risk_flags: string[]
  recommendations: Recommendation[]
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)))
}

function n(val: unknown): number {
  return parseFloat(String(val || '0')) || 0
}

// ── Sub-scorers ───────────────────────────────────────────────────────────────

function scoreCashflow(
  d: Record<string, unknown>,
  flags: string[],
  recs: Recommendation[],
): number {
  let score = 50

  const efm = d.emergencyFundMonths as string
  if (!efm || efm === '0' || efm === 'none') {
    score -= 15
    flags.push('No emergency fund — one unexpected expense could derail finances')
    recs.push({
      priority: 'high',
      category: 'Cash Flow',
      message: 'Build an emergency fund covering 3–6 months of expenses before investing further.',
    })
  } else if (efm === '1')   score += 5
  else if (efm === '2')     score += 8
  else if (efm === '3')     score += 12
  else if (efm === '4-6')   score += 20
  else if (efm === '6+')    score += 25

  if (d.hasbudget === 'yes')          score += 15
  else if (d.hasbudget === 'informal') score += 8
  else
    recs.push({
      priority: 'medium',
      category: 'Cash Flow',
      message: 'Create a monthly budget to track spending and identify savings opportunities.',
    })

  const savings  = n(d.monthlySavings)
  const expenses = n(d.monthlyExpenses)
  if (expenses > 0 && savings / expenses > 0.2) score += 10

  return clamp(score)
}

function scoreRetirement(
  d: Record<string, unknown>,
  flags: string[],
  recs: Recommendation[],
): number {
  let score = 30

  const accounts = d.retirementAccounts as string[]
  if (Array.isArray(accounts) && accounts.length > 0) {
    score += 20
  } else {
    flags.push('No retirement accounts identified')
    recs.push({
      priority: 'high',
      category: 'Retirement',
      message: 'Open a 401(k), IRA, or Roth IRA to start building tax-advantaged retirement savings.',
    })
  }

  if (n(d.currentRetirementSavings) > 0) {
    score += 15
  } else {
    recs.push({
      priority: 'high',
      category: 'Retirement',
      message: 'Start contributing to retirement savings as early as possible to benefit from compounding.',
    })
  }

  if (n(d.monthlyRetirementContrib) > 0) {
    score += 15
  } else {
    recs.push({
      priority: 'high',
      category: 'Retirement',
      message: 'Set up automatic monthly contributions to your retirement accounts.',
    })
  }

  if (n(d.socialSecurityEstimate) > 0) score += 10
  if (d.hasPension === 'yes')           score += 10

  const retAge = parseInt(String(d.retirementAge || '65'), 10)
  if (retAge > 0 && retAge < 55)
    flags.push('Early retirement target (under 55) requires an aggressive savings strategy')

  return clamp(score)
}

function scoreInsurance(
  d: Record<string, unknown>,
  flags: string[],
  recs: Recommendation[],
): number {
  let score = 20

  if (d.hasLifeInsurance === 'yes') {
    score += 25
  } else if (d.hasLifeInsurance === 'no') {
    flags.push('No life insurance — dependents and income are unprotected')
    recs.push({
      priority: 'high',
      category: 'Insurance',
      message: 'Obtain life insurance coverage to protect dependents and replace lost income.',
    })
  }

  if (d.hasDisabilityInsurance === 'yes' || d.hasDisabilityInsurance === 'employer') {
    score += 20
  } else {
    flags.push('No disability insurance — income is unprotected if unable to work')
    recs.push({
      priority: 'high',
      category: 'Insurance',
      message: 'Disability insurance replaces 60–70% of income if you cannot work — review your coverage.',
    })
  }

  if (d.hasHealthInsurance && d.hasHealthInsurance !== 'none') {
    score += 20
  } else {
    flags.push('No health insurance — catastrophic medical costs are unprotected')
    recs.push({
      priority: 'high',
      category: 'Insurance',
      message: 'Obtain health insurance immediately to avoid catastrophic out-of-pocket medical costs.',
    })
  }

  if (d.hasLongTermCare === 'yes') {
    score += 10
  } else {
    recs.push({
      priority: 'low',
      category: 'Insurance',
      message: 'Consider long-term care insurance to protect assets from nursing home or in-home care costs.',
    })
  }

  if (d.hasUmbrella === 'yes') score += 5

  return clamp(score)
}

function scoreTax(
  d: Record<string, unknown>,
  flags: string[],
  recs: Recommendation[],
): number {
  let score = 40

  if (d.hasAccountant === 'yes') {
    score += 20
  } else {
    recs.push({
      priority: 'medium',
      category: 'Tax',
      message: 'A CPA can identify deductions and strategies that typically save more than their fee.',
    })
  }

  if (d.maxing401k === 'yes') {
    score += 20
  } else if (d.maxing401k === 'no') {
    recs.push({
      priority: 'high',
      category: 'Tax',
      message: 'Maximize 401(k) contributions ($23,000 in 2024; $30,500 if 50+) to reduce taxable income.',
    })
  }

  if (d.taxLossHarvesting === 'yes') {
    score += 10
  } else {
    recs.push({
      priority: 'low',
      category: 'Tax',
      message: 'Tax-loss harvesting can offset capital gains — ask your advisor about this strategy.',
    })
  }

  if (d.estimatedTaxes === 'yes') score += 10

  if (d.hasBusinessIncome === 'yes' && d.hasAccountant !== 'yes') {
    score -= 10
    flags.push('Business income without a CPA increases audit risk and missed deductions')
    recs.push({
      priority: 'high',
      category: 'Tax',
      message: 'Business owners should work with a CPA to structure income, deductions, and quarterly payments optimally.',
    })
  }

  return clamp(score)
}

function scoreEstate(
  d: Record<string, unknown>,
  flags: string[],
  recs: Recommendation[],
): number {
  let score = 10
  const significant = n(d.estateValue) > 100_000
  const pri = (significant ? 'high' : 'medium') as 'high' | 'medium'

  if (d.hasWill === 'yes') {
    score += 25
  } else {
    if (significant) flags.push('No will — assets may pass through costly intestate probate')
    recs.push({
      priority: pri,
      category: 'Estate',
      message: 'Create or update a will to ensure your assets are distributed according to your wishes.',
    })
  }

  if (d.hasTrust === 'yes') {
    score += 20
  } else if (significant) {
    recs.push({
      priority: 'medium',
      category: 'Estate',
      message: 'A revocable living trust can avoid probate and provide more control over asset distribution.',
    })
  }

  if (d.hasPOA === 'yes') {
    score += 15
  } else {
    if (significant)
      flags.push('No durable power of attorney — financial decisions may be court-controlled if incapacitated')
    recs.push({
      priority: pri,
      category: 'Estate',
      message: 'Establish a durable power of attorney so a trusted person can manage finances if needed.',
    })
  }

  if (d.hasHealthcareDirective === 'yes') {
    score += 15
  } else {
    if (significant)
      flags.push('No healthcare directive — medical decisions may not reflect your wishes')
    recs.push({
      priority: 'medium',
      category: 'Estate',
      message: 'Create a healthcare directive (living will) to document your medical treatment preferences.',
    })
  }

  if (d.hasBeneficiaries === 'yes') {
    score += 15
  } else {
    if (significant)
      flags.push('Beneficiary designations not confirmed — retirement accounts may not pass as intended')
    recs.push({
      priority: pri,
      category: 'Estate',
      message: 'Review and update beneficiary designations on all accounts — they override your will.',
    })
  }

  return clamp(score)
}

function scoreInvestments(
  d: Record<string, unknown>,
  _flags: string[],
  recs: Recommendation[],
): number {
  let score = 40

  if (d.riskTolerance)    score += 10
  if (d.investmentHorizon) score += 10
  if (d.investmentGoal)   score += 10

  if (d.currentAllocation && d.currentAllocation !== 'unsure') {
    score += 15
  } else {
    recs.push({
      priority: 'medium',
      category: 'Investments',
      message: 'Establish a clear asset allocation aligned with your risk tolerance and time horizon.',
    })
  }

  if (d.investmentExperience === 'experienced' || d.investmentExperience === 'professional') {
    score += 15
  } else {
    recs.push({
      priority: 'low',
      category: 'Investments',
      message: 'Consider working with a financial advisor to build a diversified, goal-oriented investment strategy.',
    })
  }

  return clamp(score)
}

// ── Main export ───────────────────────────────────────────────────────────────

export function scoreAssessment(answers: Record<string, unknown>): ScoreResults {
  const flags: string[]          = []
  const recs:  Recommendation[]  = []

  const cashflow    = scoreCashflow(answers, flags, recs)
  const retirement  = scoreRetirement(answers, flags, recs)
  const insurance   = scoreInsurance(answers, flags, recs)
  const tax         = scoreTax(answers, flags, recs)
  const estate      = scoreEstate(answers, flags, recs)
  const investments = scoreInvestments(answers, flags, recs)

  const overall = clamp(
    cashflow    * 0.25 +
    retirement  * 0.25 +
    insurance   * 0.20 +
    tax         * 0.10 +
    estate      * 0.10 +
    investments * 0.10,
  )

  return {
    overall_score: overall,
    sub_scores: { cashflow, retirement, insurance, tax, estate, investments },
    risk_flags: flags,
    recommendations: recs,
  }
}
