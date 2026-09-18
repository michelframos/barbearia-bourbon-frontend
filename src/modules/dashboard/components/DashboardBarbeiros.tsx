import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

import { DashboardPanel } from '@/modules/dashboard/components/DashboardPanel'
import type { DashboardRef } from '@/modules/dashboard/types/dashboard'
import { Badge } from '@/shared/ui/badge'
import { InitialsAvatar } from '@/shared/ui/initials-avatar'

const statusMeta: Record<
  string,
  { label: string; tone: 'default' | 'success' | 'warning' | 'info' | 'muted'; order: number }
> = {
  em_atendimento: { label: 'Em atendimento', tone: 'success', order: 0 },
  disponivel: { label: 'Disponível', tone: 'info', order: 1 },
  aguardando: { label: 'Aguardando', tone: 'warning', order: 2 },
  offline: { label: 'Offline', tone: 'muted', order: 3 },
}

type DashboardBarbeirosProps = {
  items: DashboardRef[]
}

export function DashboardBarbeiros({ items }: DashboardBarbeirosProps) {
  const ordenados = [...items].sort((a, b) => {
    const orderA = statusMeta[a.status_operacional ?? '']?.order ?? 9
    const orderB = statusMeta[b.status_operacional ?? '']?.order ?? 9
    if (orderA !== orderB) return orderA - orderB
    return a.nome.localeCompare(b.nome, 'pt-BR')
  })

  const ativos = ordenados.filter((item) => item.status_operacional !== 'offline').length

  return (
    <DashboardPanel
      title="Barbeiros"
      description={`${ativos} no expediente · ${ordenados.length} cadastrados`}
      action={
        <Link
          to="/barbeiros"
          className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] transition-opacity hover:opacity-80"
        >
          Ver todos
          <ArrowRight className="size-3.5" />
        </Link>
      }
    >
      {ordenados.length === 0 ? (
        <p className="px-4 py-8 text-center text-xs text-[var(--foreground-muted)]">
          Nenhum barbeiro cadastrado
        </p>
      ) : (
        <ul className="max-h-64 divide-y divide-[var(--border)]/70 overflow-y-auto">
          {ordenados.map((item) => {
            const meta = statusMeta[item.status_operacional ?? ''] ?? {
              label: item.status_operacional ?? '—',
              tone: 'muted' as const,
              order: 9,
            }

            return (
              <li
                key={item.id}
                className="flex items-center gap-2.5 px-4 py-3 transition-colors hover:bg-white/[0.02]"
              >
                <InitialsAvatar
                  name={item.nome}
                  src={item.foto_url}
                  variant="accent"
                  className="size-8 text-[10px]"
                />
                <p className="min-w-0 flex-1 truncate text-sm font-medium">{item.nome}</p>
                <Badge tone={meta.tone} dot className="shrink-0 text-[10px]">
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
