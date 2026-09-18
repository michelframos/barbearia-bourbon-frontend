import { Clock, ListChecks, Pencil, Plus, Trash2 } from 'lucide-react'
import { useCallback, useMemo, useState, type FormEvent } from 'react'

import { useServicos } from '@/modules/servicos/hooks/useServicos'
import type { Servico, ServicoPayload } from '@/modules/servicos/types/servico'
import { ApiError } from '@/shared/api/httpClient'
import { useSelection } from '@/shared/hooks/useSelection'
import { PageHeader } from '@/shared/layout/PageHeader'
import { cn } from '@/shared/lib/utils'
import { BulkActionsBar } from '@/shared/ui/bulk-actions-bar'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import { ConfirmDialog } from '@/shared/ui/confirm-dialog'
import { EmptyState } from '@/shared/ui/empty-state'
import { FieldLabel } from '@/shared/ui/field-label'
import { FilterChip } from '@/shared/ui/filter-chip'
import { Input } from '@/shared/ui/input'
import { Modal } from '@/shared/ui/modal'
import { SearchField } from '@/shared/ui/search-field'
import { Skeleton } from '@/shared/ui/skeleton'
import { Switch } from '@/shared/ui/switch'

const emptyForm: ServicoPayload = {
  nome: '',
  duracao_minutos: 30,
  preco: null,
}

type StatusFilter = 'todos' | 'a' | 'i'
type DeleteTarget = { mode: 'single'; item: Servico } | { mode: 'bulk'; ids: number[] }

function formatPreco(preco: string | number | null) {
  if (preco === null || preco === undefined || preco === '') return '—'
  const value = typeof preco === 'number' ? preco : Number(preco)
  if (Number.isNaN(value)) return '—'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function ServicosPage() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<StatusFilter>('todos')
  const { items, loading, error, create, update, updateMany, remove, removeMany } = useServicos(query)

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Servico | null>(null)
  const [form, setForm] = useState<ServicoPayload>(emptyForm)
  const [precoInput, setPrecoInput] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [deleting, setDeleting] = useState<DeleteTarget | null>(null)
  const [removing, setRemoving] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [bulkLoading, setBulkLoading] = useState(false)

  const title = useMemo(() => (editing ? 'Editar Serviço' : 'Novo Serviço'), [editing])

  const counts = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc.todos += 1
        if (item.status === 'a') acc.a += 1
        else acc.i += 1
        return acc
      },
      { todos: 0, a: 0, i: 0 },
    )
  }, [items])

  const filtered = useMemo(() => {
    if (filter === 'todos') return items
    return items.filter((item) => item.status === filter)
  }, [items, filter])

  const visibleIds = useMemo(() => filtered.map((item) => item.id), [filtered])
  const selection = useSelection(visibleIds)

  const handleSearch = useCallback((value: string) => {
    setQuery(value.trim())
  }, [])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm)
    setPrecoInput('')
    setFormError(null)
    setModalOpen(true)
  }

  function openEdit(item: Servico) {
    setEditing(item)
    setForm({
      nome: item.nome,
      duracao_minutos: item.duracao_minutos,
      preco: item.preco === null ? null : Number(item.preco),
    })
    setPrecoInput(item.preco === null || item.preco === undefined ? '' : String(item.preco))
    setFormError(null)
    setModalOpen(true)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setFormError(null)

    const preco = precoInput.trim() === '' ? null : Number(precoInput.replace(',', '.'))

    if (preco !== null && Number.isNaN(preco)) {
      setFormError('Preço inválido.')
      setSaving(false)
      return
    }

    const payload: ServicoPayload = {
      nome: form.nome.trim(),
      duracao_minutos: form.duracao_minutos ?? 30,
      preco,
    }

    try {
      if (editing) {
        await update(editing.id, payload)
      } else {
        await create(payload)
      }
      setModalOpen(false)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Não foi possível salvar.')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleStatus(item: Servico, active: boolean) {
    setTogglingId(item.id)
    try {
      await update(item.id, { status: active ? 'a' : 'i' })
    } catch {
      // listagem recarrega
    } finally {
      setTogglingId(null)
    }
  }

  async function handleBulkStatus(status: 'a' | 'i') {
    if (selection.count === 0) return
    setBulkLoading(true)
    try {
      await updateMany(selection.selectedIds, { status })
      selection.clear()
    } catch {
      // mantém seleção para nova tentativa
    } finally {
      setBulkLoading(false)
    }
  }

  async function handleConfirmDelete() {
    if (!deleting) return
    setRemoving(true)
    try {
      if (deleting.mode === 'single') {
        await remove(deleting.item.id)
      } else {
        await removeMany(deleting.ids)
        selection.clear()
      }
      setDeleting(null)
    } catch {
      setDeleting(null)
    } finally {
      setRemoving(false)
    }
  }

  const deleteDescription =
    deleting?.mode === 'single'
      ? `Tem certeza que deseja remover "${deleting.item.nome}"? Serviços vinculados a barbeiros ou atendimentos podem impedir a exclusão.`
      : deleting?.mode === 'bulk'
        ? `Tem certeza que deseja remover ${deleting.ids.length} serviço(s)? Serviços vinculados a barbeiros ou atendimentos podem impedir a exclusão.`
        : ''

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Serviços"
        description="Catálogo de serviços oferecidos pela barbearia."
        actions={
          <Button type="button" onClick={openCreate}>
            <Plus />
            Novo serviço
          </Button>
        }
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchField
          value={query}
          onChange={handleSearch}
          placeholder="Buscar serviço…"
          className="max-w-md"
        />
        <p className="text-sm text-[var(--foreground-muted)] tabular-nums">
          {loading ? '…' : `${filtered.length} de ${items.length}`}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            ['todos', 'Todos'],
            ['a', 'Ativos'],
            ['i', 'Inativos'],
          ] as const
        ).map(([key, label]) => (
          <FilterChip
            key={key}
            active={filter === key}
            count={counts[key]}
            onClick={() => setFilter(key)}
          >
            {label}
          </FilterChip>
        ))}
      </div>

      <BulkActionsBar
        count={selection.count}
        loading={bulkLoading || removing}
        onActivate={() => void handleBulkStatus('a')}
        onDeactivate={() => void handleBulkStatus('i')}
        onDelete={() => setDeleting({ mode: 'bulk', ids: selection.selectedIds })}
        onClear={selection.clear}
      />

      {error ? (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-36 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<ListChecks className="size-5" />}
          title={query || filter !== 'todos' ? 'Nenhum resultado' : 'Nenhum serviço ainda'}
          description={
            query || filter !== 'todos'
              ? 'Ajuste a busca ou o filtro para ver outros serviços.'
              : 'Cadastre o primeiro serviço do catálogo.'
          }
          actionLabel={query || filter !== 'todos' ? undefined : 'Novo serviço'}
          onAction={query || filter !== 'todos' ? undefined : openCreate}
        />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Checkbox
              checked={selection.allSelected}
              indeterminate={selection.someSelected}
              onCheckedChange={() => selection.toggleAll()}
              aria-label="Selecionar todos os serviços visíveis"
            />
            <span className="text-xs text-[var(--foreground-muted)]">Selecionar todos</span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((item) => {
              const selected = selection.isSelected(item.id)
              return (
                <article
                  key={item.id}
                  className={cn(
                    'group flex flex-col rounded-2xl border bg-[var(--surface)] p-5 transition-colors hover:bg-[var(--surface-elevated)]/40',
                    selected
                      ? 'border-[var(--accent)]/50 bg-[var(--accent-soft)]/30'
                      : 'border-[var(--border)] hover:border-[var(--accent)]/30',
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <Checkbox
                        checked={selected}
                        onCheckedChange={() => selection.toggle(item.id)}
                        aria-label={`Selecionar ${item.nome}`}
                        className="mt-1"
                      />
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-semibold text-[var(--foreground)]">
                          {item.nome}
                        </h3>
                        <p className="mt-1 text-lg font-semibold tabular-nums text-[var(--accent)]">
                          {formatPreco(item.preco)}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Switch
                        checked={item.status === 'a'}
                        disabled={togglingId === item.id || bulkLoading}
                        aria-label={
                          item.status === 'a' ? `Inativar ${item.nome}` : `Ativar ${item.nome}`
                        }
                        onCheckedChange={(active) => void handleToggleStatus(item, active)}
                      />
                      <span className="text-[11px] text-[var(--foreground-muted)]">
                        {item.status === 'a' ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--sidebar)] px-2.5 py-1.5">
                      <Clock className="size-3.5 text-[var(--accent)]" />
                      {item.duracao_minutos} min
                    </span>
                  </div>

                  <div className="mt-5 flex items-center justify-end gap-1 border-t border-[var(--border)] pt-3 opacity-80 transition-opacity group-hover:opacity-100">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(item)}
                    >
                      <Pencil />
                      Editar
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleting({ mode: 'single', item })}
                    >
                      <Trash2 />
                      Remover
                    </Button>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      )}

      <Modal
        open={modalOpen}
        title={title}
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="servico-form" disabled={saving} className="min-w-24">
              {saving ? 'Salvando…' : 'Salvar'}
            </Button>
          </>
        }
      >
        <form id="servico-form" className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <FieldLabel htmlFor="servico-nome">Nome</FieldLabel>
            <Input
              id="servico-nome"
              value={form.nome}
              onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value }))}
              required
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel htmlFor="servico-duracao">Duração (min)</FieldLabel>
              <Input
                id="servico-duracao"
                type="number"
                min={5}
                max={480}
                value={form.duracao_minutos ?? 30}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, duracao_minutos: Number(e.target.value) }))
                }
                required
              />
            </div>
            <div>
              <FieldLabel htmlFor="servico-preco">Preço</FieldLabel>
              <Input
                id="servico-preco"
                inputMode="decimal"
                placeholder="0,00"
                value={precoInput}
                onChange={(e) => setPrecoInput(e.target.value)}
              />
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
        title={deleting?.mode === 'bulk' ? 'Remover serviços' : 'Remover serviço'}
        description={deleteDescription}
        confirmLabel="Remover"
        loading={removing}
        onCancel={() => setDeleting(null)}
        onConfirm={() => void handleConfirmDelete()}
      />
    </div>
  )
}
