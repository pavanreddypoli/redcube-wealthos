import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )

    const { data } = await serviceClient
      .from('founding_member_config')
      .select('total_slots, claimed_slots, is_active, offer_ends_at, price_founding, price_regular')
      .eq('id', 1)
      .single()

    return NextResponse.json({
      total:         data?.total_slots   ?? 500,
      claimed:       data?.claimed_slots ?? 0,
      remaining:     (data?.total_slots ?? 500) - (data?.claimed_slots ?? 0),
      isActive:      data?.is_active     ?? true,
      offerEndsAt:   data?.offer_ends_at ?? null,
      priceFounding: data?.price_founding ?? 2.90,
      priceRegular:  data?.price_regular  ?? 29.00,
    })
  } catch {
    return NextResponse.json({
      total: 500, claimed: 0, remaining: 500, isActive: true,
      offerEndsAt: null, priceFounding: 2.90, priceRegular: 29.00,
    })
  }
}
