import { Check } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'

import { cn } from '@/shared/lib/utils'

type CheckboxProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> & {
  checked: boolean
  indeterminate?: boolean
  onCheckedChange: (checked: boolean) => void
}

export function Checkbox({
  checked,
  indeterminate = false,
  onCheckedChange,
  className,
  disabled,
  ...props
}: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'inline-flex size-4 shrink-0 items-center justify-center rounded border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]',
        checked || indeterminate
          ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)]'
          : 'border-[#3a3a3a] bg-transparent text-transparent hover:border-[var(--accent)]/60',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
      {...props}
    >
      {(checked || indeterminate) && (
        <Check className={cn('size-3', indeterminate && 'opacity-80')} strokeWidth={3} />
      )}
    </button>
  )
}
