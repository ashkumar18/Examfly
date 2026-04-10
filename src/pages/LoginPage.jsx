import { useState, useEffect } from 'react'
import { createAccount, login, checkUsernameAvailable, suggestUsernames } from '../lib/auth'
import { checkPasswordStrength } from '../lib/utils'

const STRENGTH_COLORS = { weak: 'bg-error', medium: 'bg-warning', strong: 'bg-success' }
const STRENGTH_LABELS = { weak: 'Weak', medium: 'Medium', strong: 'Strong' }
const STRENGTH_TEXT = { weak: 'text-error', medium: 'text-warning', strong: 'text-success' }

function PasswordStrengthIndicator({ password }) {
  if (!password) return null
  const { level, passed, total, suggestions } = checkPasswordStrength(password)
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1">
          {Array.from({ length: total }, (_, i) => (
            <div key={i} className={`h-1 flex-1 ${i < passed ? STRENGTH_COLORS[level] : 'bg-white/[0.06]'}`} />
          ))}
        </div>
        <span className={`text-[9px] font-black uppercase tracking-widest ${STRENGTH_TEXT[level]}`}>{STRENGTH_LABELS[level]}</span>
      </div>
      {suggestions.length > 0 && level !== 'strong' && (
        <div className="space-y-0.5">
          {suggestions.map((s) => (
            <p key={s} className="text-[9px] text-text-muted">• {s}</p>
          ))}
        </div>
      )}
    </div>
  )
}

export default function LoginPage({ onLogin }) {
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [usernameStatus, setUsernameStatus] = useState(null)
  const [suggestions, setSuggestions] = useState([])

  useEffect(() => {
    if (mode !== 'signup' || username.length < 3) {
      setUsernameStatus(null)
      setSuggestions([])
      return
    }
    const timer = setTimeout(async () => {
      const result = await checkUsernameAvailable(username)
      setUsernameStatus(result)
      if (!result.available) {
        const s = await suggestUsernames(username)
        setSuggestions(s)
      } else {
        setSuggestions([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [username, mode])

  const pwStrength = password ? checkPasswordStrength(password) : null
  const isPasswordWeak = mode === 'signup' && password && pwStrength && pwStrength.level === 'weak'

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'login') {
        const result = await login(username, password)
        if (result.success) onLogin(result.session)
        else setError(result.error)
      } else {
        if (isPasswordWeak) {
          setError('Password is too weak. Must be at least Medium strength.')
          setLoading(false)
          return
        }
        if (password !== confirmPassword) {
          setError('Passwords do not match')
          setLoading(false)
          return
        }
        if (usernameStatus && !usernameStatus.available) {
          setError(usernameStatus.error)
          setLoading(false)
          return
        }
        const result = await createAccount(username, password, displayName)
        if (result.success) {
          const loginResult = await login(username, password)
          if (loginResult.success) {
            onLogin(loginResult.session)
          } else {
            setError('Account created! Please sign in.')
            setMode('login')
          }
        } else {
          setError(result.error)
        }
      }
    } catch (err) {
      console.error('Auth error:', err)
      setError(err.message || 'Something went wrong')
    }
    setLoading(false)
  }

  function handleGoogleSignIn() {
    setError('Google sign-in is not available in offline mode. Please use username/password.')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="mb-8 sm:mb-10">
          <div className="mb-4 inline-block border-2 border-white/10 bg-surface-lowest px-4 py-2 shadow-[3px_3px_0px_0px_rgba(99,102,241,0.4)]">
            <span className="text-2xl">📋</span>
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter text-text sm:text-4xl">
            SSC PrepZone
          </h1>
          <p className="mt-1 text-xs font-bold uppercase tracking-widest text-text-muted">
            {mode === 'login' ? 'Sign in to continue' : 'Create your account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-text-muted">Display Name</label>
              <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="w-full border-2 border-white/10 bg-surface-lowest px-4 py-3 text-sm text-text outline-none transition-all placeholder:text-text-muted/40 focus:border-primary/40 focus:shadow-[3px_3px_0px_0px_rgba(99,102,241,0.2)]" />
            </div>
          )}
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-text-muted">Username</label>
            <input type="text" value={username}
              onChange={(e) => { setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '')); setError('') }}
              placeholder="Enter username" required autoComplete="username"
              className={`w-full border-2 bg-surface-lowest px-4 py-3 text-sm text-text outline-none transition-all placeholder:text-text-muted/40 ${
                mode === 'signup' && usernameStatus
                  ? usernameStatus.available ? 'border-success/40 focus:shadow-[3px_3px_0px_0px_rgba(34,197,94,0.2)]' : 'border-error/40 focus:shadow-[3px_3px_0px_0px_rgba(244,63,94,0.2)]'
                  : 'border-white/10 focus:border-primary/40 focus:shadow-[3px_3px_0px_0px_rgba(99,102,241,0.2)]'
              }`} />
            {mode === 'signup' && username.length >= 3 && usernameStatus && (
              <div className="mt-2">
                {usernameStatus.available ? (
                  <span className="border border-success/20 bg-success/[0.06] px-2 py-0.5 text-[10px] font-bold text-success">✓ AVAILABLE</span>
                ) : (
                  <div>
                    <span className="border border-error/20 bg-error/[0.06] px-2 py-0.5 text-[10px] font-bold text-error">✗ {usernameStatus.error}</span>
                    {suggestions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted">Try:</span>
                        {suggestions.map((s) => (
                          <button key={s} type="button" onClick={() => setUsername(s)}
                            className="border border-primary/20 bg-primary/[0.06] px-2 py-0.5 text-[10px] font-bold text-primary-light transition-all hover:bg-primary/10 active:translate-x-[1px] active:translate-y-[1px]">
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-text-muted">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password" required autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              className="w-full border-2 border-white/10 bg-surface-lowest px-4 py-3 text-sm text-text outline-none transition-all placeholder:text-text-muted/40 focus:border-primary/40 focus:shadow-[3px_3px_0px_0px_rgba(99,102,241,0.2)]" />
            {mode === 'signup' && <PasswordStrengthIndicator password={password} />}
          </div>
          {mode === 'signup' && (
            <div>
              <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-widest text-text-muted">Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password" required autoComplete="new-password"
                className={`w-full border-2 bg-surface-lowest px-4 py-3 text-sm text-text outline-none transition-all placeholder:text-text-muted/40 ${
                  confirmPassword && password !== confirmPassword ? 'border-error/40' : 'border-white/10 focus:border-primary/40 focus:shadow-[3px_3px_0px_0px_rgba(99,102,241,0.2)]'
                }`} />
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-1.5 text-[10px] font-bold text-error">Passwords do not match</p>
              )}
            </div>
          )}

          {error && (
            <div className="border border-error/20 bg-error/[0.06] px-3 py-2 text-xs font-bold text-error">{error}</div>
          )}

          <button type="submit" disabled={loading || isPasswordWeak || (mode === 'signup' && usernameStatus && !usernameStatus.available) || (mode === 'signup' && confirmPassword && password !== confirmPassword)}
            className="w-full border-2 border-primary bg-primary/10 py-3.5 text-sm font-black uppercase tracking-widest text-primary-light shadow-[3px_3px_0px_0px_rgba(99,102,241,0.4)] transition-all hover:bg-primary/20 active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-40 disabled:cursor-not-allowed">
            {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Divider */}
        <div className="my-5 flex items-center gap-4">
          <div className="h-px flex-1 bg-white/[0.08]" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-text-muted">Or</span>
          <div className="h-px flex-1 bg-white/[0.08]" />
        </div>

        {/* Google sign-in */}
        <button onClick={handleGoogleSignIn}
          className="flex w-full items-center justify-center gap-3 border-2 border-white/10 bg-surface-lowest py-3 text-sm font-bold text-text shadow-[3px_3px_0px_0px_rgba(255,255,255,0.05)] transition-all hover:bg-surface active:translate-x-[2px] active:translate-y-[2px] active:shadow-none">
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continue with Google
        </button>

        <div className="mt-6 text-center">
          {mode === 'login' ? (
            <p className="text-xs text-text-muted">
              Don&apos;t have an account?{' '}
              <button onClick={() => { setMode('signup'); setError(''); setUsernameStatus(null); setConfirmPassword('') }}
                className="font-bold uppercase tracking-wider text-primary-light underline underline-offset-2">
                Create one
              </button>
            </p>
          ) : (
            <p className="text-xs text-text-muted">
              Already have an account?{' '}
              <button onClick={() => { setMode('login'); setError(''); setUsernameStatus(null); setConfirmPassword('') }}
                className="font-bold uppercase tracking-wider text-primary-light underline underline-offset-2">
                Sign in
              </button>
            </p>
          )}
        </div>

        <div className="mt-8 border border-white/[0.06] bg-surface-lowest p-3.5">
          <p className="text-[9px] font-bold uppercase tracking-widest text-text-muted">Cloud Sync Enabled</p>
          <p className="mt-1 text-[10px] text-text-muted/70">
            Your progress is saved to the cloud and syncs across devices.
          </p>
        </div>
      </div>
    </div>
  )
}
