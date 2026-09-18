import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '@/modules/auth/hooks/useAuth'

function AuthLoadingScreen() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-[var(--background)] text-sm text-[var(--foreground-muted)]">
      Carregando sessão…
    </div>
  )
}

/** Exige autenticação para acessar rotas privadas */
export function ProtectedRoute() {
  const { isAuthenticated, isBootstrapping } = useAuth()
  const location = useLocation()

  if (isBootstrapping) {
    return <AuthLoadingScreen />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

/** Redireciona usuários já autenticados para longe do login */
export function GuestRoute() {
  const { isAuthenticated, isBootstrapping } = useAuth()

  if (isBootstrapping) {
    return <AuthLoadingScreen />
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
