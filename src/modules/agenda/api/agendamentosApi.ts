import { httpClient } from '@/shared/api/httpClient'
import type { MutationResponse } from '@/shared/api/types'
import type {
  AgendaGrade,
  Agendamento,
  AgendamentoPayload,
  TrinksExportResult,
  TrinksImportResult,
} from '@/modules/agenda/types/agendamento'

export const agendamentosApi = {
  list(params: { data: string; idBarbeiro?: number | null }) {
    const query = new URLSearchParams()
    query.set('data', params.data)
    if (params.idBarbeiro) query.set('id_barbeiro', String(params.idBarbeiro))
    return httpClient<{ data: Agendamento[] }>(`/agendamentos?${query.toString()}`)
  },

  grade(params: { data: string; idBarbeiro?: number | null }) {
    const query = new URLSearchParams()
    query.set('data', params.data)
    if (params.idBarbeiro) query.set('id_barbeiro', String(params.idBarbeiro))
    return httpClient<AgendaGrade>(`/agendamentos/grade?${query.toString()}`)
  },

  create(payload: AgendamentoPayload) {
    return httpClient<MutationResponse<Agendamento>>('/agendamentos', {
      method: 'POST',
      body: payload,
    })
  },

  update(id: number, payload: Partial<AgendamentoPayload>) {
    return httpClient<MutationResponse<Agendamento>>(`/agendamentos/${id}`, {
      method: 'PUT',
      body: payload,
    })
  },

  cancel(id: number) {
    return httpClient<MutationResponse<Agendamento>>(`/agendamentos/${id}/cancelar`, {
      method: 'POST',
    })
  },

  importarTrinks() {
    return httpClient<TrinksImportResult>('/agendamentos/trinks/importar', {
      method: 'POST',
    })
  },

  exportarTrinks() {
    return httpClient<TrinksExportResult>('/agendamentos/trinks/exportar', {
      method: 'POST',
    })
  },
}
