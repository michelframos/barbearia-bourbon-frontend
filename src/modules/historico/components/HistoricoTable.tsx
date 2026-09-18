import type { Atendimento, StatusAtendimento } from '@/modules/painel/types/atendimento'
import { Badge } from '@/shared/ui/badge'
import { EmptyState } from '@/shared/ui/empty-state'
import { TableSkeleton } from '@/shared/ui/skeleton'

const statusMeta: Record<
  string,
  { label: string; tone: 'default' | 'success' | 'warning' | 'info' | 'muted' }
> = {
  aguardando: { label: 'Aguardando', tone: 'default' },
  chamado: { label: 'Chamado', tone: 'info' },
  em_atendimento: { label: 'Em atendimento', tone: 'success' },
  concluido: { label: 'Concluído', tone: 'muted' },
  cancelado: { label: 'Cancelado', tone: 'muted' },
}

type Props = {
  items: Atendimento[]
  loading: boolean
}

export function HistoricoTable({ items, loading }: Props) {
  if (loading) {
    return <TableSkeleton rows={8} />
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Nenhum atendimento encontrado"
        description="Ajuste a data ou o filtro de status para ver outros registros."
      />
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
      <table className="min-w-full text-sm">
        <thead className="border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_80%,transparent)]">
          <tr className="text-left text-[var(--foreground-muted)]">
            <th className="px-4 py-3 font-medium">Cliente</th>
            <th className="px-4 py-3 font-medium">Serviço</th>
            <th className="px-4 py-3 font-medium">Assistente</th>
            <th className="px-4 py-3 font-medium">Barbeiro</th>
            <th className="px-4 py-3 font-medium">Chegada</th>
            <th className="px-4 py-3 font-medium">Início</th>
            <th className="px-4 py-3 font-medium">Fim</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const meta = statusMeta[item.status_atendimento as StatusAtendimento] ?? {
              label: item.status_atendimento,
              tone: 'default' as const,
            }
            return (
              <tr key={item.id} className="border-b border-[var(--border)] last:border-b-0">
                <td className="px-4 py-3">{item.cliente?.nome ?? `#${item.id_cliente}`}</td>
                <td className="px-4 py-3">{item.servico?.nome ?? '—'}</td>
                <td className="px-4 py-3">{item.assistente?.nome ?? '—'}</td>
                <td className="px-4 py-3">{item.barbeiro?.nome ?? '—'}</td>
                <td className="px-4 py-3 tabular-nums">{item.hora_chegada ?? '—'}</td>
                <td className="px-4 py-3 tabular-nums">{item.hora_inicio ?? '—'}</td>
                <td className="px-4 py-3 tabular-nums">{item.hora_fim ?? '—'}</td>
                <td className="px-4 py-3">
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
