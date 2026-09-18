import { httpClient } from '@/shared/api/httpClient'
import type { Atendimento, StatusAtendimento } from '@/modules/painel/types/atendimento'

type ListResponse = {
  data: Atendimento[]
}

export type HistoricoFilters = {
  data: string
  status_atendimento?: StatusAtendimento | null
}

export const historicoApi = {
  list(filters: HistoricoFilters) {
    const query = new URLSearchParams()
    query.set('data', filters.data)
    if (filters.status_atendimento) {
      query.set('status_atendimento', filters.status_atendimento)
    }
    return httpClient<ListResponse>(`/atendimentos?${query.toString()}`)
  },
}
