import { useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { DashboardPanel } from '@/modules/dashboard/components/DashboardPanel'
import type { DashboardGraficoHora } from '@/modules/dashboard/types/dashboard'
import { EmptyState } from '@/shared/ui/empty-state'
import { FilterChip } from '@/shared/ui/filter-chip'

type DashboardGraficoHorasProps = {
  data: DashboardGraficoHora[]
}

type ModoGrafico = 'dados' | 'completo'

function filtrarDados(data: DashboardGraficoHora[], modo: ModoGrafico) {
  const comAtividade = data.filter(
    (item) => item.agendamentos > 0 || item.concluidos > 0 || item.em_andamento > 0,
  )

  if (modo === 'completo' || comAtividade.length === 0) {
    return data
  }

  const indices = comAtividade.map((item) => data.indexOf(item))
  const primeiro = Math.max(0, Math.min(...indices) - 1)
  const ultimo = Math.min(data.length - 1, Math.max(...indices) + 1)

  return data.slice(primeiro, ultimo + 1)
}

export function DashboardGraficoHoras({ data }: DashboardGraficoHorasProps) {
  const [modo, setModo] = useState<ModoGrafico>('dados')

  const hasData = data.some(
    (item) => item.agendamentos > 0 || item.concluidos > 0 || item.em_andamento > 0,
  )

  const dadosVisiveis = useMemo(() => filtrarDados(data, modo), [data, modo])
  const totalConcluidos = data.reduce((acc, item) => acc + item.concluidos, 0)
  const pico = data.reduce(
    (max, item) =>
      Math.max(max, item.agendamentos + item.concluidos + item.em_andamento),
    0,
  )

  return (
    <DashboardPanel
      title="Atividade por hora"
      description={
        hasData
          ? `${totalConcluidos} concluídos · pico de ${pico} no intervalo`
          : 'Agendamentos, atendimentos concluídos e em andamento'
      }
      action={
        hasData ? (
          <div className="flex flex-wrap justify-end gap-2">
            <FilterChip active={modo === 'dados'} onClick={() => setModo('dados')}>
              Com atividade
            </FilterChip>
            <FilterChip active={modo === 'completo'} onClick={() => setModo('completo')}>
              Expediente
            </FilterChip>
          </div>
        ) : null
      }
    >
      {!hasData ? (
        <EmptyState
          className="border-0 bg-transparent py-12"
          title="Sem movimento ainda"
          description="O gráfico será preenchido conforme a operação do dia."
        />
      ) : (
        <div className="relative h-[280px] w-full p-4 pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dadosVisiveis} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="hora"
                tick={{ fill: 'var(--foreground-muted)', fontSize: 11 }}
                axisLine={{ stroke: 'var(--border)' }}
                tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: 'var(--foreground-muted)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'color-mix(in srgb, var(--accent) 8%, transparent)' }}
                contentStyle={{
                  background: 'var(--surface-elevated)',
                  border: '1px solid var(--border)',
                  borderRadius: '10px',
                  color: 'var(--foreground)',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
                }}
                labelStyle={{ color: 'var(--foreground-muted)', marginBottom: 4 }}
                formatter={(value, name) => [value ?? 0, name]}
                labelFormatter={(label) => `Horário ${label}`}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: 'var(--foreground-muted)', paddingTop: 8 }} />
              <Bar
                dataKey="agendamentos"
                name="Agendamentos"
                fill="#c9a96a"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
              <Bar
                dataKey="concluidos"
                name="Concluídos"
                fill="#34d399"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
              <Bar
                dataKey="em_andamento"
                name="Em andamento"
                fill="#38bdf8"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </DashboardPanel>
  )
}
