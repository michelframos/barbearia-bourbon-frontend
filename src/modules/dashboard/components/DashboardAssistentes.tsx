import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { DashboardPanel } from '@/modules/dashboard/components/DashboardPanel'
import type { DashboardAssistente } from '@/modules/dashboard/types/dashboard'
import { Badge } from '@/shared/ui/badge'
import { InitialsAvatar } from '@/shared/ui/initials-avatar'
import { cn } from '@/shared/lib/utils'

const statusMeta: Record<
  string,
  { label: string; tone: 'default' | 'success' | 'warning' | 'info' | 'muted'; order: number }
> = {
  exclusiva: { label: 'Exclusiva', tone: 'warning', order: 0 },
  livre: { label: 'Livre', tone: 'success', order: 1 },
  offline: { label: 'Offline', tone: 'muted', order: 2 },
}

type DashboardAssistentesProps = {
  items: DashboardAssistente[]
}

export function DashboardAssistentes({ items }: DashboardAssistentesProps) {
  const ordenados = [...items].sort((a, b) => {
    const orderA = statusMeta[a.status_operacional]?.order ?? 9
    const orderB = statusMeta[b.status_operacional]?.order ?? 9
    if (orderA !== orderB) return orderA - orderB
    return b.ocupados - a.ocupados
  })

  const livres = ordenados.filter((item) => item.status_operacional === 'livre').length

  return (
    <DashboardPanel
      title="Assistentes"
      description={`${ordenados.length} cadastradas · ${livres} livres`}
      action={
        <Link
          to="/assistentes"
          className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] transition-opacity hover:opacity-80"
        >
          Ver todas
          <ArrowRight className="size-3.5" />
        </Link>
      }
    >
      {ordenados.length === 0 ? (
        <p className="px-4 py-8 text-center text-xs text-[var(--foreground-muted)]">
          Nenhuma assistente cadastrada
        </p>
      ) : (
        <ul className="max-h-64 divide-y divide-[var(--border)]/70 overflow-y-auto">
          {ordenados.map((item) => {
            const meta = statusMeta[item.status_operacional] ?? {
              label: item.status_operacional,
              tone: 'muted' as const,
              order: 9,
            }
            const ocupacao = Math.min(100, Math.round((item.ocupados / item.capacidade) * 100))

            return (
              <li key={item.id} className="px-4 py-3">
                <div className="flex items-center gap-2.5">
                  <InitialsAvatar
                    name={item.nome}
                    variant="vibrant"
                    className="size-8 text-[10px]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-medium">{item.nome}</p>
                      <Badge tone={meta.tone} className="shrink-0 text-[10px]">
                        {meta.label}
                      </Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">
                      {item.turno ?? 'Turno não definido'}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-1 flex-1 overflow-hidden rounded-full bg-[var(--surface-elevated)]">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            ocupacao >= 100
                              ? 'bg-amber-400'
                              : ocupacao > 0
                                ? 'bg-[var(--accent)]'
                                : 'bg-emerald-400/70',
                          )}
                          style={{ width: `${ocupacao}%` }}
                        />
                      </div>
                      <span className="text-[10px] tabular-nums text-[var(--foreground-muted)]">
                        {item.ocupados}/{item.capacidade}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </DashboardPanel>
  )
}
