import { httpClient } from '@/shared/api/httpClient'
import type { MutationResponse } from '@/shared/api/types'
import type {
  Atendimento,
  CheckInPayload,
  PainelSnapshot,
} from '@/modules/painel/types/atendimento'

export const atendimentosApi = {
  painel(data?: string) {
    const query = new URLSearchParams()
    if (data) query.set('data', data)
    const qs = query.toString()
    return httpClient<PainelSnapshot>(`/atendimentos/painel${qs ? `?${qs}` : ''}`)
  },

  checkIn(payload: CheckInPayload) {
    return httpClient<MutationResponse<Atendimento>>('/atendimentos/check-in', {
      method: 'POST',
      body: payload,
    })
  },

  chamar(id: number) {
    return httpClient<MutationResponse<Atendimento>>(`/atendimentos/${id}/chamar`, {
      method: 'POST',
    })
  },

  iniciar(
    id: number,
    payload?: { id_barbeiro?: number | null; id_assistente?: number | null },
  ) {
    return httpClient<MutationResponse<Atendimento>>(`/atendimentos/${id}/iniciar`, {
      method: 'POST',
      body: {
        ...(payload?.id_barbeiro ? { id_barbeiro: payload.id_barbeiro } : {}),
        ...(payload?.id_assistente ? { id_assistente: payload.id_assistente } : {}),
      },
    })
  },

  concluir(id: number) {
    return httpClient<MutationResponse<Atendimento>>(`/atendimentos/${id}/concluir`, {
      method: 'POST',
    })
  },

  cancelar(id: number) {
    return httpClient<MutationResponse<Atendimento>>(`/atendimentos/${id}/cancelar`, {
      method: 'POST',
    })
  },
}
