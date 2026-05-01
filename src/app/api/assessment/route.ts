import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { scoreAssessment } from '@/lib/scoring'

// ─── Risk scoring (investment profile) ───────────────────────────────────────

function computeRiskScore(answers: Record<string, unknown>): number {
  let score = 0

  // Age (from dob)
  if (answers.dob) {
    const age = new Date().getFullYear() - new Date(answers.dob as string).getFullYear()
    if (age < 30)      score += 25
    else if (age < 45) score += 20
    else if (age < 55) score += 12
    else if (age < 65) score += 6
    else               score += 2
  }

  // Investment horizon
  const horizon = answers.investmentHorizon as string
  if (horizon === '20+')   score += 25
  else if (horizon === '10-20') score += 18
  else if (horizon === '5-10')  score += 12
  else if (horizon === '3-5')   score += 6
  else                          score += 2

  // Self-reported risk tolerance
  const risk = answers.riskTolerance as string
  if (risk === 'very_aggressive')    score += 40
  else if (risk === 'aggressive')    score += 30
  else if (risk === 'moderately_aggressive') score += 20
  else if (risk === 'moderate')      score += 12
  else if (risk === 'conservative')  score += 4

  // Emergency fund — reduces need for liquidity (positive)
  if (answers.emergencyFundMonths && answers.emergencyFundMonths !== '0') score += 5

  // High-interest debt — reduces risk capacity (negative)
  if (answers.hasBusinessIncome === 'yes') score += 3

  return Math.max(0, Math.min(100, score))
}

function getRiskProfile(score: number): string {
  if (score < 20) return 'conservative'
  if (score < 45) return 'moderate'
  if (score < 70) return 'aggressive'
  return 'very_aggressive'
}

function getAllocation(profile: string) {
  const map: Record<string, Record<string, number>> = {
    conservative:    { us_equities:20, intl_equities:10, fixed_income:55, alternatives:5,  cash:10 },
    moderate:        { us_equities:40, intl_equities:20, fixed_income:30, alternatives:5,  cash:5  },
    aggressive:      { us_equities:55, intl_equities:25, fixed_income:12, alternatives:6,  cash:2  },
    very_aggressive: { us_equities:65, intl_equities:25, fixed_income:5,  alternatives:4,  cash:1  },
  }
  return map[profile] ?? map.moderate
}

// ─── Split full form data into sections ───────────────────────────────────────

function splitIntoSections(answers: Record<string, unknown>) {
  return [
    {
      section: 'personal',
      answers: {
        firstName:        answers.firstName,
        lastName:         answers.lastName,
        email:            answers.email,
        phone:            answers.phone,
        dob:              answers.dob,
        maritalStatus:    answers.maritalStatus,
        dependents:       answers.dependents,
        employmentStatus: answers.employmentStatus,
        occupation:       answers.occupation,
        state:            answers.state,
      },
    },
    {
      section: 'cashflow',
      answers: {
        grossIncome:         answers.grossIncome,
        spouseIncome:        answers.spouseIncome,
        otherIncome:         answers.otherIncome,
        monthlyExpenses:     answers.monthlyExpenses,
        monthlySavings:      answers.monthlySavings,
        emergencyFundMonths: answers.emergencyFundMonths,
        hasbudget:           answers.hasbudget,
      },
    },
    {
      section: 'protection',
      answers: {
        hasLifeInsurance:       answers.hasLifeInsurance,
        lifeInsuranceType:      answers.lifeInsuranceType,
        lifeCoverageAmount:     answers.lifeCoverageAmount,
        hasDisabilityInsurance: answers.hasDisabilityInsurance,
        hasHealthInsurance:     answers.hasHealthInsurance,
        hasLongTermCare:        answers.hasLongTermCare,
        hasUmbrella:            answers.hasUmbrella,
      },
    },
    {
      section: 'retirement',
      answers: {
        retirementAge:            answers.retirementAge,
        retirementIncomeGoal:     answers.retirementIncomeGoal,
        currentRetirementSavings: answers.currentRetirementSavings,
        monthlyRetirementContrib: answers.monthlyRetirementContrib,
        retirementAccounts:       answers.retirementAccounts,
        hasPension:               answers.hasPension,
        socialSecurityEstimate:   answers.socialSecurityEstimate,
      },
    },
    {
      section: 'investments',
      answers: {
        investableAssets:      answers.investableAssets,
        investmentHorizon:     answers.investmentHorizon,
        riskTolerance:         answers.riskTolerance,
        investmentExperience:  answers.investmentExperience,
        currentAllocation:     answers.currentAllocation,
        investmentGoal:        answers.investmentGoal,
        hasAdvisor:            answers.hasAdvisor,
      },
    },
    {
      section: 'mortgage',
      answers: {
        homeOwnership:     answers.homeOwnership,
        homeValue:         answers.homeValue,
        mortgageBalance:   answers.mortgageBalance,
        mortgageRate:      answers.mortgageRate,
        mortgageType:      answers.mortgageType,
        monthlyMortgage:   answers.monthlyMortgage,
        yearsRemaining:    answers.yearsRemaining,
        hasSecondProperty: answers.hasSecondProperty,
      },
    },
    {
      section: 'tax',
      answers: {
        filingStatus:       answers.filingStatus,
        taxBracket:         answers.taxBracket,
        lastYearTaxes:      answers.lastYearTaxes,
        estimatedTaxes:     answers.estimatedTaxes,
        hasAccountant:      answers.hasAccountant,
        taxLossHarvesting:  answers.taxLossHarvesting,
        hasBusinessIncome:  answers.hasBusinessIncome,
        maxing401k:         answers.maxing401k,
      },
    },
    {
      section: 'estate',
      answers: {
        hasWill:               answers.hasWill,
        hasTrust:              answers.hasTrust,
        hasPOA:                answers.hasPOA,
        hasHealthcareDirective:answers.hasHealthcareDirective,
        estateValue:           answers.estateValue,
        hasBeneficiaries:      answers.hasBeneficiaries,
        lastReviewedEstate:    answers.lastReviewedEstate,
        hasEstateAttorney:     answers.hasEstateAttorney,
      },
    },
    {
      section: 'priorities',
      answers: {
        topPriority1:    answers.topPriority1,
        topPriority2:    answers.topPriority2,
        topPriority3:    answers.topPriority3,
        biggestConcern:  answers.biggestConcern,
        timelineToStart: answers.timelineToStart,
        additionalNotes: answers.additionalNotes,
        referralSource:  answers.referralSource,
      },
    },
  ]
}

// ─── POST handler ─────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const answers = body.answers ?? body   // support both {answers:{}} and flat payload

    const supabase  = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const riskScore  = computeRiskScore(answers)
    const risk_profile = getRiskProfile(riskScore)
    const recommended_allocation = getAllocation(risk_profile)
    const score_results = scoreAssessment(answers)

    const fullName = [answers.firstName, answers.lastName].filter(Boolean).join(' ') || null

    // 1. Insert parent assessment row
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .insert({
        user_id:                user?.id ?? null,
        full_name:              fullName,
        email:                  (answers.email as string) || null,
        answers,
        score:                  score_results.overall_score,
        risk_profile,
        recommended_allocation,
        score_results,
        status:                 'submitted',
      })
      .select('id')
      .single()

    if (assessmentError) {
      console.error('Assessment insert error:', assessmentError)
      throw assessmentError
    }

    // 2. Insert normalized per-section rows into assessment_answers
    const sections = splitIntoSections(answers)
    const { error: answersError } = await supabase
      .from('assessment_answers')
      .insert(
        sections.map(s => ({
          assessment_id: assessment.id,
          section:       s.section,
          answers:       s.answers,
        }))
      )

    if (answersError) {
      // Non-fatal — parent assessment saved, log and continue
      console.error('Section answers insert error:', answersError)
    }

    // 3. If user is logged in, link assessment to their profile client record
    if (user && fullName) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('firm_id')
        .eq('id', user.id)
        .single()

      if (profile?.firm_id) {
        // Upsert client record so dashboard shows this person
        await supabase.from('clients').upsert({
          firm_id:      profile.firm_id,
          advisor_id:   user.id,
          full_name:    fullName,
          email:        (answers.email as string) || null,
          risk_profile,
        }, { onConflict: 'firm_id,email', ignoreDuplicates: false })
      }
    }

    // Fire-and-forget: generate PDF and email advisor (non-blocking)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://redcube-wealthos.vercel.app'
    const sendReportUrl = `${appUrl}/api/assessment/send-report`
    console.log('[assessment] Triggering send-report at:', sendReportUrl, 'for ID:', assessment.id)
    fetch(sendReportUrl, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ assessmentId: assessment.id }),
    }).then(r => {
      console.log('[assessment] send-report response status:', r.status)
      return r.json()
    }).then(data => {
      console.log('[assessment] send-report response:', data)
    }).catch(err => {
      console.error('[assessment] send-report fetch failed:', err.message)
    })

    return NextResponse.json({ id: assessment.id, risk_profile, score: score_results.overall_score })

  } catch (err) {
    console.error('Assessment POST error:', err)
    return NextResponse.json(
      { error: 'Failed to save assessment. Please try again.' },
      { status: 500 }
    )
  }
}

// ─── GET handler — fetch a single assessment by id ───────────────────────────

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const supabase = await createClient()

    const { data, error } = await supabase
      .from('assessments')
      .select(`
        *,
        assessment_answers ( section, answers )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return NextResponse.json(data)

  } catch (err) {
    console.error('Assessment GET error:', err)
    return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
  }
}