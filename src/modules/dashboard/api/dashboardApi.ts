import { httpClient } from '@/shared/api/httpClient'

import type { DashboardSnapshot } from '../types/dashboard'

export const dashboardApi = {
  hoje(data?: string) {
    const query = new URLSearchParams()
    if (data) query.set('data', data)
    const suffix = query.toString() ? `?${query}` : ''
    return httpClient<DashboardSnapshot>(`/dashboard/hoje${suffix}`)
  },
}
