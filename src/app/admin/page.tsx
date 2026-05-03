import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { AdminClient } from './AdminClient'

export const dynamic = 'force-dynamic'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const userEmail = (user.email || '').toLowerCase()
  console.log('[admin page] user email:', userEmail)
  console.log('[admin page] admin emails:', ADMIN_EMAILS)
  console.log('[admin page] is admin:', ADMIN_EMAILS.includes(userEmail))

  if (!ADMIN_EMAILS.includes(userEmail)) redirect('/dashboard')

  // Fetch ALL data server-side using service role — bypasses RLS completely
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: codes, error: codesError } = await serviceClient
    .from('discount_codes')
    .select('*, referrer:referrer_id(id, full_name, email)')
    .order('created_at', { ascending: false })

  console.log('[admin page] codes fetched:', codes?.length, codesError?.message)

  const { data: referrals, error: referralsError } = await serviceClient
    .from('referrals')
    .select('*, referrer:referrer_id(id, full_name, email), referred:referred_id(id, full_name, email), commissions:commission_payments(*)')
    .order('created_at', { ascending: false })

  console.log('[admin page] referrals fetched:', referrals?.length, referralsError?.message)

  const { data: commissions, error: commissionsError } = await serviceClient
    .from('commission_payments')
    .select('*, referral:referral_id(discount_code, plan, referred:referred_id(full_name, email)), referrer:referrer_id(full_name, email)')
    .order('created_at', { ascending: false })

  console.log('[admin page] commissions fetched:', commissions?.length, commissionsError?.message)

  const { data: advisors } = await serviceClient
    .from('profiles')
    .select('id, full_name, email, advisor_type')
    .in('advisor_type', ['advisor', 'planner'])
    .order('full_name')

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, advisor_type, plan, email')
    .eq('id', user.id)
    .single()

  return (
    <DashboardShell
      userEmail={user.email}
      userName={profile?.full_name}
      advisorType={profile?.advisor_type}
      isAdmin={true}
    >
      <AdminClient
        initialCodes={codes ?? []}
        initialReferrals={referrals ?? []}
        initialCommissions={commissions ?? []}
        advisors={advisors ?? []}
      />
    </DashboardShell>
  )
}
