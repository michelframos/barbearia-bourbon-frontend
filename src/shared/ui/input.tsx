import * as React from 'react'

import { cn } from '@/shared/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-11 w-full rounded-lg border border-[#333] bg-[#111] px-3.5 text-sm text-white placeholder:text-[#666] outline-none transition-colors focus-visible:border-[var(--accent)] focus-visible:ring-1 focus-visible:ring-[var(--accent)]/40 disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      ref={ref}
      {...props}
    />
  )
})
Input.displayName = 'Input'

export { Input }
