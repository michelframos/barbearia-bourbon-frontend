import { Modal } from '@/shared/ui/modal'
import { Button } from '@/shared/ui/button'

type ConfirmDialogProps = {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  loading?: boolean
  tone?: 'danger' | 'default'
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  loading = false,
  tone = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      className="max-w-[400px]"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className={
              tone === 'danger'
                ? 'min-w-24 bg-red-500/90 text-white hover:bg-red-500'
                : 'min-w-24'
            }
          >
            {loading ? 'Aguarde…' : confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-[#b0b0b0]">{description}</p>
    </Modal>
  )
}
