# RedCube WealthOS — Build Progress

## Last updated: May 1, 2026 (session 2)

## What is built and working (latest additions at top):
- Company email multi-recipient: sends to COMPANY_EMAIL + COMPANY_BACKUP_EMAIL, survives SpamCop RBL
- Stripe webhook fully implemented: checkout.session.completed, subscription.updated/deleted, invoice.payment_failed
- Plan activation on checkout: profiles.plan + stripe_customer_id/subscription_id updated via webhook
- Upgrade success banner on /dashboard?upgraded=true after Stripe checkout
- Next.js 14 app with App Router deployed on Vercel
- Supabase database with migrations 001-007 (run 006, 007 in Supabase)
- Authentication: signup, signin, signout using @supabase/ssr@0.10.2
- Multi-step 9-section financial assessment form
- Financial scoring engine (src/lib/scoring.ts) with sub-scores
- Three Pillars summary page (/summary) — Protect, Grow, Leave a Legacy
- PDF generation for clients and advisors (src/lib/generatePDF.ts)
- Email system via SendGrid (src/lib/email.ts) — client, advisor, company emails
- Advisor self-registration flow (/auth/login MODE 3)
- Advisor dropdown on summary page for client to select advisor
- Advisor CRM dashboard (/dashboard) with assessment table and notes panel
- Results page (/results) with score breakdown
- Pricing page (/pricing) with Stripe checkout buttons
- Light blue design system with Inter + Sora fonts
- Mobile friendly layout

## Auth root cause and fix:
- Problem: @supabase/ssr@0.3.0 had cookie encoding mismatch between
  browser and server client on Vercel
- Fix: upgraded to @supabase/ssr@0.10.2
- Pattern: browser client signin + router.refresh() + router.push()
- Middleware uses official Supabase SSR pattern with broad matcher

## What still needs to be built:
- [ ] Test full assessment → summary → email flow end to end on production
- [ ] Verify PDF emails arrive at client and advisor emails
- [ ] Verify advisor dropdown shows registered advisors
- [ ] Add COMPANY_BACKUP_EMAIL in Vercel env variables (Gmail backup address)
- [ ] Register Stripe webhook endpoint in Stripe Dashboard (see instructions below)
- [ ] Add STRIPE_WEBHOOK_SECRET to Vercel env variables after Stripe webhook creation
- [ ] Full advisor dashboard with real client data
- [ ] Billing portal page (/settings/billing)
- [ ] Run migration 006 and 007 in Supabase if not done
- [ ] White-label branding for Enterprise plan
- [ ] Password reset flow
- [ ] Mobile testing on real devices

## Stripe webhook setup (required for plan activation):
Go to stripe.com → Developers → Webhooks → Add endpoint
Endpoint URL: https://redcube-wealthos.vercel.app/api/stripe/webhook
Events to listen for:
- checkout.session.completed
- customer.subscription.updated
- customer.subscription.deleted
- invoice.payment_failed
After adding, copy Signing Secret → add to Vercel as STRIPE_WEBHOOK_SECRET=whsec_...

## Key environment variables needed in Vercel:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- NEXT_PUBLIC_APP_URL = https://redcube-wealthos.vercel.app
- SENDGRID_API_KEY
- SENDGRID_FROM_EMAIL = info@redcubefinancial.com
- COMPANY_EMAIL = info@redcubefinancial.com
- STRIPE_SECRET_KEY
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
- STRIPE_WEBHOOK_SECRET (from Stripe webhook signing secret)
- COMPANY_BACKUP_EMAIL (Gmail backup, e.g. yourname@gmail.com)

## GitHub repo:
https://github.com/pavanreddypoli/redcube-wealthos

## Live URL:
https://redcube-wealthos.vercel.app

## Database:
Supabase project: gvrycagcpyqhrixyscnc
Tables: profiles, assessments, assessment_answers, advisor_notes,
        clients, compliance_items, firms
