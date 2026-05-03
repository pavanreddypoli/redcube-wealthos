import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? '').split(',').map(e => e.trim()).filter(Boolean)

function svc() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !ADMIN_EMAILS.includes(user.email ?? '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, status, payment_method, payment_reference, notes } = await request.json()
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const { data, error } = await svc()
      .from('commission_payments')
      .update({
        status,
        payment_method: payment_method ?? null,
        payment_reference: payment_reference ?? null,
        notes: notes ?? null,
        paid_at: status === 'paid' ? new Date().toISOString() : null,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // If marking paid, update referral total_commission_paid
    if (status === 'paid' && data) {
      const { data: existingReferral } = await svc()
        .from('referrals')
        .select('total_commission_paid')
        .eq('id', data.referral_id)
        .single()

      if (existingReferral) {
        await svc()
          .from('referrals')
          .update({ total_commission_paid: (existingReferral.total_commission_paid ?? 0) + data.commission_amount })
          .eq('id', data.referral_id)
      }
    }

    return NextResponse.json(data)
  } catch (e: any) {
    console.error('[admin/commissions PATCH] error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
