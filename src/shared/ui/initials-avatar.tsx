import { cn } from '@/shared/lib/utils'

type InitialsAvatarProps = {
  name: string
  className?: string
  src?: string | null
  /** Cores variadas por nome (estilo painel operacional). */
  variant?: 'accent' | 'vibrant'
}

const vibrantPalette = [
  'bg-[#c0268a] text-white',
  'bg-[#38bdf8] text-[#0c4a6e]',
  'bg-[#14b8a6] text-[#042f2e]',
  'bg-[#8b5cf6] text-white',
  'bg-[#f59e0b] text-[#1c1408]',
  'bg-[#ef4444] text-white',
  'bg-[#6366f1] text-white',
]

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function colorFromName(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i += 1) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return vibrantPalette[Math.abs(hash) % vibrantPalette.length]
}

export function InitialsAvatar({
  name,
  className,
  src,
  variant = 'accent',
}: InitialsAvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('size-10 shrink-0 rounded-full object-cover', className)}
      />
    )
  }

  return (
    <div
      aria-hidden
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold tracking-wide',
        variant === 'accent' &&
          'bg-[var(--accent-soft)] text-[var(--accent)] ring-1 ring-[var(--accent)]/20',
        variant === 'vibrant' && colorFromName(name),
        className,
      )}
    >
      {getInitials(name)}
    </div>
  )
}
