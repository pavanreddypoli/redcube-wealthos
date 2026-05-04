import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateAdvisorPDF } from '@/lib/generatePDF'
import { sendAdvisorEmail } from '@/lib/email'
import type { ScoreResults } from '@/lib/scoring'
import type { PillarScores } from '@/lib/email'
import type { IntakeAnalysisOutput } from '@/lib/wealthplanr/intake-analysis-engine'
import type { ClientEducationalSummary } from '@/lib/wealthplanr/client-view-translator'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

function clamp(v: number) { return Math.max(0, Math.min(100, Math.round(v))) }

function computePillars(sr: ScoreResults | null): PillarScores {
  if (!sr) return { protect: 0, grow: 0, legacy: 0 }
  return {
    protect: clamp((sr.sub_scores.insurance + sr.sub_scores.estate) / 2),
    grow:    clamp((sr.sub_scores.investments + sr.sub_scores.retirement + sr.sub_scores.cashflow + sr.sub_scores.tax) / 4),
    legacy:  clamp(sr.sub_scores.estate),
  }
}

function topGaps(sr: ScoreResults | null): string[] {
  if (!sr?.recommendations) return []
  return [...sr.recommendations]
    .sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] ?? 2) - ({ high: 0, medium: 1, low: 2 }[b.priority] ?? 2))
    .slice(0, 3)
    .map(r => r.message)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const { id } = params
    const body = await request.json() as { selected_advisor_id?: string | null }

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const supabase = adminClient()
    const { error } = await supabase
      .from('assessments')
      .update({ selected_advisor_id: body.selected_advisor_id ?? null })
      .eq('id', id)

    if (error) throw error

    // Fire-and-forget: send targeted advisor emails when an advisor is selected
    if (body.selected_advisor_id) {
      const advisorId = body.selected_advisor_id
      ;(async () => {
        try {
          const db = adminClient()

          const [{ data: assessment }, { data: advisor }] = await Promise.all([
            db.from('assessments')
              .select('id, full_name, email, risk_profile, score, score_results, answers, created_at, intake_analysis, client_summary, audit_trail')
              .eq('id', id)
              .single(),
            db.from('profiles')
              .select('email, full_name')
              .eq('id', advisorId)
              .single(),
          ])

          if (!assessment || !advisor?.email) {
            console.error('[assessment PATCH] missing assessment or advisor email for id:', id)
            return
          }

          const sr      = assessment.score_results as ScoreResults | null
          const answers = (assessment.answers ?? {}) as Record<string, unknown>
          const name    = (assessment.full_name as string | null) ?? 'Client'
          const email   = (assessment.email as string | null) ?? (answers.email as string | null) ?? null
          const pillars = computePillars(sr)
          const gaps    = topGaps(sr)
          const score   = (assessment.score as number) ?? 0

          const advisorPDF = await generateAdvisorPDF({
            clientName:     name,
            clientEmail:    email,
            riskProfile:    assessment.risk_profile as string,
            overallScore:   score,
            scoreResults:   sr,
            answers,
            createdAt:      assessment.created_at as string,
            assessmentId:   id,
            advisorName:    advisor.full_name ?? 'Your Advisor',
            intakeAnalysis: ((assessment as Record<string, unknown>).intake_analysis as IntakeAnalysisOutput | null) ?? null,
            clientSummary:  ((assessment as Record<string, unknown>).client_summary as ClientEducationalSummary | null) ?? null,
            auditTrail:     ((assessment as Record<string, unknown>).audit_trail as { consents?: unknown[]; events?: unknown[] } | null) ?? null,
          })

          const concerns  = String(answers.biggestConcern ?? '')
          const priorities = [
            String(answers.topPriority1 ?? ''),
            String(answers.topPriority2 ?? ''),
            String(answers.topPriority3 ?? ''),
          ]

          await Promise.all([
            sendAdvisorEmail(
              advisor.email,
              advisor.full_name ?? 'Advisor',
              name,
              email,
              score,
              assessment.risk_profile as string,
              pillars,
              concerns,
              priorities,
              id,
              advisorPDF,
              { topGaps: gaps },
            ),
            sendAdvisorEmail(
              process.env.COMPANY_EMAIL ?? 'info@wealthplanrai.com',
              'WealthPlanrAI',
              name,
              email,
              score,
              assessment.risk_profile as string,
              pillars,
              concerns,
              priorities,
              id,
              advisorPDF,
              { topGaps: gaps, isCompanyNotification: true },
            ),
          ])

          console.log('[assessment PATCH] advisor emails sent for assessment:', id)
        } catch (err) {
          console.error('[assessment PATCH] advisor email error:', err)
        }
      })()
    }

    return NextResponse.json({ success: true })

  } catch (err) {
    console.error('[assessment PATCH] error:', err)
    return NextResponse.json({ error: 'Failed to update assessment' }, { status: 500 })
  }
}
