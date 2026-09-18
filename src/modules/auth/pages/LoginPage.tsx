import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '@/modules/auth/hooks/useAuth'
import { ApiError } from '@/shared/api/httpClient'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'

export function LoginPage() {
  const { login, isAuthenticated, isBootstrapping } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [email, setEmail] = useState('admin@barbearia.test')
  const [password, setPassword] = useState('password')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (isBootstrapping) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-[var(--background)] text-sm text-[var(--foreground-muted)]">
        Carregando sessão…
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to={from} replace />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      await login({ email, password })
      navigate(from, { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        const fieldError = err.errors?.email?.[0] ?? err.errors?.password?.[0]
        setError(fieldError ?? err.message)
      } else {
        setError('Falha ao autenticar. Tente novamente.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="relative flex min-h-svh items-center justify-center px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 70% 50% at 50% -10%, color-mix(in srgb, var(--accent) 18%, transparent), transparent 55%), radial-gradient(circle at 1px 1px, color-mix(in srgb, #fff 4%, transparent) 1px, transparent 0)',
          backgroundSize: 'auto, 24px 24px',
        }}
      />

      <div className="relative w-full max-w-md animate-fade-in">
        <div className="mb-8 text-center">
          <p className="font-display text-3xl text-[var(--accent)]">Bourbon</p>
          <p className="mt-1 text-xs uppercase tracking-[0.22em] text-[var(--foreground-muted)]">
            Barbearia
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.8)] md:p-8"
        >
          <div className="space-y-1">
            <h1 className="font-display text-2xl text-[var(--foreground)]">Entrar</h1>
            <p className="text-sm text-[var(--foreground-muted)]">
              Acesse o painel operacional da barbearia.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm text-[var(--foreground-muted)]">
              E-mail
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm text-[var(--foreground-muted)]">
              Senha
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error ? (
            <p className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>
      </div>
    </div>
  )
}
