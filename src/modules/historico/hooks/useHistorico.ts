import { useCallback, useEffect, useState } from 'react'

import { historicoApi } from '@/modules/historico/api/historicoApi'
import type { HistoricoFilters } from '@/modules/historico/api/historicoApi'
import type { Atendimento } from '@/modules/painel/types/atendimento'
import { ApiError } from '@/shared/api/httpClient'

export function useHistorico(filters: HistoricoFilters) {
  const [items, setItems] = useState<Atendimento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await historicoApi.list(filters)
      setItems(response.data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao carregar histórico.')
    } finally {
      setLoading(false)
    }
  }, [filters.data, filters.status_atendimento])

  useEffect(() => {
    void reload()
  }, [reload])

  return { items, loading, error, reload }
}
