import { ArrowRight, CalendarDays } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import { DashboardPanel } from '@/modules/dashboard/components/DashboardPanel'
import type { DashboardAgendamento } from '@/modules/dashboard/types/dashboard'
import { Badge } from '@/shared/ui/badge'
import { EmptyState } from '@/shared/ui/empty-state'
import { cn } from '@/shared/lib/utils'

const statusMeta: Record<
  string,
  { label: string; tone: 'default' | 'success' | 'warning' | 'info' | 'muted' }
> = {
  agendado: { label: 'Agendado', tone: 'default' },
  confirmado: { label: 'Confirmado', tone: 'info' },
  em_atendimento: { label: 'Em atendimento', tone: 'success' },
  concluido: { label: 'Concluído', tone: 'muted' },
  cancelado: { label: 'Cancelado', tone: 'muted' },
  nao_compareceu: { label: 'Não compareceu', tone: 'warning' },
}

const STATUS_FINALIZADOS = new Set(['concluido', 'cancelado', 'nao_compareceu'])

function minutosDesdeMeiaNoite(hora: string) {
  const [h, m] = hora.split(':').map(Number)
  return h * 60 + m
}

function encontrarProximo(items: DashboardAgendamento[]) {
  const agora = new Date()
  const minutosAgora = agora.getHours() * 60 + agora.getMinutes()

  return items.find((item) => {
    if (!item.hora || STATUS_FINALIZADOS.has(item.status_agenda)) return false
    return minutosDesdeMeiaNoite(item.hora) >= minutosAgora
  })
}

type DashboardAgendaHojeProps = {
  items: DashboardAgendamento[]
}

export function DashboardAgendaHoje({ items }: DashboardAgendaHojeProps) {
  const proximo = useMemo(() => encontrarProximo(items), [items])
  const pendentes = items.filter((item) => !STATUS_FINALIZADOS.has(item.status_agenda)).length

  return (
    <DashboardPanel
      title="Agenda de hoje"
      description={
        pendentes > 0
          ? `${pendentes} pendente${pendentes === 1 ? '' : 's'} · ${items.length} no total`
          : `${items.length} agendamento${items.length === 1 ? '' : 's'}`
      }
      action={
        <Link
          to="/agenda"
          className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] transition-opacity hover:opacity-80"
        >
          Ver agenda
          <ArrowRight className="size-3.5" />
        </Link>
      }
    >
      {items.length === 0 ? (
        <EmptyState
          className="border-0 bg-transparent py-10"
          icon={<CalendarDays className="size-5" />}
          title="Sem agendamentos"
          description="Nenhum horário reservado para hoje."
          actionLabel="Abrir agenda"
          onAction={() => {
            window.location.href = '/agenda'
          }}
        />
      ) : (
        <ul className="max-h-72 divide-y divide-[var(--border)]/70 overflow-y-auto">
          {items.map((item) => {
            const meta = statusMeta[item.status_agenda] ?? {
              label: item.status_agenda,
              tone: 'muted' as const,
            }
            const isProximo = proximo?.id === item.id

            return (
              <li
                key={item.id}
                className={cn(
                  'grid grid-cols-[3.5rem_1fr_auto] items-start gap-3 px-4 py-3 transition-colors hover:bg-white/[0.02]',
                  isProximo && 'bg-[var(--accent-soft)]/40',
                )}
              >
                <span
                  className={cn(
                    'pt-0.5 font-semibold tabular-nums',
                    isProximo ? 'text-[var(--accent)]' : 'text-[var(--foreground-muted)]',
                  )}
                >
                  {item.hora ?? '—'}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium text-[var(--foreground)]">
                      {item.cliente?.nome ?? 'Cliente'}
                    </p>
                    {isProximo ? (
                      <Badge tone="default" className="shrink-0">
                        Próximo
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-[var(--foreground-muted)]">
                    {[item.servico?.nome, item.barbeiro?.nome, item.assistente?.nome]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                <Badge tone={meta.tone} className="shrink-0">
                  {meta.label}
                </Badge>
              </li>
            )
          })}
        </ul>
      )}
    </DashboardPanel>
  )
}
