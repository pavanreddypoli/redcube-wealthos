'use client'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function WelcomeContent() {
  const searchParams = useSearchParams()
  // sessionId available for future server-side verification
  void searchParams.get('session_id')

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0F172A, #1E3A8A)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px',
    }}>
      <div style={{
        background: 'white', borderRadius: '24px', padding: '48px 40px',
        maxWidth: '480px', width: '100%', textAlign: 'center',
      }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          background: 'linear-gradient(135deg, #F59E0B, #EF4444)',
          borderRadius: '20px', padding: '6px 16px', marginBottom: '20px',
        }}>
          <span style={{
            fontSize: '12px', fontWeight: 800, color: 'white',
            textTransform: 'uppercase', letterSpacing: '0.5px',
          }}>
            🏆 Founding Member
          </span>
        </div>

        <h1 style={{
          fontFamily: 'Sora,sans-serif', fontSize: '26px', fontWeight: 800,
          color: '#0F172A', marginBottom: '12px',
        }}>
          Welcome to WealthPlanrAI!
        </h1>

        <p style={{ fontSize: '15px', color: '#64748B', lineHeight: '1.7', marginBottom: '8px' }}>
          You&apos;ve locked in your founding member rate of{' '}
          <strong style={{ color: '#2563EB' }}>$2.90/mo forever.</strong>
        </p>

        <p style={{ fontSize: '13px', color: '#94A3B8', marginBottom: '32px' }}>
          Your rate will never increase, even as we add more features
          and raise prices for new members.
        </p>

        <div style={{
          background: '#F8FAFC', borderRadius: '12px', padding: '16px',
          marginBottom: '24px', textAlign: 'left',
        }}>
          <p style={{
            fontSize: '12px', fontWeight: 600, color: '#64748B',
            textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px',
          }}>
            What&apos;s next
          </p>
          {[
            { icon: '📊', text: 'Take your free financial assessment' },
            { icon: '🤖', text: 'Chat with your AI financial coach' },
            { icon: '🎯', text: 'Set your financial goals' },
            { icon: '👨‍💼', text: 'Get matched with a licensed advisor' },
          ].map(s => (
            <div key={s.text} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0' }}>
              <span style={{ fontSize: '18px' }}>{s.icon}</span>
              <span style={{ fontSize: '13px', color: '#374151' }}>{s.text}</span>
            </div>
          ))}
        </div>

        <a href="/assessment" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
          color: 'white', padding: '14px 28px', borderRadius: '12px',
          fontSize: '14px', fontWeight: 700, textDecoration: 'none',
          boxShadow: '0 4px 16px rgba(37,99,235,0.35)', marginBottom: '12px',
        }}>
          Start My Financial Assessment →
        </a>

        <a href="/dashboard" style={{ display: 'block', fontSize: '13px', color: '#94A3B8', textDecoration: 'none' }}>
          Go to my dashboard
        </a>
      </div>
    </div>
  )
}

export default function ConsumerWelcomePage() {
  return (
    <Suspense fallback={null}>
      <WelcomeContent />
    </Suspense>
  )
}
