import { httpClient } from '@/shared/api/httpClient'
import type { MutationResponse, PaginatedResponse } from '@/shared/api/types'
import type { Cliente, ClientePayload } from '@/modules/clientes/types/cliente'

export const clientesApi = {
  list(params: { search?: string; page?: number; perPage?: number } = {}) {
    const query = new URLSearchParams()
    if (params.search) query.set('search', params.search)
    if (params.page) query.set('page', String(params.page))
    query.set('per_page', String(params.perPage ?? 50))
    const qs = query.toString()
    return httpClient<PaginatedResponse<Cliente>>(`/clientes${qs ? `?${qs}` : ''}`)
  },

  create(payload: ClientePayload) {
    return httpClient<MutationResponse<Cliente>>('/clientes', {
      method: 'POST',
      body: payload,
    })
  },

  update(id: number, payload: Partial<ClientePayload>) {
    return httpClient<MutationResponse<Cliente>>(`/clientes/${id}`, {
      method: 'PUT',
      body: payload,
    })
  },

  remove(id: number) {
    return httpClient<{ message: string }>(`/clientes/${id}`, {
      method: 'DELETE',
    })
  },
}
