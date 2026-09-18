import { httpClient } from '@/shared/api/httpClient'
import type { MutationResponse, PaginatedResponse } from '@/shared/api/types'
import type { Assistente, AssistentePayload } from '@/modules/assistentes/types/assistente'

export const assistentesApi = {
  list(params: { search?: string; page?: number; perPage?: number } = {}) {
    const query = new URLSearchParams()
    if (params.search) query.set('search', params.search)
    if (params.page) query.set('page', String(params.page))
    query.set('per_page', String(params.perPage ?? 50))
    const qs = query.toString()
    return httpClient<PaginatedResponse<Assistente>>(`/assistentes${qs ? `?${qs}` : ''}`)
  },

  create(payload: AssistentePayload) {
    return httpClient<MutationResponse<Assistente>>('/assistentes', {
      method: 'POST',
      body: payload,
    })
  },

  update(id: number, payload: Partial<AssistentePayload>) {
    return httpClient<MutationResponse<Assistente>>(`/assistentes/${id}`, {
      method: 'PUT',
      body: payload,
    })
  },

  remove(id: number) {
    return httpClient<{ message: string }>(`/assistentes/${id}`, {
      method: 'DELETE',
    })
  },
}
