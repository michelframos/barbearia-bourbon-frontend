import { X } from 'lucide-react'
import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

import { cn } from '@/shared/lib/utils'

type ModalProps = {
  open: boolean
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  className?: string
}

export function Modal({ open, title, description, onClose, children, footer, className }: ModalProps) {
  useEffect(() => {
    if (!open) return

    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    window.addEventListener('keydown', onKeyDown)

    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!open || typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Fechar overlay"
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          'relative z-10 w-full max-w-[440px] rounded-2xl border border-[#2a2a2a] bg-[#1c1c1c] p-7 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.85)] sm:p-8',
          className,
        )}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2
              id="modal-title"
              className="text-lg font-semibold tracking-tight text-white sm:text-xl"
            >
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm text-[#8a8a8a]">{description}</p>
            ) : null}
          </div>

          <button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#2a2a2a] text-[#b0b0b0] transition-colors hover:bg-[#333] hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-4">{children}</div>

        {footer ? <div className="mt-7 flex items-center justify-end gap-3">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  )
}
