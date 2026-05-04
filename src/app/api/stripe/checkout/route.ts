import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getStripe, PLANS } from '@/lib/stripe'
import type { PlanKey } from '@/lib/stripe'

const CONSUMER_PRICE_IDS: Record<string, string> = {
  consumer_founding: process.env.STRIPE_CONSUMER_FOUNDING_PRICE_ID || '',
  consumer_regular:  process.env.STRIPE_CONSUMER_REGULAR_PRICE_ID  || '',
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    console.log('[checkout] called, user:', user?.id)

    if (!user) {
      return NextResponse.json(
        { error: 'Please sign in to start your free trial' },
        { status: 401 },
      )
    }

    const { plan } = await req.json() as { plan: string }
    console.log('Price ID being used:', CONSUMER_PRICE_IDS[plan])
    console.log('Stripe key type:', process.env.STRIPE_SECRET_KEY?.substring(0, 10))
    const isConsumer = plan.startsWith('consumer_')
    const stripe  = getStripe()
    const appUrl  = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

    if (isConsumer) {
      const priceId = CONSUMER_PRICE_IDS[plan]
      if (!priceId) {
        return NextResponse.json({ error: 'Invalid consumer plan' }, { status: 400 })
      }

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        success_url:  `${appUrl}/consumer/welcome?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url:   `${appUrl}/consumer/pricing`,
        metadata:     { userId: user.id, plan, userType: 'consumer' },
        subscription_data: { metadata: { userId: user.id, plan } },
        customer_email:    user.email,
        allow_promotion_codes: true,
      })

      console.log('[checkout] consumer session created:', session.id)
      return NextResponse.json({ url: session.url })
    }

    // Advisor plan
    const planConfig = PLANS[plan as PlanKey]
    if (!planConfig) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: planConfig.priceId, quantity: 1 }],
      subscription_data: { trial_period_days: 14, metadata: { userId: user.id, plan } },
      customer_email: user.email,
      success_url: `${appUrl}/dashboard?upgraded=true`,
      cancel_url:  `${appUrl}/pricing`,
      metadata:    { userId: user.id, plan, userType: 'advisor' },
    })

    console.log('[checkout] advisor session created:', session.id)
    return NextResponse.json({ url: session.url })

  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to create checkout session'
    console.error('[checkout] error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
