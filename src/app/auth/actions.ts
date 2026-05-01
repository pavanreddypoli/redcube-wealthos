'use server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

async function makeSupabase() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options as Parameters<typeof cookieStore.set>[2])
          )
        },
      },
    }
  )
}

export async function signIn(formData: FormData) {
  const email      = formData.get('email') as string
  const password   = formData.get('password') as string
  const redirectTo = (formData.get('redirectTo') as string) || '/dashboard'

  const supabase = await makeSupabase()
  const { error } = await supabase.auth.signInWithPassword({
    email: email.toLowerCase().trim(),
    password,
  })

  if (error) {
    if (error.message.includes('Email not confirmed')) {
      redirect('/auth/login?error=email_not_confirmed')
    }
    if (error.message.includes('Invalid login credentials')) {
      redirect('/auth/login?error=invalid_credentials')
    }
    redirect(`/auth/login?error=${encodeURIComponent(error.message)}`)
  }

  redirect(redirectTo)
}

export async function signOut() {
  const supabase = await makeSupabase()
  await supabase.auth.signOut()
  redirect('/')
}
