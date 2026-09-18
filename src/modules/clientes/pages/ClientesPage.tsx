import { Pencil, Plus, Trash2, Users } from 'lucide-react'
import { useCallback, useMemo, useState, type FormEvent } from 'react'

import { useAssistentes } from '@/modules/assistentes/hooks/useAssistentes'
import { useClientes } from '@/modules/clientes/hooks/useClientes'
import type { Cliente, ClientePayload } from '@/modules/clientes/types/cliente'
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
import { InitialsAvatar } from '@/shared/ui/initials-avatar'
import { Input } from '@/shared/ui/input'
import { Modal } from '@/shared/ui/modal'
import { SearchField } from '@/shared/ui/search-field'
import { Select } from '@/shared/ui/select'
import { TableSkeleton } from '@/shared/ui/skeleton'
import { Switch } from '@/shared/ui/switch'

const emptyForm: ClientePayload = {
  nome: '',
  telefone: '',
  id_assistente_preferida: null,
  observacoes: '',
}

type StatusFilter = 'todos' | 'a' | 'i'
type DeleteTarget = { mode: 'single'; item: Cliente } | { mode: 'bulk'; ids: number[] }

export function ClientesPage() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<StatusFilter>('todos')
  const { items, loading, error, create, update, updateMany, remove, removeMany } = useClientes(query)
  const { items: assistentes } = useAssistentes()

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Cliente | null>(null)
  const [form, setForm] = useState<ClientePayload>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [deleting, setDeleting] = useState<DeleteTarget | null>(null)
  const [removing, setRemoving] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [bulkLoading, setBulkLoading] = useState(false)

  const title = useMemo(() => (editing ? 'Editar Cliente' : 'Novo Cliente'), [editing])

  const assistentesAtivas = useMemo(
    () => assistentes.filter((item) => item.status === 'a'),
    [assistentes],
  )

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
    setFormError(null)
    setModalOpen(true)
  }

  function openEdit(item: Cliente) {
    setEditing(item)
    setForm({
      nome: item.nome,
      telefone: item.telefone ?? '',
      id_assistente_preferida: item.id_assistente_preferida,
      observacoes: item.observacoes ?? '',
    })
    setFormError(null)
    setModalOpen(true)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setFormError(null)

    const payload: ClientePayload = {
      nome: form.nome.trim(),
      telefone: form.telefone?.trim() || null,
      id_assistente_preferida: form.id_assistente_preferida || null,
      observacoes: form.observacoes?.trim() || null,
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

  async function handleToggleStatus(item: Cliente, active: boolean) {
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
      // mantém seleção
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
      ? `Tem certeza que deseja remover "${deleting.item.nome}"?`
      : deleting?.mode === 'bulk'
        ? `Tem certeza que deseja remover ${deleting.ids.length} cliente(s)?`
        : ''

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Clientes"
        description="Cadastro e consulta de clientes."
        actions={
          <Button type="button" onClick={openCreate}>
            <Plus />
            Novo cliente
          </Button>
        }
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchField
          value={query}
          onChange={handleSearch}
          placeholder="Buscar por nome ou telefone…"
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
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          <TableSkeleton rows={4} />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="size-5" />}
          title={query || filter !== 'todos' ? 'Nenhum resultado' : 'Nenhum cliente ainda'}
          description={
            query || filter !== 'todos'
              ? 'Ajuste a busca ou o filtro para ver outros clientes.'
              : 'Cadastre o primeiro cliente da barbearia.'
          }
          actionLabel={query || filter !== 'todos' ? undefined : 'Novo cliente'}
          onAction={query || filter !== 'todos' ? undefined : openCreate}
        />
      ) : (
        <>
          <div className="grid gap-3 md:hidden">
            <div className="flex items-center gap-2 px-1">
              <Checkbox
                checked={selection.allSelected}
                indeterminate={selection.someSelected}
                onCheckedChange={() => selection.toggleAll()}
                aria-label="Selecionar todos os clientes visíveis"
              />
              <span className="text-xs text-[var(--foreground-muted)]">Selecionar todos</span>
            </div>

            {filtered.map((item) => {
              const selected = selection.isSelected(item.id)
              return (
                <article
                  key={item.id}
                  className={cn(
                    'rounded-2xl border bg-[var(--surface)] p-4',
                    selected
                      ? 'border-[var(--accent)]/50 bg-[var(--accent-soft)]/30'
                      : 'border-[var(--border)]',
                  )}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selected}
                      onCheckedChange={() => selection.toggle(item.id)}
                      aria-label={`Selecionar ${item.nome}`}
                      className="mt-1"
                    />
                    <InitialsAvatar name={item.nome} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3 className="truncate font-medium text-[var(--foreground)]">{item.nome}</h3>
                          <p className="mt-0.5 text-sm text-[var(--foreground-muted)]">
                            {item.telefone || 'Sem telefone'}
                          </p>
                          <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                            Preferida:{' '}
                            {item.assistente_preferida?.nome ?? '—'}
                          </p>
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
                      <div className="mt-3 flex justify-end gap-1">
                        <Button type="button" variant="ghost" size="icon" onClick={() => openEdit(item)}>
                          <Pencil />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleting({ mode: 'single', item })}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>

          <div className="hidden overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--sidebar)]/40 text-[11px] uppercase tracking-[0.08em] text-[var(--foreground-muted)]">
                  <th className="w-12 px-5 py-3.5">
                    <Checkbox
                      checked={selection.allSelected}
                      indeterminate={selection.someSelected}
                      onCheckedChange={() => selection.toggleAll()}
                      aria-label="Selecionar todos os clientes visíveis"
                    />
                  </th>
                  <th className="px-5 py-3.5 font-medium">Cliente</th>
                  <th className="px-5 py-3.5 font-medium">Assistente preferida</th>
                  <th className="px-5 py-3.5 font-medium">Observações</th>
                  <th className="px-5 py-3.5 font-medium">Cadastro</th>
                  <th className="px-5 py-3.5 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const selected = selection.isSelected(item.id)
                  return (
                    <tr
                      key={item.id}
                      className={cn(
                        'border-t border-[var(--border)] transition-colors hover:bg-[var(--surface-hover)]/50',
                        selected && 'bg-[var(--accent-soft)]/20',
                      )}
                    >
                      <td className="px-5 py-3.5">
                        <Checkbox
                          checked={selected}
                          onCheckedChange={() => selection.toggle(item.id)}
                          aria-label={`Selecionar ${item.nome}`}
                        />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <InitialsAvatar name={item.nome} className="size-9 text-[10px]" />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-[var(--foreground)]">{item.nome}</p>
                            <p className="truncate text-xs text-[var(--foreground-muted)]">
                              {item.telefone || 'Sem telefone'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-[var(--foreground-muted)]">
                        {item.assistente_preferida?.nome ?? '—'}
                      </td>
                      <td className="max-w-[220px] truncate px-5 py-3.5 text-[var(--foreground-muted)]">
                        {item.observacoes || '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={item.status === 'a'}
                            disabled={togglingId === item.id || bulkLoading}
                            aria-label={
                              item.status === 'a' ? `Inativar ${item.nome}` : `Ativar ${item.nome}`
                            }
                            onCheckedChange={(active) => void handleToggleStatus(item, active)}
                          />
                          <span className="text-xs text-[var(--foreground-muted)]">
                            {item.status === 'a' ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Editar ${item.nome}`}
                            onClick={() => openEdit(item)}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label={`Remover ${item.nome}`}
                            onClick={() => setDeleting({ mode: 'single', item })}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
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
            <Button type="submit" form="cliente-form" disabled={saving} className="min-w-24">
              {saving ? 'Salvando…' : 'Salvar'}
            </Button>
          </>
        }
      >
        <form id="cliente-form" className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <FieldLabel htmlFor="cliente-nome">Nome</FieldLabel>
            <Input
              id="cliente-nome"
              value={form.nome}
              onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value }))}
              required
              autoFocus
            />
          </div>
          <div>
            <FieldLabel htmlFor="cliente-telefone">Telefone</FieldLabel>
            <Input
              id="cliente-telefone"
              value={form.telefone ?? ''}
              onChange={(e) => setForm((prev) => ({ ...prev, telefone: e.target.value }))}
              placeholder="(11) 99999-0000"
            />
          </div>
          <div>
            <FieldLabel htmlFor="cliente-assistente">Assistente preferida</FieldLabel>
            <Select
              id="cliente-assistente"
              value={form.id_assistente_preferida ? String(form.id_assistente_preferida) : ''}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  id_assistente_preferida: e.target.value ? Number(e.target.value) : null,
                }))
              }
            >
              <option value="">Nenhuma</option>
              {assistentesAtivas.map((assistente) => (
                <option key={assistente.id} value={assistente.id}>
                  {assistente.nome}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <FieldLabel htmlFor="cliente-obs">Observações</FieldLabel>
            <textarea
              id="cliente-obs"
              value={form.observacoes ?? ''}
              onChange={(e) => setForm((prev) => ({ ...prev, observacoes: e.target.value }))}
              rows={3}
              className="w-full rounded-lg border border-[#3a3a3a] bg-transparent px-3 py-2 text-sm text-[#e8e8e8] outline-none transition-colors placeholder:text-[#6a6a6a] focus:border-[var(--accent)]"
              placeholder="Preferências, alergias, VIP…"
            />
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
        title={deleting?.mode === 'bulk' ? 'Remover clientes' : 'Remover cliente'}
        description={deleteDescription}
        confirmLabel="Remover"
        loading={removing}
        onCancel={() => setDeleting(null)}
        onConfirm={() => void handleConfirmDelete()}
      />
    </div>
  )
}
