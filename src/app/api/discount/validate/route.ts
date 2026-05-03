import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const PLAN_PRICES: Record<string, number> = {
  starter: 149,
  professional: 399,
  enterprise: 999,
}

export async function POST(request: NextRequest) {
  try {
    const { code, plan } = await request.json() as { code: string; plan: string }

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    }

    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { data: discountCode, error } = await serviceClient
      .from('discount_codes')
      .select('*, referrer:referrer_id(full_name, email)')
      .eq('is_active', true)
      .ilike('code', code.trim())
      .single()

    if (error || !discountCode) {
      return NextResponse.json({ valid: false, error: 'This code is not valid or has expired' })
    }

    if (discountCode.expires_at && new Date(discountCode.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, error: 'This discount code has expired' })
    }

    if (discountCode.max_uses && discountCode.current_uses >= discountCode.max_uses) {
      return NextResponse.json({ valid: false, error: 'This discount code has reached its maximum uses' })
    }

    const fullPrice = PLAN_PRICES[plan] ?? PLAN_PRICES.professional
    let discountAmount = 0
    let discountedPrice = fullPrice

    if (discountCode.discount_type === 'percentage') {
      discountAmount = fullPrice * (discountCode.discount_value / 100)
      discountedPrice = fullPrice - discountAmount
    } else {
      discountAmount = Math.min(discountCode.discount_value, fullPrice)
      discountedPrice = fullPrice - discountAmount
    }

    const referrerData = discountCode.referrer as { full_name?: string; email?: string } | null

    return NextResponse.json({
      valid: true,
      code: discountCode.code,
      discount_type: discountCode.discount_type,
      discount_value: discountCode.discount_value,
      discount_amount: discountAmount,
      full_price: fullPrice,
      discounted_price: discountedPrice,
      referrer_name: referrerData?.full_name ?? null,
      description: discountCode.description,
    })

  } catch (e: any) {
    console.error('[discount/validate] error:', e.message)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
