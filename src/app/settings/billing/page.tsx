import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BillingClient } from './BillingClient'
import { DashboardShell } from '@/components/layout/DashboardShell'

export const dynamic = 'force-dynamic'

export default async function BillingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, plan, subscription_status, trial_ends_at, stripe_customer_id, email, advisor_type')
    .eq('id', user.id)
    .single()

  return (
    <DashboardShell
      userEmail={user.email}
      userName={profile?.full_name}
      advisorType={profile?.advisor_type}
    >
      <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs text-gray-500 flex items-center gap-2">
        <a href="/dashboard" className="hover:text-blue-600 transition-colors">Dashboard</a>
        <span>→</span>
        <span className="text-gray-900 font-medium">Billing</span>
      </div>
      <BillingClient
        profile={profile}
        userEmail={user.email ?? ''}
      />
    </DashboardShell>
  )
}
