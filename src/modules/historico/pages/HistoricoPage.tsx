import { useMemo, useState } from 'react'

import { HistoricoTable } from '@/modules/historico/components/HistoricoTable'
import { useHistorico } from '@/modules/historico/hooks/useHistorico'
import type { StatusAtendimento } from '@/modules/painel/types/atendimento'
import { PageHeader } from '@/shared/layout/PageHeader'
import { FieldLabel } from '@/shared/ui/field-label'
import { FilterChip } from '@/shared/ui/filter-chip'
import { Input } from '@/shared/ui/input'

function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

type StatusFilter = 'todos' | StatusAtendimento

const statusOptions: { id: StatusFilter; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'concluido', label: 'Concluídos' },
  { id: 'cancelado', label: 'Cancelados' },
  { id: 'em_atendimento', label: 'Em atendimento' },
  { id: 'aguardando', label: 'Aguardando' },
  { id: 'chamado', label: 'Chamados' },
]

export function HistoricoPage() {
  const [data, setData] = useState(todayIso())
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('concluido')

  const filters = useMemo(
    () => ({
      data,
      status_atendimento: statusFilter === 'todos' ? null : statusFilter,
    }),
    [data, statusFilter],
  )

  const { items, loading, error } = useHistorico(filters)

  return (
    <div className="animate-fade-in flex flex-col gap-5">
      <PageHeader
        title="Histórico"
        description="Consulta de atendimentos por data e status."
      />

      <div className="flex flex-col gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)]/40 p-4">
        <div className="max-w-xs space-y-1.5">
          <FieldLabel htmlFor="historico-data">Data</FieldLabel>
          <Input
            id="historico-data"
            type="date"
            value={data}
            onChange={(event) => setData(event.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {statusOptions.map((option) => (
            <FilterChip
              key={option.id}
              active={statusFilter === option.id}
              onClick={() => setStatusFilter(option.id)}
            >
              {option.label}
            </FilterChip>
          ))}
        </div>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <HistoricoTable items={items} loading={loading} />
    </div>
  )
}
