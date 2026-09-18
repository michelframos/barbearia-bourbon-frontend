import { useCallback, useEffect, useState } from 'react'

import { servicosApi } from '@/modules/servicos/api/servicosApi'
import type { Servico, ServicoPayload } from '@/modules/servicos/types/servico'
import { ApiError } from '@/shared/api/httpClient'

export function useServicos(search = '') {
  const [items, setItems] = useState<Servico[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await servicosApi.list({ search, perPage: 50 })
      setItems(response.data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao carregar serviços.')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    void reload()
  }, [reload])

  const create = useCallback(
    async (payload: ServicoPayload) => {
      await servicosApi.create(payload)
      await reload()
    },
    [reload],
  )

  const update = useCallback(
    async (id: number, payload: Partial<ServicoPayload>) => {
      await servicosApi.update(id, payload)
      await reload()
    },
    [reload],
  )

  const updateMany = useCallback(
    async (ids: number[], payload: Partial<ServicoPayload>) => {
      await Promise.all(ids.map((id) => servicosApi.update(id, payload)))
      await reload()
    },
    [reload],
  )

  const remove = useCallback(
    async (id: number) => {
      await servicosApi.remove(id)
      await reload()
    },
    [reload],
  )

  const removeMany = useCallback(
    async (ids: number[]) => {
      await Promise.all(ids.map((id) => servicosApi.remove(id)))
      await reload()
    },
    [reload],
  )

  return { items, loading, error, reload, create, update, updateMany, remove, removeMany }
}
