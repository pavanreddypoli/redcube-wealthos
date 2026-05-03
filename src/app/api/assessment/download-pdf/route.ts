import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateClientPDF, generateAdvisorPDF, generateFormExtractPDF } from '@/lib/generatePDF'
import type { ScoreResults } from '@/lib/scoring'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id   = searchParams.get('id')
    const type = searchParams.get('type') ?? 'client'

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const supabase = adminClient()
    const { data, error } = await supabase
      .from('assessments')
      .select('id, full_name, email, risk_profile, score, score_results, answers, created_at')
      .eq('id', id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
    }

    const sr      = data.score_results as ScoreResults | null
    const answers = (data.answers ?? {}) as Record<string, unknown>
    const name    = (data.full_name as string | null) ?? 'Client'
    const email   = (data.email as string | null) ?? (answers.email as string | null) ?? null

    const assessmentForPDF = {
      clientName:   name,
      clientEmail:  email,
      riskProfile:  data.risk_profile as string,
      overallScore: (data.score as number) ?? 0,
      scoreResults: sr,
      answers,
      createdAt:    data.created_at as string,
      assessmentId: data.id as string,
    }

    const safeName = name.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_')
    let pdfBuffer: Buffer
    let filename: string
    if (type === 'advisor') {
      pdfBuffer = await generateAdvisorPDF(assessmentForPDF)
      filename  = `${safeName}_Advisor_Report.pdf`
    } else if (type === 'extract') {
      pdfBuffer = await generateFormExtractPDF(assessmentForPDF)
      filename  = `${safeName}_Form_Extract.pdf`
    } else {
      pdfBuffer = await generateClientPDF(assessmentForPDF)
      filename  = `${safeName}_Financial_Summary.pdf`
    }

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length':      String(pdfBuffer.length),
      },
    })

  } catch (err) {
    console.error('[download-pdf] error:', err)
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 })
  }
}
