import { useCallback, useEffect, useState } from 'react'

import { dashboardApi } from '@/modules/dashboard/api/dashboardApi'
import type { DashboardSnapshot } from '@/modules/dashboard/types/dashboard'
import { ApiError } from '@/shared/api/httpClient'

function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function useDashboardHoje(data = todayIso(), pollMs = 30000) {
  const [snapshot, setSnapshot] = useState<DashboardSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const reload = useCallback(async () => {
    setError(null)
    try {
      const response = await dashboardApi.hoje(data)
      setSnapshot(response)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao carregar o dashboard.')
    } finally {
      setLoading(false)
    }
  }, [data])

  useEffect(() => {
    setLoading(true)
    void reload()
  }, [reload])

  useEffect(() => {
    if (pollMs <= 0) return
    const id = window.setInterval(() => {
      void reload()
    }, pollMs)
    return () => window.clearInterval(id)
  }, [pollMs, reload])

  return { snapshot, loading, error, lastUpdated, reload }
}
