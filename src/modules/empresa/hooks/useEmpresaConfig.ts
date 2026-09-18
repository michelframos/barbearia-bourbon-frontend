import { useCallback, useEffect, useState } from 'react'

import { empresaApi } from '@/modules/empresa/api/empresaApi'
import type { Empresa, EmpresaConfigPayload } from '@/modules/empresa/types/empresa'
import { ApiError } from '@/shared/api/httpClient'

export function useEmpresaConfig() {
  const [empresa, setEmpresa] = useState<Empresa | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await empresaApi.get()
      setEmpresa(response.data)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Falha ao carregar configurações.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  const update = useCallback(
    async (payload: EmpresaConfigPayload) => {
      const response = await empresaApi.update(payload)
      setEmpresa(response.data)
      return response.data
    },
    [],
  )

  return { empresa, loading, error, reload, update }
}
