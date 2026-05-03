import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-04-22.dahlia' as any,
  })
}

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

const PLAN_MAP: Record<string, string> = {
  [process.env.STRIPE_STARTER_PRICE_ID    ?? '']: 'starter',
  [process.env.STRIPE_PRO_PRICE_ID        ?? '']: 'professional',
  [process.env.STRIPE_ENTERPRISE_PRICE_ID ?? '']: 'enterprise',
}

export async function POST(request: NextRequest) {
  const stripe = getStripe()
  const sig = request.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !webhookSecret) {
    console.error('[webhook] Missing stripe-signature or STRIPE_WEBHOOK_SECRET')
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    const body = await request.text()
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (e: any) {
    console.error('[webhook] Signature verification failed:', e.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = serviceClient()
  console.log('[webhook] Received event:', event.type)

  switch (event.type) {

    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId
      const plan = session.metadata?.plan
      const customerId = session.customer as string
      const subscriptionId = session.subscription as string | null

      console.log('[webhook] checkout.session.completed:', { userId, plan, customerId })

      if (!userId) {
        console.error('[webhook] checkout.session.completed: no userId in metadata')
        break
      }

      // Fetch subscription to get trial end date
      let trialEndsAt: string | null = null
      if (subscriptionId) {
        try {
          const sub = await stripe.subscriptions.retrieve(subscriptionId)
          trialEndsAt = sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null
        } catch (e: any) {
          console.error('[webhook] Failed to retrieve subscription:', e.message)
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          plan: plan || 'starter',
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          subscription_status: 'active',
          trial_ends_at: trialEndsAt,
        })
        .eq('id', userId)

      if (error) {
        console.error('[webhook] Failed to update profile after checkout:', error.message)
      } else {
        console.log('[webhook] Profile updated — plan:', plan, 'user:', userId)
      }
      break
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string
      const status = subscription.status
      const priceId = subscription.items.data[0]?.price?.id ?? ''
      const planName = PLAN_MAP[priceId] || 'starter'

      console.log('[webhook] subscription.updated:', { customerId, status, priceId, planName })

      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_status: status,
          plan: status === 'active' || status === 'trialing' ? planName : 'free',
        })
        .eq('stripe_customer_id', customerId)

      if (error) {
        console.error('[webhook] Failed to update subscription status:', error.message)
      }
      break
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription
      const customerId = subscription.customer as string

      console.log('[webhook] subscription.deleted for customer:', customerId)

      const { error } = await supabase
        .from('profiles')
        .update({
          plan: 'free',
          subscription_status: 'canceled',
          stripe_subscription_id: null,
        })
        .eq('stripe_customer_id', customerId)

      if (error) {
        console.error('[webhook] Failed to cancel subscription:', error.message)
      }
      break
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string
      const amountPaid = (invoice.amount_paid ?? 0) / 100

      if (!amountPaid || amountPaid <= 0) break

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, referred_by_code')
        .eq('stripe_customer_id', customerId)
        .single()

      if (!profile?.referred_by_code) break

      const { data: referral } = await supabase
        .from('referrals')
        .select('id, referrer_id, commission_percentage')
        .eq('referred_id', profile.id)
        .eq('status', 'active')
        .single()

      if (!referral) break

      const commissionAmount = amountPaid * (referral.commission_percentage / 100)
      const now = new Date()

      await supabase.from('commission_payments').insert({
        referral_id: referral.id,
        referrer_id: referral.referrer_id,
        referred_payment: amountPaid,
        commission_rate: referral.commission_percentage,
        commission_amount: commissionAmount,
        period_month: now.getMonth() + 1,
        period_year: now.getFullYear(),
        status: 'pending',
      })

      const { data: existing } = await supabase
        .from('referrals')
        .select('total_revenue_generated, total_commission_earned')
        .eq('id', referral.id)
        .single()

      await supabase.from('referrals').update({
        total_revenue_generated: (existing?.total_revenue_generated ?? 0) + amountPaid,
        total_commission_earned: (existing?.total_commission_earned ?? 0) + commissionAmount,
      }).eq('id', referral.id)

      console.log('[webhook] Commission recorded:', { referralId: referral.id, commissionAmount })
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const customerId = invoice.customer as string

      console.log('[webhook] invoice.payment_failed for customer:', customerId)

      const { error } = await supabase
        .from('profiles')
        .update({ subscription_status: 'past_due' })
        .eq('stripe_customer_id', customerId)

      if (error) {
        console.error('[webhook] Failed to mark past_due:', error.message)
      }
      break
    }

    default:
      console.log('[webhook] Unhandled event type:', event.type)
  }

  return NextResponse.json({ received: true })
}
