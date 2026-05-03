import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'

function isAdmin(email: string | undefined): boolean {
  if (!email) return false
  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
  const result = adminEmails.includes(email.toLowerCase())
  console.log('[admin] checking:', email.toLowerCase(), 'against:', adminEmails, '→', result)
  return result
}

async function requireAdmin(): Promise<{ user: { id: string; email?: string } } | NextResponse> {
  console.log('[discount-codes GET] called')
  console.log('[discount-codes GET] ADMIN_EMAILS env:', process.env.ADMIN_EMAILS)
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  console.log('[discount-codes GET] user:', user?.email)
  console.log('[discount-codes GET] isAdmin result:', isAdmin(user?.email))
  if (!user || !isAdmin(user.email)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return { user }
}

function svc() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function GET() {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { data } = await svc()
      .from('discount_codes')
      .select('*, referrer:referrer_id(id, full_name, email)')
      .order('created_at', { ascending: false })

    return NextResponse.json(data ?? [])
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth
    const { user } = auth as { user: { id: string; email?: string } }

    const { code, description, discount_type, discount_value, referrer_id, commission_percentage, max_uses, expires_at } =
      await request.json()

    if (!code || !discount_type || discount_value === undefined) {
      return NextResponse.json({ error: 'Missing required fields: code, discount_type, discount_value' }, { status: 400 })
    }

    const { data, error } = await svc()
      .from('discount_codes')
      .insert({
        code: String(code).toUpperCase().trim(),
        description: description || null,
        discount_type,
        discount_value: Number(discount_value),
        referrer_id: referrer_id || null,
        commission_percentage: Number(commission_percentage ?? 0),
        max_uses: max_uses ? Number(max_uses) : null,
        expires_at: expires_at || null,
        created_by: user.id,
        is_active: true,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (auth instanceof NextResponse) return auth

    const { id, ...updates } = await request.json()
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const { data, error } = await svc()
      .from('discount_codes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
