import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/Button'
import { ArrowRight, BarChart3, ShieldCheck, Brain, Zap, Users, TrendingUp } from 'lucide-react'

const FEATURES = [
  {
    icon: Brain,
    title: 'AI Advisor',
    description: 'Ask any financial planning question. Get compliance-aware answers with regulatory citations built in.',
  },
  {
    icon: ShieldCheck,
    title: 'Compliance-first',
    description: 'Every output auto-includes FINRA, SEC, and Reg BI disclaimers. Stay protected, always.',
  },
  {
    icon: BarChart3,
    title: 'Monte Carlo projections',
    description: 'Run thousands of simulations in seconds. Show clients probability-based retirement outcomes.',
  },
  {
    icon: TrendingUp,
    title: 'Tax-loss harvesting',
    description: 'Automatically surface harvest opportunities with wash-sale rule guidance built in.',
  },
  {
    icon: Users,
    title: 'Client management',
    description: 'Unified client profiles with portfolio allocation, risk scoring, and review tracking.',
  },
  {
    icon: Zap,
    title: 'Smart reports',
    description: 'Generate and email polished client reports in one click — with disclaimer auto-append.',
  },
]

const PLANS = [
  {
    name: 'Starter',
    price: '$149',
    period: '/mo',
    description: 'Solo advisors and CFPs',
    features: ['AI Advisor chat', 'Retirement calculator', 'Monte Carlo (500 runs)', 'Email reports (100/mo)'],
    cta: 'Start free trial',
    highlighted: false,
  },
  {
    name: 'Professional',
    price: '$399',
    period: '/mo',
    description: 'Growing RIA firms',
    features: ['Everything in Starter', 'Tax-loss harvesting', 'Full compliance center', 'Unlimited reports', 'Document analysis'],
    cta: 'Start free trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: '$999',
    period: '/mo',
    description: 'Large broker-dealers',
    features: ['Everything in Pro', 'White-label branding', 'Salesforce CRM integration', 'SSO / Active Directory', 'SLA + priority support'],
    cta: 'Contact sales',
    highlighted: false,
  },
]

export default function HomePage() {
  return (
    <div className="bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-gray-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(220,38,38,0.15),transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 lg:py-36 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-900/50 border border-brand-800 text-brand-400 text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
            Now in early access — 14-day free trial
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
            The AI wealth platform<br />
            <span className="text-brand-400">built for advisors</span>
          </h1>
          <p className="mt-6 text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            RedCube WealthOS combines AI-powered financial planning, compliance automation,
            and client management in one place — so you can focus on advice, not admin.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/assessment">
              <Button size="lg" className="w-full sm:w-auto">
                Start free assessment <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto bg-transparent text-white border-gray-700 hover:bg-gray-800">
                See how it works
              </Button>
            </Link>
          </div>
          <p className="mt-4 text-xs text-gray-500">No credit card required · 14-day free trial · Cancel anytime</p>
        </div>
      </section>

      {/* Social proof strip */}
      <div className="bg-gray-50 border-y border-gray-200 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-sm text-gray-500">
            <span className="font-medium text-gray-700">Trusted by advisors at</span>
            {['Raymond James', 'LPL Financial', 'Ameriprise', 'Edward Jones'].map(name => (
              <span key={name} className="font-semibold text-gray-400">{name}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <section id="features" className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Everything your practice needs</h2>
            <p className="mt-3 text-gray-500 max-w-xl mx-auto">
              Purpose-built for registered investment advisors. Compliance-first, AI-powered, and ready on day one.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map(f => {
              const Icon = f.icon
              return (
                <div key={f.title} className="p-6 rounded-xl border border-gray-100 hover:border-brand-200 hover:shadow-sm transition-all">
                  <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-brand-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Compliance callout */}
      <section className="bg-brand-600 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="text-white text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-2 mb-3">
              <ShieldCheck className="w-5 h-5" />
              <span className="text-sm font-semibold uppercase tracking-wide opacity-80">Compliance built in</span>
            </div>
            <h2 className="text-2xl font-bold">SEC · FINRA · Reg BI · CFPB</h2>
            <p className="mt-2 text-brand-100 max-w-xl">
              Every AI response, client report, and generated document automatically includes
              required regulatory disclaimers — reviewed and updated quarterly.
            </p>
          </div>
          <Link href="/assessment" className="flex-shrink-0">
            <Button size="lg" className="bg-white text-brand-700 hover:bg-brand-50">
              Get started free <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Simple, transparent pricing</h2>
            <p className="mt-3 text-gray-500">All plans include a 14-day free trial. No credit card required.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {PLANS.map(plan => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 border ${
                  plan.highlighted
                    ? 'bg-gray-950 text-white border-gray-800 shadow-xl scale-105'
                    : 'bg-white text-gray-900 border-gray-200'
                }`}
              >
                {plan.highlighted && (
                  <div className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-brand-600 text-white text-xs font-medium mb-4">
                    Most popular
                  </div>
                )}
                <h3 className="font-bold text-lg">{plan.name}</h3>
                <p className={`text-sm mt-1 ${plan.highlighted ? 'text-gray-400' : 'text-gray-500'}`}>
                  {plan.description}
                </p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className={plan.highlighted ? 'text-gray-400' : 'text-gray-500'}>{plan.period}</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map(f => (
                    <li key={f} className={`flex items-start gap-2 text-sm ${plan.highlighted ? 'text-gray-300' : 'text-gray-600'}`}>
                      <span className="text-brand-500 mt-0.5 flex-shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/assessment" className="block mt-8">
                  <Button
                    className="w-full"
                    variant={plan.highlighted ? 'primary' : 'secondary'}
                    size="md"
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-md bg-brand-600 flex items-center justify-center">
                <BarChart3 className="w-3.5 h-3.5 text-white" />
              </span>
              <span className="font-semibold text-white">RedCube WealthOS</span>
            </div>
            <p className="text-xs text-center">
              © {new Date().getFullYear()} RedCube WealthOS. For licensed financial advisors only.
              Not investment advice. SEC · FINRA regulated.
            </p>
            <div className="flex gap-6 text-sm">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="/terms"   className="hover:text-white transition-colors">Terms</Link>
              <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
