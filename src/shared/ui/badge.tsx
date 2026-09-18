import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

const tones = {
  default: 'bg-[var(--accent-soft)] text-[var(--accent)]',
  success: 'bg-emerald-500/15 text-emerald-300',
  warning: 'bg-amber-500/15 text-amber-300',
  info: 'bg-sky-500/15 text-sky-300',
  muted: 'bg-[var(--surface-elevated)] text-[var(--foreground-muted)]',
}

type BadgeProps = {
  children: ReactNode
  tone?: 'default' | 'success' | 'warning' | 'info' | 'muted'
  className?: string
  dot?: boolean
}

export function Badge({ children, tone = 'default', className, dot = false }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        tones[tone],
        className,
      )}
    >
      {dot ? <span className="size-1.5 shrink-0 rounded-full bg-current" /> : null}
      {children}
    </span>
  )
}
