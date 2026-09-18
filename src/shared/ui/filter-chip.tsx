import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

type FilterChipProps = {
  active?: boolean
  children: ReactNode
  onClick?: () => void
  count?: number
}

export function FilterChip({ active, children, onClick, count }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-sm transition-colors',
        active
          ? 'border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent)]'
          : 'border-[var(--border)] bg-transparent text-[var(--foreground-muted)] hover:border-[var(--foreground-muted)] hover:text-[var(--foreground)]',
      )}
    >
      <span>{children}</span>
      {typeof count === 'number' ? (
        <span
          className={cn(
            'rounded-full px-1.5 text-[11px] font-semibold tabular-nums',
            active ? 'bg-[var(--accent)] text-[var(--accent-foreground)]' : 'bg-[var(--surface-elevated)]',
          )}
        >
          {count}
        </span>
      ) : null}
    </button>
  )
}
