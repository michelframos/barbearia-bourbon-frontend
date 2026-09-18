import { httpClient } from '@/shared/api/httpClient'
import type { LoginPayload, LoginResponse, MeResponse } from '@/modules/auth/types/auth'

export const authApi = {
  login(payload: LoginPayload) {
    return httpClient<LoginResponse>('/auth/login', {
      method: 'POST',
      body: { ...payload, device_name: payload.device_name ?? 'web' },
      auth: false,
    })
  },

  me() {
    return httpClient<MeResponse>('/auth/me')
  },

  logout() {
    return httpClient<{ message: string }>('/auth/logout', {
      method: 'POST',
    })
  },
}
