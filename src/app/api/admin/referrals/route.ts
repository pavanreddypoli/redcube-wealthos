import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    const adminEmails = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim().toLowerCase()).filter(Boolean)
    if (!user || !adminEmails.includes((user.email ?? '').toLowerCase())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { data: referrals } = await serviceClient
      .from('referrals')
      .select(`
        *,
        referrer:referrer_id(id, full_name, email),
        referred:referred_id(id, full_name, email),
        commissions:commission_payments(*)
      `)
      .order('created_at', { ascending: false })

    return NextResponse.json(referrals ?? [])
  } catch (e: any) {
    console.error('[admin/referrals] error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
