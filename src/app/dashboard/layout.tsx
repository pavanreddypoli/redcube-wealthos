import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardShell } from '@/components/layout/DashboardShell'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  console.log('Dashboard layout - user:', user?.id, 'error:', error?.message)

  if (!user) redirect('/auth/login')

  return (
    <DashboardShell userEmail={user.email}>
      {children}
    </DashboardShell>
  )
}
