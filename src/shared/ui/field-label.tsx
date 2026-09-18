import type { LabelHTMLAttributes, ReactNode } from 'react'

import { cn } from '@/shared/lib/utils'

type FieldLabelProps = LabelHTMLAttributes<HTMLLabelElement> & {
  children: ReactNode
}

export function FieldLabel({ children, className, ...props }: FieldLabelProps) {
  return (
    <label
      className={cn(
        'mb-1.5 block text-[11px] font-medium uppercase tracking-[0.08em] text-[#8a8a8a]',
        className,
      )}
      {...props}
    >
      {children}
    </label>
  )
}
