import { useCallback, useEffect, useMemo, useState } from 'react'

export function useSelection(visibleIds: number[]) {
  const [selected, setSelected] = useState<Set<number>>(() => new Set())
  const visibleKey = visibleIds.join(',')

  useEffect(() => {
    const allowed = new Set(visibleIds)
    setSelected((prev) => {
      let changed = false
      const next = new Set<number>()
      for (const id of prev) {
        if (allowed.has(id)) next.add(id)
        else changed = true
      }
      if (!changed && next.size === prev.size) return prev
      return next
    })
    // visibleIds is represented by visibleKey for stable dependency
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleKey])

  const selectedIds = useMemo(() => Array.from(selected), [selected])

  const isSelected = useCallback((id: number) => selected.has(id), [selected])

  const toggle = useCallback((id: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  const toggleAll = useCallback(() => {
    setSelected((prev) => {
      const allSelected = visibleIds.length > 0 && visibleIds.every((id) => prev.has(id))
      if (allSelected) return new Set()
      return new Set(visibleIds)
    })
  }, [visibleIds])

  const clear = useCallback(() => {
    setSelected(new Set())
  }, [])

  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id))
  const someSelected = selected.size > 0 && !allSelected

  return {
    selectedIds,
    count: selected.size,
    isSelected,
    toggle,
    toggleAll,
    clear,
    allSelected,
    someSelected,
  }
}
