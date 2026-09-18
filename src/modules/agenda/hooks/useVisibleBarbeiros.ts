import { useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'agenda.visibleBarbeiroIds'

function readStoredIds(): number[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return null
    return parsed.map(Number).filter((id) => Number.isFinite(id) && id > 0)
  } catch {
    return null
  }
}

function writeStoredIds(ids: number[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
}

/**
 * Controla quais barbeiros ativos aparecem na grade.
 * Persistido em localStorage; novos barbeiros entram selecionados por padrão.
 */
export function useVisibleBarbeiros(ativosIds: number[]) {
  const [selectedIds, setSelectedIds] = useState<number[]>(() => {
    const stored = readStoredIds()
    return stored ?? ativosIds
  })
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    const stored = readStoredIds()
    if (stored === null) {
      setSelectedIds(ativosIds)
    } else {
      const stillValid = stored.filter((id) => ativosIds.includes(id))
      const novos = ativosIds.filter((id) => !stored.includes(id))
      setSelectedIds([...stillValid, ...novos])
    }
    setHydrated(true)
  }, [ativosIds.join(',')]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!hydrated) return
    writeStoredIds(selectedIds)
  }, [selectedIds, hydrated])

  const visibleIds = useMemo(() => {
    const set = new Set(selectedIds)
    return ativosIds.filter((id) => set.has(id))
  }, [ativosIds, selectedIds])

  function toggle(id: number) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  function selectAll() {
    setSelectedIds(ativosIds)
  }

  function clearAll() {
    setSelectedIds([])
  }

  return {
    visibleIds,
    selectedIds,
    toggle,
    selectAll,
    clearAll,
    isSelected: (id: number) => selectedIds.includes(id),
  }
}
