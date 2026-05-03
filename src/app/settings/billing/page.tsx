import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BillingClient } from './BillingClient'

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
    <BillingClient
      profile={profile}
      userEmail={user.email ?? ''}
    />
  )
}
