import { Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Input } from '@/shared/ui/input'
import { cn } from '@/shared/lib/utils'

type SearchFieldProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  debounceMs?: number
}

export function SearchField({
  value,
  onChange,
  placeholder = 'Buscar…',
  className,
  debounceMs = 300,
}: SearchFieldProps) {
  const [local, setLocal] = useState(value)

  useEffect(() => {
    setLocal(value)
  }, [value])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (local !== value) onChange(local)
    }, debounceMs)
    return () => window.clearTimeout(timer)
  }, [local, value, onChange, debounceMs])

  return (
    <div className={cn('relative min-w-0 flex-1', className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--foreground-muted)]" />
      <Input
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        className="h-11 border-[var(--border)] bg-[var(--surface)] pl-10 pr-10"
        aria-label={placeholder}
      />
      {local ? (
        <button
          type="button"
          aria-label="Limpar busca"
          className="absolute top-1/2 right-2 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-[var(--foreground-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]"
          onClick={() => {
            setLocal('')
            onChange('')
          }}
        >
          <X className="size-4" />
        </button>
      ) : null}
    </div>
  )
}
