'use client'
import { Copy } from 'lucide-react'

export function CopyButton({ text }: { text: string }) {
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text).catch(() => {}) }}
      className="flex items-center gap-2 px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold rounded-xl transition-colors"
    >
      <Copy className="w-3.5 h-3.5" />
      Copy Link
    </button>
  )
}
