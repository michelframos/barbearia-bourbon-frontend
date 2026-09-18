import * as React from 'react'

import { cn } from '@/shared/lib/utils'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const selectClassName =
  'flex h-11 w-full appearance-none rounded-lg border border-[#333] bg-[#111] px-3.5 text-sm text-white outline-none transition-colors focus-visible:border-[var(--accent)] focus-visible:ring-1 focus-visible:ring-[var(--accent)]/40 disabled:cursor-not-allowed disabled:opacity-50'

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <select className={cn(selectClassName, className)} ref={ref} {...props}>
        {children}
      </select>
    )
  },
)
Select.displayName = 'Select'

export { Select, selectClassName }
