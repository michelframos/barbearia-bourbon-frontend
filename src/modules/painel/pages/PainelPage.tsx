import { History, MoreHorizontal, Plus } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'

import { useAssistentes } from '@/modules/assistentes/hooks/useAssistentes'
import { useBarbeiros } from '@/modules/barbeiros/hooks/useBarbeiros'
import type { Barbeiro } from '@/modules/barbeiros/types/barbeiro'
import { useClientes } from '@/modules/clientes/hooks/useClientes'
import { useEmpresaConfig } from '@/modules/empresa/hooks/useEmpresaConfig'
import { usePainel } from '@/modules/painel/hooks/usePainel'
import type { Atendimento, CheckInPayload } from '@/modules/painel/types/atendimento'
import { useServicos } from '@/modules/servicos/hooks/useServicos'
import { ApiError } from '@/shared/api/httpClient'
import { playAlertSound } from '@/shared/lib/alertSound'
import { elapsedFromHora } from '@/shared/lib/elapsed'
import { cn } from '@/shared/lib/utils'
import { PageHeader } from '@/shared/layout/PageHeader'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { ConfirmDialog } from '@/shared/ui/confirm-dialog'
import { EmptyState } from '@/shared/ui/empty-state'
import { FieldLabel } from '@/shared/ui/field-label'
import { FilterChip } from '@/shared/ui/filter-chip'
import { Input } from '@/shared/ui/input'
import { Modal } from '@/shared/ui/modal'
import { Select } from '@/shared/ui/select'
import { Skeleton } from '@/shared/ui/skeleton'

function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function minutesBetween(fromHora: string | null, to: Date = new Date()) {
  if (!fromHora) return null
  const [h, m] = fromHora.split(':').map(Number)
  const start = new Date(to)
  start.setHours(h, m, 0, 0)
  const diff = Math.max(0, Math.floor((to.getTime() - start.getTime()) / 60000))
  return diff
}

function formatMinutes(mins: number | null) {
  if (mins === null) return '—'
  return `${mins}min`
}

function barbeiroPodeIniciarAtendimento(barbeiro: Barbeiro) {
  return (
    barbeiro.status === 'a' &&
    barbeiro.status_operacional !== 'offline' &&
    barbeiro.status_operacional !== 'em_atendimento'
  )
}

function barbeiroIndisponivelMotivo(barbeiro: Barbeiro) {
  if (barbeiro.status_operacional === 'offline') return 'fora do expediente'
  if (barbeiro.status_operacional === 'em_atendimento') return 'em atendimento'
  return null
}

function renderBarbeiroOption(barbeiro: Barbeiro, { paraInicio = false } = {}) {
  const indisponivel = paraInicio ? barbeiroIndisponivelMotivo(barbeiro) : null
  return (
    <option key={barbeiro.id} value={barbeiro.id} disabled={Boolean(indisponivel)}>
      {barbeiro.nome}
      {indisponivel ? ` (${indisponivel})` : ''}
    </option>
  )
}

type StatusFilter = 'todos' | 'aguardando' | 'chamado' | 'em_atendimento' | 'concluido'

const statusMeta: Record<
  string,
  { label: string; tone: 'default' | 'success' | 'warning' | 'info' | 'muted' }
> = {
  aguardando: { label: 'Aguardando', tone: 'default' },
  chamado: { label: 'Chamado', tone: 'info' },
  em_atendimento: { label: 'Em Atendimento', tone: 'success' },
  concluido: { label: 'Concluído', tone: 'muted' },
  cancelado: { label: 'Cancelado', tone: 'muted' },
}

type CheckInForm = {
  id_cliente: string
  id_assistente: string
  id_servico: string
  id_barbeiro: string
  observacoes: string
}

const emptyCheckIn = (): CheckInForm => ({
  id_cliente: '',
  id_assistente: '',
  id_servico: '',
  id_barbeiro: '',
  observacoes: '',
})

export function PainelPage() {
  const data = todayIso()
  const { snapshot, loading, error, checkIn, chamar, iniciar, concluir, cancelar } = usePainel(data)
  const { empresa } = useEmpresaConfig()
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const emAtendimento = snapshot?.resumo?.em_atendimento ?? 0
    const intervalMs = emAtendimento > 0 ? 1000 : 30_000
    const id = window.setInterval(() => setNow(new Date()), intervalMs)
    return () => window.clearInterval(id)
  }, [snapshot?.resumo?.em_atendimento])

  const { items: clientes } = useClientes()
  const { items: assistentes } = useAssistentes()
  const { items: barbeiros } = useBarbeiros('', 15_000)
  const { items: servicos } = useServicos()

  const [filter, setFilter] = useState<StatusFilter>('todos')
  const [checkInOpen, setCheckInOpen] = useState(false)
  const [form, setForm] = useState<CheckInForm>(emptyCheckIn())
  const [formError, setFormError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [iniciarTarget, setIniciarTarget] = useState<Atendimento | null>(null)
  const [idAssistenteInicio, setIdAssistenteInicio] = useState('')
  const [idBarbeiroInicio, setIdBarbeiroInicio] = useState('')
  const [iniciarError, setIniciarError] = useState<string | null>(null)
  const [iniciando, setIniciando] = useState(false)

  const [menuTarget, setMenuTarget] = useState<Atendimento | null>(null)
  const [actionTarget, setActionTarget] = useState<{
    item: Atendimento
    action: 'cancelar'
  } | null>(null)
  const [acting, setActing] = useState(false)

  const clientesAtivos = useMemo(() => clientes.filter((c) => c.status === 'a'), [clientes])
  const assistentesAtivas = useMemo(() => assistentes.filter((a) => a.status === 'a'), [assistentes])
  const barbeirosAtivos = useMemo(() => barbeiros.filter((b) => b.status === 'a'), [barbeiros])
  const barbeirosParaInicio = useMemo(
    () => barbeirosAtivos.filter(barbeiroPodeIniciarAtendimento),
    [barbeirosAtivos],
  )
  const servicosAtivos = useMemo(() => servicos.filter((s) => s.status === 'a'), [servicos])

  const resumo = snapshot?.resumo
  const selecaoAutomatica =
    snapshot?.config_operacional?.modo_selecao_assistente === 'automatico_sequencial'
  const atribuicaoNoCheckin =
    selecaoAutomatica &&
    snapshot?.config_operacional?.momento_atribuicao_assistente === 'checkin_cliente'
  const rows = useMemo(() => {
    if (!snapshot) return []
    if (filter === 'concluido') return snapshot.finalizados ?? []
    const abertos = snapshot.atendimentos ?? []
    if (filter === 'todos') return abertos
    return abertos.filter((item) => item.status_atendimento === filter)
  }, [snapshot, filter])

  async function handleCheckIn(event: FormEvent) {
    event.preventDefault()
    setFormError(null)

    if (!form.id_cliente || !form.id_servico) {
      setFormError('Informe cliente e serviço.')
      return
    }

    if (atribuicaoNoCheckin && !form.id_barbeiro) {
      setFormError('Informe o barbeiro para atribuir a assistente no check-in.')
      return
    }

    const payload: CheckInPayload = {
      id_cliente: Number(form.id_cliente),
      id_assistente:
        atribuicaoNoCheckin || !form.id_assistente ? null : Number(form.id_assistente),
      id_servico: Number(form.id_servico),
      id_barbeiro: form.id_barbeiro ? Number(form.id_barbeiro) : null,
      observacoes: form.observacoes.trim() || null,
    }

    setSaving(true)
    try {
      await checkIn(payload)
      if (empresa?.som_alerta_ativo) {
        playAlertSound()
      }
      setCheckInOpen(false)
      setForm(emptyCheckIn())
    } catch (err) {
      if (err instanceof ApiError) {
        const first = err.errors ? Object.values(err.errors).flat()[0] : null
        setFormError(first ?? err.message)
      } else {
        setFormError('Não foi possível registrar a chegada.')
      }
    } finally {
      setSaving(false)
    }
  }

  function openIniciar(item: Atendimento) {
    setIniciarTarget(item)
    setIdAssistenteInicio(item.id_assistente ? String(item.id_assistente) : '')
    const barbeiroPreSelecionado = item.id_barbeiro
      ? barbeirosAtivos.find((barbeiro) => barbeiro.id === item.id_barbeiro)
      : null
    setIdBarbeiroInicio(
      barbeiroPreSelecionado && barbeiroPodeIniciarAtendimento(barbeiroPreSelecionado)
        ? String(barbeiroPreSelecionado.id)
        : '',
    )
    setIniciarError(null)
  }

  async function handleIniciar() {
    if (!iniciarTarget) return
    setIniciarError(null)

    const idAssistente =
      idAssistenteInicio || (iniciarTarget.id_assistente ? String(iniciarTarget.id_assistente) : '')
    const idBarbeiro =
      idBarbeiroInicio || (iniciarTarget.id_barbeiro ? String(iniciarTarget.id_barbeiro) : '')

    if (!selecaoAutomatica && !idAssistente) {
      setIniciarError('Selecione assistente e barbeiro para iniciar.')
      return
    }

    if (!idBarbeiro) {
      setIniciarError(
        selecaoAutomatica
          ? 'Selecione o barbeiro para iniciar.'
          : 'Selecione assistente e barbeiro para iniciar.',
      )
      return
    }

    const barbeiroSelecionado = barbeirosAtivos.find((item) => item.id === Number(idBarbeiro))
    if (!barbeiroSelecionado || !barbeiroPodeIniciarAtendimento(barbeiroSelecionado)) {
      setIniciarError(
        'Selecione um barbeiro disponível (no expediente e sem atendimento em andamento).',
      )
      return
    }

    setIniciando(true)
    try {
      await iniciar(iniciarTarget.id, {
        ...(idAssistente ? { id_assistente: Number(idAssistente) } : {}),
        id_barbeiro: Number(idBarbeiro),
      })
      setIniciarTarget(null)
    } catch (err) {
      if (err instanceof ApiError) {
        const first = err.errors ? Object.values(err.errors).flat()[0] : null
        setIniciarError(first ?? err.message)
      } else {
        setIniciarError('Falha ao iniciar.')
      }
    } finally {
      setIniciando(false)
    }
  }

  async function handleCancelConfirm() {
    if (!actionTarget) return
    setActing(true)
    try {
      await cancelar(actionTarget.item.id)
      setActionTarget(null)
      setMenuTarget(null)
    } finally {
      setActing(false)
    }
  }

  function clienteSubtext(item: Atendimento) {
    const pos = item.posicao_fila ? `Posição ${item.posicao_fila}` : null
    if (item.status_atendimento === 'aguardando') {
      return pos ? `${pos} — aguardando vaga` : 'Aguardando vaga'
    }
    if (item.status_atendimento === 'chamado') {
      return pos ? `${pos} — chamado para a cadeira` : 'Chamado para a cadeira'
    }
    if (item.status_atendimento === 'em_atendimento') {
      const cliente = item.cliente?.nome ?? `Cliente #${item.id_cliente}`
      const servico = item.servico?.nome
      const inicio = item.hora_inicio ? `início ${item.hora_inicio}` : null
      return [cliente, servico, inicio].filter(Boolean).join(' · ')
    }
    return null
  }

  function primaryAction(item: Atendimento) {
    if (item.status_atendimento === 'aguardando') {
      return (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => void chamar(item.id)}
        >
          Chamar
        </Button>
      )
    }
    if (item.status_atendimento === 'chamado') {
      return (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => openIniciar(item)}
        >
          Iniciar
        </Button>
      )
    }
    if (item.status_atendimento === 'em_atendimento') {
      return (
        <Button type="button" size="sm" onClick={() => void concluir(item.id)}>
          Finalizar
        </Button>
      )
    }
    return null
  }

  return (
    <div className="animate-fade-in flex min-h-0 flex-1 flex-col gap-5">
      <PageHeader
        title="Painel Operacional"
        description="Todos os atendimentos em andamento e em fila"
        className="mb-0 shrink-0"
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setFilter((prev) => (prev === 'concluido' ? 'todos' : 'concluido'))}
            >
              <History className="size-4" />
              {filter === 'concluido' ? 'Ver fila' : 'Ver Finalizados'}
            </Button>
            <Button
              type="button"
              onClick={() => {
                setForm(emptyCheckIn())
                setFormError(null)
                setCheckInOpen(true)
              }}
            >
              <Plus className="size-4" />
              Registrar Chegada
            </Button>
          </>
        }
      />

      {resumo ? (
        <div className="flex shrink-0 flex-wrap gap-2">
          <FilterChip active={filter === 'todos'} onClick={() => setFilter('todos')}>
            {resumo.total} total
          </FilterChip>
          <FilterChip active={filter === 'aguardando'} onClick={() => setFilter('aguardando')}>
            {resumo.aguardando} aguardando
          </FilterChip>
          <FilterChip active={filter === 'chamado'} onClick={() => setFilter('chamado')}>
            {resumo.chamados} chamados
          </FilterChip>
          <FilterChip
            active={filter === 'em_atendimento'}
            onClick={() => setFilter('em_atendimento')}
          >
            {resumo.em_atendimento} em atendimento
          </FilterChip>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-[var(--border)] bg-[var(--surface)]/40">
        {loading && !snapshot ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-lg" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <EmptyState
            className="border-0 bg-transparent"
            title={filter === 'concluido' ? 'Nenhum finalizado hoje' : 'Fila vazia'}
            description={
              filter === 'concluido'
                ? 'Os atendimentos concluídos aparecerão aqui.'
                : 'Registre a chegada de um cliente para começar.'
            }
            actionLabel={filter === 'concluido' ? undefined : 'Registrar Chegada'}
            onAction={
              filter === 'concluido'
                ? undefined
                : () => {
                    setForm(emptyCheckIn())
                    setCheckInOpen(true)
                  }
            }
          />
        ) : (
          <div className="min-w-[960px]">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="sticky top-0 z-10 bg-[#12171c]/95 backdrop-blur-md">
                <tr className="border-b border-[var(--border)] text-[10px] uppercase tracking-[0.12em] text-[#6b7280]">
                  <th className="px-4 py-3 font-semibold">Chegada</th>
                  <th className="px-4 py-3 font-semibold">Cliente</th>
                  <th className="px-4 py-3 font-semibold">Serviço</th>
                  <th className="px-4 py-3 font-semibold">Assistente</th>
                  <th className="px-4 py-3 font-semibold">Barbeiro</th>
                  <th className="px-4 py-3 font-semibold">Espera</th>
                  <th className="px-4 py-3 font-semibold">Atendimento</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((item) => {
                  const meta = statusMeta[item.status_atendimento] ?? {
                    label: item.status_atendimento,
                    tone: 'muted' as const,
                  }
                  const espera =
                    item.status_atendimento === 'em_atendimento' ||
                    item.status_atendimento === 'concluido'
                      ? minutesBetween(
                          item.hora_chegada,
                          item.hora_inicio
                            ? (() => {
                                const [h, m] = item.hora_inicio.split(':').map(Number)
                                const d = new Date()
                                d.setHours(h, m, 0, 0)
                                return d
                              })()
                            : now,
                        )
                      : minutesBetween(item.hora_chegada, now)
                  const atendimentoMins =
                    item.status_atendimento === 'em_atendimento'
                      ? minutesBetween(item.hora_inicio, now)
                      : item.status_atendimento === 'concluido'
                        ? minutesBetween(
                            item.hora_inicio,
                            item.hora_fim
                              ? (() => {
                                  const [h, m] = item.hora_fim.split(':').map(Number)
                                  const d = new Date()
                                  d.setHours(h, m, 0, 0)
                                  return d
                                })()
                              : now,
                          )
                        : null
                  const sub = clienteSubtext(item)

                  return (
                    <tr
                      key={item.id}
                      className="border-b border-[var(--border)]/70 transition-colors hover:bg-white/[0.02]"
                    >
                      <td className="px-4 py-4">
                        <span className="font-semibold tabular-nums text-[var(--accent)]">
                          {item.hora_chegada ?? '—'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <p className="font-semibold text-[var(--foreground)]">
                          {item.cliente?.nome ?? `Cliente #${item.id_cliente}`}
                        </p>
                        {sub ? (
                          <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">{sub}</p>
                        ) : null}
                      </td>
                      <td className="px-4 py-4 text-[#c8c2b8]">
                        {item.servico?.nome ?? '—'}
                      </td>
                      <td className="px-4 py-4 text-[#c8c2b8]">
                        {item.assistente?.nome ?? '—'}
                      </td>
                      <td className="px-4 py-4 text-[#c8c2b8]">
                        {item.barbeiro?.nome ?? '—'}
                      </td>
                      <td className="px-4 py-4 tabular-nums text-[#c8c2b8]">
                        {formatMinutes(espera)}
                      </td>
                      <td className="px-4 py-4 tabular-nums text-[#c8c2b8]">
                        {item.status_atendimento === 'em_atendimento' && item.hora_inicio
                          ? elapsedFromHora(item.hora_inicio, now)
                          : formatMinutes(atendimentoMins)}
                      </td>
                      <td className="px-4 py-4">
                        <Badge tone={meta.tone} dot>
                          {meta.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {primaryAction(item)}
                          {item.status_atendimento !== 'concluido' &&
                          item.status_atendimento !== 'cancelado' ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              aria-label="Mais ações"
                              onClick={() => setMenuTarget(item)}
                            >
                              <MoreHorizontal className="size-4" />
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={checkInOpen}
        title="Registrar Chegada"
        description="Cliente chegou — assistente e barbeiro podem ser definidos depois."
        onClose={() => setCheckInOpen(false)}
        className="max-w-[480px]"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setCheckInOpen(false)}>
              Fechar
            </Button>
            <Button type="submit" form="checkin-form" disabled={saving}>
              {saving ? 'Salvando…' : 'Confirmar chegada'}
            </Button>
          </>
        }
      >
        <form id="checkin-form" className="space-y-4" onSubmit={handleCheckIn}>
          <div className="space-y-1.5">
            <FieldLabel htmlFor="ci-cliente">Cliente</FieldLabel>
            <Select
              id="ci-cliente"
              value={form.id_cliente}
              onChange={(e) => setForm((p) => ({ ...p, id_cliente: e.target.value }))}
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
            {!atribuicaoNoCheckin ? (
              <div className="space-y-1.5">
                <FieldLabel htmlFor="ci-assistente">Assistente (opcional)</FieldLabel>
                <Select
                  id="ci-assistente"
                  value={form.id_assistente}
                  onChange={(e) => setForm((p) => ({ ...p, id_assistente: e.target.value }))}
                >
                  <option value="">Sem assistente</option>
                  {assistentesAtivas.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nome}
                    </option>
                  ))}
                </Select>
              </div>
            ) : null}
            <div className={cn('space-y-1.5', atribuicaoNoCheckin && 'sm:col-span-2')}>
              <FieldLabel htmlFor="ci-servico">Serviço</FieldLabel>
              <Select
                id="ci-servico"
                value={form.id_servico}
                onChange={(e) => setForm((p) => ({ ...p, id_servico: e.target.value }))}
                required
              >
                <option value="">Selecione…</option>
                {servicosAtivos.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <FieldLabel htmlFor="ci-barbeiro">
              {atribuicaoNoCheckin ? 'Barbeiro' : 'Barbeiro (opcional)'}
            </FieldLabel>
            <Select
              id="ci-barbeiro"
              value={form.id_barbeiro}
              onChange={(e) => setForm((p) => ({ ...p, id_barbeiro: e.target.value }))}
              required={atribuicaoNoCheckin}
            >
              <option value="">{atribuicaoNoCheckin ? 'Selecione…' : 'Definir depois'}</option>
              {barbeirosAtivos.map((item) => renderBarbeiroOption(item, { paraInicio: true }))}
            </Select>
            {atribuicaoNoCheckin ? (
              <p className="text-xs text-[var(--foreground-muted)]">
                A assistente será atribuída automaticamente na sequência configurada.
              </p>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <FieldLabel htmlFor="ci-obs">Observações</FieldLabel>
            <Input
              id="ci-obs"
              value={form.observacoes}
              onChange={(e) => setForm((p) => ({ ...p, observacoes: e.target.value }))}
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

      <Modal
        open={Boolean(iniciarTarget)}
        title="Iniciar atendimento"
        description={
          iniciarTarget
            ? selecaoAutomatica
              ? `${iniciarTarget.cliente?.nome ?? 'Cliente'} · ${iniciarTarget.servico?.nome ?? 'Serviço'} — assistente atribuída automaticamente`
              : `${iniciarTarget.cliente?.nome ?? 'Cliente'} · ${iniciarTarget.servico?.nome ?? 'Serviço'} — assistente e barbeiro obrigatórios`
            : undefined
        }
        onClose={() => setIniciarTarget(null)}
        className="max-w-[420px]"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setIniciarTarget(null)}>
              Fechar
            </Button>
            <Button type="button" disabled={iniciando || barbeirosParaInicio.length === 0} onClick={() => void handleIniciar()}>
              {iniciando ? 'Iniciando…' : 'Iniciar'}
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {selecaoAutomatica ? (
            <p className="rounded-lg border border-[var(--border)] bg-[var(--surface-elevated)] px-3 py-2 text-sm text-[var(--foreground-muted)]">
              A assistente será atribuída automaticamente pelo rodízio sequencial.
            </p>
          ) : (
            <div className="space-y-1.5">
              <FieldLabel htmlFor="ini-assistente">Assistente</FieldLabel>
              <Select
                id="ini-assistente"
                value={idAssistenteInicio}
                onChange={(e) => setIdAssistenteInicio(e.target.value)}
                required
              >
                <option value="">Selecione…</option>
                {assistentesAtivas.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nome}
                  </option>
                ))}
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <FieldLabel htmlFor="ini-barbeiro">Barbeiro</FieldLabel>
            <Select
              id="ini-barbeiro"
              value={idBarbeiroInicio}
              onChange={(e) => setIdBarbeiroInicio(e.target.value)}
              required
            >
              <option value="">
                {barbeirosParaInicio.length === 0
                  ? 'Nenhum barbeiro disponível'
                  : 'Selecione…'}
              </option>
              {barbeirosAtivos.map((item) => renderBarbeiroOption(item, { paraInicio: true }))}
            </Select>
            {barbeirosParaInicio.length === 0 ? (
              <p className="text-xs text-[var(--foreground-muted)]">
                Todos os barbeiros estão fora do expediente ou já em atendimento.
              </p>
            ) : null}
          </div>
        </div>
        {iniciarError ? (
          <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {iniciarError}
          </p>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(menuTarget)}
        title="Ações"
        description={menuTarget?.cliente?.nome ?? undefined}
        onClose={() => setMenuTarget(null)}
        className="max-w-[360px]"
        footer={
          <Button type="button" variant="outline" onClick={() => setMenuTarget(null)}>
            Fechar
          </Button>
        }
      >
        <div className="flex flex-col gap-2">
          {menuTarget?.status_atendimento === 'aguardando' ? (
            <Button
              type="button"
              variant="secondary"
              className="justify-start"
              onClick={() => {
                const item = menuTarget
                setMenuTarget(null)
                void chamar(item.id)
              }}
            >
              Chamar cliente
            </Button>
          ) : null}
          {menuTarget &&
          (menuTarget.status_atendimento === 'chamado' ||
            menuTarget.status_atendimento === 'aguardando') ? (
            <Button
              type="button"
              variant="secondary"
              className="justify-start"
              onClick={() => {
                openIniciar(menuTarget)
                setMenuTarget(null)
              }}
            >
              Iniciar atendimento
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            className="justify-start text-red-300 hover:text-red-200"
            onClick={() => {
              if (!menuTarget) return
              setActionTarget({ item: menuTarget, action: 'cancelar' })
              setMenuTarget(null)
            }}
          >
            Cancelar atendimento
          </Button>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(actionTarget)}
        title="Cancelar atendimento"
        description={
          actionTarget
            ? `Cancelar o atendimento de ${actionTarget.item.cliente?.nome ?? 'cliente'}?`
            : ''
        }
        confirmLabel="Cancelar atendimento"
        cancelLabel="Voltar"
        loading={acting}
        onConfirm={() => void handleCancelConfirm()}
        onCancel={() => setActionTarget(null)}
      />
    </div>
  )
}
