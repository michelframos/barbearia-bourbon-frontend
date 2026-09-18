import { httpClient } from '@/shared/api/httpClient'
import type { PainelSnapshot } from '@/modules/painel/types/atendimento'

export type PainelTvMeta = {
  cached: boolean
  refresh_interval_segundos: number
  gerado_em: string
}

export type PainelTvSnapshot = PainelSnapshot & {
  meta: PainelTvMeta
}

export const painelTvApi = {
  snapshot(data?: string) {
    const query = new URLSearchParams()
    if (data) query.set('data', data)
    const qs = query.toString()
    return httpClient<PainelTvSnapshot>(`/atendimentos/painel-tv${qs ? `?${qs}` : ''}`)
  },
}
