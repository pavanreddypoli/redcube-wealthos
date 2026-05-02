import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateClientPDF, generateAdvisorPDF } from '@/lib/generatePDF'
import { sendClientEmail, sendAdvisorEmail } from '@/lib/email'
import type { ScoreResults } from '@/lib/scoring'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

function clamp(v: number) { return Math.max(0, Math.min(100, Math.round(v))) }

function computePillars(sr: ScoreResults | null) {
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

export async function POST(req: NextRequest) {
  try {
    const { assessmentId } = await req.json() as { assessmentId: string }
    console.log('[send-report] 1. called for assessment:', assessmentId)
    console.log('[send-report] SENDGRID_API_KEY present:', !!process.env.SENDGRID_API_KEY)
    console.log('[send-report] SENDGRID_FROM_EMAIL:', process.env.SENDGRID_FROM_EMAIL)
    console.log('[send-report] COMPANY_EMAIL:', process.env.COMPANY_EMAIL)

    if (!assessmentId) {
      return NextResponse.json({ error: 'assessmentId required' }, { status: 400 })
    }

    const supabase = adminClient()

    const { data, error } = await supabase
      .from('assessments')
      .select('id, full_name, email, risk_profile, score, score_results, answers, created_at, selected_advisor_id')
      .eq('id', assessmentId)
      .single()

    if (error || !data) {
      console.error('[send-report] 2. assessment not found:', error)
      return NextResponse.json({ error: 'assessment not found' }, { status: 404 })
    }

    console.log('[send-report] 2. assessment fetched:', data.id)

    const sr       = data.score_results as ScoreResults | null
    const answers  = (data.answers ?? {}) as Record<string, unknown>
    const name     = (data.full_name as string | null) ?? 'Client'
    const email    = (data.email as string | null) ?? (answers.email as string | null) ?? null
    const pillars  = computePillars(sr)
    const gaps     = topGaps(sr)
    const score    = (data.score as number) ?? 0
    const risk     = data.risk_profile as string

    console.log('[send-report] 3. client email:', email)
    console.log('[send-report] 3. selected_advisor_id:', data.selected_advisor_id)

    // Fetch selected advisor if present
    let advisorEmail: string | null = null
    let advisorName: string | null  = null
    if (data.selected_advisor_id) {
      const { data: advisor } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', data.selected_advisor_id)
        .single()
      advisorEmail = advisor?.email ?? null
      advisorName  = advisor?.full_name ?? null
      console.log('[send-report] 3. selected advisor:', advisorName, advisorEmail)
    }

    const assessmentForPDF = {
      clientName:   name,
      clientEmail:  email,
      riskProfile:  risk,
      overallScore: score,
      scoreResults: sr,
      answers,
      createdAt:    data.created_at as string,
      assessmentId,
      advisorName,
    }

    // Generate PDFs individually — a PDF failure must not prevent emails
    console.log('[send-report] 4. generating client PDF...')
    let clientPDF: Buffer | null = null
    try {
      clientPDF = await generateClientPDF(assessmentForPDF)
      console.log('[send-report] 4. client PDF generated, bytes:', clientPDF.length)
    } catch (e) {
      console.error('[send-report] 4. client PDF generation failed:', (e as Error).message)
    }

    console.log('[send-report] 4. generating advisor PDF...')
    let advisorPDF: Buffer | null = null
    try {
      advisorPDF = await generateAdvisorPDF(assessmentForPDF)
      console.log('[send-report] 4. advisor PDF generated, bytes:', advisorPDF.length)
    } catch (e) {
      console.error('[send-report] 4. advisor PDF generation failed:', (e as Error).message)
    }

    let emailsSent = 0
    const priorities = [
      String(answers.topPriority1 ?? ''),
      String(answers.topPriority2 ?? ''),
      String(answers.topPriority3 ?? ''),
    ]
    const concern = String(answers.biggestConcern ?? '')

    // EMAIL 2 — Company notification (multi-recipient to survive RBL blocks)
    const EMAIL_VALID = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const companyEmails = [
      process.env.COMPANY_EMAIL || 'info@redcubefinancial.com',
      process.env.COMPANY_BACKUP_EMAIL,
    ].filter((e): e is string => !!e && EMAIL_VALID.test(e))

    for (const recipient of companyEmails) {
      console.log('[send-report] 6. sending company email to:', recipient)
      try {
        if (!advisorPDF) throw new Error('advisor PDF unavailable')
        await sendAdvisorEmail(
          recipient,
          'RedCube Financial Team',
          name,
          email,
          score,
          risk,
          pillars,
          concern,
          priorities,
          assessmentId,
          advisorPDF,
          {
            clientPhone:      String(answers.phone ?? ''),
            grossIncome:      String(answers.grossIncome ?? ''),
            investableAssets: String(answers.investableAssets ?? ''),
            topGaps:          gaps,
            isCompanyNotification: true,
          },
        )
        console.log('[send-report] 7. company email sent to:', recipient)
        emailsSent++
      } catch (e) {
        console.error('[send-report] 7. company email failed for', recipient, ':', (e as Error).message)
      }
    }

    // EMAIL 1 — Client email (when we have a valid address)
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    console.log('[send-report] 5. client email check — value:', email, 'valid:', email ? EMAIL_RE.test(email) : false)
    if (email && EMAIL_RE.test(email)) {
      console.log('[send-report] 5. sending client email to:', email)
      try {
        if (!clientPDF) throw new Error('client PDF unavailable')
        await sendClientEmail(email, name, assessmentId, score, risk, pillars, clientPDF, gaps)
        console.log('[send-report] 5. client email sent successfully')
        emailsSent++
      } catch (e) {
        console.error('[send-report] 5. client email failed:', (e as Error).message)
      }
    } else {
      console.error('[send-report] 5. no valid client email — raw value:', email)
    }

    // EMAIL 3 — Selected advisor (only if one was chosen)
    if (advisorEmail) {
      console.log('[send-report] 8. sending advisor email to:', advisorEmail)
      try {
        if (!advisorPDF) throw new Error('advisor PDF unavailable')
        await sendAdvisorEmail(
          advisorEmail,
          advisorName ?? 'Advisor',
          name,
          email,
          score,
          risk,
          pillars,
          concern,
          priorities,
          assessmentId,
          advisorPDF,
          {
            clientPhone:      String(answers.phone ?? ''),
            grossIncome:      String(answers.grossIncome ?? ''),
            investableAssets: String(answers.investableAssets ?? ''),
            topGaps:          gaps,
            isCompanyNotification: false,
          },
        )
        console.log('[send-report] 8. advisor email sent successfully to:', advisorEmail)
        emailsSent++
      } catch (e) {
        console.error('[send-report] 8. advisor email failed:', (e as Error).message)
      }
    }

    // Update assessment status
    await supabase
      .from('assessments')
      .update({ status: 'emailed' })
      .eq('id', assessmentId)

    console.log('[send-report] 9. done. emails sent:', emailsSent)
    return NextResponse.json({ success: true, emailsSent })

  } catch (err) {
    console.error('[send-report] fatal error:', (err as Error).message)
    return NextResponse.json({ error: 'Report send failed' }, { status: 500 })
  }
}
