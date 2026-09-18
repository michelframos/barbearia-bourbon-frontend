import { useCallback, useEffect, useState } from 'react'

import { agendamentosApi } from '@/modules/agenda/api/agendamentosApi'
import type {
  AgendaGrade,
  Agendamento,
  AgendamentoPayload,
} from '@/modules/agenda/types/agendamento'
import { ApiError } from '@/shared/api/httpClient'

function todayIso() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function useAgenda(data = todayIso(), idBarbeiro: number | null = null) {
  const [grade, setGrade] = useState<AgendaGrade | null>(null)
  const [items, setItems] = useState<Agendamento[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [gradeResponse, listResponse] = await Promise.all([
        agendamentosApi.grade({ data, idBarbeiro }),
        agendamentosApi.list({ data, idBarbeiro }),
      ])
      setGrade(gradeResponse)
      setItems(listResponse.data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao carregar a agenda.')
    } finally {
      setLoading(false)
    }
  }, [data, idBarbeiro])

  useEffect(() => {
    void reload()
  }, [reload])

  const create = useCallback(
    async (payload: AgendamentoPayload) => {
      await agendamentosApi.create(payload)
      await reload()
    },
    [reload],
  )

  const update = useCallback(
    async (id: number, payload: Partial<AgendamentoPayload>) => {
      await agendamentosApi.update(id, payload)
      await reload()
    },
    [reload],
  )

  const cancel = useCallback(
    async (id: number) => {
      await agendamentosApi.cancel(id)
      await reload()
    },
    [reload],
  )

  return { grade, items, loading, error, reload, create, update, cancel, todayIso }
}
