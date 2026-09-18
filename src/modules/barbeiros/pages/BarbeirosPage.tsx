import { Camera, LayoutGrid, Plus, Scissors, SquarePen, Table2, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'

import { useBarbeiros } from '@/modules/barbeiros/hooks/useBarbeiros'
import type { Barbeiro, BarbeiroPayload } from '@/modules/barbeiros/types/barbeiro'
import { useServicos } from '@/modules/servicos/hooks/useServicos'
import { ApiError } from '@/shared/api/httpClient'
import { elapsedFromHora } from '@/shared/lib/elapsed'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import { ConfirmDialog } from '@/shared/ui/confirm-dialog'
import { EmptyState } from '@/shared/ui/empty-state'
import { FieldLabel } from '@/shared/ui/field-label'
import { InitialsAvatar } from '@/shared/ui/initials-avatar'
import { Input } from '@/shared/ui/input'
import { Modal } from '@/shared/ui/modal'
import { Skeleton } from '@/shared/ui/skeleton'

const emptyForm: BarbeiroPayload = {
  nome: '',
  telefone: '',
  status_operacional: 'offline',
  hora_entrada: '',
  servico_ids: [],
}

type ViewMode = 'cards' | 'tabela'

const operacionalLabels: Record<string, string> = {
  disponivel: 'Disponível',
  em_atendimento: 'Em Atendimento',
  offline: 'Offline',
  aguardando: 'Aguardando',
}

function isOnShift(status: string) {
  return status === 'disponivel' || status === 'em_atendimento' || status === 'aguardando'
}

function statusDotClass(status: string) {
  if (status === 'em_atendimento') return 'bg-[#3b9eff]'
  if (status === 'disponivel') return 'bg-[#3dd68c]'
  if (status === 'aguardando') return 'bg-amber-400'
  return 'bg-[#666]'
}

function statusTextClass(status: string) {
  if (status === 'em_atendimento') return 'text-[#3b9eff]'
  if (status === 'disponivel') return 'text-[#3dd68c]'
  if (status === 'aguardando') return 'text-amber-300'
  return 'text-[#8a8a8a]'
}

function nowTimeHHmm() {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

function DetailRow({
  label,
  value,
  valueClassName,
  hidden,
}: {
  label: string
  value: string
  valueClassName?: string
  hidden?: boolean
}) {
  if (hidden) return null
  return (
    <div className="flex items-center justify-between gap-3 py-[7px]">
      <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-[#6b6b6b]">
        {label}
      </span>
      <span className={cn('text-right text-[13px] text-[#e8e8e8]', valueClassName)}>
        {value}
      </span>
    </div>
  )
}

function StatusLabel({ status }: { status: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-[13px]', statusTextClass(status))}>
      <span className={cn('size-1.5 shrink-0 rounded-full', statusDotClass(status))} />
      {operacionalLabels[status] ?? status}
    </span>
  )
}

export function BarbeirosPage() {
  const { items, loading, error, create, update, remove } = useBarbeiros('', 15_000)
  const { items: servicos } = useServicos()
  const [now, setNow] = useState(() => new Date())
  const [view, setView] = useState<ViewMode>('cards')

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Barbeiro | null>(null)
  const [form, setForm] = useState<BarbeiroPayload>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [removeFoto, setRemoveFoto] = useState(false)

  const [deleting, setDeleting] = useState<Barbeiro | null>(null)
  const [removing, setRemoving] = useState(false)
  const [actionId, setActionId] = useState<number | null>(null)

  const modalTitle = useMemo(() => (editing ? 'Editar Barbeiro' : 'Novo Barbeiro'), [editing])

  const fotoDisplay = fotoPreview ?? (!removeFoto ? editing?.foto_url ?? null : null)

  const servicosAtivos = useMemo(
    () => servicos.filter((item) => item.status === 'a'),
    [servicos],
  )

  const ativos = useMemo(
    () => items.filter((item) => item.status === 'a' && isOnShift(item.status_operacional)),
    [items],
  )

  const foraExpediente = useMemo(
    () => items.filter((item) => item.status !== 'a' || !isOnShift(item.status_operacional)),
    [items],
  )

  const temEmAtendimento = useMemo(
    () => ativos.some((item) => item.status_operacional === 'em_atendimento'),
    [ativos],
  )

  useEffect(() => {
    if (!temEmAtendimento) return
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [temEmAtendimento])

  function resetFotoState() {
    setFotoFile(null)
    setFotoPreview(null)
    setRemoveFoto(false)
  }

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setFormError(null)
    resetFotoState()
    setModalOpen(true)
  }

  function openEdit(item: Barbeiro) {
    setEditing(item)
    setForm({
      nome: item.nome,
      telefone: item.telefone ?? '',
      status_operacional: item.status_operacional,
      hora_entrada: item.hora_entrada ?? '',
      servico_ids: item.servico_ids ?? item.servicos?.map((s) => s.id) ?? [],
    })
    setFormError(null)
    resetFotoState()
    setModalOpen(true)
  }

  function handleFotoChange(file: File | null) {
    if (fotoPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(fotoPreview)
    }
    if (!file) {
      setFotoFile(null)
      setFotoPreview(null)
      return
    }
    setRemoveFoto(false)
    setFotoFile(file)
    setFotoPreview(URL.createObjectURL(file))
  }

  function handleRemoveFoto() {
    if (fotoPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(fotoPreview)
    }
    setFotoFile(null)
    setFotoPreview(null)
    setRemoveFoto(true)
  }

  function toggleServico(id: number) {
    setForm((prev) => {
      const current = prev.servico_ids ?? []
      const next = current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
      return { ...prev, servico_ids: next }
    })
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setFormError(null)

    const payload: BarbeiroPayload = {
      nome: form.nome.trim(),
      telefone: form.telefone?.trim() || null,
      status_operacional: form.status_operacional,
      hora_entrada: form.hora_entrada?.trim() || null,
      servico_ids: form.servico_ids ?? [],
    }

    try {
      if (editing) {
        await update(editing.id, payload, {
          foto: fotoFile,
          removeFoto: removeFoto && !fotoFile,
        })
      } else {
        await create(payload, fotoFile)
      }
      setModalOpen(false)
      resetFotoState()
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Não foi possível salvar.')
    } finally {
      setSaving(false)
    }
  }

  async function handleCheckIn(item: Barbeiro) {
    setActionId(item.id)
    try {
      await update(item.id, {
        status_operacional: 'disponivel',
        hora_entrada: nowTimeHHmm(),
        status: 'a',
      })
    } catch {
      // hook recarrega
    } finally {
      setActionId(null)
    }
  }

  async function handleCheckOut(item: Barbeiro) {
    setActionId(item.id)
    try {
      await update(item.id, {
        status_operacional: 'offline',
        hora_entrada: null,
      })
    } catch {
      // hook recarrega
    } finally {
      setActionId(null)
    }
  }

  async function handleConfirmDelete() {
    if (!deleting) return
    setRemoving(true)
    try {
      await remove(deleting.id)
      setDeleting(null)
    } catch {
      setDeleting(null)
    } finally {
      setRemoving(false)
    }
  }

  return (
    <div className="animate-fade-in space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0 space-y-1">
          <h1 className="font-display text-2xl tracking-tight text-white md:text-3xl">Barbeiros</h1>
          <p className="text-sm text-[#8a8a8a]">
            {loading
              ? '…'
              : `${ativos.length} em expediente · ${items.length} cadastrado${items.length === 1 ? '' : 's'}`}
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="inline-flex rounded-xl border border-[#2c2c2c] bg-[#141414] p-1">
            <button
              type="button"
              onClick={() => setView('cards')}
              className={cn(
                'inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                view === 'cards'
                  ? 'bg-[var(--accent)] text-[var(--accent-foreground)]'
                  : 'text-[#9a9a9a] hover:text-white',
              )}
            >
              <LayoutGrid className="size-3.5" />
              Cards
            </button>
            <button
              type="button"
              onClick={() => setView('tabela')}
              className={cn(
                'inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                view === 'tabela'
                  ? 'bg-[var(--accent)] text-[var(--accent-foreground)]'
                  : 'text-[#9a9a9a] hover:text-white',
              )}
            >
              <Table2 className="size-3.5" />
              Tabela
            </button>
          </div>

          <Button type="button" onClick={openCreate} className="sm:w-auto">
            <Plus />
            Novo Barbeiro
          </Button>
        </div>
      </header>

      {error ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-[280px] rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Scissors className="size-5" />}
          title="Nenhum barbeiro ainda"
          description="Cadastre o primeiro barbeiro e associe os serviços que ele oferece."
          actionLabel="Novo Barbeiro"
          onAction={openCreate}
        />
      ) : view === 'cards' ? (
        <div className="space-y-10">
          {ativos.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {ativos.map((item) => {
                const emAtendimento = item.status_operacional === 'em_atendimento'
                const atendimento = item.atendimento_atual
                const horaInicio = atendimento?.hora_inicio ?? null
                const tempo = emAtendimento && horaInicio ? elapsedFromHora(horaInicio, now) : ''

                return (
                  <article
                    key={item.id}
                    className="flex flex-col rounded-2xl border border-[#2c2c2c] bg-[#1c1c1c] p-5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="relative shrink-0">
                          <InitialsAvatar
                            name={item.nome}
                            src={item.foto_url}
                            variant="vibrant"
                            className="size-[52px] text-[15px] font-semibold"
                          />
                          <span
                            className={cn(
                              'absolute bottom-0.5 right-0.5 size-3 rounded-full ring-[3px] ring-[#1c1c1c]',
                              statusDotClass(item.status_operacional),
                            )}
                          />
                        </div>
                        <div className="min-w-0">
                          <h3 className="truncate text-[15px] font-semibold leading-tight text-white">
                            {item.nome}
                          </h3>
                          <div className="mt-1">
                            <StatusLabel status={item.status_operacional} />
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        aria-label={`Editar ${item.nome}`}
                        onClick={() => openEdit(item)}
                        className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-[#6a6a6a] transition-colors hover:bg-[#2a2a2a] hover:text-[#cfcfcf]"
                      >
                        <SquarePen className="size-4" />
                      </button>
                    </div>

                    <div className="mt-5 flex-1">
                      <DetailRow
                        label="Entrada"
                        value={emAtendimento ? horaInicio || '—' : item.hora_entrada || '—'}
                      />
                      <DetailRow
                        label="Cliente"
                        value={atendimento?.cliente?.nome ?? '—'}
                        hidden={!emAtendimento}
                      />
                      <DetailRow
                        label="Serviço"
                        value={atendimento?.servico?.nome ?? '—'}
                        hidden={!emAtendimento}
                      />
                      <DetailRow
                        label="Tempo"
                        value={tempo}
                        hidden={!emAtendimento}
                        valueClassName="text-[22px] font-semibold leading-none tabular-nums text-[#c9a96a]"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={actionId === item.id}
                      onClick={() => void handleCheckOut(item)}
                      className="mt-5 w-full rounded-xl bg-[#3a1c1c] px-4 py-2.5 text-sm font-medium text-[#f07171] transition-colors hover:bg-[#462020] disabled:opacity-50"
                    >
                      {actionId === item.id ? 'Aguarde…' : 'Check-out'}
                    </button>
                  </article>
                )
              })}
            </div>
          ) : (
            <p className="rounded-2xl border border-dashed border-[#2c2c2c] px-4 py-10 text-center text-sm text-[#8a8a8a]">
              Nenhum barbeiro no expediente. Faça check-in abaixo.
            </p>
          )}

          {foraExpediente.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-[11px] font-medium uppercase tracking-[0.14em] text-[#6b6b6b]">
                Fora do expediente
              </h2>
              <div className="space-y-2">
                {foraExpediente.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-2xl border border-[#2c2c2c] bg-[#1c1c1c] px-4 py-3"
                  >
                    <InitialsAvatar
                      name={item.nome}
                      src={item.foto_url}
                      variant="vibrant"
                      className="size-10 text-xs"
                    />
                    <p className="min-w-0 flex-1 truncate text-[15px] font-medium text-white">
                      {item.nome}
                    </p>
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="rounded-lg border border-[#3a3a3a] bg-transparent px-3 py-1.5 text-xs font-medium text-[#d0d0d0] transition-colors hover:bg-[#2a2a2a]"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        disabled={actionId === item.id}
                        onClick={() => void handleCheckIn(item)}
                        className="rounded-lg bg-[#2a2a2a] px-3 py-1.5 text-xs font-medium text-[#e8e8e8] transition-colors hover:bg-[#333] disabled:opacity-50"
                      >
                        {actionId === item.id ? '…' : 'Check-in'}
                      </button>
                      <button
                        type="button"
                        aria-label={`Remover ${item.nome}`}
                        onClick={() => setDeleting(item)}
                        className="inline-flex size-8 items-center justify-center rounded-lg text-[#6a6a6a] transition-colors hover:bg-[#2a2a2a] hover:text-[#f07171]"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[#2c2c2c] bg-[#1c1c1c]">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-[#2c2c2c] text-[10px] uppercase tracking-[0.1em] text-[#6b6b6b]">
                <th className="px-5 py-3.5 font-medium">Nome</th>
                <th className="px-5 py-3.5 font-medium">Status</th>
                <th className="px-5 py-3.5 font-medium">Entrada</th>
                <th className="px-5 py-3.5 font-medium">Cliente</th>
                <th className="px-5 py-3.5 font-medium">Serviço</th>
                <th className="px-5 py-3.5 font-medium">Tempo</th>
                <th className="px-5 py-3.5 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const offline = !isOnShift(item.status_operacional) || item.status !== 'a'
                const emAtendimento = item.status_operacional === 'em_atendimento'
                const atendimento = item.atendimento_atual
                const horaInicio = atendimento?.hora_inicio ?? null
                const tempo =
                  emAtendimento && horaInicio ? elapsedFromHora(horaInicio, now) : ''
                return (
                  <tr
                    key={item.id}
                    className="border-t border-[#2c2c2c] transition-colors hover:bg-[#222]"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <InitialsAvatar
                          name={item.nome}
                          src={item.foto_url}
                          variant="vibrant"
                          className={cn('size-9 text-[11px]', offline && 'opacity-70')}
                        />
                        <span
                          className={cn(
                            'font-medium',
                            offline ? 'text-[#9a9a9a]' : 'text-white',
                          )}
                        >
                          {item.nome}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusLabel
                        status={item.status !== 'a' ? 'offline' : item.status_operacional}
                      />
                    </td>
                    <td className="px-5 py-3.5 text-[#cfcfcf]">
                      {emAtendimento ? horaInicio || '—' : item.hora_entrada || '—'}
                    </td>
                    <td className="px-5 py-3.5 text-[#cfcfcf]">
                      {atendimento?.cliente?.nome ?? '—'}
                    </td>
                    <td className="px-5 py-3.5 text-[#cfcfcf]">
                      {atendimento?.servico?.nome ?? '—'}
                    </td>
                    <td className="px-5 py-3.5 tabular-nums text-[#c9a96a]">
                      {tempo || '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          aria-label={`Editar ${item.nome}`}
                          onClick={() => openEdit(item)}
                          className="inline-flex size-8 items-center justify-center rounded-lg text-[#7a7a7a] transition-colors hover:bg-[#2a2a2a] hover:text-white"
                        >
                          <SquarePen className="size-4" />
                        </button>
                        {offline ? (
                          <button
                            type="button"
                            disabled={actionId === item.id}
                            onClick={() => void handleCheckIn(item)}
                            className="rounded-lg bg-[#2a2a2a] px-3 py-1.5 text-xs font-medium text-[#e8e8e8] transition-colors hover:bg-[#333] disabled:opacity-50"
                          >
                            {actionId === item.id ? '…' : 'Check-in'}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={actionId === item.id}
                            onClick={() => void handleCheckOut(item)}
                            className="rounded-lg bg-[#3a1c1c] px-3 py-1.5 text-xs font-medium text-[#f07171] transition-colors hover:bg-[#462020] disabled:opacity-50"
                          >
                            {actionId === item.id ? '…' : 'Check-out'}
                          </button>
                        )}
                        <button
                          type="button"
                          aria-label={`Remover ${item.nome}`}
                          onClick={() => setDeleting(item)}
                          className="inline-flex size-8 items-center justify-center rounded-lg text-[#7a7a7a] transition-colors hover:bg-[#2a2a2a] hover:text-[#f07171]"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        title={modalTitle}
        onClose={() => setModalOpen(false)}
        className="max-w-[520px]"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="barbeiro-form" disabled={saving} className="min-w-24">
              {saving ? 'Salvando…' : 'Salvar'}
            </Button>
          </>
        }
      >
        <form id="barbeiro-form" className="space-y-4" onSubmit={handleSubmit}>
          <div className="flex items-center gap-4">
            <InitialsAvatar
              name={form.nome || 'Barbeiro'}
              src={fotoDisplay}
              variant="vibrant"
              className="size-16 text-base"
            />
            <div className="min-w-0 flex-1 space-y-2">
              <FieldLabel>Foto</FieldLabel>
              <div className="flex flex-wrap gap-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[#3a3a3a] bg-transparent px-3 py-2 text-xs font-medium text-[#d0d0d0] transition-colors hover:bg-[#2a2a2a]">
                  <Camera className="size-3.5" />
                  {fotoDisplay ? 'Trocar foto' : 'Escolher foto'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => handleFotoChange(e.target.files?.[0] ?? null)}
                  />
                </label>
                {fotoDisplay ? (
                  <button
                    type="button"
                    onClick={handleRemoveFoto}
                    className="rounded-lg px-3 py-2 text-xs font-medium text-[#f07171] transition-colors hover:bg-red-500/10"
                  >
                    Remover
                  </button>
                ) : null}
              </div>
              <p className="text-[11px] text-[#7a7a7a]">JPEG, PNG ou WebP · máx. 2 MB</p>
            </div>
          </div>
          <div>
            <FieldLabel htmlFor="barbeiro-nome">Nome</FieldLabel>
            <Input
              id="barbeiro-nome"
              value={form.nome}
              onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value }))}
              required
              autoFocus
            />
          </div>
          <div>
            <FieldLabel htmlFor="barbeiro-telefone">Telefone</FieldLabel>
            <Input
              id="barbeiro-telefone"
              value={form.telefone ?? ''}
              onChange={(e) => setForm((prev) => ({ ...prev, telefone: e.target.value }))}
              placeholder="(11) 99999-0000"
            />
          </div>
          <div>
            <FieldLabel>Serviços oferecidos</FieldLabel>
            <div className="mt-2 max-h-40 space-y-2 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--sidebar)]/30 p-3">
              {servicosAtivos.length === 0 ? (
                <p className="text-sm text-[var(--foreground-muted)]">
                  Nenhum serviço ativo cadastrado.
                </p>
              ) : (
                servicosAtivos.map((servico) => {
                  const checked = (form.servico_ids ?? []).includes(servico.id)
                  return (
                    <label
                      key={servico.id}
                      className="flex cursor-pointer items-center gap-2.5 text-sm text-[var(--foreground)]"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleServico(servico.id)}
                        aria-label={`Associar ${servico.nome}`}
                      />
                      <span>{servico.nome}</span>
                    </label>
                  )
                })
              )}
            </div>
          </div>
          {formError ? (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {formError}
            </p>
          ) : null}
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Remover barbeiro"
        description={deleting ? `Tem certeza que deseja remover "${deleting.nome}"?` : ''}
        confirmLabel="Remover"
        loading={removing}
        onCancel={() => setDeleting(null)}
        onConfirm={() => void handleConfirmDelete()}
      />
    </div>
  )
}
