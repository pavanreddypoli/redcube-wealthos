'use client'
import { useState, useEffect } from 'react'
import { CheckoutButton } from '@/app/pricing/CheckoutButton'

interface FoundingConfig {
  total:         number
  claimed:       number
  remaining:     number
  isActive:      boolean
  offerEndsAt:   string
  priceFounding: number
  priceRegular:  number
}

interface TimeLeft {
  days: number; hours: number; minutes: number; seconds: number
}

export default function ConsumerPricingPage() {
  const [config, setConfig] = useState<FoundingConfig>({
    total: 500, claimed: 0, remaining: 500, isActive: true,
    offerEndsAt: '', priceFounding: 2.90, priceRegular: 29.00,
  })
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    fetch('/api/founding-members/count')
      .then(r => r.json())
      .then((data: FoundingConfig) => { setConfig(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!config.offerEndsAt) return
    const interval = setInterval(() => {
      const now  = new Date().getTime()
      const end  = new Date(config.offerEndsAt).getTime()
      const diff = end - now
      if (diff <= 0) { clearInterval(interval); return }
      setTimeLeft({
        days:    Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours:   Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [config.offerEndsAt])

  const progressPct = Math.min(100, (config.claimed / config.total) * 100)
  const spotsLeft   = config.remaining
  const discount    = Math.round((1 - config.priceFounding / config.priceRegular) * 100)

  if (loading) return null

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>

      {/* Nav */}
      <nav style={{
        background: 'white', borderBottom: '1px solid #E2E8F0',
        padding: '0 24px', height: '56px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px',
          }}>📈</div>
          <span style={{ fontFamily: 'Sora,sans-serif', fontWeight: 700, fontSize: '15px', color: '#0F172A' }}>
            WealthPlanr<span style={{ color: '#2563EB' }}>AI</span>
          </span>
        </a>
        <a href="/auth/login" style={{ fontSize: '13px', color: '#64748B', textDecoration: 'none' }}>
          Already a member? Sign in
        </a>
      </nav>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '48px 24px' }}>

        {/* Founding member banner */}
        {config.isActive && (
          <div style={{
            background: 'linear-gradient(135deg, #1E3A8A, #2563EB)',
            borderRadius: '16px', padding: '20px 24px', marginBottom: '32px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: '16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '28px' }}>🏆</span>
              <div>
                <p style={{
                  color: '#93C5FD', fontSize: '11px', fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '1px',
                }}>
                  Limited Time — Founding Member Offer
                </p>
                <p style={{ color: 'white', fontSize: '16px', fontWeight: 700, marginTop: '2px' }}>
                  {discount}% off — Lock in ${config.priceFounding}/mo forever
                </p>
              </div>
            </div>

            {/* Countdown timer */}
            {config.offerEndsAt && (
              <div style={{ display: 'flex', gap: '8px' }}>
                {([
                  { value: timeLeft.days,    label: 'days' },
                  { value: timeLeft.hours,   label: 'hrs'  },
                  { value: timeLeft.minutes, label: 'min'  },
                  { value: timeLeft.seconds, label: 'sec'  },
                ] as { value: number; label: string }[]).map(t => (
                  <div key={t.label} style={{
                    background: 'rgba(255,255,255,0.15)', borderRadius: '8px',
                    padding: '8px 12px', textAlign: 'center', minWidth: '52px',
                  }}>
                    <p style={{ color: 'white', fontSize: '20px', fontWeight: 800, lineHeight: '1' }}>
                      {String(t.value).padStart(2, '0')}
                    </p>
                    <p style={{ color: '#93C5FD', fontSize: '10px', marginTop: '2px' }}>
                      {t.label}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Spots progress bar */}
        {config.isActive && (
          <div style={{
            background: 'white', borderRadius: '12px', padding: '16px 20px',
            border: '1px solid #E2E8F0', marginBottom: '32px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#0F172A' }}>
                🔥 {config.claimed} founding members have joined
              </span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#EF4444' }}>
                Only {spotsLeft} spots left!
              </span>
            </div>
            <div style={{ height: '8px', background: '#F1F5F9', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: '4px',
                width: `${progressPct}%`,
                background: 'linear-gradient(90deg, #2563EB, #7C3AED)',
                transition: 'width 0.5s ease',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
              <span style={{ fontSize: '11px', color: '#94A3B8' }}>0</span>
              <span style={{ fontSize: '11px', color: '#94A3B8' }}>{config.total} founding member spots total</span>
            </div>
          </div>
        )}

        {/* Page header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{
            fontFamily: 'Sora,sans-serif', fontSize: 'clamp(28px,4vw,40px)',
            fontWeight: 800, color: '#0F172A', marginBottom: '12px', lineHeight: '1.2',
          }}>
            Take control of your financial future
          </h1>
          <p style={{ fontSize: '16px', color: '#64748B', maxWidth: '520px', margin: '0 auto', lineHeight: '1.7' }}>
            Get your personalized financial health score, AI-powered insights,
            and a roadmap to reach your goals — all in one place.
          </p>
        </div>

        {/* Two plan cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '40px' }}>

          {/* FREE card */}
          <div style={{
            background: 'white', borderRadius: '20px',
            border: '1px solid #E2E8F0', padding: '32px',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ marginBottom: '20px' }}>
              <p style={{
                fontSize: '12px', fontWeight: 600, color: '#64748B',
                textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px',
              }}>
                Free
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                <span style={{ fontSize: '36px', fontWeight: 800, color: '#0F172A', fontFamily: 'Sora,sans-serif' }}>$0</span>
                <span style={{ fontSize: '14px', color: '#94A3B8' }}>/mo</span>
              </div>
              <p style={{ fontSize: '13px', color: '#64748B', marginTop: '8px' }}>
                Get started with your financial health assessment
              </p>
            </div>

            <div style={{ flex: 1, marginBottom: '24px' }}>
              {[
                'Financial health assessment',
                'Overall health score (0-100)',
                'Three Pillars analysis',
                'Basic PDF summary',
                'Advisor matching',
              ].map(f => (
                <div key={f} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '8px 0', borderBottom: '1px solid #F8FAFC',
                }}>
                  <span style={{ color: '#10B981', fontSize: '14px', flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: '13px', color: '#374151' }}>{f}</span>
                </div>
              ))}
            </div>

            <a href="/assessment" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '8px', padding: '12px 20px',
              border: '2px solid #E2E8F0', borderRadius: '12px',
              fontSize: '14px', fontWeight: 600, color: '#374151',
              textDecoration: 'none', textAlign: 'center',
            }}>
              Start Free Assessment →
            </a>
          </div>

          {/* PREMIUM card */}
          <div style={{
            background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)',
            borderRadius: '20px', padding: '32px',
            display: 'flex', flexDirection: 'column',
            position: 'relative', overflow: 'hidden',
            boxShadow: '0 20px 60px rgba(37,99,235,0.3)',
          }}>
            <div style={{
              position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
              backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 60%)',
              pointerEvents: 'none',
            }} />

            {config.isActive && (
              <div style={{
                position: 'absolute', top: '16px', right: '16px',
                background: 'linear-gradient(135deg, #F59E0B, #EF4444)',
                borderRadius: '20px', padding: '4px 12px',
                fontSize: '10px', fontWeight: 800, color: 'white',
                textTransform: 'uppercase', letterSpacing: '0.5px',
              }}>
                🏆 Founding Member
              </div>
            )}

            <div style={{ marginBottom: '20px', position: 'relative' }}>
              <p style={{
                fontSize: '12px', fontWeight: 600, color: 'rgba(255,255,255,0.6)',
                textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px',
              }}>
                Premium
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <span style={{ fontSize: '36px', fontWeight: 800, color: 'white', fontFamily: 'Sora,sans-serif' }}>
                  ${config.priceFounding}
                </span>
                <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', textDecoration: 'line-through' }}>
                  ${config.priceRegular}
                </span>
                <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)' }}>/mo</span>
              </div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                background: 'rgba(255,255,255,0.15)', borderRadius: '20px',
                padding: '4px 12px', marginTop: '8px',
              }}>
                <span style={{ fontSize: '12px', color: '#93C5FD', fontWeight: 600 }}>
                  {discount}% off — locked in forever
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginTop: '8px' }}>
                Everything you need for complete financial clarity
              </p>
            </div>

            <div style={{ flex: 1, marginBottom: '24px', position: 'relative' }}>
              {[
                'Everything in Free',
                'Monthly re-assessment & tracking',
                'AI Financial Coach (unlimited)',
                'Goal planning & progress tracking',
                'Net worth calculator',
                'Priority advisor matching',
                'Unlimited PDF reports',
                'Financial tips & insights',
                'Founding member badge 🏆',
                'Rate locked in forever',
              ].map(f => (
                <div key={f} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.08)',
                }}>
                  <span style={{ color: '#93C5FD', fontSize: '14px', flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)' }}>{f}</span>
                </div>
              ))}
            </div>

            <div style={{ position: 'relative' }}>
              <CheckoutButton
                plan="consumer_founding"
                label={`Start for $${config.priceFounding}/mo — Lock in my rate →`}
                highlighted={true}
              />
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginTop: '8px' }}>
                No contracts · Cancel anytime · Billed monthly
              </p>
            </div>
          </div>
        </div>

        {/* Social proof */}
        <div style={{
          background: 'white', borderRadius: '16px',
          border: '1px solid #E2E8F0', padding: '24px', marginBottom: '32px',
        }}>
          <p style={{
            fontSize: '13px', color: '#64748B', textAlign: 'center',
            fontWeight: 600, marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px',
          }}>
            Why founding members are locking in now
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '16px' }}>
            {[
              { icon: '🔒', title: 'Rate locked forever',      desc: 'Your $2.90/mo rate never increases, even as we add features' },
              { icon: '🏆', title: 'Founding member status',   desc: 'Exclusive badge and recognition as an early supporter' },
              { icon: '⚡', title: 'Full access immediately',  desc: 'All premium features unlocked the moment you subscribe' },
            ].map(b => (
              <div key={b.title} style={{ textAlign: 'center', padding: '8px' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>{b.icon}</div>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '4px' }}>{b.title}</p>
                <p style={{ fontSize: '12px', color: '#64748B', lineHeight: '1.5' }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div style={{ marginBottom: '40px' }}>
          <h3 style={{
            fontFamily: 'Sora,sans-serif', fontSize: '20px', fontWeight: 700,
            color: '#0F172A', textAlign: 'center', marginBottom: '24px',
          }}>
            Frequently asked questions
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[
              {
                q: 'What is a founding member?',
                a: 'The first 500 people who subscribe to WealthPlanrAI Premium. You lock in the $2.90/mo rate forever and get exclusive founding member status.',
              },
              {
                q: 'Will my rate really stay at $2.90 forever?',
                a: 'Yes. As a founding member your rate is locked in permanently. Even as we raise prices for new members, yours never changes.',
              },
              {
                q: 'Can I cancel anytime?',
                a: 'Absolutely. No contracts, no cancellation fees. Cancel with one click from your account settings.',
              },
              {
                q: 'What happens when all 500 spots are claimed?',
                a: 'New members will pay the regular $29/mo price. The founding member offer will not be available again.',
              },
              {
                q: 'Is this financial advice?',
                a: 'No. WealthPlanrAI is an educational financial planning tool. Our AI coach provides education, not personalized investment advice.',
              },
              {
                q: 'What payment methods do you accept?',
                a: 'All major credit and debit cards via Stripe. Your payment information is never stored on our servers.',
              },
            ].map(faq => (
              <div key={faq.q} style={{
                background: 'white', borderRadius: '12px',
                border: '1px solid #E2E8F0', padding: '20px',
              }}>
                <p style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>
                  {faq.q}
                </p>
                <p style={{ fontSize: '13px', color: '#64748B', lineHeight: '1.6' }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <p style={{
          fontSize: '11px', color: '#94A3B8', textAlign: 'center',
          lineHeight: '1.7', maxWidth: '600px', margin: '0 auto',
        }}>
          WealthPlanrAI is an educational financial planning tool, not a registered
          investment advisor. AI-generated content is for informational purposes only
          and does not constitute financial, investment, tax, or legal advice.
          Always consult a licensed financial professional before making financial decisions.
        </p>

      </div>
    </div>
  )
}
