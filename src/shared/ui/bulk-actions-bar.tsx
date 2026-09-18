import { Power, PowerOff, Trash2, X } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '@/shared/ui/button'

type BulkActionsBarProps = {
  count: number
  loading?: boolean
  onActivate?: () => void
  onDeactivate?: () => void
  onDelete?: () => void
  onClear: () => void
  children?: ReactNode
}

export function BulkActionsBar({
  count,
  loading = false,
  onActivate,
  onDeactivate,
  onDelete,
  onClear,
  children,
}: BulkActionsBarProps) {
  if (count <= 0) return null

  return (
    <div className="sticky top-3 z-20 flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--accent)]/30 bg-[var(--surface-elevated)]/95 px-3 py-2.5 shadow-[0_12px_40px_-16px_rgba(0,0,0,0.7)] backdrop-blur-md sm:gap-3 sm:px-4">
      <p className="mr-auto text-sm font-medium text-[var(--foreground)] tabular-nums">
        {count} {count === 1 ? 'selecionado' : 'selecionados'}
      </p>

      {children}

      {onActivate ? (
        <Button type="button" variant="secondary" size="sm" disabled={loading} onClick={onActivate}>
          <Power />
          Ativar
        </Button>
      ) : null}

      {onDeactivate ? (
        <Button type="button" variant="secondary" size="sm" disabled={loading} onClick={onDeactivate}>
          <PowerOff />
          Inativar
        </Button>
      ) : null}

      {onDelete ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={loading}
          onClick={onDelete}
          className="text-red-300 hover:bg-red-500/10 hover:text-red-200"
        >
          <Trash2 />
          Excluir
        </Button>
      ) : null}

      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled={loading}
        aria-label="Limpar seleção"
        onClick={onClear}
        className="size-8"
      >
        <X className="size-4" />
      </Button>
    </div>
  )
}
