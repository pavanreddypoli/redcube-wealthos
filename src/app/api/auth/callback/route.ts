import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code       = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type       = searchParams.get('type')
  const next       = searchParams.get('next') ?? '/dashboard'

  console.log('[callback] code:', !!code, 'token_hash:', !!token_hash, 'type:', type)

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type: type as any,
      token_hash,
    })
    if (!error) {
      console.log('[callback] OTP verified successfully')
      return NextResponse.redirect(`${origin}${next}`)
    }
    console.error('[callback] OTP verification failed:', error.message)
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      console.log('[callback] Code exchanged successfully')
      return NextResponse.redirect(`${origin}${next}`)
    }
    console.error('[callback] Code exchange failed:', error.message)
  }

  console.error('[callback] No valid token or code found')
  return NextResponse.redirect(
    `${origin}/auth/login?error=auth_callback_error`
  )
}
