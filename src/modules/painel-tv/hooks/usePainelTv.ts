import { useCallback, useEffect, useMemo, useState } from 'react'

import { useEmpresaConfig } from '@/modules/empresa/hooks/useEmpresaConfig'
import { painelTvApi } from '@/modules/painel-tv/api/painelTvApi'
import type { PainelTvSnapshot } from '@/modules/painel-tv/api/painelTvApi'
import { ApiError } from '@/shared/api/httpClient'

function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function usePainelTv(data = todayIso()) {
  const { empresa } = useEmpresaConfig()
  const [snapshot, setSnapshot] = useState<PainelTvSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const pollMs = useMemo(() => {
    if (empresa && !empresa.painel_tv_auto_refresh) return 0
    const seconds = empresa?.painel_tv_intervalo_segundos ?? 30
    return Math.max(10, seconds) * 1000
  }, [empresa])

  const reload = useCallback(async () => {
    setError(null)
    try {
      const response = await painelTvApi.snapshot(data)
      setSnapshot(response)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao carregar o painel TV.')
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

  return { snapshot, loading, error, reload, pollMs }
}
