import { LogIn, LogOut, Pencil, Plus, Settings2, Trash2, Users } from 'lucide-react'
import { useCallback, useMemo, useState, type FormEvent } from 'react'

import { useAssistentes } from '@/modules/assistentes/hooks/useAssistentes'
import type {
  Assistente,
  AssistentePayload,
  VinculoBarbeiroDia,
} from '@/modules/assistentes/types/assistente'
import { useBarbeiros } from '@/modules/barbeiros/hooks/useBarbeiros'
import { useEmpresaConfig } from '@/modules/empresa/hooks/useEmpresaConfig'
import type {
  FonteOrdemAssistente,
  MomentoAtribuicaoAssistente,
  ModoSelecaoAssistente,
  ResetCursorAssistente,
} from '@/modules/empresa/types/empresa'
import { ApiError } from '@/shared/api/httpClient'
import { useSelection } from '@/shared/hooks/useSelection'
import { PageHeader } from '@/shared/layout/PageHeader'
import { cn } from '@/shared/lib/utils'
import { Badge } from '@/shared/ui/badge'
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

const emptyForm: AssistentePayload = {
  nome: '',
  telefone: '',
  turno: 'Manhã',
  ordem_sequencial: null,
  status_operacional: 'offline',
  vinculos_barbeiro_dia: [],
}

const DIAS_SEMANA = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
]

type OperacionalFilter = 'todos' | 'livre' | 'exclusiva' | 'offline'
type DeleteTarget = { mode: 'single'; item: Assistente } | { mode: 'bulk'; ids: number[] }

const operacionalLabels: Record<string, string> = {
  livre: 'Livre',
  exclusiva: 'Exclusiva',
  offline: 'Offline',
}

function operacionalTone(status: string) {
  if (status === 'livre') return 'success' as const
  if (status === 'exclusiva') return 'warning' as const
  return 'muted' as const
}

function vinculoKey(idBarbeiro: number, dia: number) {
  return `${idBarbeiro}:${dia}`
}

function hasVinculo(vinculos: VinculoBarbeiroDia[] | undefined, idBarbeiro: number, dia: number) {
  return (vinculos ?? []).some((v) => v.id_barbeiro === idBarbeiro && v.dia_semana === dia)
}

function toggleVinculo(
  vinculos: VinculoBarbeiroDia[] | undefined,
  idBarbeiro: number,
  dia: number,
): VinculoBarbeiroDia[] {
  const current = vinculos ?? []
  if (hasVinculo(current, idBarbeiro, dia)) {
    return current.filter((v) => !(v.id_barbeiro === idBarbeiro && v.dia_semana === dia))
  }
  return [...current, { id_barbeiro: idBarbeiro, dia_semana: dia }]
}

const modoSelecaoLabels: Record<ModoSelecaoAssistente, string> = {
  manual: 'Manual',
  automatico_sequencial: 'Automática',
}

export function AssistentesPage() {
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<OperacionalFilter>('todos')
  const { items, loading, error, create, update, updateMany, remove, removeMany } =
    useAssistentes(query)
  const { items: barbeiros } = useBarbeiros()
  const { empresa, update: updateEmpresa } = useEmpresaConfig()

  const [modalOpen, setModalOpen] = useState(false)
  const [configOpen, setConfigOpen] = useState(false)
  const [configModo, setConfigModo] = useState<ModoSelecaoAssistente>('manual')
  const [configMax, setConfigMax] = useState('2')
  const [configFonte, setConfigFonte] = useState<FonteOrdemAssistente>('manual')
  const [configReset, setConfigReset] = useState<ResetCursorAssistente>('meia_noite')
  const [configMomento, setConfigMomento] = useState<MomentoAtribuicaoAssistente>('iniciar_atendimento')
  const [configError, setConfigError] = useState<string | null>(null)
  const [configSaving, setConfigSaving] = useState(false)
  const [editing, setEditing] = useState<Assistente | null>(null)
  const [form, setForm] = useState<AssistentePayload>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [deleting, setDeleting] = useState<DeleteTarget | null>(null)
  const [removing, setRemoving] = useState(false)
  const [togglingId, setTogglingId] = useState<number | null>(null)
  const [actionId, setActionId] = useState<number | null>(null)
  const [bulkLoading, setBulkLoading] = useState(false)

  const title = useMemo(() => (editing ? 'Editar Assistente' : 'Nova Assistente'), [editing])
  const barbeirosAtivos = useMemo(() => barbeiros.filter((b) => b.status === 'a'), [barbeiros])
  const fonteCheckin = (empresa?.fonte_ordem_assistente ?? 'manual') === 'checkin'

  const counts = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc.todos += 1
        if (item.status_operacional === 'livre') acc.livre += 1
        else if (item.status_operacional === 'exclusiva') acc.exclusiva += 1
        else acc.offline += 1
        return acc
      },
      { todos: 0, livre: 0, exclusiva: 0, offline: 0 },
    )
  }, [items])

  const filtered = useMemo(() => {
    if (filter === 'todos') return items
    return items.filter((item) => item.status_operacional === filter)
  }, [items, filter])

  const visibleIds = useMemo(() => filtered.map((item) => item.id), [filtered])
  const selection = useSelection(visibleIds)

  const handleSearch = useCallback((value: string) => {
    setQuery(value.trim())
  }, [])

  function openCreate() {
    setEditing(null)
    setForm({ ...emptyForm, vinculos_barbeiro_dia: [] })
    setFormError(null)
    setModalOpen(true)
  }

  function openConfigModal() {
    setConfigModo(empresa?.modo_selecao_assistente ?? 'manual')
    setConfigMax(String(empresa?.max_atendimentos_simultaneos_assistente ?? 2))
    setConfigFonte(empresa?.fonte_ordem_assistente ?? 'manual')
    setConfigReset(empresa?.reset_cursor_assistente ?? 'meia_noite')
    setConfigMomento(empresa?.momento_atribuicao_assistente ?? 'iniciar_atendimento')
    setConfigError(null)
    setConfigOpen(true)
  }

  async function handleConfigSubmit(event: FormEvent) {
    event.preventDefault()
    setConfigSaving(true)
    setConfigError(null)

    const max = Number(configMax)
    if (!Number.isInteger(max) || max < 1 || max > 10) {
      setConfigError('Informe entre 1 e 10 atendimentos simultâneos.')
      setConfigSaving(false)
      return
    }

    try {
      await updateEmpresa({
        modo_selecao_assistente: configModo,
        max_atendimentos_simultaneos_assistente: max,
        fonte_ordem_assistente: configFonte,
        reset_cursor_assistente: configReset,
        momento_atribuicao_assistente: configMomento,
      })
      setConfigOpen(false)
    } catch (err) {
      setConfigError(err instanceof ApiError ? err.message : 'Não foi possível salvar.')
    } finally {
      setConfigSaving(false)
    }
  }

  function openEdit(item: Assistente) {
    setEditing(item)
    setForm({
      nome: item.nome,
      telefone: item.telefone ?? '',
      turno: item.turno ?? 'Manhã',
      ordem_sequencial: item.ordem_sequencial ?? null,
      status_operacional: item.status_operacional,
      vinculos_barbeiro_dia: item.vinculos_barbeiro_dia ?? [],
    })
    setFormError(null)
    setModalOpen(true)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setFormError(null)

    const payload: AssistentePayload = {
      nome: form.nome.trim(),
      telefone: form.telefone?.trim() || null,
      turno: form.turno || null,
      ordem_sequencial: form.ordem_sequencial ? Number(form.ordem_sequencial) : null,
      status_operacional: form.status_operacional,
      vinculos_barbeiro_dia: form.vinculos_barbeiro_dia ?? [],
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

  async function handleCheckIn(item: Assistente) {
    setActionId(item.id)
    try {
      await update(item.id, {
        status_operacional: 'livre',
        status: 'a',
      })
    } catch {
      // listagem recarrega
    } finally {
      setActionId(null)
    }
  }

  async function handleCheckOut(item: Assistente) {
    setActionId(item.id)
    try {
      await update(item.id, {
        status_operacional: 'offline',
        hora_checkin: null,
      })
    } catch {
      // listagem recarrega
    } finally {
      setActionId(null)
    }
  }

  async function handleToggleStatus(item: Assistente, active: boolean) {
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
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Falha ao remover.')
      setDeleting(null)
    } finally {
      setRemoving(false)
    }
  }

  const deleteDescription =
    deleting?.mode === 'single'
      ? `Tem certeza que deseja remover "${deleting.item.nome}"? Essa ação pode ser revertida depois no banco (soft delete).`
      : deleting?.mode === 'bulk'
        ? `Tem certeza que deseja remover ${deleting.ids.length} assistente(s)? Essa ação pode ser revertida depois no banco (soft delete).`
        : ''

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title="Assistentes"
        description="Equipe de apoio e status operacional do dia."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {empresa ? (
              <Badge tone="muted" className="hidden sm:inline-flex">
                Seleção: {modoSelecaoLabels[empresa.modo_selecao_assistente]}
              </Badge>
            ) : null}
            <Button type="button" variant="outline" onClick={openConfigModal}>
              <Settings2 />
              Configurar seleção
            </Button>
            <Button type="button" onClick={openCreate}>
              <Plus />
              Nova assistente
            </Button>
          </div>
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
            ['todos', 'Todas'],
            ['livre', 'Livres'],
            ['exclusiva', 'Exclusivas'],
            ['offline', 'Offline'],
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
          title={query || filter !== 'todos' ? 'Nenhum resultado' : 'Nenhuma assistente ainda'}
          description={
            query || filter !== 'todos'
              ? 'Ajuste a busca ou o filtro para ver outras assistentes.'
              : 'Cadastre a primeira assistente para começar a operação.'
          }
          actionLabel={query || filter !== 'todos' ? undefined : 'Nova assistente'}
          onAction={query || filter !== 'todos' ? undefined : openCreate}
        />
      ) : (
        <>
          {/* Mobile cards */}
          <div className="grid gap-3 md:hidden">
            <div className="flex items-center gap-2 px-1">
              <Checkbox
                checked={selection.allSelected}
                indeterminate={selection.someSelected}
                onCheckedChange={() => selection.toggleAll()}
                aria-label="Selecionar todas as assistentes visíveis"
              />
              <span className="text-xs text-[var(--foreground-muted)]">Selecionar todas</span>
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
                            {item.telefone || 'Sem telefone'} · {item.turno || '—'}
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
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <Badge tone={operacionalTone(item.status_operacional)}>
                          {operacionalLabels[item.status_operacional] ?? item.status_operacional}
                        </Badge>
                        <div className="flex gap-1">
                          {item.status_operacional === 'offline' ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={actionId === item.id}
                              onClick={() => void handleCheckIn(item)}
                            >
                              <LogIn />
                              {actionId === item.id ? '…' : 'Check-in'}
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={actionId === item.id}
                              onClick={() => void handleCheckOut(item)}
                            >
                              <LogOut />
                              {actionId === item.id ? '…' : 'Check-out'}
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => openEdit(item)}
                          >
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
                  </div>
                </article>
              )
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)] md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--sidebar)]/40 text-[11px] uppercase tracking-[0.08em] text-[var(--foreground-muted)]">
                  <th className="w-12 px-5 py-3.5">
                    <Checkbox
                      checked={selection.allSelected}
                      indeterminate={selection.someSelected}
                      onCheckedChange={() => selection.toggleAll()}
                      aria-label="Selecionar todas as assistentes visíveis"
                    />
                  </th>
                  <th className="px-5 py-3.5 font-medium">Assistente</th>
                  <th className="px-5 py-3.5 font-medium">Turno</th>
                  <th className="px-5 py-3.5 font-medium">Operacional</th>
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
                        {item.turno || '—'}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge tone={operacionalTone(item.status_operacional)}>
                          {operacionalLabels[item.status_operacional] ?? item.status_operacional}
                        </Badge>
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
                          {item.status_operacional === 'offline' ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={actionId === item.id}
                              onClick={() => void handleCheckIn(item)}
                            >
                              {actionId === item.id ? '…' : 'Check-in'}
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              disabled={actionId === item.id}
                              onClick={() => void handleCheckOut(item)}
                            >
                              {actionId === item.id ? '…' : 'Check-out'}
                            </Button>
                          )}
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
        className="max-w-[720px]"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="assistente-form" disabled={saving} className="min-w-24">
              {saving ? 'Salvando…' : 'Salvar'}
            </Button>
          </>
        }
      >
        <form id="assistente-form" className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <FieldLabel htmlFor="assistente-nome">Nome</FieldLabel>
            <Input
              id="assistente-nome"
              value={form.nome}
              onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value }))}
              required
              autoFocus
            />
          </div>
          <div>
            <FieldLabel htmlFor="assistente-telefone">Telefone</FieldLabel>
            <Input
              id="assistente-telefone"
              value={form.telefone ?? ''}
              onChange={(e) => setForm((prev) => ({ ...prev, telefone: e.target.value }))}
              placeholder="(11) 99999-0000"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel htmlFor="assistente-turno">Turno</FieldLabel>
              <Select
                id="assistente-turno"
                value={form.turno ?? 'Manhã'}
                onChange={(e) => setForm((prev) => ({ ...prev, turno: e.target.value }))}
              >
                <option value="Manhã">Manhã</option>
                <option value="Tarde">Tarde</option>
              </Select>
            </div>
            <div>
              <FieldLabel htmlFor="assistente-op">Operacional</FieldLabel>
              <Select
                id="assistente-op"
                value={form.status_operacional}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, status_operacional: e.target.value }))
                }
              >
                <option value="livre">Livre</option>
                <option value="exclusiva">Exclusiva</option>
                <option value="offline">Offline</option>
              </Select>
            </div>
          </div>
          {!fonteCheckin ? (
            <div>
              <FieldLabel htmlFor="assistente-ordem">Ordem na sequência</FieldLabel>
              <Input
                id="assistente-ordem"
                type="number"
                min={1}
                value={form.ordem_sequencial ?? ''}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    ordem_sequencial: e.target.value ? Number(e.target.value) : null,
                  }))
                }
                placeholder="Ex.: 1"
              />
            </div>
          ) : null}
          <div className="space-y-2">
            <FieldLabel>Barbeiros por dia da semana</FieldLabel>
            <p className="text-xs text-[var(--foreground-muted)]">
              Sem vínculo no dia, a assistente não entra na sequência daquele barbeiro.
            </p>
            {barbeirosAtivos.length === 0 ? (
              <p className="text-sm text-[var(--foreground-muted)]">Nenhum barbeiro ativo.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
                <table className="w-full min-w-[480px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border)] bg-[var(--sidebar)]/40">
                      <th className="px-2 py-2 font-medium">Barbeiro</th>
                      {DIAS_SEMANA.map((dia) => (
                        <th key={dia.value} className="px-1 py-2 text-center font-medium">
                          {dia.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {barbeirosAtivos.map((barbeiro) => (
                      <tr key={barbeiro.id} className="border-t border-[var(--border)]">
                        <td className="px-2 py-2">{barbeiro.nome}</td>
                        {DIAS_SEMANA.map((dia) => (
                          <td key={vinculoKey(barbeiro.id, dia.value)} className="px-1 py-2 text-center">
                            <Checkbox
                              checked={hasVinculo(
                                form.vinculos_barbeiro_dia,
                                barbeiro.id,
                                dia.value,
                              )}
                              onCheckedChange={() =>
                                setForm((prev) => ({
                                  ...prev,
                                  vinculos_barbeiro_dia: toggleVinculo(
                                    prev.vinculos_barbeiro_dia,
                                    barbeiro.id,
                                    dia.value,
                                  ),
                                }))
                              }
                              aria-label={`${barbeiro.nome} ${dia.label}`}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {formError ? (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {formError}
            </p>
          ) : null}
        </form>
      </Modal>

      <Modal
        open={configOpen}
        title="Configurar seleção de assistentes"
        description="Define como a assistente é escolhida ao iniciar um atendimento."
        onClose={() => setConfigOpen(false)}
        className="max-w-[480px]"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setConfigOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="config-selecao-form" disabled={configSaving}>
              {configSaving ? 'Salvando…' : 'Salvar'}
            </Button>
          </>
        }
      >
        <form id="config-selecao-form" className="space-y-4" onSubmit={(e) => void handleConfigSubmit(e)}>
          <div className="space-y-1.5">
            <FieldLabel htmlFor="config-modo">Modo de seleção</FieldLabel>
            <Select
              id="config-modo"
              value={configModo}
              onChange={(e) => setConfigModo(e.target.value as ModoSelecaoAssistente)}
            >
              <option value="manual">Manual</option>
              <option value="automatico_sequencial">Sequencial automático</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <FieldLabel htmlFor="config-max">Atendimentos simultâneos por assistente</FieldLabel>
            <Input
              id="config-max"
              type="number"
              min={1}
              max={10}
              value={configMax}
              onChange={(e) => setConfigMax(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <FieldLabel htmlFor="config-fonte">Fonte da ordem</FieldLabel>
            <Select
              id="config-fonte"
              value={configFonte}
              onChange={(e) => setConfigFonte(e.target.value as FonteOrdemAssistente)}
            >
              <option value="manual">Ordem manual (cadastro)</option>
              <option value="checkin">Ordem do check-in</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <FieldLabel htmlFor="config-reset">Reset da sequência</FieldLabel>
            <Select
              id="config-reset"
              value={configReset}
              onChange={(e) => setConfigReset(e.target.value as ResetCursorAssistente)}
            >
              <option value="meia_noite">À meia-noite</option>
              <option value="primeiro_checkin_dia">No primeiro check-in do dia</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <FieldLabel htmlFor="config-momento">Momento da atribuição</FieldLabel>
            <Select
              id="config-momento"
              value={configMomento}
              onChange={(e) => setConfigMomento(e.target.value as MomentoAtribuicaoAssistente)}
            >
              <option value="iniciar_atendimento">Ao iniciar o atendimento</option>
              <option value="checkin_cliente">No check-in do cliente</option>
            </Select>
          </div>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm text-[var(--foreground-muted)]">
            <p>Esta configuração se aplica a todas as assistentes da barbearia.</p>
            <p className="mt-2">
              No modo automático, só entram na fila assistentes com vínculo no dia para o barbeiro,
              com capacidade disponível e (se a fonte for check-in) com check-in no dia.
            </p>
          </div>
          {configError ? (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {configError}
            </p>
          ) : null}
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title={deleting?.mode === 'bulk' ? 'Remover assistentes' : 'Remover assistente'}
        description={deleteDescription}
        confirmLabel="Remover"
        loading={removing}
        onCancel={() => setDeleting(null)}
        onConfirm={() => void handleConfirmDelete()}
      />
    </div>
  )
}
