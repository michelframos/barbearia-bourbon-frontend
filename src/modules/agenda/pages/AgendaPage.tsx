import { CalendarClock, ChevronLeft, ChevronRight, Plus, Settings2 } from 'lucide-react'
import { useMemo, useState, type FormEvent } from 'react'

import { AgendaGradeGrid } from '@/modules/agenda/components/AgendaGradeGrid'
import { useAgenda } from '@/modules/agenda/hooks/useAgenda'
import { useVisibleBarbeiros } from '@/modules/agenda/hooks/useVisibleBarbeiros'
import type { Agendamento, AgendamentoPayload } from '@/modules/agenda/types/agendamento'
import { useAssistentes } from '@/modules/assistentes/hooks/useAssistentes'
import { useBarbeiros } from '@/modules/barbeiros/hooks/useBarbeiros'
import { useClientes } from '@/modules/clientes/hooks/useClientes'
import { useServicos } from '@/modules/servicos/hooks/useServicos'
import { ApiError } from '@/shared/api/httpClient'
import { PageHeader } from '@/shared/layout/PageHeader'
import { cn } from '@/shared/lib/utils'
import { Button } from '@/shared/ui/button'
import { Checkbox } from '@/shared/ui/checkbox'
import { ConfirmDialog } from '@/shared/ui/confirm-dialog'
import { EmptyState } from '@/shared/ui/empty-state'
import { FieldLabel } from '@/shared/ui/field-label'
import { InitialsAvatar } from '@/shared/ui/initials-avatar'
import { Input } from '@/shared/ui/input'
import { Modal } from '@/shared/ui/modal'
import { Select } from '@/shared/ui/select'
import { Skeleton } from '@/shared/ui/skeleton'

function todayIso() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function shiftDate(iso: string, days: number) {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + days)
  const yy = date.getFullYear()
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

function formatDateShort(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  })
}

function formatDateLong(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  })
}

type FormState = {
  data: string
  hora: string
  id_cliente: string
  id_assistente: string
  id_barbeiro: string
  id_servico: string
  observacoes: string
}

const emptyForm = (data: string, hora = '', idBarbeiro = ''): FormState => ({
  data,
  hora,
  id_cliente: '',
  id_assistente: '',
  id_barbeiro: idBarbeiro,
  id_servico: '',
  observacoes: '',
})

function AgendaSkeleton() {
  return (
    <div className="h-full min-h-[280px] overflow-hidden rounded-xl border border-[var(--border)] bg-[#0c1014]">
      <div className="flex gap-3 border-b border-[var(--border)] bg-[#12171c] px-3 py-3.5">
        <Skeleton className="h-4 w-12" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex flex-1 items-center gap-2">
            <Skeleton className="size-7 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
      <div className="space-y-0 p-0">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex h-[60px] items-center gap-3 border-b border-[var(--border)]/40 px-3">
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-10 flex-1 rounded-lg opacity-40" />
            <Skeleton className="h-10 flex-1 rounded-lg opacity-25" />
            <Skeleton className="h-10 flex-1 rounded-lg opacity-40" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function AgendaPage() {
  const [data, setData] = useState(todayIso)
  const hoje = todayIso()
  const isToday = data === hoje
  const { grade, items, loading, error, create, update, cancel } = useAgenda(data, null)

  const { items: clientes } = useClientes()
  const { items: assistentes } = useAssistentes()
  const { items: barbeiros } = useBarbeiros()
  const { items: servicos } = useServicos()

  const [modalOpen, setModalOpen] = useState(false)
  const [barbeirosModalOpen, setBarbeirosModalOpen] = useState(false)
  const [editing, setEditing] = useState<Agendamento | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm(data))
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<Agendamento | null>(null)
  const [cancelling, setCancelling] = useState(false)

  const barbeirosAtivos = useMemo(
    () => barbeiros.filter((item) => item.status === 'a'),
    [barbeiros],
  )
  const ativosIds = useMemo(() => barbeirosAtivos.map((item) => item.id), [barbeirosAtivos])
  const { visibleIds, toggle, selectAll, clearAll, isSelected } = useVisibleBarbeiros(ativosIds)

  const barbeirosVisiveis = useMemo(() => {
    const list = barbeirosAtivos.filter((item) => visibleIds.includes(item.id))
    const hasUnassigned = items.some((item) => !item.id_barbeiro)
    if (hasUnassigned) {
      list.unshift({
        id: 0,
        id_empresa: 1,
        nome: 'Sem barbeiro',
        telefone: null,
        status_operacional: 'disponivel',
        hora_entrada: null,
        status: 'a',
        servicos: [],
      })
    }
    return list
  }, [barbeirosAtivos, visibleIds, items])

  const assistentesAtivas = useMemo(
    () => assistentes.filter((item) => item.status === 'a'),
    [assistentes],
  )
  const clientesAtivos = useMemo(
    () => clientes.filter((item) => item.status === 'a'),
    [clientes],
  )
  const servicosAtivos = useMemo(
    () => servicos.filter((item) => item.status === 'a'),
    [servicos],
  )

  const barbeiroSelecionado = useMemo(
    () => barbeirosAtivos.find((item) => item.id === Number(form.id_barbeiro)),
    [barbeirosAtivos, form.id_barbeiro],
  )

  const servicosDisponiveis = useMemo(() => {
    if (!form.id_barbeiro) {
      return servicosAtivos
    }
    if (!barbeiroSelecionado?.servicos?.length) return []
    return barbeiroSelecionado.servicos.filter((s) => s.status !== 'i')
  }, [form.id_barbeiro, barbeiroSelecionado, servicosAtivos])

  const horas = useMemo(() => grade?.slots.map((slot) => slot.hora) ?? [], [grade])
  const intervalo = grade?.meta.intervalo_agenda_minutos ?? 30

  const itemsVisiveis = useMemo(
    () =>
      items.filter(
        (item) => !item.id_barbeiro || visibleIds.includes(item.id_barbeiro),
      ),
    [items, visibleIds],
  )
  const totalAgendamentos = itemsVisiveis.length
  const livresEstimados = Math.max(
    0,
    Math.max(barbeirosVisiveis.length, 1) * horas.length - totalAgendamentos,
  )

  function openCreate(hora = '', idBarbeiro = '') {
    setEditing(null)
    setForm(emptyForm(data, hora, idBarbeiro === '0' ? '' : idBarbeiro))
    setFormError(null)
    setModalOpen(true)
  }

  function openEdit(item: Agendamento) {
    setEditing(item)
    setForm({
      data: item.data,
      hora: item.hora,
      id_cliente: String(item.id_cliente),
      id_assistente: item.id_assistente ? String(item.id_assistente) : '',
      id_barbeiro: item.id_barbeiro ? String(item.id_barbeiro) : '',
      id_servico: String(item.id_servico),
      observacoes: item.observacoes ?? '',
    })
    setFormError(null)
    setModalOpen(true)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)

    if (!form.hora || !form.id_cliente || !form.id_servico) {
      setFormError('Preencha data, horário, cliente e serviço.')
      return
    }

    const payload: AgendamentoPayload = {
      data: form.data,
      hora: form.hora,
      id_cliente: Number(form.id_cliente),
      id_assistente: form.id_assistente ? Number(form.id_assistente) : null,
      id_barbeiro: form.id_barbeiro ? Number(form.id_barbeiro) : null,
      id_servico: Number(form.id_servico),
      observacoes: form.observacoes.trim() || null,
    }

    setSaving(true)
    try {
      if (editing) {
        await update(editing.id, payload)
      } else {
        await create(payload)
      }
      setModalOpen(false)
    } catch (err) {
      if (err instanceof ApiError) {
        const first = err.errors ? Object.values(err.errors).flat()[0] : null
        setFormError(first ?? err.message)
      } else {
        setFormError('Não foi possível salvar o agendamento.')
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleCancelConfirm() {
    if (!cancelTarget) return
    setCancelling(true)
    try {
      await cancel(cancelTarget.id)
      setCancelTarget(null)
      if (editing?.id === cancelTarget.id) setModalOpen(false)
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Falha ao cancelar.')
      setCancelTarget(null)
    } finally {
      setCancelling(false)
    }
  }

  return (
    <div className="animate-fade-in flex min-h-0 flex-1 flex-col gap-4">
      <PageHeader
        title="Agenda"
        description="Grade do dia por barbeiro."
        className="mb-0 shrink-0"
        actions={
          <Button type="button" onClick={() => openCreate()}>
            <Plus className="size-4" />
            Novo agendamento
          </Button>
        }
      />

      {/* Day toolbar */}
      <div className="flex shrink-0 flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]/70 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-9 shrink-0"
            onClick={() => setData((prev) => shiftDate(prev, -1))}
            aria-label="Dia anterior"
          >
            <ChevronLeft className="size-4" />
          </Button>

          <label className="group relative min-w-0 flex-1 cursor-pointer sm:flex-none">
            <span className="sr-only">Escolher data</span>
            <Input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="absolute inset-0 cursor-pointer opacity-0"
            />
            <span className="flex min-w-[200px] flex-col rounded-lg border border-transparent px-2 py-1 transition-colors group-hover:border-[var(--border)] group-hover:bg-[var(--surface-elevated)]">
              <span className="font-display text-base capitalize tracking-tight text-[var(--foreground)] sm:text-lg">
                {formatDateShort(data)}
              </span>
              <span className="truncate text-[11px] capitalize text-[var(--foreground-muted)]">
                {formatDateLong(data)}
              </span>
            </span>
          </label>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-9 shrink-0"
            onClick={() => setData((prev) => shiftDate(prev, 1))}
            aria-label="Próximo dia"
          >
            <ChevronRight className="size-4" />
          </Button>

          <Button
            type="button"
            variant={isToday ? 'secondary' : 'ghost'}
            size="sm"
            className={cn(isToday && 'pointer-events-none text-[var(--accent)]')}
            onClick={() => setData(hoje)}
            disabled={isToday}
          >
            Hoje
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--foreground-muted)]">
          <span className="rounded-md bg-[var(--accent-soft)] px-2.5 py-1 font-medium text-[var(--accent)]">
            {totalAgendamentos} agendado{totalAgendamentos === 1 ? '' : 's'}
          </span>
          <span className="rounded-md bg-[var(--surface-elevated)] px-2.5 py-1">
            {barbeirosVisiveis.length} barbeiro{barbeirosVisiveis.length === 1 ? '' : 's'}
          </span>
          {!loading && horas.length > 0 ? (
            <span className="hidden rounded-md bg-[var(--surface-elevated)] px-2.5 py-1 sm:inline">
              ~{livresEstimados} livres
            </span>
          ) : null}
        </div>
      </div>

      {/* Barbeiro chips */}
      {barbeirosAtivos.length > 0 ? (
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {barbeirosAtivos.map((barbeiro) => {
              const selected = isSelected(barbeiro.id)
              return (
                <button
                  key={barbeiro.id}
                  type="button"
                  onClick={() => toggle(barbeiro.id)}
                  className={cn(
                    'inline-flex shrink-0 items-center gap-2 rounded-full border px-2.5 py-1.5 text-sm transition-all',
                    selected
                      ? 'border-[var(--accent)]/45 bg-[var(--accent-soft)] text-[var(--foreground)]'
                      : 'border-[var(--border)] bg-transparent text-[var(--foreground-muted)] opacity-55 hover:opacity-90',
                  )}
                >
                  <InitialsAvatar
                    name={barbeiro.nome}
                    src={barbeiro.foto_url}
                    variant="vibrant"
                    className="size-6 text-[9px]"
                  />
                  <span className="max-w-[7rem] truncate">
                    {barbeiro.nome.trim().split(/\s+/)[0]}
                  </span>
                </button>
              )
            })}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-9 shrink-0"
            onClick={() => setBarbeirosModalOpen(true)}
            aria-label="Gerenciar barbeiros na agenda"
            title="Gerenciar"
          >
            <Settings2 className="size-4" />
          </Button>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col">
        {loading ? (
          <AgendaSkeleton />
        ) : horas.length === 0 || barbeirosAtivos.length === 0 ? (
          <EmptyState
            icon={<CalendarClock className="size-6" />}
            title={barbeirosAtivos.length === 0 ? 'Nenhum barbeiro ativo' : 'Sem horários na grade'}
            description={
              barbeirosAtivos.length === 0
                ? 'Cadastre barbeiros ativos para montar a grade.'
                : 'Verifique o horário de funcionamento da barbearia nas configurações.'
            }
          />
        ) : barbeirosVisiveis.length === 0 ? (
          <EmptyState
            icon={<Settings2 className="size-6" />}
            title="Nenhum barbeiro selecionado"
            description="Toque nos chips acima ou abra o gerenciador para escolher quem aparece na grade."
            actionLabel="Escolher barbeiros"
            onAction={() => setBarbeirosModalOpen(true)}
          />
        ) : (
          <AgendaGradeGrid
            horas={horas}
            barbeiros={barbeirosVisiveis}
            agendamentos={itemsVisiveis}
            intervaloMinutos={intervalo}
            data={data}
            onSlotClick={(hora, idBarbeiro) => openCreate(hora, String(idBarbeiro))}
            onAgendamentoClick={openEdit}
          />
        )}
      </div>

      <Modal
        open={barbeirosModalOpen}
        title="Barbeiros na agenda"
        description="Marque quem deve aparecer como coluna. A preferência fica salva neste navegador."
        onClose={() => setBarbeirosModalOpen(false)}
        className="max-w-[440px]"
        footer={
          <>
            <Button type="button" variant="ghost" onClick={clearAll}>
              Limpar
            </Button>
            <Button type="button" variant="outline" onClick={selectAll}>
              Todos
            </Button>
            <Button type="button" onClick={() => setBarbeirosModalOpen(false)}>
              Concluir
            </Button>
          </>
        }
      >
        <ul className="max-h-[360px] space-y-1 overflow-y-auto pr-1">
          {barbeirosAtivos.map((barbeiro) => {
            const checked = isSelected(barbeiro.id)
            return (
              <li key={barbeiro.id}>
                <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-[var(--surface-hover)]">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggle(barbeiro.id)}
                    aria-label={`Mostrar ${barbeiro.nome}`}
                  />
                  <InitialsAvatar
                    name={barbeiro.nome}
                    src={barbeiro.foto_url}
                    variant="vibrant"
                    className="size-8 text-[10px]"
                  />
                  <span className="min-w-0 flex-1 truncate text-sm text-[var(--foreground)]">
                    {barbeiro.nome}
                  </span>
                </label>
              </li>
            )
          })}
        </ul>
      </Modal>

      <Modal
        open={modalOpen}
        title={editing ? 'Editar agendamento' : 'Novo agendamento'}
        description={
          form.hora
            ? `${form.hora}${barbeiroSelecionado ? ` · ${barbeiroSelecionado.nome}` : ''}`
            : 'Preencha os dados do horário.'
        }
        onClose={() => setModalOpen(false)}
        className="max-w-[520px]"
        footer={
          <>
            {editing ? (
              <Button
                type="button"
                variant="ghost"
                className="mr-auto text-red-300 hover:text-red-200"
                onClick={() => setCancelTarget(editing)}
              >
                Cancelar agendamento
              </Button>
            ) : null}
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Fechar
            </Button>
            <Button type="submit" form="agenda-form" disabled={saving}>
              {saving ? 'Salvando…' : editing ? 'Salvar' : 'Agendar'}
            </Button>
          </>
        }
      >
        <form id="agenda-form" className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <FieldLabel htmlFor="agenda-data">Data</FieldLabel>
              <Input
                id="agenda-data"
                type="date"
                value={form.data}
                onChange={(e) => setForm((prev) => ({ ...prev, data: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <FieldLabel htmlFor="agenda-hora">Horário</FieldLabel>
              <Select
                id="agenda-hora"
                value={form.hora}
                onChange={(e) => setForm((prev) => ({ ...prev, hora: e.target.value }))}
                required
              >
                <option value="">Selecione…</option>
                {horas.map((hora) => (
                  <option key={hora} value={hora}>
                    {hora}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <FieldLabel htmlFor="agenda-cliente">Cliente</FieldLabel>
            <Select
              id="agenda-cliente"
              value={form.id_cliente}
              onChange={(e) => setForm((prev) => ({ ...prev, id_cliente: e.target.value }))}
              required
            >
              <option value="">Selecione…</option>
              {clientesAtivos.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <FieldLabel htmlFor="agenda-barbeiro">Barbeiro (opcional)</FieldLabel>
              <Select
                id="agenda-barbeiro"
                value={form.id_barbeiro}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    id_barbeiro: e.target.value,
                    id_servico: '',
                  }))
                }
              >
                <option value="">Sem barbeiro</option>
                {barbeirosAtivos.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <FieldLabel htmlFor="agenda-servico">Serviço</FieldLabel>
              <Select
                id="agenda-servico"
                value={form.id_servico}
                onChange={(e) => setForm((prev) => ({ ...prev, id_servico: e.target.value }))}
                required
              >
                <option value="">Selecione…</option>
                {servicosDisponiveis.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome}
                    {item.duracao_minutos ? ` (${item.duracao_minutos} min)` : ''}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <FieldLabel htmlFor="agenda-assistente">Assistente (opcional)</FieldLabel>
            <Select
              id="agenda-assistente"
              value={form.id_assistente}
              onChange={(e) => setForm((prev) => ({ ...prev, id_assistente: e.target.value }))}
            >
              <option value="">Sem assistente</option>
              {assistentesAtivas.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <FieldLabel htmlFor="agenda-obs">Observações</FieldLabel>
            <Input
              id="agenda-obs"
              value={form.observacoes}
              onChange={(e) => setForm((prev) => ({ ...prev, observacoes: e.target.value }))}
              placeholder="Ex.: Cliente VIP"
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
        open={Boolean(cancelTarget)}
        title="Cancelar agendamento"
        description={
          cancelTarget
            ? `Cancelar o horário ${cancelTarget.hora} de ${cancelTarget.cliente?.nome ?? 'cliente'}? O slot ficará livre novamente.`
            : ''
        }
        confirmLabel="Cancelar horário"
        cancelLabel="Voltar"
        loading={cancelling}
        onConfirm={() => void handleCancelConfirm()}
        onCancel={() => setCancelTarget(null)}
      />
    </div>
  )
}
