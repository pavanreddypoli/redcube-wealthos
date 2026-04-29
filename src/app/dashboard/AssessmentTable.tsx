'use client'
import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search, Download, Eye, StickyNote, AlertTriangle, CheckCircle2,
  AlertCircle, X, Users, TrendingUp, ShieldAlert, Clock, ClipboardList,
  Link as LinkIcon,
} from 'lucide-react'
import type { AssessmentRow } from './page'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Note {
  id: string
  title: string | null
  body: string
  created_at: string
  tags: string[] | null
}

interface PanelState {
  assessmentId: string
  clientName: string
}

// ── Static lookup maps ────────────────────────────────────────────────────────

const RISK_LABEL: Record<string, string> = {
  conservative:    'Conservative',
  moderate:        'Moderate',
  aggressive:      'Aggressive',
  very_aggressive: 'Very Aggressive',
}

const RISK_BADGE: Record<string, string> = {
  conservative:    'bg-blue-100 text-blue-700',
  moderate:        'bg-amber-100 text-amber-700',
  aggressive:      'bg-orange-100 text-orange-700',
  very_aggressive: 'bg-rose-100 text-rose-700',
}

const STATUS_CONFIG: Record<string, { label: string; cls: string }> = {
  submitted: { label: 'Submitted', cls: 'bg-blue-100 text-blue-700' },
  reviewed:  { label: 'Reviewed',  cls: 'bg-emerald-100 text-emerald-700' },
  actioned:  { label: 'Actioned',  cls: 'bg-slate-100 text-slate-600' },
}

const AVATAR_COLORS = [
  'bg-violet-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500',
  'bg-rose-500',   'bg-indigo-500', 'bg-teal-500',  'bg-orange-500',
]

// ── Pure helpers ──────────────────────────────────────────────────────────────

function getInitials(name: string | null): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return parts.length === 1
    ? (parts[0][0] ?? '?').toUpperCase()
    : ((parts[0][0] ?? '') + (parts[parts.length - 1][0] ?? '')).toUpperCase()
}

function avatarColor(name: string | null): string {
  if (!name) return 'bg-slate-500'
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function scoreClasses(score: number) {
  if (score >= 75) return { bg: 'bg-emerald-100', text: 'text-emerald-700' }
  if (score >= 50) return { bg: 'bg-amber-100',   text: 'text-amber-700' }
  return                 { bg: 'bg-rose-100',     text: 'text-rose-700' }
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, icon: Icon, iconCls,
}: {
  label: string; value: string | number; sub?: string
  icon: React.ElementType; iconCls: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-5 py-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconCls}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900 leading-tight">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

function FlagCell({ count }: { count: number }) {
  if (count === 0)
    return <span className="flex items-center gap-1 text-emerald-600 text-xs font-medium"><CheckCircle2 className="w-3.5 h-3.5" />None</span>
  if (count <= 2)
    return <span className="flex items-center gap-1 text-amber-600 text-xs font-medium"><AlertCircle className="w-3.5 h-3.5" />{count}</span>
  return <span className="flex items-center gap-1 text-rose-600 text-xs font-medium"><AlertTriangle className="w-3.5 h-3.5" />{count}</span>
}

function OpportunityCell({ score }: { score: number }) {
  const opp  = 100 - score
  const label = opp >= 50 ? 'High' : opp >= 25 ? 'Medium' : 'Low'
  const bar   = opp >= 50 ? 'bg-rose-500' : opp >= 25 ? 'bg-amber-400' : 'bg-gray-300'
  const text  = opp >= 50 ? 'text-rose-600' : opp >= 25 ? 'text-amber-600' : 'text-gray-400'
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${bar} rounded-full`} style={{ width: `${opp}%` }} />
      </div>
      <span className={`text-[11px] font-semibold ${text} w-10 flex-shrink-0`}>{label}</span>
    </div>
  )
}

// ── Notes panel ───────────────────────────────────────────────────────────────

function NotesPanel({
  panel, notes, loading, saving,
  noteTitle, noteBody, noteTags,
  onTitleChange, onBodyChange, onTagsChange,
  onSave, onClose,
}: {
  panel: PanelState
  notes: Note[]
  loading: boolean
  saving: boolean
  noteTitle: string
  noteBody: string
  noteTags: string
  onTitleChange: (v: string) => void
  onBodyChange: (v: string) => void
  onTagsChange: (v: string) => void
  onSave: () => void
  onClose: () => void
}) {
  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-slate-900/40 z-40 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 right-0 h-full w-[380px] bg-white shadow-2xl z-50 flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Advisor Notes</h2>
            <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[280px]">{panel.clientName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notes list */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <svg className="w-6 h-6 animate-spin text-gray-300" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
            </div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
              <StickyNote className="w-8 h-8 text-gray-200" />
              <p className="text-sm text-gray-400">No notes yet. Add your first note below.</p>
            </div>
          ) : (
            notes.map(note => (
              <div key={note.id} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                {note.title && (
                  <p className="text-sm font-semibold text-gray-800 mb-1">{note.title}</p>
                )}
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{note.body}</p>
                <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
                  <p className="text-[11px] text-gray-400">{shortDate(note.created_at)}</p>
                  {note.tags && note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {note.tags.map(tag => (
                        <span key={tag} className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add note form */}
        <div className="border-t border-gray-100 px-5 py-4 space-y-3 flex-shrink-0 bg-gray-50">
          <input
            type="text"
            value={noteTitle}
            onChange={e => onTitleChange(e.target.value)}
            placeholder="Note title..."
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white outline-none focus:border-slate-400 transition-colors placeholder:text-gray-400"
          />
          <textarea
            value={noteBody}
            onChange={e => onBodyChange(e.target.value)}
            placeholder="Write your note..."
            rows={4}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white outline-none focus:border-slate-400 transition-colors resize-none placeholder:text-gray-400 leading-relaxed"
          />
          <input
            type="text"
            value={noteTags}
            onChange={e => onTagsChange(e.target.value)}
            placeholder="Tags: retirement, urgent..."
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white outline-none focus:border-slate-400 transition-colors placeholder:text-gray-400"
          />
          <button
            onClick={onSave}
            disabled={saving || !noteBody.trim()}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {saving ? 'Saving…' : 'Save Note'}
          </button>
        </div>

      </div>
    </>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function AssessmentTable({ initialAssessments }: { initialAssessments: AssessmentRow[] }) {
  const router = useRouter()

  // Search
  const [search, setSearch] = useState('')

  // Notes panel state
  const [panel, setPanel] = useState<PanelState | null>(null)
  const [notes, setNotes] = useState<Note[]>([])
  const [notesLoading, setNotesLoading] = useState(false)
  const [noteTitle, setNoteTitle] = useState('')
  const [noteBody, setNoteBody]   = useState('')
  const [noteTags, setNoteTags]   = useState('')
  const [saving, setSaving]       = useState(false)

  // Derived
  const filtered = useMemo(() => {
    if (!search.trim()) return initialAssessments
    const q = search.toLowerCase()
    return initialAssessments.filter(a =>
      (a.full_name ?? '').toLowerCase().includes(q) ||
      (a.email ?? '').toLowerCase().includes(q),
    )
  }, [initialAssessments, search])

  const stats = useMemo(() => {
    const total    = initialAssessments.length
    const avgScore = total
      ? Math.round(initialAssessments.reduce((s, a) => s + (a.score ?? 0), 0) / total)
      : 0
    const highRisk = initialAssessments.filter(a => (a.score ?? 0) < 50).length
    const pending  = initialAssessments.filter(a => a.status === 'submitted').length
    return { total, avgScore, highRisk, pending }
  }, [initialAssessments])

  // Notes panel actions
  const openPanel = useCallback(async (row: AssessmentRow, e: React.MouseEvent) => {
    e.stopPropagation()
    const state = { assessmentId: row.id, clientName: row.full_name ?? 'Client' }
    setPanel(state)
    setNotes([])
    setNoteTitle(''); setNoteBody(''); setNoteTags('')
    setNotesLoading(true)
    try {
      const res  = await fetch(`/api/notes?assessment_id=${row.id}`)
      const data = await res.json()
      setNotes(Array.isArray(data) ? data : [])
    } catch { setNotes([]) }
    finally   { setNotesLoading(false) }
  }, [])

  const closePanel = useCallback(() => {
    setPanel(null)
    setNotes([])
    setNoteTitle(''); setNoteBody(''); setNoteTags('')
  }, [])

  const saveNote = useCallback(async () => {
    if (!panel || !noteBody.trim()) return
    setSaving(true)
    try {
      const tags = noteTags.split(',').map(t => t.trim()).filter(Boolean)
      const res  = await fetch('/api/notes', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          assessment_id: panel.assessmentId,
          title: noteTitle.trim() || null,
          body:  noteBody,
          tags,
        }),
      })
      if (res.ok) {
        const refreshRes  = await fetch(`/api/notes?assessment_id=${panel.assessmentId}`)
        const refreshData = await refreshRes.json()
        setNotes(Array.isArray(refreshData) ? refreshData : [])
        setNoteTitle(''); setNoteBody(''); setNoteTags('')
      }
    } finally { setSaving(false) }
  }, [panel, noteTitle, noteBody, noteTags])

  function copyAssessmentLink() {
    navigator.clipboard.writeText(`${window.location.origin}/assessment`)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Topbar ───────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-gray-200 px-6 h-14 flex items-center justify-between flex-shrink-0 sticky top-0 z-10">
        <h1 className="text-base font-semibold text-gray-900">Client Assessments</h1>
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search clients…"
              className="pl-8 pr-3 h-8 w-52 text-sm border border-gray-200 rounded-lg outline-none focus:border-slate-400 transition-colors bg-gray-50 placeholder:text-gray-400"
            />
          </div>
          <button className="inline-flex items-center gap-1.5 px-3 h-8 rounded-lg border border-gray-200 bg-white text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
        </div>
      </header>

      <div className="p-6 space-y-5">

        {/* ── Stats row ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Assessments"
            value={stats.total}
            sub="all time"
            icon={ClipboardList}
            iconCls="bg-slate-100 text-slate-500"
          />
          <StatCard
            label="Avg Health Score"
            value={stats.total ? stats.avgScore : '—'}
            sub="out of 100"
            icon={TrendingUp}
            iconCls="bg-emerald-50 text-emerald-500"
          />
          <StatCard
            label="High Risk Clients"
            value={stats.highRisk}
            sub="score below 50"
            icon={ShieldAlert}
            iconCls="bg-rose-50 text-rose-500"
          />
          <StatCard
            label="Pending Review"
            value={stats.pending}
            sub="status: submitted"
            icon={Clock}
            iconCls="bg-amber-50 text-amber-500"
          />
        </div>

        {/* ── Table ─────────────────────────────────────────────────── */}
        {initialAssessments.length === 0 ? (
          /* Empty state */
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center">
              <Users className="w-7 h-7 text-slate-300" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-gray-700">No assessments yet</p>
              <p className="text-sm text-gray-400 mt-1">Share the link to start collecting client assessments.</p>
            </div>
            <button
              onClick={copyAssessmentLink}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors"
            >
              <LinkIcon className="w-3.5 h-3.5" />
              Share Assessment Link
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Client', 'Health Score', 'Risk Profile', 'Risk Flags', 'Opportunity', 'Status', 'Date', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-12 text-sm text-gray-400">
                        No clients match &ldquo;{search}&rdquo;
                      </td>
                    </tr>
                  ) : (
                    filtered.map((row, i) => {
                      const sc        = scoreClasses(row.score ?? 0)
                      const flagCount = row.score_results?.risk_flags?.length ?? 0
                      const riskCls   = RISK_BADGE[row.risk_profile] ?? 'bg-gray-100 text-gray-600'
                      const riskLbl   = RISK_LABEL[row.risk_profile] ?? row.risk_profile
                      const statusCfg = STATUS_CONFIG[row.status ?? ''] ?? { label: row.status ?? '—', cls: 'bg-gray-100 text-gray-500' }
                      const initials  = getInitials(row.full_name)
                      const avCls     = avatarColor(row.full_name)

                      return (
                        <tr
                          key={row.id}
                          onClick={() => router.push(`/results?id=${row.id}`)}
                          className={`border-b border-gray-50 cursor-pointer hover:bg-blue-50 transition-colors ${i % 2 === 1 ? 'bg-slate-50/50' : 'bg-white'}`}
                        >
                          {/* CLIENT */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-8 h-8 rounded-full ${avCls} flex items-center justify-center text-xs font-bold text-white flex-shrink-0`}>
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 truncate max-w-[140px]">
                                  {row.full_name ?? '—'}
                                </p>
                                <p className="text-[11px] text-gray-400 truncate max-w-[140px]">
                                  {row.email ?? ''}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* HEALTH SCORE */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${sc.bg} ${sc.text}`}>
                              {row.score ?? 0}/100
                            </span>
                          </td>

                          {/* RISK PROFILE */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold ${riskCls}`}>
                              {riskLbl}
                            </span>
                          </td>

                          {/* RISK FLAGS */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <FlagCell count={flagCount} />
                          </td>

                          {/* OPPORTUNITY */}
                          <td className="px-4 py-3">
                            <OpportunityCell score={row.score ?? 0} />
                          </td>

                          {/* STATUS */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold ${statusCfg.cls}`}>
                              {statusCfg.label}
                            </span>
                          </td>

                          {/* DATE */}
                          <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-400 font-medium">
                            {shortDate(row.created_at)}
                          </td>

                          {/* ACTIONS */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                              <button
                                onClick={() => router.push(`/results?id=${row.id}`)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-slate-700 hover:bg-gray-100 transition-colors"
                                title="View results"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={e => openPanel(row, e)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-slate-700 hover:bg-gray-100 transition-colors relative"
                                title="Advisor notes"
                              >
                                <StickyNote className="w-4 h-4" />
                                {row.note_count > 0 && (
                                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                                    {row.note_count > 9 ? '9+' : row.note_count}
                                  </span>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table footer */}
            {filtered.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
                <p className="text-xs text-gray-400">
                  Showing {filtered.length} of {initialAssessments.length} assessment{initialAssessments.length !== 1 ? 's' : ''}
                  {search && ` for "${search}"`}
                </p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── Notes slide-in panel ─────────────────────────────────────── */}
      {panel && (
        <NotesPanel
          panel={panel}
          notes={notes}
          loading={notesLoading}
          saving={saving}
          noteTitle={noteTitle}
          noteBody={noteBody}
          noteTags={noteTags}
          onTitleChange={setNoteTitle}
          onBodyChange={setNoteBody}
          onTagsChange={setNoteTags}
          onSave={saveNote}
          onClose={closePanel}
        />
      )}
    </>
  )
}
