import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AdminClient } from './AdminClient'
import { DashboardShell } from '@/components/layout/DashboardShell'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean)

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !ADMIN_EMAILS.includes(user.email ?? '')) {
    redirect('/dashboard')
  }

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
      <AdminClient />
    </DashboardShell>
  )
}
