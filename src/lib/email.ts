import type { ScoreResults } from '@/lib/scoring'

export interface PillarScores {
  protect: number
  grow: number
  legacy: number
}

// ── SendGrid lazy init ────────────────────────────────────────────────────────

function getSgMail() {
  const key = process.env.SENDGRID_API_KEY
  if (!key || key === 'placeholder') throw new Error('SENDGRID_API_KEY not configured')
  console.log('[sendgrid] API key present, length:', key.length)
  console.log('[sendgrid] From email:', process.env.SENDGRID_FROM_EMAIL ?? 'info@redcubefinancial.com (default)')
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const sgMail = require('@sendgrid/mail')
  sgMail.setApiKey(key)
  return sgMail
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function from(): { email: string; name: string } {
  return { email: process.env.SENDGRID_FROM_EMAIL ?? 'info@redcubefinancial.com', name: 'WealthPlanrAI' }
}

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
}

function safeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '_')
}

function dateStr(): string {
  return new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function emailHeader(title: string): string {
  return `<div style="background:#1e3a8a;padding:28px 36px;">
    <p style="margin:0;color:#93c5fd;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:700;">WealthPlanrAI</p>
    <h1 style="margin:8px 0 0;color:#fff;font-size:20px;font-weight:700;">${title}</h1>
  </div>`
}

function emailFooter(disclaimer: string): string {
  return `<div style="background:#f9fafb;padding:18px 36px;border-top:1px solid #e5e7eb;">
    <p style="margin:0;font-size:10px;color:#9ca3af;line-height:1.6;">${disclaimer}</p>
  </div>`
}

function pillarTable(pillars: PillarScores): string {
  const bar = (score: number) => {
    const color = score >= 80 ? '#16a34a' : score >= 50 ? '#f59e0b' : '#ef4444'
    return `<span style="display:inline-block;width:${score * 0.8}px;height:8px;background:${color};border-radius:4px;vertical-align:middle;"></span> ${score}/100`
  }
  return `<table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-top:4px;">
    <tr style="background:#f9fafb;">
      <th style="padding:8px 14px;text-align:left;font-size:11px;color:#6b7280;letter-spacing:1px;text-transform:uppercase;">Pillar</th>
      <th style="padding:8px 14px;text-align:left;font-size:11px;color:#6b7280;letter-spacing:1px;text-transform:uppercase;">Score</th>
    </tr>
    <tr><td style="padding:9px 14px;font-size:13px;color:#374151;font-weight:600;">🛡️ PROTECT</td><td style="padding:9px 14px;font-size:13px;">${bar(pillars.protect)}</td></tr>
    <tr style="background:#f9fafb;"><td style="padding:9px 14px;font-size:13px;color:#374151;font-weight:600;">📈 GROW</td><td style="padding:9px 14px;font-size:13px;">${bar(pillars.grow)}</td></tr>
    <tr><td style="padding:9px 14px;font-size:13px;color:#374151;font-weight:600;">🏛️ LEAVE A LEGACY</td><td style="padding:9px 14px;font-size:13px;">${bar(pillars.legacy)}</td></tr>
  </table>`
}

function clientSummaryTable(name: string, email: string | null, score: number, risk: string, date: string): string {
  const riskLabel = risk.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  return `<table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
    <tr style="background:#f9fafb;"><td style="padding:9px 14px;font-size:12px;color:#6b7280;width:38%;">Name</td><td style="padding:9px 14px;font-size:13px;font-weight:600;color:#111827;">${name}</td></tr>
    <tr><td style="padding:9px 14px;font-size:12px;color:#6b7280;">Email</td><td style="padding:9px 14px;font-size:13px;color:#374151;">${email ?? '—'}</td></tr>
    <tr style="background:#f9fafb;"><td style="padding:9px 14px;font-size:12px;color:#6b7280;">Overall Score</td><td style="padding:9px 14px;font-size:13px;font-weight:700;color:#2563eb;">${score}/100</td></tr>
    <tr><td style="padding:9px 14px;font-size:12px;color:#6b7280;">Risk Profile</td><td style="padding:9px 14px;font-size:13px;color:#374151;">${riskLabel}</td></tr>
    <tr style="background:#f9fafb;"><td style="padding:9px 14px;font-size:12px;color:#6b7280;">Date</td><td style="padding:9px 14px;font-size:13px;color:#374151;">${date}</td></tr>
  </table>`
}

function ctaButton(href: string, label: string): string {
  return `<div style="text-align:center;margin:28px 0;">
    <a href="${href}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:13px 30px;border-radius:10px;">${label} →</a>
  </div>`
}

const CLIENT_DISCLAIMER = `This summary is for informational purposes only and does not constitute investment, tax, legal, or insurance advice. Based on self-reported data. Consult a licensed financial professional before making financial decisions. WealthPlanrAI LLC.`

const ADVISOR_DISCLAIMER = `This report is for licensed financial professionals only. Does not constitute a solicitation or offer to buy or sell any security or insurance product. All recommendations based on self-reported client data. Advisors must conduct independent suitability analysis per FINRA Rule 2111 and SEC Reg BI. WealthPlanrAI LLC is not a registered investment advisor or broker-dealer. © WealthPlanrAI LLC — Confidential.`

// ── FUNCTION 1: sendClientEmail ───────────────────────────────────────────────

export async function sendClientEmail(
  clientEmail: string,
  clientName: string,
  assessmentId: string,
  overallScore: number,
  riskProfile: string,
  pillars: PillarScores,
  clientPDFBuffer: Buffer,
  topGaps?: string[],
): Promise<void> {
  const sgMail    = getSgMail()
  const safe      = safeFilename(clientName)
  const firstName = clientName.split(' ')[0]
  const scoreColor = overallScore >= 75 ? '#16a34a' : overallScore >= 50 ? '#f59e0b' : '#ef4444'

  function statusOf(score: number): { label: string; color: string } {
    if (score >= 80) return { label: 'Excellent',       color: '#16a34a' }
    if (score >= 60) return { label: 'Good',            color: '#2563eb' }
    if (score >= 40) return { label: 'Needs Attention', color: '#f59e0b' }
    return             { label: 'At Risk',            color: '#ef4444' }
  }

  const sp = statusOf(pillars.protect)
  const sg = statusOf(pillars.grow)
  const sl = statusOf(pillars.legacy)

  function scoreBar(score: number, color: string): string {
    return `<span style="display:inline-block;width:${Math.round(score * 0.65)}px;height:7px;background:${color};border-radius:4px;vertical-align:middle;margin-right:6px;"></span><span style="font-size:13px;">${score}/100</span>`
  }

  const gapSection = topGaps && topGaps.length > 0 ? `
    <h3 style="font-size:12px;font-weight:700;color:#6b7280;letter-spacing:2px;text-transform:uppercase;margin:24px 0 10px;">Key Areas To Address</h3>
    <ul style="margin:0;padding:0 0 0 18px;">
      ${topGaps.slice(0, 3).map(g => `<li style="padding:5px 0;font-size:13px;color:#374151;line-height:1.6;">${g}</li>`).join('')}
    </ul>` : ''

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:system-ui,sans-serif;">
<div style="max-width:600px;margin:28px auto;background:#fff;border-radius:14px;border:1px solid #e5e7eb;overflow:hidden;">
  ${emailHeader('Your Financial Health Summary is Ready')}
  <div style="padding:28px 36px;">
    <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 12px;">Hi ${firstName},</p>
    <p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 16px;">Thank you for completing your WealthPlanrAI Financial Health Assessment! Your personalized summary is <strong>attached to this email as a PDF</strong> — take a few minutes to review it at your convenience.</p>

    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:18px 22px;margin:20px 0;text-align:center;">
      <p style="margin:0;font-size:12px;color:#3b82f6;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Your Overall Financial Health Score</p>
      <p style="margin:6px 0 0;font-size:48px;font-weight:800;color:${scoreColor};line-height:1;">${overallScore}<span style="font-size:18px;color:#6b7280;">/100</span></p>
      <p style="margin:6px 0 0;font-size:13px;color:#6b7280;">${riskProfile.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Investor Profile</p>
    </div>

    <h3 style="font-size:12px;font-weight:700;color:#6b7280;letter-spacing:2px;text-transform:uppercase;margin:20px 0 10px;">Your Three Pillars Scorecard</h3>
    <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-top:4px;">
      <tr style="background:#f9fafb;">
        <th style="padding:8px 14px;text-align:left;font-size:11px;color:#6b7280;letter-spacing:1px;text-transform:uppercase;width:32%;">Pillar</th>
        <th style="padding:8px 14px;text-align:left;font-size:11px;color:#6b7280;letter-spacing:1px;text-transform:uppercase;">Score</th>
        <th style="padding:8px 14px;text-align:left;font-size:11px;color:#6b7280;letter-spacing:1px;text-transform:uppercase;">Status</th>
      </tr>
      <tr>
        <td style="padding:10px 14px;font-size:13px;color:#374151;font-weight:600;">🛡️ Protect</td>
        <td style="padding:10px 14px;">${scoreBar(pillars.protect, sp.color)}</td>
        <td style="padding:10px 14px;font-size:12px;font-weight:700;color:${sp.color};">${sp.label}</td>
      </tr>
      <tr style="background:#f9fafb;">
        <td style="padding:10px 14px;font-size:13px;color:#374151;font-weight:600;">📈 Grow</td>
        <td style="padding:10px 14px;">${scoreBar(pillars.grow, sg.color)}</td>
        <td style="padding:10px 14px;font-size:12px;font-weight:700;color:${sg.color};">${sg.label}</td>
      </tr>
      <tr>
        <td style="padding:10px 14px;font-size:13px;color:#374151;font-weight:600;">🏛️ Legacy</td>
        <td style="padding:10px 14px;">${scoreBar(pillars.legacy, sl.color)}</td>
        <td style="padding:10px 14px;font-size:12px;font-weight:700;color:${sl.color};">${sl.label}</td>
      </tr>
    </table>

    ${gapSection}

    <p style="color:#374151;font-size:14px;line-height:1.7;margin-top:22px;">A WealthPlanrAI advisor will be in touch within <strong>1 business day</strong> to walk you through your results and help you build a personalized action plan.</p>

    ${ctaButton(`${appUrl()}/summary?id=${assessmentId}`, 'View Your Full Summary Online')}

    <div style="border-top:1px solid #e5e7eb;margin-top:24px;padding-top:18px;">
      <p style="margin:0;font-size:13px;color:#374151;font-weight:600;">The WealthPlanrAI Team</p>
      <p style="margin:4px 0 0;font-size:12px;color:#6b7280;">info@redcubefinancial.com</p>
    </div>
  </div>
  ${emailFooter(CLIENT_DISCLAIMER)}
</div>
</body></html>`

  console.log('[sendgrid] sending client email to:', clientEmail)
  await sgMail.send({
    from: from(),
    to:   clientEmail,
    subject: `Your WealthPlanrAI Financial Health Summary is Ready, ${firstName}!`,
    html,
    attachments: [{
      content:     clientPDFBuffer.toString('base64'),
      filename:    `${safe}_Financial_Summary.pdf`,
      type:        'application/pdf',
      disposition: 'attachment',
    }],
  })
}

// ── FUNCTION 2: sendInfoEmail ─────────────────────────────────────────────────

export async function sendInfoEmail(
  clientName: string,
  clientEmail: string | null,
  overallScore: number,
  riskProfile: string,
  pillars: PillarScores,
  topGaps: string[],
  assessmentId: string,
  advisorPDFBuffer: Buffer,
  formExtractPDF?: Buffer | null,
): Promise<void> {
  const sgMail  = getSgMail()
  const date    = dateStr()
  const safe    = safeFilename(clientName)
  const infoTo  = process.env.COMPANY_EMAIL ?? 'info@redcubefinancial.com'

  const gapItems = topGaps.slice(0, 3).map(g => `<li style="padding:4px 0;font-size:13px;color:#374151;">${g}</li>`).join('')

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:system-ui,sans-serif;">
<div style="max-width:600px;margin:28px auto;background:#fff;border-radius:14px;border:1px solid #e5e7eb;overflow:hidden;">
  ${emailHeader('New Client Assessment Received')}
  <div style="padding:28px 36px;">
    <p style="color:#374151;font-size:14px;line-height:1.7;">A new client has completed the WealthPlanrAI financial assessment. Please review and assign to an advisor.</p>

    <h3 style="font-size:12px;font-weight:700;color:#6b7280;letter-spacing:2px;text-transform:uppercase;margin:20px 0 10px;">Client Summary</h3>
    ${clientSummaryTable(clientName, clientEmail, overallScore, riskProfile, date)}

    <h3 style="font-size:12px;font-weight:700;color:#6b7280;letter-spacing:2px;text-transform:uppercase;margin:20px 0 10px;">Three Pillars Scorecard</h3>
    ${pillarTable(pillars)}

    ${topGaps.length > 0 ? `
    <h3 style="font-size:12px;font-weight:700;color:#6b7280;letter-spacing:2px;text-transform:uppercase;margin:20px 0 10px;">Top Gaps Identified</h3>
    <ul style="margin:0;padding:0 0 0 16px;">${gapItems}</ul>` : ''}

    <p style="color:#374151;font-size:13px;line-height:1.7;margin-top:18px;">The full advisor report with detailed analysis and product recommendations is attached as a PDF.</p>

    ${ctaButton(`${appUrl()}/dashboard`, 'View in Dashboard')}
  </div>
  ${emailFooter(ADVISOR_DISCLAIMER)}
</div>
</body></html>`

  const infoAttachments: object[] = [{
    content:     advisorPDFBuffer.toString('base64'),
    filename:    `${safe}_Advisor_Report_${date.replace(/, /g, '_').replace(/ /g, '_')}.pdf`,
    type:        'application/pdf',
    disposition: 'attachment',
  }]
  if (formExtractPDF) {
    infoAttachments.push({
      content:     formExtractPDF.toString('base64'),
      filename:    `${safe}_Form_Extract.pdf`,
      type:        'application/pdf',
      disposition: 'attachment',
    })
  }

  console.log('[sendgrid] sending info email to:', infoTo)
  await sgMail.send({
    from: from(),
    to:   infoTo,
    subject: `New Assessment — ${clientName} — Score: ${overallScore}/100 — ${date}`,
    html,
    attachments: infoAttachments,
  })
}

// ── FUNCTION 3: sendAdvisorEmail ──────────────────────────────────────────────

export async function sendAdvisorEmail(
  advisorEmail: string,
  advisorName: string,
  clientName: string,
  clientEmail: string | null,
  overallScore: number,
  riskProfile: string,
  pillars: PillarScores,
  biggestConcern: string,
  topPriorities: string[],
  assessmentId: string,
  advisorPDFBuffer: Buffer,
  opts?: {
    clientPhone?: string
    grossIncome?: string
    investableAssets?: string
    topGaps?: string[]
    isCompanyNotification?: boolean
    formExtractPDF?: Buffer | null
  },
): Promise<void> {
  const sgMail    = getSgMail()
  const date      = dateStr()
  const safe      = safeFilename(clientName)
  const isCompany = opts?.isCompanyNotification ?? false
  const firstName = advisorName.split(' ')[0]

  function scoreStatus(score: number): { label: string; color: string } {
    if (score >= 80) return { label: 'Excellent',       color: '#16a34a' }
    if (score >= 60) return { label: 'Good',            color: '#2563eb' }
    if (score >= 40) return { label: 'Needs Attention', color: '#f59e0b' }
    return             { label: 'At Risk',            color: '#ef4444' }
  }

  const sp = scoreStatus(pillars.protect)
  const sg = scoreStatus(pillars.grow)
  const sl = scoreStatus(pillars.legacy)

  const riskLabel = riskProfile.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

  const priorityItems = topPriorities.filter(Boolean).slice(0, 3)
    .map(p => `<li style="padding:4px 0;font-size:13px;color:#374151;">${p.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</li>`).join('')

  const gapItems = (opts?.topGaps ?? []).slice(0, 3)
    .map(g => `<li style="padding:4px 0;font-size:13px;color:#374151;">${g}</li>`).join('')

  const subject = isCompany
    ? `New Assessment Submitted — ${clientName} — Score: ${overallScore}/100`
    : `New Client Match — ${clientName} — WealthPlanrAI`

  const greeting = isCompany
    ? `<p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 16px;">New client assessment received:</p>`
    : `<p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 4px;">Hi ${firstName},</p>
       <p style="color:#374151;font-size:14px;line-height:1.7;margin:0 0 16px;">A prospective client has selected you as their preferred WealthPlanrAI advisor. Please reach out within <strong>24 hours</strong>.</p>`

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:system-ui,sans-serif;">
<div style="max-width:600px;margin:28px auto;background:#fff;border-radius:14px;border:1px solid #e5e7eb;overflow:hidden;">
  ${emailHeader(isCompany ? 'New Assessment Submitted' : 'New Client Match — Action Required')}
  <div style="padding:28px 36px;">
    ${greeting}

    <h3 style="font-size:12px;font-weight:700;color:#6b7280;letter-spacing:2px;text-transform:uppercase;margin:20px 0 10px;">Client Contact</h3>
    <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
      <tr style="background:#f9fafb;"><td style="padding:9px 14px;font-size:12px;color:#6b7280;width:38%;">Name</td><td style="padding:9px 14px;font-size:13px;font-weight:600;color:#111827;">${clientName}</td></tr>
      <tr><td style="padding:9px 14px;font-size:12px;color:#6b7280;">Email</td><td style="padding:9px 14px;font-size:13px;">${clientEmail ? `<a href="mailto:${clientEmail}" style="color:#2563eb;">${clientEmail}</a>` : '—'}</td></tr>
      ${opts?.clientPhone ? `<tr style="background:#f9fafb;"><td style="padding:9px 14px;font-size:12px;color:#6b7280;">Phone</td><td style="padding:9px 14px;font-size:13px;color:#374151;">${opts.clientPhone}</td></tr>` : ''}
    </table>

    <h3 style="font-size:12px;font-weight:700;color:#6b7280;letter-spacing:2px;text-transform:uppercase;margin:20px 0 10px;">Financial Overview</h3>
    <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;">
      ${opts?.grossIncome ? `<tr style="background:#f9fafb;"><td style="padding:9px 14px;font-size:12px;color:#6b7280;width:38%;">Gross Income</td><td style="padding:9px 14px;font-size:13px;color:#374151;">${opts.grossIncome}</td></tr>` : ''}
      ${opts?.investableAssets ? `<tr><td style="padding:9px 14px;font-size:12px;color:#6b7280;">Investable Assets</td><td style="padding:9px 14px;font-size:13px;color:#374151;">${opts.investableAssets}</td></tr>` : ''}
      <tr style="background:#f9fafb;"><td style="padding:9px 14px;font-size:12px;color:#6b7280;">Risk Profile</td><td style="padding:9px 14px;font-size:13px;color:#374151;">${riskLabel}</td></tr>
      <tr><td style="padding:9px 14px;font-size:12px;color:#6b7280;">Overall Score</td><td style="padding:9px 14px;font-size:13px;font-weight:700;color:#2563eb;">${overallScore}/100</td></tr>
      <tr style="background:#f9fafb;"><td style="padding:9px 14px;font-size:12px;color:#6b7280;">Assessment Date</td><td style="padding:9px 14px;font-size:13px;color:#374151;">${date}</td></tr>
    </table>

    <h3 style="font-size:12px;font-weight:700;color:#6b7280;letter-spacing:2px;text-transform:uppercase;margin:20px 0 10px;">Three Pillars Scorecard</h3>
    <table style="width:100%;border-collapse:collapse;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin-top:4px;">
      <tr style="background:#f9fafb;">
        <th style="padding:8px 14px;text-align:left;font-size:11px;color:#6b7280;letter-spacing:1px;text-transform:uppercase;width:32%;">Pillar</th>
        <th style="padding:8px 14px;text-align:left;font-size:11px;color:#6b7280;letter-spacing:1px;text-transform:uppercase;">Score</th>
        <th style="padding:8px 14px;text-align:left;font-size:11px;color:#6b7280;letter-spacing:1px;text-transform:uppercase;">Status</th>
      </tr>
      <tr>
        <td style="padding:10px 14px;font-size:13px;color:#374151;font-weight:600;">🛡️ Protect</td>
        <td style="padding:10px 14px;font-size:13px;color:#374151;">${pillars.protect}/100</td>
        <td style="padding:10px 14px;font-size:12px;font-weight:700;color:${sp.color};">${sp.label}</td>
      </tr>
      <tr style="background:#f9fafb;">
        <td style="padding:10px 14px;font-size:13px;color:#374151;font-weight:600;">📈 Grow</td>
        <td style="padding:10px 14px;font-size:13px;color:#374151;">${pillars.grow}/100</td>
        <td style="padding:10px 14px;font-size:12px;font-weight:700;color:${sg.color};">${sg.label}</td>
      </tr>
      <tr>
        <td style="padding:10px 14px;font-size:13px;color:#374151;font-weight:600;">🏛️ Legacy</td>
        <td style="padding:10px 14px;font-size:13px;color:#374151;">${pillars.legacy}/100</td>
        <td style="padding:10px 14px;font-size:12px;font-weight:700;color:${sl.color};">${sl.label}</td>
      </tr>
    </table>

    ${gapItems ? `
    <h3 style="font-size:12px;font-weight:700;color:#6b7280;letter-spacing:2px;text-transform:uppercase;margin:20px 0 10px;">Top Gaps Identified</h3>
    <ul style="margin:0;padding:0 0 0 16px;">${gapItems}</ul>` : ''}

    ${biggestConcern ? `
    <h3 style="font-size:12px;font-weight:700;color:#6b7280;letter-spacing:2px;text-transform:uppercase;margin:20px 0 10px;">Client's Biggest Concern</h3>
    <blockquote style="border-left:4px solid #2563eb;margin:0;padding:12px 18px;background:#eff6ff;border-radius:0 8px 8px 0;font-style:italic;color:#1e40af;font-size:14px;">"${biggestConcern}"</blockquote>` : ''}

    ${priorityItems ? `
    <h3 style="font-size:12px;font-weight:700;color:#6b7280;letter-spacing:2px;text-transform:uppercase;margin:20px 0 10px;">Client's Top Priorities</h3>
    <ul style="margin:0;padding:0 0 0 16px;">${priorityItems}</ul>` : ''}

    ${!isCompany && clientEmail ? `
    <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:10px;padding:14px 18px;margin:20px 0;">
      <p style="margin:0;font-size:13px;color:#92400e;font-weight:600;">📧 Please contact ${clientName} at <a href="mailto:${clientEmail}" style="color:#2563eb;">${clientEmail}</a> within 24 hours.</p>
    </div>` : ''}

    <p style="color:#374151;font-size:13px;line-height:1.7;margin-top:12px;">The full advisor report with detailed analysis and product recommendations is attached as a PDF.</p>

    ${ctaButton(`${appUrl()}/assessment/view?id=${assessmentId}`, 'View Full Assessment')}
  </div>
  ${emailFooter(ADVISOR_DISCLAIMER)}
</div>
</body></html>`

  const advisorAttachments: object[] = [{
    content:     advisorPDFBuffer.toString('base64'),
    filename:    `${safe}_Advisor_Report_${date.replace(/, /g, '_').replace(/ /g, '_')}.pdf`,
    type:        'application/pdf',
    disposition: 'attachment',
  }]
  if (opts?.formExtractPDF) {
    advisorAttachments.push({
      content:     opts.formExtractPDF.toString('base64'),
      filename:    `${safe}_Form_Extract.pdf`,
      type:        'application/pdf',
      disposition: 'attachment',
    })
  }

  console.log('[sendgrid] sending advisor email to:', advisorEmail, '| subject:', subject)
  await sgMail.send({
    from: from(),
    to:   advisorEmail,
    subject,
    html,
    attachments: advisorAttachments,
  })
}

// ── Legacy export: keep old function signature working ────────────────────────

export async function sendAdvisorReport(
  params: {
    assessmentId: string
    clientName: string
    clientEmail: string | null
    overallScore: number
    riskProfile: string
    pillarScores: PillarScores
    topRecommendations: string[]
    scoreResults: ScoreResults | null
  },
  pdfBuffer: Buffer,
): Promise<void> {
  await sendInfoEmail(
    params.clientName,
    params.clientEmail,
    params.overallScore,
    params.riskProfile,
    params.pillarScores,
    params.topRecommendations,
    params.assessmentId,
    pdfBuffer,
  )
}
