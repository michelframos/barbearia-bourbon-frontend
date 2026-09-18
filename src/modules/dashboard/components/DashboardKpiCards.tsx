import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Scissors,
  UserCheck,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'

import type { DashboardKpis } from '@/modules/dashboard/types/dashboard'
import { cn } from '@/shared/lib/utils'

type MetricProps = {
  label: string
  value: number
  icon: LucideIcon
  accent: 'gold' | 'sky' | 'amber' | 'emerald' | 'muted'
  to?: string
}

const accentMap = {
  gold: 'border-[var(--accent)]/20 bg-[var(--accent-soft)]/50 text-[var(--accent)]',
  sky: 'border-sky-500/20 bg-sky-500/10 text-sky-300',
  amber: 'border-amber-500/20 bg-amber-500/10 text-amber-300',
  emerald: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300',
  muted: 'border-[var(--border)] bg-[var(--surface)]/60 text-[var(--foreground-muted)]',
}

function MetricCard({ label, value, icon: Icon, accent, to }: MetricProps) {
  const body = (
    <div className="flex items-center gap-3 p-3">
      <div
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-lg border',
          accentMap[accent],
        )}
      >
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--foreground-muted)]">
          {label}
        </p>
        <p className="font-display text-2xl tabular-nums leading-none text-[var(--foreground)]">
          {value}
        </p>
      </div>
    </div>
  )

  if (to) {
    return (
      <Link
        to={to}
        className="block rounded-xl border border-[var(--border)] bg-[var(--surface)]/50 transition-colors hover:border-[var(--accent)]/30 hover:bg-[var(--surface)]"
      >
        {body}
      </Link>
    )
  }

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/50">{body}</div>
  )
}

type DashboardKpiCardsProps = {
  kpis: DashboardKpis
}

export function DashboardKpiCards({ kpis }: DashboardKpiCardsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      <MetricCard
        label="Trabalhando"
        value={kpis.trabalhando}
        icon={Scissors}
        accent="gold"
        to="/painel"
      />
      <MetricCard
        label="Aguardando"
        value={kpis.aguardando}
        icon={Clock}
        accent="amber"
        to="/painel"
      />
      <MetricCard
        label="Em atendimento"
        value={kpis.em_atendimento}
        icon={UserCheck}
        accent="emerald"
        to="/painel"
      />
      <MetricCard label="Livres" value={kpis.livres} icon={Users} accent="sky" />
      <MetricCard
        label="Concluídos"
        value={kpis.concluidos}
        icon={CheckCircle2}
        accent="muted"
      />
      <MetricCard
        label="Agendamentos"
        value={kpis.agendamentos_hoje}
        icon={CalendarDays}
        accent="muted"
        to="/agenda"
      />
    </div>
  )
}
