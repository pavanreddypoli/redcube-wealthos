import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'RedCube WealthOS', template: '%s | RedCube WealthOS' },
  description: 'AI-powered wealth management platform for financial advisors and their clients.',
  keywords: ['wealth management', 'financial advisor', 'portfolio', 'AI', 'RIA'],
  openGraph: {
    title: 'RedCube WealthOS',
    description: 'AI-powered wealth management for the modern advisor.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  )
}
