import type { ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

type PageHeaderProps = {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        'mb-8 flex flex-col gap-4 md:flex-row md:flex-wrap md:items-end md:justify-between',
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        <h1 className="font-display text-2xl tracking-tight text-[var(--foreground)] md:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="max-w-2xl text-sm text-[var(--foreground-muted)] md:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex w-full flex-col gap-2 md:w-auto md:flex-row md:items-center [&_button]:w-full md:[&_button]:w-auto">
          {actions}
        </div>
      ) : null}
    </header>
  )
}
