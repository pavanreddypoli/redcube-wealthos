'use client'
import { useState, useEffect, useCallback } from 'react'
import { Plus, Tag, Users, DollarSign, TrendingUp, Check, X, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Advisor { id: string; full_name: string | null; email: string | null }

interface DiscountCode {
  id: string
  code: string
  description: string | null
  discount_type: string
  discount_value: number
  commission_percentage: number
  referrer: Advisor | null
  max_uses: number | null
  current_uses: number
  expires_at: string | null
  is_active: boolean
  created_at: string
}

interface CommissionPayment {
  id: string
  referral_id: string
  period_month: number
  period_year: number
  referred_payment: number
  commission_rate: number
  commission_amount: number
  status: string
  paid_at: string | null
  payment_method: string | null
  payment_reference: string | null
}

interface Referral {
  id: string
  discount_code: string | null
  original_price: number
  discounted_price: number
  commission_percentage: number
  plan: string
  status: string
  total_revenue_generated: number
  total_commission_earned: number
  total_commission_paid: number
  created_at: string
  referrer: Advisor | null
  referred: Advisor | null
  commissions: CommissionPayment[]
}

type Tab = 'codes' | 'referrals' | 'commissions'

// ── Helpers ───────────────────────────────────────────────────────────────────

const fmt$ = (v: number) => `$${v.toFixed(2)}`

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

// ── Main Component ────────────────────────────────────────────────────────────

export function AdminClient() {
  const [tab, setTab] = useState<Tab>('codes')
  const [codes, setCodes] = useState<DiscountCode[]>([])
  const [referrals, setReferrals] = useState<Referral[]>([])
  const [advisors, setAdvisors] = useState<Advisor[]>([])
  const [loadingCodes, setLoadingCodes] = useState(true)
  const [error, setError] = useState('')

  const fetchCodes = useCallback(async () => {
    try {
      setLoadingCodes(true)
      const res = await fetch('/api/admin/discount-codes', { credentials: 'include' })
      console.log('[admin] fetch codes status:', res.status)
      if (!res.ok) {
        console.error('[admin] fetch codes failed:', await res.text())
        return
      }
      const data = await res.json()
      console.log('[admin] codes loaded:', data?.length)
      setCodes(Array.isArray(data) ? data : [])
    } catch (e: any) {
      console.error('[admin] fetchCodes error:', e.message)
    } finally {
      setLoadingCodes(false)
    }
  }, [])

  const fetchReferrals = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/referrals', { credentials: 'include' })
      const data = await res.json()
      setReferrals(Array.isArray(data) ? data : [])
    } catch (e: any) {
      console.error('[admin] fetchReferrals error:', e.message)
    }
  }, [])

  const fetchAdvisors = useCallback(async () => {
    try {
      const res = await fetch('/api/advisors', { credentials: 'include' })
      const data = await res.json()
      setAdvisors(Array.isArray(data) ? data : [])
    } catch (e: any) {
      console.error('[admin] fetchAdvisors error:', e.message)
    }
  }, [])

  useEffect(() => {
    fetchCodes()
    fetchReferrals()
    fetchAdvisors()
  }, [fetchCodes, fetchReferrals, fetchAdvisors])

  const allCommissions = referrals.flatMap(r => r.commissions ?? [])
  const pendingCommissions = allCommissions.filter(c => c.status === 'pending')
  const pendingTotal = pendingCommissions.reduce((s, c) => s + c.commission_amount, 0)

  const now = new Date()
  const paidThisMonth = allCommissions
    .filter(c => c.status === 'paid' && c.period_month === now.getMonth() + 1 && c.period_year === now.getFullYear())
    .reduce((s, c) => s + c.commission_amount, 0)

  const activeCodes = codes.filter(c => c.is_active).length
  const activeReferrals = referrals.filter(r => r.status === 'active').length

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'codes',       label: 'Discount Codes', icon: <Tag className="w-4 h-4" /> },
    { key: 'referrals',   label: 'Referrals',      icon: <Users className="w-4 h-4" /> },
    { key: 'commissions', label: 'Commissions',    icon: <DollarSign className="w-4 h-4" /> },
  ]

  return (
    <div>
      {/* Sticky page header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 h-14 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-gray-900">Admin Panel</h1>
          <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-xs font-semibold rounded-full">
            Admin Only
          </span>
        </div>
        <a
          href="/dashboard"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          ← Dashboard
        </a>
      </div>

      {/* Breadcrumb */}
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs text-gray-500 flex items-center gap-2">
        <a href="/dashboard" className="hover:text-blue-600 transition-colors">Dashboard</a>
        <span>→</span>
        <span className="text-gray-900 font-medium">Admin Panel</span>
      </div>

      <div className="p-4 sm:p-6">
        <div className="max-w-6xl mx-auto">

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-2 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Pending Commissions', value: fmt$(pendingTotal), icon: <DollarSign className="w-5 h-5 text-amber-500" />, bg: 'bg-amber-50' },
              { label: 'Paid This Month',     value: fmt$(paidThisMonth), icon: <Check className="w-5 h-5 text-green-500" />,  bg: 'bg-green-50' },
              { label: 'Active Referrals',    value: String(activeReferrals), icon: <Users className="w-5 h-5 text-brand-500" />, bg: 'bg-blue-50' },
              { label: 'Active Codes',        value: String(activeCodes), icon: <Tag className="w-5 h-5 text-purple-500" />,    bg: 'bg-purple-50' },
            ].map(stat => (
              <div key={stat.label} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
                <div className={`w-9 h-9 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}>
                  {stat.icon}
                </div>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 mb-6 w-fit">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  tab === t.key
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {t.icon}
                {t.label}
                {t.key === 'commissions' && pendingCommissions.length > 0 && (
                  <span className="bg-amber-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {pendingCommissions.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <>
            {tab === 'codes'       && <CodesTab codes={codes} advisors={advisors} onRefresh={fetchCodes} loadingCodes={loadingCodes} />}
            {tab === 'referrals'   && <ReferralsTab referrals={referrals} />}
            {tab === 'commissions' && <CommissionsTab referrals={referrals} onRefresh={fetchReferrals} />}
          </>

        </div>
      </div>
    </div>
  )
}

// ── TAB 1: Discount Codes ─────────────────────────────────────────────────────

function CodesTab({
  codes, advisors, onRefresh, loadingCodes,
}: {
  codes: DiscountCode[]
  advisors: Advisor[]
  onRefresh: () => Promise<void>
  loadingCodes: boolean
}) {
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [form, setForm] = useState({
    code: '', description: '', discount_type: 'percentage', discount_value: '',
    referrer_id: '', commission_percentage: '0', max_uses: '', expires_at: '',
  })

  function set(k: string, v: string) { setForm(f => ({ ...f, [k]: v })) }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      const payload = {
        code: form.code.toUpperCase().trim(),
        description: form.description || null,
        discount_type: form.discount_type,
        discount_value: parseFloat(String(form.discount_value)) || 0,
        referrer_id: form.referrer_id || null,
        commission_percentage: parseFloat(String(form.commission_percentage)) || 0,
        max_uses: form.max_uses ? parseInt(form.max_uses) : null,
        expires_at: form.expires_at || null,
      }
      console.log('Creating code with data:', payload)
      const res = await fetch('/api/admin/discount-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      console.log('API response status:', res.status)
      const data = await res.json()
      console.log('API response data:', data)
      if (!res.ok) {
        setFormError(data.error || 'Failed to create code')
        return
      }
      await onRefresh()
      setSuccessMsg(`Discount code ${payload.code} created successfully!`)
      setTimeout(() => setSuccessMsg(''), 3000)
      setShowForm(false)
      setForm({ code: '', description: '', discount_type: 'percentage', discount_value: '', referrer_id: '', commission_percentage: '0', max_uses: '', expires_at: '' })
    } catch (e: any) {
      setFormError(e.message || 'Failed to create code')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(id: string, is_active: boolean) {
    await fetch('/api/admin/discount-codes', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id, is_active: !is_active }),
    })
    onRefresh()
  }

  return (
    <div className="space-y-4">
      {successMsg && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
          <p className="text-green-700 text-sm font-medium">✓ {successMsg}</p>
          <button onClick={() => setSuccessMsg('')} className="text-green-500 hover:text-green-700 text-sm font-bold">✕</button>
        </div>
      )}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-gray-900">Discount Codes ({codes.length})</h2>
        <button
          onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Code
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-brand-200 p-6 space-y-4 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-2">Create Discount Code</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">Code *</label>
              <input required value={form.code} onChange={e => set('code', e.target.value.toUpperCase())}
                placeholder="e.g. JOHN50" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100 uppercase" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">Description</label>
              <input value={form.description} onChange={e => set('description', e.target.value)}
                placeholder="e.g. John Smith referral code" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">Discount Type *</label>
              <div className="flex gap-2">
                {['percentage', 'fixed'].map(t => (
                  <label key={t} className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border cursor-pointer text-sm font-medium transition-colors ${form.discount_type === t ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    <input type="radio" name="discount_type" value={t} checked={form.discount_type === t} onChange={() => set('discount_type', t)} className="sr-only" />
                    {t === 'percentage' ? '% Off' : '$ Fixed'}
                  </label>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">Discount Value * {form.discount_type === 'percentage' ? '(%)' : '($)'}</label>
              <input required type="number" min="0" max={form.discount_type === 'percentage' ? '100' : undefined} step="0.01"
                value={form.discount_value} onChange={e => set('discount_value', e.target.value)}
                placeholder={form.discount_type === 'percentage' ? '20' : '50'}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">Referrer (Advisor)</label>
              <select value={form.referrer_id} onChange={e => set('referrer_id', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100">
                <option value="">— None —</option>
                {advisors.map(a => (
                  <option key={a.id} value={a.id}>{a.full_name ?? a.email}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">Commission % (paid to referrer)</label>
              <input type="number" min="0" max="100" step="0.01"
                value={form.commission_percentage} onChange={e => set('commission_percentage', e.target.value)}
                placeholder="15" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">Max Uses (blank = unlimited)</label>
              <input type="number" min="1" value={form.max_uses} onChange={e => set('max_uses', e.target.value)}
                placeholder="Unlimited" className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-600">Expires At (blank = never)</label>
              <input type="date" value={form.expires_at} onChange={e => set('expires_at', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100" />
            </div>
          </div>

          {formError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
              {formError}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={saving}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors">
              {saving ? 'Creating…' : 'Create Code'}
            </button>
            <button type="button" onClick={() => setShowForm(false)}
              className="px-5 py-2.5 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loadingCodes ? (
          <div className="flex items-center justify-center py-12">
            <svg className="w-5 h-5 animate-spin text-blue-500" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
            </svg>
            <span className="ml-2 text-sm text-gray-400">Loading codes...</span>
          </div>
        ) : codes.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-400">
            No discount codes yet. Click &quot;+ New Code&quot; to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">Code</th>
                  <th className="px-4 py-3 text-left">Discount</th>
                  <th className="px-4 py-3 text-left">Commission</th>
                  <th className="px-4 py-3 text-left">Referrer</th>
                  <th className="px-4 py-3 text-left">Uses</th>
                  <th className="px-4 py-3 text-left">Expires</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {codes.map(code => (
                  <tr key={code.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-gray-900">{code.code}</span>
                      {code.description && <p className="text-xs text-gray-400 mt-0.5">{code.description}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-semibold text-brand-600">
                        {code.discount_type === 'percentage' ? `${code.discount_value}%` : fmt$(code.discount_value)}
                      </span>
                      <span className="text-gray-400 text-xs ml-1">off</span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{code.commission_percentage}%</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{code.referrer?.full_name ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {code.current_uses}{code.max_uses ? `/${code.max_uses}` : ''}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {code.expires_at ? new Date(code.expires_at).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${code.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {code.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(code.id, code.is_active)}
                        className={`text-xs font-medium px-2.5 py-1 rounded-lg transition-colors ${code.is_active ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
                      >
                        {code.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ── TAB 2: Referrals ──────────────────────────────────────────────────────────

function ReferralsTab({ referrals }: { referrals: Referral[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      <h2 className="text-base font-semibold text-gray-900">Referrals ({referrals.length})</h2>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {referrals.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-12">No referrals yet.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {referrals.map(r => (
              <div key={r.id}>
                <div
                  className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                >
                  <button className="text-gray-400 flex-shrink-0">
                    {expanded === r.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  <div className="min-w-0 flex-1 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-sm">
                    <div className="col-span-1">
                      <p className="text-xs text-gray-400">Referrer</p>
                      <p className="font-medium text-gray-900 truncate">{r.referrer?.full_name ?? '—'}</p>
                    </div>
                    <div className="col-span-1">
                      <p className="text-xs text-gray-400">Referred</p>
                      <p className="font-medium text-gray-900 truncate">{r.referred?.full_name ?? '—'}</p>
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-xs text-gray-400">Code</p>
                      <p className="font-mono text-xs text-gray-700">{r.discount_code ?? '—'}</p>
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-xs text-gray-400">Plan</p>
                      <p className="capitalize text-gray-700">{r.plan}</p>
                    </div>
                    <div className="hidden lg:block">
                      <p className="text-xs text-gray-400">Pays/mo</p>
                      <p className="font-semibold text-brand-600">{fmt$(r.discounted_price)}</p>
                    </div>
                    <div className="hidden lg:block">
                      <p className="text-xs text-gray-400">Commission %</p>
                      <p className="text-gray-700">{r.commission_percentage}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Total Earned</p>
                      <p className="font-semibold text-green-600">{fmt$(r.total_commission_earned)}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${r.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {r.status}
                  </span>
                </div>

                {expanded === r.id && (
                  <div className="px-12 py-4 bg-gray-50 border-t border-gray-100">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 text-sm">
                      <div><p className="text-xs text-gray-400">Full Price</p><p className="font-medium">{fmt$(r.original_price)}</p></div>
                      <div><p className="text-xs text-gray-400">Discounted</p><p className="font-medium text-brand-600">{fmt$(r.discounted_price)}</p></div>
                      <div><p className="text-xs text-gray-400">Total Revenue</p><p className="font-medium">{fmt$(r.total_revenue_generated)}</p></div>
                      <div><p className="text-xs text-gray-400">Total Paid Out</p><p className="font-medium text-green-600">{fmt$(r.total_commission_paid)}</p></div>
                    </div>
                    {r.commissions && r.commissions.length > 0 ? (
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-gray-400 font-semibold uppercase tracking-wide">
                            <th className="text-left pb-2">Period</th>
                            <th className="text-left pb-2">Payment</th>
                            <th className="text-left pb-2">Commission</th>
                            <th className="text-left pb-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {r.commissions.map(c => (
                            <tr key={c.id}>
                              <td className="py-1.5">{MONTHS[c.period_month - 1]} {c.period_year}</td>
                              <td className="py-1.5">{fmt$(c.referred_payment)}</td>
                              <td className="py-1.5 font-semibold text-green-700">{fmt$(c.commission_amount)}</td>
                              <td className="py-1.5">
                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${c.status === 'paid' ? 'bg-green-100 text-green-700' : c.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                                  {c.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-xs text-gray-400">No commission payments recorded yet.</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── TAB 3: Commissions ────────────────────────────────────────────────────────

function CommissionsTab({ referrals, onRefresh }: { referrals: Referral[]; onRefresh: () => Promise<void> }) {
  const [markingId, setMarkingId] = useState<string | null>(null)
  const [payForm, setPayForm] = useState<{ method: string; reference: string; notes: string }>({ method: 'zelle', reference: '', notes: '' })
  const [saving, setSaving] = useState(false)

  const allCommissions = referrals.flatMap(r =>
    (r.commissions ?? []).map(c => ({ ...c, referrer: r.referrer, referred: r.referred }))
  )

  const pending = allCommissions.filter(c => c.status === 'pending')
  const recent  = allCommissions.filter(c => c.status !== 'pending').slice(0, 20)

  async function handleMarkPaid(id: string) {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/commissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id, status: 'paid', payment_method: payForm.method, payment_reference: payForm.reference || null, notes: payForm.notes || null }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      setMarkingId(null)
      setPayForm({ method: 'zelle', reference: '', notes: '' })
      onRefresh()
    } catch (e: any) {
      alert(e.message)
    } finally {
      setSaving(false)
    }
  }

  type CommissionWithParties = CommissionPayment & { referrer: Advisor | null; referred: Advisor | null }

  function CommissionRow({ c, showActions }: { c: CommissionWithParties; showActions: boolean }) {
    return (
      <div className="px-4 py-3 hover:bg-gray-50">
        <div className="flex items-center gap-4 text-sm">
          <div className="min-w-0 flex-1 grid grid-cols-2 sm:grid-cols-5 gap-2">
            <div><p className="text-xs text-gray-400">Period</p><p className="font-medium">{MONTHS[c.period_month - 1]} {c.period_year}</p></div>
            <div><p className="text-xs text-gray-400">Referrer</p><p className="truncate text-gray-900">{c.referrer?.full_name ?? '—'}</p></div>
            <div className="hidden sm:block"><p className="text-xs text-gray-400">Referred</p><p className="truncate text-gray-600">{c.referred?.full_name ?? '—'}</p></div>
            <div className="hidden sm:block"><p className="text-xs text-gray-400">Their Payment</p><p>{fmt$(c.referred_payment)}</p></div>
            <div>
              <p className="text-xs text-gray-400">Commission Due</p>
              <p className="font-bold text-green-700">{fmt$(c.commission_amount)}</p>
            </div>
          </div>
          <div className="flex-shrink-0 flex items-center gap-2">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${c.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {c.status}
            </span>
            {showActions && c.status === 'pending' && (
              <button
                onClick={() => setMarkingId(c.id)}
                className="text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 px-3 py-1 rounded-lg transition-colors"
              >
                Mark Paid
              </button>
            )}
          </div>
        </div>

        {markingId === c.id && (
          <div className="mt-3 bg-white border border-brand-200 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-900">Record Payment — {fmt$(c.commission_amount)}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">Payment Method</label>
                <select value={payForm.method} onChange={e => setPayForm(f => ({ ...f, method: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:border-brand-400">
                  {['zelle', 'paypal', 'bank_transfer', 'check', 'other'].map(m => (
                    <option key={m} value={m}>{m.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Reference / Transaction ID</label>
                <input value={payForm.reference} onChange={e => setPayForm(f => ({ ...f, reference: e.target.value }))}
                  placeholder="Optional" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-400" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Notes</label>
                <input value={payForm.notes} onChange={e => setPayForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Optional" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-400" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleMarkPaid(c.id)} disabled={saving}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" /> {saving ? 'Saving…' : 'Confirm Paid'}
              </button>
              <button onClick={() => setMarkingId(null)}
                className="px-4 py-2 border border-gray-200 text-gray-600 text-sm rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-1.5">
                <X className="w-3.5 h-3.5" /> Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-3">
          Pending Commissions ({pending.length})
          {pending.length > 0 && <span className="ml-2 text-amber-600 font-bold">{fmt$(pending.reduce((s, c) => s + c.commission_amount, 0))} total</span>}
        </h2>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100 overflow-hidden">
          {pending.length === 0
            ? <p className="text-center text-gray-400 text-sm py-10">No pending commissions.</p>
            : pending.map(c => <CommissionRow key={c.id} c={c as CommissionWithParties} showActions />)
          }
        </div>
      </div>

      {recent.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Recent Payments</h2>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100 overflow-hidden">
            {recent.map(c => <CommissionRow key={c.id} c={c as CommissionWithParties} showActions={false} />)}
          </div>
        </div>
      )}
    </div>
  )
}
