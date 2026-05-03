'use client'
import { useState } from 'react'
import Link from 'next/link'
import { CreditCard, CheckCircle, AlertCircle, Clock, ArrowRight, Zap } from 'lucide-react'

interface Profile {
  full_name: string | null
  plan: string | null
  subscription_status: string | null
  trial_ends_at: string | null
  stripe_customer_id: string | null
  email: string | null
  advisor_type: string | null
}

const PLAN_DETAILS = {
  free: {
    name: 'Free',
    price: '$0',
    features: ['Assessment form', 'Basic summary page'],
  },
  starter: {
    name: 'Starter',
    price: '$149/mo',
    features: ['Up to 25 client profiles', 'Unlimited assessments', 'AI risk scoring', 'PDF report export', 'Email support'],
  },
  professional: {
    name: 'Professional',
    price: '$399/mo',
    features: ['Everything in Starter', 'Up to 150 client profiles', 'Advisor notes & tagging', 'PDF & CSV export', 'Priority support', 'Custom branding'],
  },
  enterprise: {
    name: 'Enterprise',
    price: '$999/mo',
    features: ['Everything in Professional', 'Unlimited client profiles', 'Multi-advisor management', 'Compliance audit trail', 'SSO & SAML', 'Dedicated account manager', 'SLA guarantee'],
  },
}

export function BillingClient({ profile, userEmail }: { profile: Profile | null; userEmail: string }) {
  const [portalLoading, setPortalLoading] = useState(false)
  const [error, setError] = useState('')

  const plan = profile?.plan ?? 'free'
  const status = profile?.subscription_status ?? null
  const planDetails = PLAN_DETAILS[plan as keyof typeof PLAN_DETAILS] ?? PLAN_DETAILS.free
  const trialEnds = profile?.trial_ends_at ? new Date(profile.trial_ends_at) : null
  const isTrialing = status === 'trialing'
  const isActive = status === 'active'
  const isCanceled = status === 'canceled'
  const isPastDue = status === 'past_due'
  const hasStripe = !!profile?.stripe_customer_id

  const daysLeft = trialEnds
    ? Math.max(0, Math.ceil((trialEnds.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0

  const advisorTypeLabel =
    profile?.advisor_type === 'Financial Advisor' ? 'Financial Advisor'
    : profile?.advisor_type === 'Financial Planner' ? 'Financial Planner'
    : 'Free Account'

  async function openBillingPortal() {
    setPortalLoading(true)
    setError('')
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to open billing portal')
      if (data.url) window.location.href = data.url
    } catch (e: any) {
      setError(e.message)
    } finally {
      setPortalLoading(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Sora,sans-serif' }}>
          Billing &amp; Subscription
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your RedCube WealthOS subscription and billing details.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Current plan card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 mb-4">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Current Plan</p>
            <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: 'Sora,sans-serif' }}>
              {planDetails.name}
            </h2>
            <p className="text-base font-semibold text-brand-600 mt-0.5">{planDetails.price}</p>
          </div>

          {/* Status badge */}
          <div>
            {isTrialing && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-amber-800">Trial active</p>
                  <p className="text-xs text-amber-600">{daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining</p>
                </div>
              </div>
            )}
            {isActive && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
                <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                <p className="text-xs font-semibold text-green-800">Active</p>
              </div>
            )}
            {isCanceled && (
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                <AlertCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <p className="text-xs font-semibold text-gray-600">Canceled</p>
              </div>
            )}
            {isPastDue && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-xs font-semibold text-red-800">Payment overdue</p>
              </div>
            )}
            {plan === 'free' && !isTrialing && !isActive && !isCanceled && !isPastDue && (
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                <AlertCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <p className="text-xs font-semibold text-gray-600">Free plan</p>
              </div>
            )}
          </div>
        </div>

        {/* Plan features */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">Included in your plan</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {planDetails.features.map(f => (
              <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                {f}
              </div>
            ))}
          </div>
        </div>

        {/* Trial urgency warning */}
        {isTrialing && daysLeft <= 3 && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-xs text-amber-800 font-medium">
              ⚠ Your trial ends in {daysLeft} day{daysLeft !== 1 ? 's' : ''}.
              Add a payment method to continue without interruption.
            </p>
          </div>
        )}

        {/* Past due warning */}
        {isPastDue && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-xs text-red-800 font-medium">
              ⚠ Your last payment failed. Update your payment method to avoid service interruption.
            </p>
          </div>
        )}
      </div>

      {/* Account details */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 mb-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Account Details</h3>
        <div className="space-y-0">
          <div className="flex justify-between py-2.5 border-b border-gray-100 text-sm">
            <span className="text-gray-500">Email</span>
            <span className="font-medium text-gray-900 truncate max-w-[220px] text-right">{userEmail}</span>
          </div>
          <div className="flex justify-between py-2.5 border-b border-gray-100 text-sm">
            <span className="text-gray-500">Account type</span>
            <span className="font-medium text-gray-900">{advisorTypeLabel}</span>
          </div>
          <div className="flex justify-between py-2.5 text-sm">
            <span className="text-gray-500">Billing status</span>
            <span className={`font-medium capitalize ${
              isActive ? 'text-green-600'
                : isPastDue ? 'text-red-600'
                : isTrialing ? 'text-amber-600'
                : 'text-gray-600'
            }`}>
              {status ?? 'Not subscribed'}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {hasStripe ? (
          <button
            onClick={openBillingPortal}
            disabled={portalLoading}
            className="flex items-center justify-center gap-2 p-4 bg-white border border-gray-200 rounded-2xl shadow-sm hover:border-brand-300 hover:bg-brand-50 transition-all text-sm font-semibold text-gray-700 disabled:opacity-50"
          >
            <CreditCard className="w-5 h-5 text-brand-500" />
            {portalLoading ? 'Opening portal…' : 'Manage Billing & Invoices'}
          </button>
        ) : (
          <Link
            href="/pricing"
            className="flex items-center justify-center gap-2 p-4 bg-white border border-gray-200 rounded-2xl shadow-sm hover:border-brand-300 hover:bg-brand-50 transition-all text-sm font-semibold text-gray-700"
          >
            <CreditCard className="w-5 h-5 text-brand-500" />
            Add Payment Method
          </Link>
        )}

        {plan !== 'enterprise' && (
          <Link
            href="/pricing"
            className="flex items-center justify-center gap-2 p-4 bg-brand-600 hover:bg-brand-700 rounded-2xl shadow-sm transition-all text-sm font-semibold text-white"
          >
            <Zap className="w-5 h-5" />
            {plan === 'free' ? 'Start Free Trial' : 'Upgrade Plan'}
            <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Cancel hint */}
      {(isActive || isTrialing) && hasStripe && (
        <p className="text-xs text-gray-400 text-center mt-4">
          To cancel your subscription, go to{' '}
          <button onClick={openBillingPortal} className="text-brand-500 hover:underline">
            Manage Billing
          </button>
          {' '}and select Cancel Plan.
        </p>
      )}

      <p className="text-xs text-gray-400 text-center mt-3">
        Need help?{' '}
        <a href="mailto:info@redcubefinancial.com" className="text-brand-600 hover:underline">
          Contact support
        </a>
      </p>
    </div>
  )
}
