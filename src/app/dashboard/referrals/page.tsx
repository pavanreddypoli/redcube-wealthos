import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { DollarSign, Users, Clock, TrendingUp, Copy } from 'lucide-react'

export const dynamic = 'force-dynamic'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://wealthplanrai.vercel.app'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function fmt$(v: number | null | undefined) {
  return `$${(v ?? 0).toFixed(2)}`
}

export default async function ReferralsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('referral_code, full_name')
    .eq('id', user.id)
    .single()

  const { data: referrals } = await supabase
    .from('referrals')
    .select(`
      id, discount_code, plan, discounted_price, commission_percentage,
      status, total_revenue_generated, total_commission_earned, total_commission_paid,
      created_at,
      referred:referred_id(full_name, email)
    `)
    .eq('referrer_id', user.id)
    .order('created_at', { ascending: false })

  const { data: commissions } = await supabase
    .from('commission_payments')
    .select('*')
    .eq('referrer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  const safeReferrals = referrals ?? []
  const safeCommissions = commissions ?? []

  const totalEarned = safeReferrals.reduce((s, r) => s + (r.total_commission_earned ?? 0), 0)
  const totalPaid   = safeReferrals.reduce((s, r) => s + (r.total_commission_paid ?? 0), 0)
  const pending     = safeCommissions.filter(c => c.status === 'pending').reduce((s, c) => s + (c.commission_amount ?? 0), 0)
  const activeCount = safeReferrals.filter(r => r.status === 'active').length

  const referralLink = profile?.referral_code
    ? `${APP_URL}/auth/login?ref=${profile.referral_code}`
    : null

  const mailtoBody = referralLink
    ? `Hi,\n\nI've been using WealthPlanrAI for my practice and thought you might find it useful too.\n\nUse my referral link to get a discount when you sign up:\n${referralLink}\n\nBest,\n${profile?.full_name ?? ''}`
    : ''

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">

      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Sora,sans-serif' }}>
          My Referrals &amp; Commissions
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Earn commissions when advisors you refer subscribe to WealthPlanrAI.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Earned',      value: fmt$(totalEarned), icon: <TrendingUp className="w-5 h-5 text-green-500" />, bg: 'bg-green-50' },
          { label: 'Pending Payment',   value: fmt$(pending),     icon: <Clock className="w-5 h-5 text-amber-500" />,      bg: 'bg-amber-50' },
          { label: 'Total Paid Out',    value: fmt$(totalPaid),   icon: <DollarSign className="w-5 h-5 text-brand-500" />, bg: 'bg-blue-50' },
          { label: 'Active Referrals',  value: String(activeCount), icon: <Users className="w-5 h-5 text-purple-500" />,  bg: 'bg-purple-50' },
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

      {/* Referral link */}
      <div className="bg-white rounded-2xl border border-brand-200 p-5 mb-6 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 mb-1">Your Referral Link</h2>
        <p className="text-xs text-gray-500 mb-3">
          Share this link. Anyone who signs up through it will get a discount and you&apos;ll earn commissions.
        </p>

        {referralLink ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
              <span className="text-sm text-gray-700 flex-1 font-mono truncate">{referralLink}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <CopyButton text={referralLink} />
              <a
                href={`mailto:?subject=Try WealthPlanrAI — AI-powered financial planning&body=${encodeURIComponent(mailtoBody)}`}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Share via Email
              </a>
            </div>
            <p className="text-xs text-gray-400">
              Your referral code: <span className="font-mono font-bold text-gray-700">{profile?.referral_code}</span>
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-400">
            Your referral code is being generated. Visit{' '}
            <Link href="/dashboard/profile" className="text-brand-600 hover:underline">your profile</Link>{' '}
            to trigger generation, then refresh this page.
          </p>
        )}
      </div>

      {/* Referrals table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Referred Advisors ({safeReferrals.length})</h2>
        </div>
        {safeReferrals.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-10">
            No referrals yet. Share your referral link to get started.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">Advisor</th>
                  <th className="px-4 py-3 text-left">Plan</th>
                  <th className="px-4 py-3 text-left">Pays/mo</th>
                  <th className="px-4 py-3 text-left">Your %</th>
                  <th className="px-4 py-3 text-left">Monthly Earning</th>
                  <th className="px-4 py-3 text-left">Total Earned</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Since</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {safeReferrals.map((r: any) => {
                  const monthlyEarning = r.discounted_price * (r.commission_percentage / 100)
                  return (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{r.referred?.full_name ?? '—'}</p>
                        <p className="text-xs text-gray-400">{r.referred?.email ?? ''}</p>
                      </td>
                      <td className="px-4 py-3 capitalize text-gray-700">{r.plan}</td>
                      <td className="px-4 py-3 font-semibold text-brand-600">{fmt$(r.discounted_price)}</td>
                      <td className="px-4 py-3 text-gray-700">{r.commission_percentage}%</td>
                      <td className="px-4 py-3 font-semibold text-green-600">{fmt$(monthlyEarning)}</td>
                      <td className="px-4 py-3 font-semibold text-gray-900">{fmt$(r.total_commission_earned)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${r.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-400">
                        {new Date(r.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Commission payments */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Commission Payment History</h2>
        </div>
        {safeCommissions.length === 0 ? (
          <p className="text-center text-gray-400 text-sm py-10">
            Commission payments will appear here once you have active referrals.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="px-4 py-3 text-left">Month</th>
                  <th className="px-4 py-3 text-left">Their Payment</th>
                  <th className="px-4 py-3 text-left">Rate</th>
                  <th className="px-4 py-3 text-left">Your Commission</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Paid Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {safeCommissions.map((c: any) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{MONTHS[c.period_month - 1]} {c.period_year}</td>
                    <td className="px-4 py-3 text-gray-700">{fmt$(c.referred_payment)}</td>
                    <td className="px-4 py-3 text-gray-700">{c.commission_rate}%</td>
                    <td className="px-4 py-3 font-bold text-green-700">{fmt$(c.commission_amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${c.status === 'paid' ? 'bg-green-100 text-green-700' : c.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {c.paid_at ? new Date(c.paid_at).toLocaleDateString() : '—'}
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

function CopyButton({ text }: { text: string }) {
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text).catch(() => {}) }}
      className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors"
    >
      <Copy className="w-3.5 h-3.5" />
      Copy Link
    </button>
  )
}
