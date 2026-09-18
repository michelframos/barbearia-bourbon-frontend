import { httpClient } from '@/shared/api/httpClient'

import type { Empresa, EmpresaConfigPayload } from '@/modules/empresa/types/empresa'

type EmpresaResponse = {
  data: Empresa
}

type UpdateEmpresaResponse = {
  message: string
  data: Empresa
}

export const empresaApi = {
  get() {
    return httpClient<EmpresaResponse>('/empresa')
  },

  update(payload: EmpresaConfigPayload) {
    return httpClient<UpdateEmpresaResponse>('/empresa', {
      method: 'PUT',
      body: payload,
    })
  },
}
