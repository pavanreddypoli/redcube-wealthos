'use client'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { BarChart3, ShieldCheck } from 'lucide-react'

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
        <p style={{ color: '#BFDBFE', fontSize: '9px' }}>For Licensed Advisors</p>
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
    icon: '🤖',
    gradient: 'linear-gradient(135deg, #667eea, #764ba2)',
    shadow: 'rgba(102,126,234,0.4)',
    title: 'AI-Powered Analysis',
    desc: 'Claude AI analyzes all 9 financial dimensions and generates professionally formatted plans in minutes.',
  },
  {
    icon: '🛡️',
    gradient: 'linear-gradient(135deg, #f093fb, #f5576c)',
    shadow: 'rgba(245,87,108,0.4)',
    title: 'Compliance-Aware Documentation',
    desc: 'Every report includes proper disclaimers, Reg BI language templates, and documentation designed for licensed professionals.',
  },
  {
    icon: '📊',
    gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)',
    shadow: 'rgba(79,172,254,0.4)',
    title: 'Three Pillars Framework',
    desc: 'Protect, Grow, and Leave a Legacy — a comprehensive framework clients instantly understand.',
  },
  {
    icon: '⚡',
    gradient: 'linear-gradient(135deg, #43e97b, #38f9d7)',
    shadow: 'rgba(67,233,123,0.4)',
    title: 'Instant PDF Reports',
    desc: 'Client summary and advisor analysis PDFs generated automatically and emailed instantly.',
  },
  {
    icon: '🎯',
    gradient: 'linear-gradient(135deg, #fa709a, #fee140)',
    shadow: 'rgba(250,112,154,0.4)',
    title: 'Smart Lead Matching',
    desc: 'Clients browse and select their preferred advisor — warm leads delivered to your inbox.',
  },
  {
    icon: '📱',
    gradient: 'linear-gradient(135deg, #a18cd1, #fbc2eb)',
    shadow: 'rgba(161,140,209,0.4)',
    title: 'Mobile Friendly',
    desc: 'Clients complete assessments on any device — phone, tablet, or desktop.',
  },
]

const STEPS = [
  {
    number: '01',
    icon: '📋',
    color: '#3B82F6',
    bg: '#EFF6FF',
    title: 'Client Completes Assessment',
    desc: 'Client fills out our 9-section financial assessment in about 8 minutes.',
  },
  {
    number: '02',
    icon: '🤖',
    color: '#8B5CF6',
    bg: '#F5F3FF',
    title: 'AI Analyzes Everything',
    desc: 'WealthPlanrAI scores all dimensions and identifies gaps across all three pillars.',
  },
  {
    number: '03',
    icon: '📧',
    color: '#10B981',
    bg: '#F0FDF4',
    title: 'Reports Delivered Instantly',
    desc: 'Client gets a summary email. You get a full advisor report with PDF attachments.',
  },
  {
    number: '04',
    icon: '🤝',
    color: '#F59E0B',
    bg: '#FFFBEB',
    title: 'Advisor Connects with Client',
    desc: 'Client selects you as their advisor. You reach out with a personalized plan.',
  },
]

const BADGES = [
  { icon: '🏛️', label: 'Built for SEC-Regulated Advisors' },
  { icon: '⚖️', label: 'FINRA Rule 2111 Aware' },
  { icon: '🔒', label: 'Encrypted Data Storage' },
  { icon: '📜', label: 'Reg BI Disclaimer Templates' },
  { icon: '🛡️', label: 'Enterprise-grade Infrastructure' },
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
    features: ['Everything in Starter', 'Tax-loss harvesting', 'Compliance documentation tools', 'Unlimited reports', 'Document analysis'],
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
              AI-powered financial planning for modern advisors — and the clients they serve.
            </p>

            {/* Stats row */}
            <div className="flex flex-wrap gap-8 justify-center lg:justify-start mb-10">
              {[
                { num: '9',   label: 'Assessment sections'        },
                { num: '3',   label: 'AI-powered pillars'         },
                { num: '14+', label: 'Disclaimer templates'       },
              ].map(s => (
                <div key={s.label} className="text-center lg:text-left">
                  <p className="text-2xl font-bold text-white">{s.num}</p>
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* CTA buttons — inline-flex so they never stretch full-width */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}
              className="lg:justify-start">
              <a
                href="/assessment"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                  color: 'white', padding: '10px 20px', borderRadius: '10px',
                  fontSize: '13px', fontWeight: 600, textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(37,99,235,0.35)',
                  whiteSpace: 'nowrap', transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 20px rgba(37,99,235,0.5)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(37,99,235,0.35)'
                }}
              >
                Start Free Assessment →
              </a>
              <a
                href="/pricing"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  color: 'white', padding: '10px 20px', borderRadius: '10px',
                  fontSize: '13px', fontWeight: 600, textDecoration: 'none',
                  whiteSpace: 'nowrap', transition: 'background 0.2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)' }}
              >
                View Pricing
              </a>
            </div>

            <p className="mt-4 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
              No credit card required · 14-day free trial · Cancel anytime
            </p>

            <p className="mt-3 text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Planning for yourself?{' '}
              <a href="/consumer/pricing" style={{ color: '#93C5FD', textDecoration: 'underline' }}>
                See individual plans →
              </a>
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
              { num: '500+',   label: 'Assessments completed'          },
              { num: '98%',    label: 'Client satisfaction'           },
              { num: '14 min', label: 'Avg assessment time'           },
              { num: '14+',    label: 'Regulatory disclaimer templates' },
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
            <h2 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Sora, sans-serif' }}>
              Everything your practice needs
            </h2>
            <p className="mt-3 text-gray-500 max-w-xl mx-auto">
              Purpose-built for registered investment advisors. Compliance-first, AI-powered, and ready on day one.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(feature => (
              <div
                key={feature.title}
                style={{
                  background: 'white',
                  borderRadius: '16px',
                  padding: '24px',
                  border: '1px solid #E2E8F0',
                  transition: 'all 0.25s ease',
                  cursor: 'default',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-6px)'
                  e.currentTarget.style.boxShadow = `0 20px 40px ${feature.shadow}`
                  e.currentTarget.style.borderColor = 'transparent'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                  e.currentTarget.style.borderColor = '#E2E8F0'
                }}
              >
                <div style={{
                  width: '52px', height: '52px', borderRadius: '14px',
                  background: feature.gradient,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '24px', marginBottom: '16px',
                  boxShadow: `0 8px 16px ${feature.shadow}`,
                }}>
                  {feature.icon}
                </div>
                <h3 style={{
                  fontFamily: 'Sora, sans-serif', fontSize: '15px', fontWeight: 700,
                  color: '#0F172A', marginBottom: '8px',
                }}>
                  {feature.title}
                </h3>
                <p style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.6' }}>
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ background: 'white', padding: '80px 24px', borderTop: '1px solid #E2E8F0' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '56px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: '#F0FDF4', border: '1px solid #BBF7D0',
              borderRadius: '20px', padding: '6px 14px', marginBottom: '16px',
            }}>
              <span style={{ color: '#10B981', fontSize: '12px', fontWeight: 600 }}>Simple Process</span>
            </div>
            <h2 style={{
              fontFamily: 'Sora, sans-serif',
              fontSize: 'clamp(24px, 3vw, 36px)', fontWeight: 800,
              color: '#0F172A', marginBottom: '12px',
            }}>
              How WealthPlanrAI Works
            </h2>
            <p style={{ color: '#64748B', fontSize: '15px', maxWidth: '480px', margin: '0 auto' }}>
              From assessment to advisor connection in minutes — not days
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '24px',
          }}>
            {STEPS.map((step, i) => (
              <div key={step.number} style={{ textAlign: 'center', padding: '16px' }}>
                <div style={{
                  width: '72px', height: '72px', borderRadius: '20px',
                  background: step.bg, border: `2px solid ${step.color}22`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '32px', margin: '0 auto 16px', position: 'relative',
                  boxShadow: `0 4px 16px ${step.color}22`,
                }}>
                  {step.icon}
                  <div style={{
                    position: 'absolute', top: '-8px', right: '-8px',
                    width: '24px', height: '24px', borderRadius: '50%',
                    background: step.color, color: 'white',
                    fontSize: '10px', fontWeight: 800,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {i + 1}
                  </div>
                </div>
                <h3 style={{
                  fontFamily: 'Sora, sans-serif', fontSize: '15px', fontWeight: 700,
                  color: '#0F172A', marginBottom: '8px',
                }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.6' }}>
                  {step.desc}
                </p>
              </div>
            ))}
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
              <span className="text-sm font-semibold uppercase tracking-wide opacity-80">Compliance-aware documentation</span>
            </div>
            <h2 className="text-2xl font-bold">Designed for SEC & FINRA regulated advisors</h2>
            <p className="mt-2 text-blue-100 max-w-xl">
              Every AI response, client report, and generated document automatically includes
              regulatory disclaimer templates — reviewed and updated quarterly.
            </p>
            {/* Trust badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '20px' }}>
              {BADGES.map(b => (
                <div key={b.label} style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '20px', padding: '6px 14px',
                  fontSize: '12px', fontWeight: 500, color: 'white',
                }}>
                  <span>{b.icon}</span>
                  <span>{b.label}</span>
                </div>
              ))}
            </div>
          </div>
          <a
            href="/pricing"
            style={{
              flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 700,
              background: 'white', color: '#1E3A8A', textDecoration: 'none',
              whiteSpace: 'nowrap', transition: 'background 0.2s',
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
                  className="block mt-8 text-center font-semibold text-sm rounded-xl"
                  style={{
                    padding: '10px 20px', fontSize: '13px', textDecoration: 'none',
                    ...(plan.highlighted
                      ? { background: 'white', color: '#1E3A8A' }
                      : { background: '#2563EB', color: 'white' }),
                  }}
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

      {/* Regulatory Disclosure */}
      <div style={{
        background: '#F8FAFC',
        borderTop: '1px solid #E2E8F0',
        padding: '24px',
        textAlign: 'center',
      }}>
        <p style={{
          fontSize: '11px',
          color: '#94A3B8',
          maxWidth: '800px',
          margin: '0 auto',
          lineHeight: '1.7',
        }}>
          <strong style={{ color: '#64748B' }}>Important Disclosure:</strong>{' '}
          WealthPlanrAI is a technology platform for licensed financial professionals only.
          We are not a registered investment advisor, broker-dealer, or FINRA member.
          This platform does not constitute investment advice. Licensed advisors using
          this platform are solely responsible for their own regulatory compliance,
          client suitability determinations, and adherence to applicable FINRA, SEC,
          and state regulations. All AI-generated content must be reviewed by a
          licensed professional before use with clients.
        </p>
      </div>

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
              © {new Date().getFullYear()} WealthPlanrAI Inc. For licensed financial professionals only.
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
