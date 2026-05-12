import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    )
    const { error } = await serviceClient
      .from('profiles')
      .select('id')
      .limit(1)

    if (error) throw error

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
    })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'unknown error'
    return NextResponse.json({ status: 'error', error: msg }, { status: 500 })
  }
}
