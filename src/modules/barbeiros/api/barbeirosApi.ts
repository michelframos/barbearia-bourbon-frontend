import { httpClient } from '@/shared/api/httpClient'
import type { MutationResponse, PaginatedResponse } from '@/shared/api/types'
import type { Barbeiro, BarbeiroPayload } from '@/modules/barbeiros/types/barbeiro'

export const barbeirosApi = {
  list(params: { search?: string; page?: number; perPage?: number } = {}) {
    const query = new URLSearchParams()
    if (params.search) query.set('search', params.search)
    if (params.page) query.set('page', String(params.page))
    query.set('per_page', String(params.perPage ?? 50))
    const qs = query.toString()
    return httpClient<PaginatedResponse<Barbeiro>>(`/barbeiros${qs ? `?${qs}` : ''}`)
  },

  create(payload: BarbeiroPayload) {
    return httpClient<MutationResponse<Barbeiro>>('/barbeiros', {
      method: 'POST',
      body: payload,
    })
  },

  update(id: number, payload: Partial<BarbeiroPayload>) {
    return httpClient<MutationResponse<Barbeiro>>(`/barbeiros/${id}`, {
      method: 'PUT',
      body: payload,
    })
  },

  uploadFoto(id: number, file: File) {
    const body = new FormData()
    body.append('foto', file)
    return httpClient<MutationResponse<Barbeiro>>(`/barbeiros/${id}/foto`, {
      method: 'POST',
      body,
    })
  },

  removeFoto(id: number) {
    return httpClient<MutationResponse<Barbeiro>>(`/barbeiros/${id}/foto`, {
      method: 'DELETE',
    })
  },

  remove(id: number) {
    return httpClient<{ message: string }>(`/barbeiros/${id}`, {
      method: 'DELETE',
    })
  },
}
