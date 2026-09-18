import { useCallback, useEffect, useState } from 'react'

import { barbeirosApi } from '@/modules/barbeiros/api/barbeirosApi'
import type { Barbeiro, BarbeiroPayload } from '@/modules/barbeiros/types/barbeiro'
import { ApiError } from '@/shared/api/httpClient'

export function useBarbeiros(search = '', pollMs = 0) {
  const [items, setItems] = useState<Barbeiro[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setError(null)
    try {
      const response = await barbeirosApi.list({ search, perPage: 50 })
      setItems(response.data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao carregar barbeiros.')
    } finally {
      setLoading(false)
    }
  }, [search])

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

  const create = useCallback(
    async (payload: BarbeiroPayload, foto?: File | null) => {
      const response = await barbeirosApi.create(payload)
      if (foto && response.data?.id) {
        await barbeirosApi.uploadFoto(response.data.id, foto)
      }
      await reload()
      return response.data
    },
    [reload],
  )

  const update = useCallback(
    async (
      id: number,
      payload: Partial<BarbeiroPayload>,
      options?: { foto?: File | null; removeFoto?: boolean },
    ) => {
      await barbeirosApi.update(id, payload)
      if (options?.removeFoto) {
        await barbeirosApi.removeFoto(id)
      } else if (options?.foto) {
        await barbeirosApi.uploadFoto(id, options.foto)
      }
      await reload()
    },
    [reload],
  )

  const updateMany = useCallback(
    async (ids: number[], payload: Partial<BarbeiroPayload>) => {
      await Promise.all(ids.map((itemId) => barbeirosApi.update(itemId, payload)))
      await reload()
    },
    [reload],
  )

  const remove = useCallback(
    async (id: number) => {
      await barbeirosApi.remove(id)
      await reload()
    },
    [reload],
  )

  const removeMany = useCallback(
    async (ids: number[]) => {
      await Promise.all(ids.map((itemId) => barbeirosApi.remove(itemId)))
      await reload()
    },
    [reload],
  )

  return { items, loading, error, reload, create, update, updateMany, remove, removeMany }
}
