# WealthPlanrAI — Build Progress

## Last updated: May 3, 2026 (session 4)

---

## Completed and working (latest additions at top):

### Session 4 (May 3, 2026)
- [x] Homepage CTAs fixed: compliance callout + pricing section buttons now link to /pricing (not /assessment)
- [x] Pricing page CheckoutButton: unauthenticated users redirected to /auth/login?redirectTo=/pricing (returns to pricing after login)
- [x] Billing portal page (/settings/billing) — plan details, status badges, trial countdown, Stripe portal link, upgrade CTA
- [x] Stripe portal API (/api/stripe/portal) — full error handling, descriptive 400 for missing customer
- [x] Password reset flow — Forgot password link → ForgotPassword component → /auth/reset-password page
- [x] Full mobile responsiveness — hamburger drawer on dashboard, card view for assessment table, stacked layouts on all pages

### Session 3 (May 3, 2026)
- [x] Company email multi-recipient: sends to COMPANY_EMAIL + COMPANY_BACKUP_EMAIL, survives SpamCop RBL
- [x] Stripe webhook fully implemented: checkout.session.completed, subscription.updated/deleted, invoice.payment_failed
- [x] Plan activation on checkout: profiles.plan + stripe_customer_id/subscription_id updated via webhook
- [x] Upgrade success banner on /dashboard?upgraded=true after Stripe checkout

### Earlier sessions
- [x] Next.js 14 app with App Router deployed on Vercel
- [x] Supabase database with migrations 001–007
- [x] Authentication: signup, signin, signout using @supabase/ssr@0.10.2
- [x] Multi-step 9-section financial assessment form
- [x] Financial scoring engine (src/lib/scoring.ts) with sub-scores
- [x] Three Pillars summary page (/summary) — Protect, Grow, Leave a Legacy
- [x] PDF generation for clients and advisors (src/lib/generatePDF.ts)
- [x] Email system via SendGrid (src/lib/email.ts) — client, advisor, company emails
- [x] Advisor self-registration flow (/auth/login MODE 3)
- [x] Advisor dropdown on summary page for client to select advisor
- [x] Advisor CRM dashboard (/dashboard) with assessment table, notes panel, tab filters
- [x] Results page (/results) with score breakdown
- [x] Pricing page (/pricing) with Stripe checkout buttons (start free trial)
- [x] Light blue design system with Inter + Sora fonts

---

## What still needs to be done:

### Manual configuration (user action required — no code needed):
- [ ] Add `COMPANY_BACKUP_EMAIL` in Vercel env variables (Gmail backup address)
- [ ] Register Stripe webhook endpoint in Stripe Dashboard (see instructions below)
- [ ] Add `STRIPE_WEBHOOK_SECRET` to Vercel env variables after webhook creation
- [ ] Add `https://wealthplanrai.vercel.app/auth/reset-password` to Supabase allowed redirect URLs
- [ ] Run migration 006 and 007 in Supabase SQL editor if not already done

### Testing / verification (needs production environment):
- [ ] Test full assessment → summary → email flow end to end on production
- [ ] Verify PDF emails arrive at client and advisor email addresses
- [ ] Verify advisor dropdown shows registered advisors
- [ ] Test password reset flow end to end (requires Supabase redirect URL above)
- [ ] Test Stripe checkout → plan activation → billing portal on production
- [ ] Verify upgrade success banner appears after Stripe checkout

### Remaining features to build:
- [ ] White-label branding for Enterprise plan
- [ ] Compliance audit trail for Enterprise plan
- [ ] SSO / Active Directory for Enterprise plan

---

## Roadmap — Not yet built (in priority order)

### High Priority
- [ ] Subscription enforcement — paywall when trial expires
  - PaywallOverlay component in dashboard layout
  - Check subscription_status and trial_ends_at on every dashboard visit
  - Block access if expired, show upgrade prompt
  - Trial ending email reminder (customer.subscription.trial_will_end webhook)
  - Add customer.subscription.trial_will_end to Stripe webhook events

### Medium Priority
- [ ] Custom domain setup — redcubefinancial.com instead of vercel.app
- [ ] White-label branding for Enterprise plan
- [ ] Admin panel — manage all advisors and clients
- [ ] Analytics dashboard — track submissions, conversions, revenue

### Low Priority
- [ ] Client portal — let clients log in and see their own results history
- [ ] CRM integrations — Salesforce, Redtail
- [ ] Document upload and AI analysis
- [ ] Multi-language support

---

## Auth root cause and fix:
- Problem: @supabase/ssr@0.3.0 had cookie encoding mismatch between browser and server client on Vercel
- Fix: upgraded to @supabase/ssr@0.10.2
- Pattern: browser client signin + router.refresh() + router.push()
- Middleware uses official Supabase SSR pattern with broad matcher

---

## Stripe webhook setup (required for plan activation):
Go to stripe.com → Developers → Webhooks → Add endpoint
Endpoint URL: `https://wealthplanrai.vercel.app/api/stripe/webhook`
Events to listen for:
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed`

After adding, copy Signing Secret → add to Vercel as `STRIPE_WEBHOOK_SECRET=whsec_...`

---

## Key environment variables needed in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL` = https://wealthplanrai.vercel.app
- `SENDGRID_API_KEY`
- `SENDGRID_FROM_EMAIL` = info@redcubefinancial.com
- `COMPANY_EMAIL` = info@redcubefinancial.com
- `COMPANY_BACKUP_EMAIL` = (Gmail backup, e.g. yourname@gmail.com)
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET` (from Stripe webhook signing secret — add after webhook registration)
- `STRIPE_STARTER_PRICE_ID`
- `STRIPE_PROFESSIONAL_PRICE_ID`
- `STRIPE_ENTERPRISE_PRICE_ID`

---

## Project details:
- **Product name:** WealthPlanrAI
- **Domain:** wealthplanrai.com
- **GitHub:** https://github.com/pavanreddypoli/wealthplanrai
- **Vercel:** https://wealthplanrai.vercel.app
- **Supabase project:** gvrycagcpyqhrixyscnc
- **Tables:** profiles, assessments, assessment_answers, advisor_notes, clients, compliance_items, firms
