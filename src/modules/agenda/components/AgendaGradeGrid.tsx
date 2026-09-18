import { useEffect, useMemo, useRef } from 'react'

import type { Agendamento } from '@/modules/agenda/types/agendamento'
import type { Barbeiro } from '@/modules/barbeiros/types/barbeiro'
import { cn } from '@/shared/lib/utils'
import { InitialsAvatar } from '@/shared/ui/initials-avatar'
import { Plus } from 'lucide-react'

import '@/modules/agenda/agenda.css'

const ROW_HEIGHT = 60
const TIME_COL_WIDTH = 68
const BARBEIRO_MIN_WIDTH = 180

type AgendaGradeGridProps = {
  horas: string[]
  barbeiros: Barbeiro[]
  agendamentos: Agendamento[]
  intervaloMinutos: number
  data: string
  onSlotClick: (hora: string, idBarbeiro: number) => void
  onAgendamentoClick: (item: Agendamento) => void
}

function firstName(nome: string) {
  return nome.trim().split(/\s+/)[0] ?? nome
}

function spanRows(duracaoMinutos: number | undefined, intervalo: number) {
  const duracao = Math.max(intervalo, duracaoMinutos ?? intervalo)
  return Math.max(1, Math.ceil(duracao / intervalo))
}

function minutesFromHora(hora: string) {
  const [h, m] = hora.split(':').map(Number)
  return h * 60 + (m || 0)
}

function todayIsoLocal() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function nowMinutes() {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

export function AgendaGradeGrid({
  horas,
  barbeiros,
  agendamentos,
  intervaloMinutos,
  data,
  onSlotClick,
  onAgendamentoClick,
}: AgendaGradeGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const didScroll = useRef(false)

  const horaIndex = useMemo(() => {
    const map = new Map<string, number>()
    horas.forEach((hora, index) => map.set(hora, index))
    return map
  }, [horas])

  const countsByBarbeiro = useMemo(() => {
    const map = new Map<number, number>()
    for (const item of agendamentos) {
      const key = item.id_barbeiro ?? 0
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    return map
  }, [agendamentos])

  const byBarbeiro = useMemo(() => {
    const map = new Map<number, Agendamento[]>()
    for (const barbeiro of barbeiros) {
      map.set(barbeiro.id, [])
    }
    for (const item of agendamentos) {
      const key = item.id_barbeiro ?? 0
      const list = map.get(key)
      if (list) list.push(item)
    }
    return map
  }, [agendamentos, barbeiros])

  const occupiedCells = useMemo(() => {
    const occupied = new Set<string>()
    for (const item of agendamentos) {
      const start = horaIndex.get(item.hora)
      if (start === undefined) continue
      const keyBarbeiro = item.id_barbeiro ?? 0
      const rows = spanRows(item.servico?.duracao_minutos, intervaloMinutos)
      for (let offset = 0; offset < rows; offset += 1) {
        const hora = horas[start + offset]
        if (hora) occupied.add(`${keyBarbeiro}:${hora}`)
      }
    }
    return occupied
  }, [agendamentos, horaIndex, horas, intervaloMinutos])

  const isToday = data === todayIsoLocal()
  const nowOffset = useMemo(() => {
    if (!isToday || horas.length === 0) return null
    const startMin = minutesFromHora(horas[0])
    const endMin = minutesFromHora(horas[horas.length - 1]) + intervaloMinutos
    const now = nowMinutes()
    if (now < startMin || now > endMin) return null
    return ((now - startMin) / intervaloMinutos) * ROW_HEIGHT
  }, [horas, intervaloMinutos, isToday])

  useEffect(() => {
    didScroll.current = false
  }, [data])

  useEffect(() => {
    if (didScroll.current || !scrollRef.current || horas.length === 0) return
    didScroll.current = true

    let targetRow = 0
    if (isToday && nowOffset !== null) {
      targetRow = Math.max(0, Math.floor(nowOffset / ROW_HEIGHT) - 1)
    } else if (agendamentos.length > 0) {
      const first = [...agendamentos].sort(
        (a, b) => minutesFromHora(a.hora) - minutesFromHora(b.hora),
      )[0]
      targetRow = horaIndex.get(first.hora) ?? 0
    }

    const headerApprox = 52
    scrollRef.current.scrollTo({
      top: Math.max(0, targetRow * ROW_HEIGHT - headerApprox),
      behavior: 'smooth',
    })
  }, [agendamentos, horaIndex, horas.length, isToday, nowOffset])

  if (barbeiros.length === 0) {
    return null
  }

  const gridTemplate = `${TIME_COL_WIDTH}px repeat(${barbeiros.length}, minmax(${BARBEIRO_MIN_WIDTH}px, 1fr))`
  const bodyHeight = horas.length * ROW_HEIGHT

  return (
    <div
      ref={scrollRef}
      className="h-full min-h-0 overflow-auto rounded-xl border border-[var(--border)] bg-[#0c1014] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
    >
      <div className="min-w-max pb-6">
        <div
          className="sticky top-0 z-30 grid border-b border-[var(--border)] bg-[#12171c]/95 backdrop-blur-md"
          style={{ gridTemplateColumns: gridTemplate }}
        >
          <div className="sticky left-0 z-40 flex items-center bg-[#12171c] px-3 py-3.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#6b7280]">
              Hora
            </span>
          </div>
          {barbeiros.map((barbeiro) => {
            const count = countsByBarbeiro.get(barbeiro.id) ?? 0
            return (
              <div
                key={barbeiro.id}
                className="flex items-center gap-2.5 border-l border-[var(--border)] px-3 py-3.5"
              >
                <InitialsAvatar
                  name={barbeiro.nome}
                  src={barbeiro.foto_url}
                  variant="vibrant"
                  className="size-7 text-[10px] ring-1 ring-white/10"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[#f0ebe3]">
                    {firstName(barbeiro.nome)}
                  </p>
                  <p className="truncate text-[11px] text-[#6b7280]">
                    {count === 0
                      ? 'Livre'
                      : `${count} horário${count > 1 ? 's' : ''}`}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="relative" style={{ height: bodyHeight }}>
          <div
            className="absolute inset-0 grid"
            style={{
              gridTemplateColumns: gridTemplate,
              gridTemplateRows: `repeat(${horas.length}, ${ROW_HEIGHT}px)`,
            }}
          >
            {horas.map((hora, rowIndex) => {
              const hourLabel = hora.endsWith(':00')
              return (
                <div key={`row-${hora}`} className="contents">
                  <div
                    className={cn(
                      'sticky left-0 z-20 flex items-start bg-[#0c1014] px-3 pt-2.5',
                      rowIndex < horas.length - 1 && 'border-b border-[var(--border)]/50',
                    )}
                  >
                    <span
                      className={cn(
                        'text-[12px] tabular-nums',
                        hourLabel ? 'font-medium text-[#9a9388]' : 'text-[#5c6570]',
                      )}
                    >
                      {hora}
                    </span>
                  </div>
                  {barbeiros.map((barbeiro) => {
                    const key = `${barbeiro.id}:${hora}`
                    const occupied = occupiedCells.has(key)
                    return (
                      <button
                        key={key}
                        type="button"
                        disabled={occupied}
                        onClick={() => onSlotClick(hora, barbeiro.id)}
                        aria-label={`Agendar ${hora} com ${barbeiro.nome}`}
                        className={cn(
                          'group/slot relative border-l border-[var(--border)]/50 transition-colors',
                          rowIndex < horas.length - 1 && 'border-b border-[var(--border)]/50',
                          occupied
                            ? 'cursor-default'
                            : 'cursor-pointer hover:bg-[var(--accent)]/[0.07]',
                        )}
                      >
                        {!occupied ? (
                          <span className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover/slot:opacity-100">
                            <span className="inline-flex size-7 items-center justify-center rounded-full bg-[var(--accent)]/15 text-[var(--accent)] ring-1 ring-[var(--accent)]/30">
                              <Plus className="size-3.5" strokeWidth={2.5} />
                            </span>
                          </span>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>

          {nowOffset !== null ? (
            <div
              className="agenda-now-line pointer-events-none absolute left-0 right-0 z-20"
              style={{ top: nowOffset }}
              aria-hidden
            >
              <div className="relative flex items-center">
                <span className="sticky left-0 z-30 ml-1 rounded-sm bg-[#ef4444] px-1 py-px text-[9px] font-bold uppercase tracking-wide text-white">
                  Agora
                </span>
                <div className="h-px flex-1 bg-[#ef4444]/80 shadow-[0_0_8px_rgba(239,68,68,0.55)]" />
              </div>
            </div>
          ) : null}

          <div
            className="pointer-events-none absolute inset-0 grid"
            style={{ gridTemplateColumns: gridTemplate }}
          >
            <div />
            {barbeiros.map((barbeiro) => {
              const items = byBarbeiro.get(barbeiro.id) ?? []
              return (
                <div key={`cards-${barbeiro.id}`} className="relative">
                  {items.map((item, cardIndex) => {
                    const start = horaIndex.get(item.hora)
                    if (start === undefined) return null
                    const rows = spanRows(item.servico?.duracao_minutos, intervaloMinutos)
                    const top = start * ROW_HEIGHT
                    const height = rows * ROW_HEIGHT - 8
                    const duracao = item.servico?.duracao_minutos

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onAgendamentoClick(item)}
                        className="agenda-card-enter pointer-events-auto absolute left-1.5 right-1.5 z-10 overflow-hidden rounded-lg border border-[var(--accent)]/35 bg-gradient-to-b from-[#221c14] to-[#1a1610] px-2.5 py-2 text-left shadow-[0_1px_0_rgba(201,169,106,0.12)] transition-[border-color,transform,box-shadow] hover:z-20 hover:translate-y-[-1px] hover:border-[var(--accent)]/70 hover:shadow-[0_10px_28px_-14px_rgba(201,169,106,0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/50"
                        style={{
                          top: top + 4,
                          height,
                          animationDelay: `${Math.min(cardIndex, 8) * 40}ms`,
                        }}
                        title={`${item.cliente?.nome ?? 'Cliente'} · ${item.servico?.nome ?? 'Serviço'}${item.observacoes ? ` · ${item.observacoes}` : ''}`}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <p className="truncate text-[13px] font-semibold leading-tight text-[var(--accent)]">
                            {item.cliente?.nome ?? `Cliente #${item.id_cliente}`}
                          </p>
                          {item.status_agenda === 'confirmado' ? (
                            <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-emerald-400" title="Confirmado" />
                          ) : null}
                        </div>
                        <p className="mt-0.5 truncate text-[11px] leading-tight text-[var(--accent)]/60">
                          {item.servico?.nome ?? 'Serviço'}
                          {duracao ? ` · ${duracao} min` : ''}
                        </p>
                        {rows >= 2 && item.observacoes ? (
                          <p className="mt-1.5 truncate text-[10px] text-[#8a8378]">
                            {item.observacoes}
                          </p>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
