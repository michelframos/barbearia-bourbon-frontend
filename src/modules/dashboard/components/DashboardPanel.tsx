import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

type DashboardPanelProps = {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
  className?: string
}

export function DashboardPanel({
  title,
  description,
  action,
  children,
  className,
}: DashboardPanelProps) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]/40',
        className,
      )}
    >
      <header className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
        <div className="min-w-0">
          <h2 className="font-display text-base text-[var(--foreground)]">{title}</h2>
          {description ? (
            <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">{description}</p>
          ) : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </header>
      {children}
    </section>
  )
}
