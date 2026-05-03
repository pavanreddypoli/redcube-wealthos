'use client'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { BarChart3, ShieldCheck, Brain, Zap, Users, TrendingUp } from 'lucide-react'

const heroStyles = `
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-12px); }
  }
  @keyframes float2 {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-8px); }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeInRight {
    from { opacity: 0; transform: translateX(30px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes pulse-ring {
    0% { transform: scale(1); opacity: 0.8; }
    70% { transform: scale(2.2); opacity: 0; }
    100% { transform: scale(1); opacity: 0; }
  }
  @keyframes shimmer {
    0% { background-position: -200% center; }
    100% { background-position: 200% center; }
  }
  @keyframes bounce-slow {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
  }
  .shimmer-text {
    background: linear-gradient(90deg, #60A5FA, #93C5FD, #ffffff, #93C5FD, #60A5FA);
    background-size: 200% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 4s linear infinite;
  }
  .float-anim { animation: float 6s ease-in-out infinite; }
  .float2-anim { animation: float2 8s ease-in-out infinite; }
  .fade-in-up { animation: fadeInUp 0.8s ease forwards; }
  .fade-in-right { animation: fadeInRight 0.8s ease 0.4s both; }
  .bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }
  .pulse-dot { position: relative; display: inline-block; }
  .pulse-dot::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: #60A5FA;
    animation: pulse-ring 2s ease-out infinite;
  }
`

function Particles() {
  const dots = [
    { top: '15%', left: '8%',  size: 3, delay: '0s',   dur: '4s'   },
    { top: '25%', left: '92%', size: 2, delay: '0.5s',  dur: '5s'   },
    { top: '45%', left: '5%',  size: 4, delay: '1s',    dur: '6s'   },
    { top: '60%', left: '95%', size: 2, delay: '1.5s',  dur: '4.5s' },
    { top: '80%', left: '12%', size: 3, delay: '0.8s',  dur: '5.5s' },
    { top: '10%', left: '50%', size: 2, delay: '2s',    dur: '7s'   },
    { top: '35%', left: '75%', size: 3, delay: '0.3s',  dur: '4s'   },
    { top: '70%', left: '30%', size: 2, delay: '1.2s',  dur: '6s'   },
    { top: '20%', left: '65%', size: 4, delay: '0.7s',  dur: '5s'   },
    { top: '85%', left: '60%', size: 2, delay: '1.8s',  dur: '4s'   },
    { top: '5%',  left: '30%', size: 3, delay: '2.5s',  dur: '5.5s' },
    { top: '50%', left: '85%', size: 2, delay: '0.4s',  dur: '6.5s' },
    { top: '75%', left: '45%', size: 4, delay: '1.6s',  dur: '4.5s' },
    { top: '30%', left: '20%', size: 2, delay: '2.2s',  dur: '7s'   },
    { top: '90%', left: '80%', size: 3, delay: '0.9s',  dur: '5s'   },
    { top: '40%', left: '55%', size: 2, delay: '1.4s',  dur: '4s'   },
    { top: '65%', left: '10%', size: 3, delay: '2.8s',  dur: '6s'   },
    { top: '18%', left: '40%', size: 2, delay: '0.6s',  dur: '5.5s' },
    { top: '55%', left: '68%', size: 4, delay: '2.1s',  dur: '4.5s' },
    { top: '92%', left: '25%', size: 2, delay: '1.1s',  dur: '6.5s' },
  ]
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {dots.map((d, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            top: d.top,
            left: d.left,
            width: d.size,
            height: d.size,
            background: 'rgba(96,165,250,0.35)',
            animation: `float ${d.dur} ease-in-out ${d.delay} infinite`,
          }}
        />
      ))}
    </div>
  )
}

function AnimatedDashboard() {
  return (
    <div className="relative w-full max-w-lg mx-auto fade-in-right">
      {/* Main glassmorphism card */}
      <div
        className="rounded-3xl p-6 float-anim"
        style={{
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
        }}
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '11px' }}>Financial Health Score</p>
            <div className="flex items-end gap-2 mt-0.5">
              <span className="text-3xl font-bold text-white">78</span>
              <span className="text-sm mb-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>/ 100</span>
            </div>
          </div>
          <svg width="64" height="64" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6"/>
            <circle cx="32" cy="32" r="26" fill="none" stroke="#3B82F6" strokeWidth="6"
              strokeDasharray="130 33" strokeLinecap="round" transform="rotate(-90 32 32)" />
            <text x="32" y="38" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">78</text>
          </svg>
        </div>

        {/* Three pillars */}
        <div className="space-y-3 mb-5">
          {[
            { label: 'PROTECT', pct: 80, color: '#3B82F6' },
            { label: 'GROW',    pct: 60, color: '#10B981' },
            { label: 'LEGACY',  pct: 45, color: '#8B5CF6' },
          ].map(p => (
            <div key={p.label}>
              <div className="flex justify-between mb-1" style={{ fontSize: '11px' }}>
                <span style={{ color: 'rgba(255,255,255,0.55)' }}>{p.label}</span>
                <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{p.pct}%</span>
              </div>
              <div className="h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
                <div className="h-full rounded-full" style={{ width: `${p.pct}%`, background: p.color }} />
              </div>
            </div>
          ))}
        </div>

        {/* Client rows */}
        <div className="space-y-2">
          {[
            { initials: 'JD', name: 'James Davidson',  score: 82, bg: '#DBEAFE', fg: '#1E40AF' },
            { initials: 'SR', name: 'Sarah Rodriguez', score: 67, bg: '#FEF3C7', fg: '#92400E' },
            { initials: 'MK', name: 'Mike Kim',        score: 54, bg: '#FCE7F3', fg: '#9D174D' },
          ].map(c => (
            <div key={c.initials} className="flex items-center gap-3 p-2.5 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.04)' }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: c.bg, color: c.fg, fontSize: '11px', fontWeight: 700 }}>
                {c.initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate" style={{ color: 'rgba(255,255,255,0.75)', fontSize: '12px', fontWeight: 500 }}>
                  {c.name}
                </p>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.55)', fontSize: '12px', fontWeight: 700 }}>{c.score}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Floating badge — AI Powered */}
      <div
        className="absolute -top-4 -right-6 rounded-2xl px-3 py-2 float2-anim"
        style={{
          background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
          boxShadow: '0 8px 24px rgba(37,99,235,0.45)',
        }}
      >
        <p style={{ color: 'white', fontSize: '10px', fontWeight: 700 }}>AI Powered</p>
        <p style={{ color: '#BFDBFE', fontSize: '9px' }}>FINRA Compliant</p>
      </div>

      {/* Floating badge — Reports */}
      <div
        className="absolute -bottom-4 -left-6 rounded-2xl px-3 py-2 float2-anim"
        style={{
          background: 'linear-gradient(135deg, #059669, #047857)',
          boxShadow: '0 8px 24px rgba(5,150,105,0.45)',
          animationDelay: '1s',
        }}
      >
        <p style={{ color: 'white', fontSize: '10px', fontWeight: 700 }}>14 reports</p>
        <p style={{ color: '#A7F3D0', fontSize: '9px' }}>sent this week</p>
      </div>
    </div>
  )
}

const FEATURES = [
  {
    icon: Brain,
    title: 'AI Advisor',
    description: 'Ask any financial planning question. Get compliance-aware answers with regulatory citations built in.',
    gradient: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
    iconColor: '#2563EB',
  },
  {
    icon: ShieldCheck,
    title: 'Compliance-first',
    description: 'Every output auto-includes FINRA, SEC, and Reg BI disclaimers. Stay protected, always.',
    gradient: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)',
    iconColor: '#16A34A',
  },
  {
    icon: BarChart3,
    title: 'Monte Carlo projections',
    description: 'Run thousands of simulations in seconds. Show clients probability-based retirement outcomes.',
    gradient: 'linear-gradient(135deg, #F5F3FF, #EDE9FE)',
    iconColor: '#7C3AED',
  },
  {
    icon: TrendingUp,
    title: 'Tax-loss harvesting',
    description: 'Automatically surface harvest opportunities with wash-sale rule guidance built in.',
    gradient: 'linear-gradient(135deg, #FFFBEB, #FEF3C7)',
    iconColor: '#D97706',
  },
  {
    icon: Users,
    title: 'Client management',
    description: 'Unified client profiles with portfolio allocation, risk scoring, and review tracking.',
    gradient: 'linear-gradient(135deg, #FFF1F2, #FFE4E6)',
    iconColor: '#E11D48',
  },
  {
    icon: Zap,
    title: 'Smart reports',
    description: 'Generate and email polished client reports in one click — with disclaimer auto-append.',
    gradient: 'linear-gradient(135deg, #ECFEFF, #CFFAFE)',
    iconColor: '#0891B2',
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

const TESTIMONIALS = [
  {
    name: 'Sarah Chen, CFP',
    role: 'Independent RIA, San Francisco',
    quote: 'WealthPlanrAI cut my client onboarding time in half. The AI assessment gives me a complete picture before the first meeting — my clients love the personalized reports.',
    avatar: 'SC',
    bg: '#DBEAFE',
    fg: '#1E40AF',
  },
  {
    name: 'Marcus Williams',
    role: 'Senior Advisor, Raymond James',
    quote: "The compliance automation alone is worth it. Every report auto-appends the right disclaimers. I haven't had a compliance issue since we switched.",
    avatar: 'MW',
    bg: '#D1FAE5',
    fg: '#065F46',
  },
  {
    name: 'Jennifer Park, ChFC',
    role: 'Wealth Manager, Chicago',
    quote: 'Monte Carlo projections used to take me 45 minutes. Now I run them in 20 seconds, right in front of the client. The wow factor is incredible.',
    avatar: 'JP',
    bg: '#EDE9FE',
    fg: '#4C1D95',
  },
]

export default function HomePage() {
  return (
    <div className="bg-white">
      <style>{heroStyles}</style>
      <Navbar />

      {/* Hero — dark gradient */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E3A8A 50%, #0F172A 100%)' }}
      >
        {/* Grid overlay */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(99,102,241,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.15) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            opacity: 0.4,
          }}
        />
        <Particles />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 lg:py-36 flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

          {/* Left — text */}
          <div className="flex-1 text-center lg:text-left fade-in-up">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-xs font-medium"
              style={{
                background: 'rgba(37,99,235,0.2)',
                border: '1px solid rgba(59,130,246,0.35)',
                color: '#93C5FD',
              }}
            >
              <span className="pulse-dot w-1.5 h-1.5 rounded-full bg-blue-400" style={{ display: 'inline-block' }} />
              Now in early access — 14-day free trial
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight text-white mb-1">
              The AI Financial Advisor
            </h1>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight mb-1 shimmer-text">
              Built for Modern
            </h1>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight text-white mb-6">
              Planners
            </h1>

            <p
              className="text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8"
              style={{ color: 'rgba(255,255,255,0.6)' }}
            >
              WealthPlanrAI combines artificial intelligence with compliance-first financial planning —
              helping advisors assess clients, identify gaps, and deliver personalized plans in minutes.
            </p>

            {/* Stats row */}
            <div className="flex flex-wrap gap-8 justify-center lg:justify-start mb-10">
              {[
                { num: '9',    label: 'Assessment sections' },
                { num: '3',    label: 'AI-powered pillars'  },
                { num: '100%', label: 'FINRA compliant'     },
              ].map(s => (
                <div key={s.label} className="text-center lg:text-left">
                  <p className="text-2xl font-bold text-white">{s.num}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a
                href="/assessment"
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '14px 28px', borderRadius: '12px', fontSize: '15px', fontWeight: 700,
                  background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                  color: 'white', textDecoration: 'none',
                  boxShadow: '0 8px 24px rgba(37,99,235,0.4)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 12px 32px rgba(37,99,235,0.55)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(37,99,235,0.4)'
                }}
              >
                Start Free Assessment →
              </a>
              <a
                href="#features"
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  padding: '14px 28px', borderRadius: '12px', fontSize: '15px', fontWeight: 600,
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'rgba(255,255,255,0.85)', textDecoration: 'none',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
              >
                See how it works
              </a>
            </div>

            <p className="mt-4 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
              No credit card required · 14-day free trial · Cancel anytime
            </p>
          </div>

          {/* Right — animated dashboard */}
          <div className="w-full lg:flex-shrink-0 lg:w-[460px]">
            <AnimatedDashboard />
          </div>
        </div>
      </section>

      {/* Social proof stats */}
      <div className="bg-gray-50 border-y border-gray-200 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { num: '500+',   label: 'Assessments completed'  },
              { num: '98%',    label: 'Client satisfaction'     },
              { num: '14 min', label: 'Avg assessment time'     },
              { num: '100%',   label: 'FINRA compliant outputs' },
            ].map(s => (
              <div key={s.label}>
                <p className="text-3xl font-bold text-gray-900">{s.num}</p>
                <p className="text-sm text-gray-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-3 mt-8 pt-8 border-t border-gray-200">
            <span className="text-sm font-medium text-gray-500">Trusted by advisors at</span>
            {['Raymond James', 'LPL Financial', 'Ameriprise', 'Edward Jones'].map(name => (
              <span key={name} className="font-semibold text-gray-400 text-sm">{name}</span>
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
                <div
                  key={f.title}
                  className="p-6 rounded-2xl border border-gray-100"
                  style={{ transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s', cursor: 'pointer' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.08)'
                    e.currentTarget.style.borderColor = 'rgba(37,99,235,0.25)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.borderColor = 'rgb(243,244,246)'
                  }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: f.gradient }}
                  >
                    <Icon className="w-5 h-5" style={{ color: f.iconColor }} />
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
      <section
        className="py-16"
        style={{ background: 'linear-gradient(135deg, #1E3A8A, #2563EB)' }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="text-white text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-2 mb-3">
              <ShieldCheck className="w-5 h-5 bounce-slow" />
              <span className="text-sm font-semibold uppercase tracking-wide opacity-80">Compliance built in</span>
            </div>
            <h2 className="text-2xl font-bold">SEC · FINRA · Reg BI · CFPB</h2>
            <p className="mt-2 text-blue-100 max-w-xl">
              Every AI response, client report, and generated document automatically includes
              required regulatory disclaimers — reviewed and updated quarterly.
            </p>
          </div>
          <a
            href="/pricing"
            style={{
              flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '14px 28px', borderRadius: '12px', fontSize: '15px', fontWeight: 700,
              background: 'white', color: '#1E3A8A', textDecoration: 'none',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#EFF6FF' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'white' }}
          >
            Get started free →
          </a>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-[#F8FAFC]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Simple, transparent pricing</h2>
            <p className="mt-3 text-gray-500">All plans include a 14-day free trial. No credit card required.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {PLANS.map(plan => (
              <div
                key={plan.name}
                className={`rounded-2xl p-8 border relative overflow-hidden ${
                  plan.highlighted ? 'text-white border-transparent' : 'bg-white text-gray-900 border-gray-200'
                }`}
                style={plan.highlighted ? {
                  background: 'linear-gradient(135deg, #1E3A8A, #2563EB)',
                  boxShadow: '0 0 60px rgba(37,99,235,0.22), 0 20px 40px rgba(37,99,235,0.15)',
                  transform: 'scale(1.03)',
                } : {}}
              >
                {plan.highlighted && (
                  <div
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold mb-4"
                    style={{ background: 'rgba(255,255,255,0.18)', color: 'white', animation: 'float2 3s ease-in-out infinite' }}
                  >
                    MOST POPULAR
                  </div>
                )}
                <h3 className="font-bold text-lg">{plan.name}</h3>
                <p className={`text-sm mt-1 ${plan.highlighted ? 'text-blue-200' : 'text-gray-500'}`}>
                  {plan.description}
                </p>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className={plan.highlighted ? 'text-blue-200' : 'text-gray-500'}>{plan.period}</span>
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map(f => (
                    <li key={f} className={`flex items-start gap-2 text-sm ${plan.highlighted ? 'text-blue-100' : 'text-gray-600'}`}>
                      <span className={`mt-0.5 flex-shrink-0 font-bold ${plan.highlighted ? 'text-blue-200' : 'text-blue-500'}`}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href="/pricing"
                  className="block mt-8 text-center font-semibold text-sm py-3 px-6 rounded-xl"
                  style={plan.highlighted
                    ? { background: 'white', color: '#1E3A8A', textDecoration: 'none' }
                    : { background: '#2563EB', color: 'white', textDecoration: 'none' }
                  }
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Loved by financial professionals</h2>
            <p className="mt-3 text-gray-500">See what advisors are saying about WealthPlanrAI.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-white rounded-2xl border border-gray-100 p-7 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                    style={{ background: t.bg, color: t.fg }}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-amber-400 text-sm">★</span>
                  ))}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-gray-400 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-md bg-brand-600 flex items-center justify-center">
                <BarChart3 className="w-3.5 h-3.5 text-white" />
              </span>
              <span className="font-semibold text-white">WealthPlanrAI</span>
            </div>
            <p className="text-xs text-center">
              © {new Date().getFullYear()} WealthPlanrAI Inc. For licensed financial advisors only.
              SEC · FINRA · Reg BI compliant.
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
