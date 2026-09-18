import { httpClient } from '@/shared/api/httpClient'
import type { MutationResponse, PaginatedResponse } from '@/shared/api/types'
import type { Servico, ServicoPayload } from '@/modules/servicos/types/servico'

export const servicosApi = {
  list(params: { search?: string; page?: number; perPage?: number } = {}) {
    const query = new URLSearchParams()
    if (params.search) query.set('search', params.search)
    if (params.page) query.set('page', String(params.page))
    query.set('per_page', String(params.perPage ?? 50))
    const qs = query.toString()
    return httpClient<PaginatedResponse<Servico>>(`/servicos${qs ? `?${qs}` : ''}`)
  },

  create(payload: ServicoPayload) {
    return httpClient<MutationResponse<Servico>>('/servicos', {
      method: 'POST',
      body: payload,
    })
  },

  update(id: number, payload: Partial<ServicoPayload>) {
    return httpClient<MutationResponse<Servico>>(`/servicos/${id}`, {
      method: 'PUT',
      body: payload,
    })
  },

  remove(id: number) {
    return httpClient<{ message: string }>(`/servicos/${id}`, {
      method: 'DELETE',
    })
  },
}
