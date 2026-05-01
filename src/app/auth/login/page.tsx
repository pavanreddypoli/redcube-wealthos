import { LoginClient } from './LoginClient'

const ERROR_MESSAGES: Record<string, string> = {
  email_not_confirmed: 'Please check your email and click the confirmation link before signing in.',
  invalid_credentials: 'The email or password you entered is incorrect. Please double-check and try again.',
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; redirectTo?: string }
}) {
  const errorParam   = searchParams.error
  const initialError = errorParam
    ? (ERROR_MESSAGES[errorParam] ?? decodeURIComponent(errorParam))
    : null
  const redirectTo   = searchParams.redirectTo ?? '/dashboard'
  const initialMode  = (initialError || searchParams.redirectTo) ? 'signin' : 'landing'

  return (
    <LoginClient
      initialError={initialError}
      redirectTo={redirectTo}
      initialMode={initialMode}
    />
  )
}
