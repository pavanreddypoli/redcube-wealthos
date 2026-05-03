import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

export async function GET() {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = adminClient()
    const { data, error } = await admin
      .from('profiles')
      .select('id, full_name, email, advisor_type, advisor_specialty, phone, bio, years_experience, is_accepting_clients, referral_code')
      .eq('id', user.id)
      .single()

    if (error) throw error

    if (!data.referral_code && data.full_name) {
      const namePart = data.full_name.replace(/\s+/g, '').slice(0, 4).toUpperCase()
      const numPart = String(Math.floor(1000 + Math.random() * 9000))
      const referral_code = `${namePart}${numPart}`
      await admin.from('profiles').update({ referral_code }).eq('id', user.id)
      return NextResponse.json({ ...data, referral_code })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('[advisor/profile GET] error:', err)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json() as {
      full_name?: string
      advisor_type?: string
      advisor_specialty?: string
      phone?: string
      bio?: string
      years_experience?: string
      is_accepting_clients?: boolean
    }

    const TYPE_MAP: Record<string, string> = {
      'Financial Advisor': 'advisor',
      'Financial Planner': 'planner',
    }

    const update: Record<string, unknown> = {}
    if (body.full_name !== undefined)            update.full_name            = body.full_name
    if (body.advisor_type !== undefined)         update.advisor_type         = TYPE_MAP[body.advisor_type] ?? body.advisor_type
    if (body.advisor_specialty !== undefined)    update.advisor_specialty    = body.advisor_specialty || null
    if (body.phone !== undefined)                update.phone                = body.phone || null
    if (body.bio !== undefined)                  update.bio                  = body.bio || null
    if (body.years_experience !== undefined)     update.years_experience     = body.years_experience || null
    if (body.is_accepting_clients !== undefined) update.is_accepting_clients = body.is_accepting_clients

    const admin = adminClient()
    const { error } = await admin.from('profiles').update(update).eq('id', user.id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[advisor/profile PATCH] error:', err)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
