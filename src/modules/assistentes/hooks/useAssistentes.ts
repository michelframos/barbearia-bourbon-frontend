import { useCallback, useEffect, useState } from 'react'

import { assistentesApi } from '@/modules/assistentes/api/assistentesApi'
import type { Assistente, AssistentePayload } from '@/modules/assistentes/types/assistente'
import { ApiError } from '@/shared/api/httpClient'

export function useAssistentes(search = '') {
  const [items, setItems] = useState<Assistente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await assistentesApi.list({ search, perPage: 50 })
      setItems(response.data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao carregar assistentes.')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    void reload()
  }, [reload])

  const create = useCallback(
    async (payload: AssistentePayload) => {
      await assistentesApi.create(payload)
      await reload()
    },
    [reload],
  )

  const update = useCallback(
    async (id: number, payload: Partial<AssistentePayload>) => {
      await assistentesApi.update(id, payload)
      await reload()
    },
    [reload],
  )

  const updateMany = useCallback(
    async (ids: number[], payload: Partial<AssistentePayload>) => {
      await Promise.all(ids.map((id) => assistentesApi.update(id, payload)))
      await reload()
    },
    [reload],
  )

  const remove = useCallback(
    async (id: number) => {
      await assistentesApi.remove(id)
      await reload()
    },
    [reload],
  )

  const removeMany = useCallback(
    async (ids: number[]) => {
      await Promise.all(ids.map((id) => assistentesApi.remove(id)))
      await reload()
    },
    [reload],
  )

  return { items, loading, error, reload, create, update, updateMany, remove, removeMany }
}
