'use client'
import { useState, useEffect } from 'react'

interface Advisor {
  id: string
  full_name: string | null
  email: string | null
  advisor_type: string | null
  advisor_specialty: string | null
  phone: string | null
  bio: string | null
}

export function AdvisorSelector({ assessmentId }: { assessmentId: string }) {
  const [advisors, setAdvisors] = useState<Advisor[]>([])
  const [selected, setSelected] = useState<string>('none')
  const [loading,  setLoading]  = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [error,    setError]    = useState('')

  useEffect(() => {
    fetch('/api/advisors')
      .then(r => r.json())
      .then((data: unknown) => Array.isArray(data) ? setAdvisors(data as Advisor[]) : setAdvisors([]))
      .catch(() => setAdvisors([]))
  }, [])

  async function handleConnect() {
    setLoading(true)
    setError('')
    try {
      const advisorId = selected === 'none' ? null : selected
      const res = await fetch(`/api/assessment/${assessmentId}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ selected_advisor_id: advisorId }),
      })
      if (!res.ok) throw new Error('Failed to save')
      setSaved(true)
    } catch {
      setError('Something went wrong — please try again')
    } finally {
      setLoading(false)
    }
  }

  const selectedAdvisor = advisors.find(a => a.id === selected)

  if (saved) {
    const msg = selectedAdvisor
      ? `${selectedAdvisor.full_name ?? 'Your advisor'} has been notified and will contact you within 24 hours.`
      : 'Our team will match you with the perfect advisor within 1 business day.'
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
        <p className="text-green-800 font-semibold text-sm">✓ {msg}</p>
      </div>
    )
  }

  function advisorLabel(a: Advisor): string {
    const typeLabel = a.advisor_type === 'planner' ? 'Financial Planner' : 'Financial Advisor'
    const parts = [a.full_name ?? 'Advisor', typeLabel]
    if (a.advisor_specialty) parts.push(a.advisor_specialty)
    return parts.join(' · ')
  }

  return (
    <div className="bg-white border-2 border-brand-200 rounded-2xl p-6 shadow-sm">
      <h3 className="font-heading text-base font-bold text-gray-900 mb-1">Choose Your Advisor</h3>
      <p className="text-sm text-gray-500 mb-4">Select a preferred advisor or let us assign the best match for you.</p>

      <select
        value={selected}
        onChange={e => setSelected(e.target.value)}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 bg-white focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 mb-3"
      >
        <option value="none">No preference — assign me to the next available advisor</option>
        {advisors.map(a => (
          <option key={a.id} value={a.id}>
            {advisorLabel(a)}
          </option>
        ))}
      </select>

      {/* Bio preview for selected advisor */}
      {selectedAdvisor?.bio && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-4">
          <p className="text-xs text-blue-800 leading-relaxed">{selectedAdvisor.bio}</p>
          {selectedAdvisor.phone && (
            <p className="text-xs text-blue-500 mt-1">{selectedAdvisor.phone}</p>
          )}
        </div>
      )}

      <button
        onClick={handleConnect}
        disabled={loading}
        className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold text-sm rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        {loading
          ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Connecting…</>
          : 'Confirm Selection'
        }
      </button>

      {error && <p className="text-red-500 text-xs mt-2 text-center">{error}</p>}
    </div>
  )
}
