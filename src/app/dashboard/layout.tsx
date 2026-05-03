import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/layout/DashboardShell'

export const dynamic = 'force-dynamic'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean)

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, advisor_type, plan, email')
    .eq('id', user.id)
    .single()

  const isAdmin = ADMIN_EMAILS.includes(user.email ?? '')

  return (
    <DashboardShell
      userEmail={user.email}
      userName={profile?.full_name}
      advisorType={profile?.advisor_type}
      isAdmin={isAdmin}
    >
      {children}
    </DashboardShell>
  )
}
