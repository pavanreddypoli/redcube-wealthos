import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AssessmentTable } from './AssessmentTable'
import type { ScoreResults } from '@/lib/scoring'

// ── Shared types (consumed by AssessmentTable) ────────────────────────────────

export interface AssessmentRow {
  id: string
  full_name: string | null
  email: string | null
  created_at: string
  score: number
  risk_profile: string
  score_results: ScoreResults | null
  status: string | null
  assigned_advisor_id: string | null
  note_count: number
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch assessments + note counts in parallel
  const [{ data: assessments }, { data: noteRows }] = await Promise.all([
    supabase
      .from('assessments')
      .select('id, full_name, email, created_at, score, risk_profile, score_results, status, assigned_advisor_id')
      .order('created_at', { ascending: false }),
    supabase
      .from('advisor_notes')
      .select('assessment_id'),
  ])

  // Build per-assessment note count map
  const noteCounts: Record<string, number> = {}
  for (const row of noteRows ?? []) {
    if (row.assessment_id)
      noteCounts[row.assessment_id] = (noteCounts[row.assessment_id] ?? 0) + 1
  }

  const rows: AssessmentRow[] = (assessments ?? []).map(a => ({
    ...a,
    note_count: noteCounts[a.id] ?? 0,
  }))

  return <AssessmentTable initialAssessments={rows} />
}
