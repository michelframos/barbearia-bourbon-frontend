import { useCallback, useEffect, useState } from 'react'

import { clientesApi } from '@/modules/clientes/api/clientesApi'
import type { Cliente, ClientePayload } from '@/modules/clientes/types/cliente'
import { ApiError } from '@/shared/api/httpClient'

export function useClientes(search = '') {
  const [items, setItems] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await clientesApi.list({ search, perPage: 50 })
      setItems(response.data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao carregar clientes.')
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    void reload()
  }, [reload])

  const create = useCallback(
    async (payload: ClientePayload) => {
      await clientesApi.create(payload)
      await reload()
    },
    [reload],
  )

  const update = useCallback(
    async (id: number, payload: Partial<ClientePayload>) => {
      await clientesApi.update(id, payload)
      await reload()
    },
    [reload],
  )

  const updateMany = useCallback(
    async (ids: number[], payload: Partial<ClientePayload>) => {
      await Promise.all(ids.map((id) => clientesApi.update(id, payload)))
      await reload()
    },
    [reload],
  )

  const remove = useCallback(
    async (id: number) => {
      await clientesApi.remove(id)
      await reload()
    },
    [reload],
  )

  const removeMany = useCallback(
    async (ids: number[]) => {
      await Promise.all(ids.map((id) => clientesApi.remove(id)))
      await reload()
    },
    [reload],
  )

  return { items, loading, error, reload, create, update, updateMany, remove, removeMany }
}
