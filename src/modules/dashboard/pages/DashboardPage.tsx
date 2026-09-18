import { CalendarDays, ClipboardList, Plus, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'

import { DashboardAgendaHoje } from '@/modules/dashboard/components/DashboardAgendaHoje'
import { DashboardAssistentes } from '@/modules/dashboard/components/DashboardAssistentes'
import { DashboardBarbeiros } from '@/modules/dashboard/components/DashboardBarbeiros'
import { DashboardGraficoHoras } from '@/modules/dashboard/components/DashboardGraficoHoras'
import { DashboardKpiCards } from '@/modules/dashboard/components/DashboardKpiCards'
import { useDashboardHoje } from '@/modules/dashboard/hooks/useDashboardHoje'
import { PageHeader } from '@/shared/layout/PageHeader'
import { Button } from '@/shared/ui/button'
import { Skeleton } from '@/shared/ui/skeleton'

function formatDateLabel(iso: string) {
  const [year, month, day] = iso.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  })
}

function formatLastUpdated(date: Date | null) {
  if (!date) return null
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function DashboardPage() {
  const { snapshot, loading, error, lastUpdated, reload } = useDashboardHoje()

  const operacaoAtiva =
    snapshot && (snapshot.kpis.aguardando > 0 || snapshot.kpis.em_atendimento > 0)

  return (
    <div className="animate-fade-in mx-auto w-full max-w-[1400px] space-y-5 pb-4">
      <PageHeader
        title="Dashboard"
        description={
          snapshot
            ? `Visão do dia — ${formatDateLabel(snapshot.data)}`
            : 'Visão do dia: KPIs, agenda e operação em andamento.'
        }
        className="mb-2 md:mb-0"
        actions={
          <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
            {lastUpdated ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)]/50 px-3 py-1.5 text-xs text-[var(--foreground-muted)]">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-40" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
                </span>
                Atualizado às {formatLastUpdated(lastUpdated)}
              </span>
            ) : null}
            <Button type="button" variant="outline" onClick={() => void reload()} disabled={loading}>
              <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link to="/agenda">
                <CalendarDays className="size-4" />
                Agenda
              </Link>
            </Button>
            <Button type="button" asChild>
              <Link to="/painel">
                <Plus className="size-4" />
                Registrar chegada
              </Link>
            </Button>
          </div>
        }
      />

      {error ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      {loading && !snapshot ? (
        <div className="mt-6 space-y-5 md:mt-8">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-[72px] rounded-xl" />
            ))}
          </div>
          <div className="grid items-start gap-5 xl:grid-cols-12">
            <div className="space-y-5 xl:col-span-8">
              <Skeleton className="h-80 rounded-xl" />
              <Skeleton className="h-64 rounded-xl" />
            </div>
            <div className="space-y-5 xl:col-span-4">
              <Skeleton className="h-56 rounded-xl" />
              <Skeleton className="h-56 rounded-xl" />
            </div>
          </div>
        </div>
      ) : snapshot ? (
        <>
          <div className="mt-6 md:mt-8">
            <DashboardKpiCards kpis={snapshot.kpis} />
          </div>

          {operacaoAtiva ? (
            <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-[var(--accent)]/25 bg-[var(--accent-soft)]/25 px-4 py-3 sm:flex-row sm:items-center">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-soft)] text-[var(--accent)]">
                  <ClipboardList className="size-4" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    Operação em andamento
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">
                    {snapshot.kpis.aguardando > 0
                      ? `${snapshot.kpis.aguardando} aguardando`
                      : null}
                    {snapshot.kpis.aguardando > 0 && snapshot.kpis.em_atendimento > 0
                      ? ' · '
                      : null}
                    {snapshot.kpis.em_atendimento > 0
                      ? `${snapshot.kpis.em_atendimento} em atendimento`
                      : null}
                  </p>
                </div>
              </div>
              <Button type="button" size="sm" asChild>
                <Link to="/painel">Ir ao painel</Link>
              </Button>
            </div>
          ) : null}

          <div className="grid items-start gap-5 xl:grid-cols-12">
            <div className="space-y-5 xl:col-span-8">
              <DashboardGraficoHoras data={snapshot.grafico_horas} />
              <DashboardAgendaHoje items={snapshot.agenda} />
            </div>

            <div className="space-y-5 xl:col-span-4">
              <DashboardAssistentes items={snapshot.assistentes} />
              <DashboardBarbeiros items={snapshot.barbeiros} />
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}
