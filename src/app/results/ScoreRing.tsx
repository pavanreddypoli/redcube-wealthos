'use client'
import { useEffect, useState } from 'react'

const RADIUS = 52
const CIRC   = 2 * Math.PI * RADIUS  // ≈ 326.7

export function ScoreRing({ score, color }: { score: number; color: string }) {
  const [dash, setDash] = useState(0)

  // Animate from 0 → target after first paint
  useEffect(() => {
    const id = setTimeout(() => setDash((score / 100) * CIRC), 60)
    return () => clearTimeout(id)
  }, [score])

  return (
    <div className="relative w-48 h-48 mx-auto">
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        {/* Track */}
        <circle
          cx="60" cy="60" r={RADIUS}
          fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="9"
        />
        {/* Filled arc */}
        <circle
          cx="60" cy="60" r={RADIUS}
          fill="none" stroke={color} strokeWidth="9"
          strokeDasharray={`${dash} ${CIRC}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1.4s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-6xl font-bold text-white leading-none">{score}</span>
        <span className="text-xs text-slate-400 mt-2 font-medium tracking-wide">out of 100</span>
      </div>
    </div>
  )
}
