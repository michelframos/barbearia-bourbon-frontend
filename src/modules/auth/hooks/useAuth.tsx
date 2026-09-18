import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

import { authApi } from '@/modules/auth/api/authApi'
import type { AuthUser, LoginPayload } from '@/modules/auth/types/auth'
import { ApiError } from '@/shared/api/httpClient'
import { tokenStorage } from '@/shared/api/tokenStorage'

type AuthContextValue = {
  user: AuthUser | null
  isAuthenticated: boolean
  isBootstrapping: boolean
  login: (payload: LoginPayload) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isBootstrapping, setIsBootstrapping] = useState(() => Boolean(tokenStorage.get()))

  const refreshUser = useCallback(async () => {
    const token = tokenStorage.get()
    if (!token) {
      setUser(null)
      return
    }

    try {
      const response = await authApi.me()
      setUser(response.data)
    } catch (error) {
      tokenStorage.clear()
      setUser(null)
      if (!(error instanceof ApiError && error.status === 401)) {
        throw error
      }
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      if (!tokenStorage.get()) {
        setIsBootstrapping(false)
        return
      }

      try {
        await refreshUser()
      } catch {
        // token inválido já limpo em refreshUser / httpClient
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false)
        }
      }
    }

    void bootstrap()

    return () => {
      cancelled = true
    }
  }, [refreshUser])

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await authApi.login(payload)
    tokenStorage.set(response.token)
    setUser(response.data)
  }, [])

  const logout = useCallback(async () => {
    try {
      if (tokenStorage.get()) {
        await authApi.logout()
      }
    } catch {
      // limpa sessão local mesmo se a API falhar
    } finally {
      tokenStorage.clear()
      setUser(null)
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isBootstrapping,
      login,
      logout,
      refreshUser,
    }),
    [user, isBootstrapping, login, logout, refreshUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}
