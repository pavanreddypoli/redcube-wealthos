import Stripe from 'stripe'
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-06-20' as any,
  })
}

export async function POST(request: NextRequest) {
  const stripe = getStripe()
  const sig = request.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  console.log('[webhook] POST called')
  console.log('[webhook] sig present:', !!sig)
  console.log('[webhook] secret present:', !!webhookSecret)

  if (!sig || !webhookSecret) {
    console.error('[webhook] Missing signature or secret')
    return NextResponse.json({ error: 'Missing stripe signature or webhook secret' }, { status: 400 })
  }

  let event: Stripe.Event
  let body: string

  try {
    body = await request.text()
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (e: any) {
    console.error('[webhook] Signature verification failed:', e.message)
    return NextResponse.json({ error: `Webhook signature verification failed: ${e.message}` }, { status: 400 })
  }

  console.log('[webhook] Event type:', event.type)

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId
        const plan = session.metadata?.plan
        const customerId = session.customer as string
        const subscriptionId = session.subscription as string

        console.log('[webhook] Checkout completed:', { userId, plan, customerId })

        if (!userId) {
          console.error('[webhook] checkout.session.completed: no userId in metadata')
          break
        }

        let trialEndsAt: string | null = null
        if (subscriptionId) {
          try {
            const sub = await stripe.subscriptions.retrieve(subscriptionId)
            trialEndsAt = sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null
          } catch (e: any) {
            console.error('[webhook] Failed to retrieve subscription:', e.message)
          }
        }

        const { error } = await serviceClient
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
          console.error('[webhook] Profile update failed:', error.message)
        } else {
          console.log('[webhook] Profile updated for user:', userId)
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const status = subscription.status
        const planId = subscription.items.data[0]?.price?.id ?? ''

        const planMap: Record<string, string> = {
          [process.env.STRIPE_STARTER_PRICE_ID    ?? '']: 'starter',
          [process.env.STRIPE_PRO_PRICE_ID        ?? '']: 'professional',
          [process.env.STRIPE_ENTERPRISE_PRICE_ID ?? '']: 'enterprise',
        }
        const planName = planMap[planId] || 'starter'

        console.log('[webhook] Subscription updated:', { customerId, status, planName })

        await serviceClient
          .from('profiles')
          .update({
            subscription_status: status,
            plan: status === 'active' || status === 'trialing' ? planName : 'free',
          })
          .eq('stripe_customer_id', customerId)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        console.log('[webhook] Subscription cancelled:', customerId)

        await serviceClient
          .from('profiles')
          .update({
            plan: 'free',
            subscription_status: 'canceled',
            stripe_subscription_id: null,
          })
          .eq('stripe_customer_id', customerId)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        console.log('[webhook] Payment failed:', customerId)

        await serviceClient
          .from('profiles')
          .update({ subscription_status: 'past_due' })
          .eq('stripe_customer_id', customerId)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        const amountPaid = (invoice.amount_paid || 0) / 100

        console.log('[webhook] Payment succeeded:', customerId, 'amount:', amountPaid)

        if (!amountPaid || amountPaid <= 0) break

        const { data: profile } = await serviceClient
          .from('profiles')
          .select('id, referred_by_code')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!profile?.referred_by_code) break

        const { data: referral } = await serviceClient
          .from('referrals')
          .select('*')
          .eq('referred_id', profile.id)
          .eq('status', 'active')
          .single()

        if (!referral) break

        const commissionAmount = amountPaid * (referral.commission_percentage / 100)
        const now = new Date()

        await serviceClient.from('commission_payments').insert({
          referral_id: referral.id,
          referrer_id: referral.referrer_id,
          period_month: now.getMonth() + 1,
          period_year: now.getFullYear(),
          referred_payment: amountPaid,
          commission_rate: referral.commission_percentage,
          commission_amount: commissionAmount,
          status: 'pending',
        })

        await serviceClient
          .from('referrals')
          .update({
            total_revenue_generated: referral.total_revenue_generated + amountPaid,
            total_commission_earned: referral.total_commission_earned + commissionAmount,
          })
          .eq('id', referral.id)

        console.log('[webhook] Commission recorded:', commissionAmount)
        break
      }

      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const { data: profile } = await serviceClient
          .from('profiles')
          .select('email, full_name')
          .eq('stripe_customer_id', customerId)
          .single()

        if (profile?.email) {
          console.log('[webhook] Trial ending soon for:', profile.email)
        }
        break
      }

      default:
        console.log('[webhook] Unhandled event type:', event.type)
    }
  } catch (e: any) {
    console.error('[webhook] Handler error:', e.message)
    // Return 200 so Stripe does not retry
  }

  return NextResponse.json({ received: true })
}
