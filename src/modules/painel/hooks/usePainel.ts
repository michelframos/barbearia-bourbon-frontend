import { useCallback, useEffect, useState } from 'react'

import { atendimentosApi } from '@/modules/painel/api/atendimentosApi'
import type { CheckInPayload, PainelSnapshot } from '@/modules/painel/types/atendimento'
import { ApiError } from '@/shared/api/httpClient'

function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function usePainel(data = todayIso(), pollMs = 15000) {
  const [snapshot, setSnapshot] = useState<PainelSnapshot | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setError(null)
    try {
      const response = await atendimentosApi.painel(data)
      setSnapshot(response)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao carregar o painel.')
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

  const checkIn = useCallback(
    async (payload: CheckInPayload) => {
      await atendimentosApi.checkIn({ ...payload, data })
      await reload()
    },
    [data, reload],
  )

  const chamar = useCallback(
    async (id: number) => {
      await atendimentosApi.chamar(id)
      await reload()
    },
    [reload],
  )

  const iniciar = useCallback(
    async (
      id: number,
      payload?: { id_barbeiro?: number | null; id_assistente?: number | null },
    ) => {
      await atendimentosApi.iniciar(id, payload)
      await reload()
    },
    [reload],
  )

  const concluir = useCallback(
    async (id: number) => {
      await atendimentosApi.concluir(id)
      await reload()
    },
    [reload],
  )

  const cancelar = useCallback(
    async (id: number) => {
      await atendimentosApi.cancelar(id)
      await reload()
    },
    [reload],
  )

  return { snapshot, loading, error, reload, checkIn, chamar, iniciar, concluir, cancelar }
}
