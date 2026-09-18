import { Clock, User } from 'lucide-react'
import { useMemo } from 'react'

import {
  barbeirosAuxiliando,
  emAtendimentosDaAssistente,
  mapaBarbeiros,
  nomeDoBarbeiro,
  proximoDaAssistente,
} from '@/modules/painel-tv/lib/painelTvHelpers'
import type { Atendimento, PainelAssistenteColuna, PainelRef } from '@/modules/painel/types/atendimento'
import { InitialsAvatar } from '@/shared/ui/initials-avatar'
import { cn } from '@/shared/lib/utils'

type Props = {
  colunas: PainelAssistenteColuna[]
  barbeiros: PainelRef[]
}

function BarbeiroBadge({ nome, muted = false }: { nome: string; muted?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        muted
          ? 'border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_80%,transparent)] text-[var(--foreground-muted)]'
          : 'border-amber-500/50 bg-amber-500/10 text-amber-400',
      )}
    >
      <User className="size-3 shrink-0 opacity-80" aria-hidden />
      {nome}
    </span>
  )
}

function BarbeirosBadges({ nomes, muted = false }: { nomes: string[]; muted?: boolean }) {
  if (nomes.length === 0) return null

  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {nomes.map((nome) => (
        <BarbeiroBadge key={nome} nome={nome} muted={muted} />
      ))}
    </div>
  )
}

function HorariosAtendimento({ item }: { item: Atendimento }) {
  return (
    <div className="mt-2 flex flex-wrap gap-4 text-sm">
      {item.hora_chegada ? (
        <span className="inline-flex items-center gap-1.5 tabular-nums text-[var(--foreground-muted)]">
          <Clock className="size-3.5 shrink-0 opacity-70" />
          {item.hora_chegada} Chegada
        </span>
      ) : null}
      {item.hora_inicio ? (
        <span className="inline-flex items-center gap-1.5 tabular-nums text-amber-400">
          <Clock className="size-3.5 shrink-0 opacity-90" />
          {item.hora_inicio} Início
        </span>
      ) : null}
    </div>
  )
}

function CelulaAtendimento({
  itens,
  barbeirosPorId,
}: {
  itens: Atendimento[]
  barbeirosPorId: Map<number, PainelRef>
}) {
  if (itens.length === 0) {
    return <p className="text-lg italic text-[var(--foreground-muted)]/40">Livre</p>
  }

  return (
    <div className="space-y-4">
      {itens.map((item, index) => {
        const barbeiro = nomeDoBarbeiro(item, barbeirosPorId)

        return (
          <div
            key={item.id}
            className={cn(index > 0 && 'border-t border-[var(--border)]/70 pt-4')}
          >
            <p className="text-lg font-semibold text-[var(--foreground)]">
              {item.cliente?.nome ?? 'Cliente'}
            </p>
            <p className="mt-0.5 text-sm text-[var(--foreground-muted)]">
              {item.servico?.nome ?? 'Serviço'}
            </p>
            {barbeiro ? <BarbeirosBadges nomes={[barbeiro]} /> : null}
            <HorariosAtendimento item={item} />
          </div>
        )
      })}
    </div>
  )
}

function CelulaProximo({
  item,
  barbeirosPorId,
}: {
  item: Atendimento | null
  barbeirosPorId: Map<number, PainelRef>
}) {
  if (!item) {
    return <p className="text-sm text-[var(--foreground-muted)]/40">—</p>
  }

  const barbeiro = nomeDoBarbeiro(item, barbeirosPorId)

  return (
    <div>
      <p className="text-lg font-medium text-[var(--foreground-muted)]">
        {item.cliente?.nome ?? 'Cliente'}
      </p>
      <p className="mt-0.5 text-sm text-[var(--foreground-muted)]/80">
        {item.servico?.nome ?? 'Serviço'}
      </p>
      {barbeiro ? <BarbeirosBadges nomes={[barbeiro]} muted /> : null}
      {item.hora_chegada ? (
        <p className="mt-2 inline-flex items-center gap-1.5 text-sm tabular-nums text-[var(--foreground-muted)]/70">
          <Clock className="size-3.5" />
          {item.hora_chegada} Chegada
        </p>
      ) : null}
    </div>
  )
}

function StatusPill({ status }: { status: string }) {
  const config: Record<string, { label: string; dot: string; text: string; bg: string }> = {
    livre: {
      label: 'LIVRE',
      dot: 'bg-emerald-400',
      text: 'text-emerald-400',
      bg: 'bg-[color-mix(in_srgb,#10b981_12%,transparent)]',
    },
    exclusiva: {
      label: 'EXCLUSIVA',
      dot: 'bg-amber-400',
      text: 'text-amber-400',
      bg: 'bg-[color-mix(in_srgb,#f59e0b_12%,transparent)]',
    },
    offline: {
      label: 'OFFLINE',
      dot: 'bg-[var(--foreground-muted)]',
      text: 'text-[var(--foreground-muted)]',
      bg: 'bg-[color-mix(in_srgb,var(--foreground-muted)_12%,transparent)]',
    },
  }

  const meta = config[status] ?? config.livre

  return (
    <div
      className={cn(
        'inline-flex min-w-[120px] items-center justify-center gap-2 rounded-xl px-5 py-2.5',
        meta.bg,
      )}
    >
      <span className={cn('size-2 rounded-full', meta.dot)} />
      <span className={cn('text-sm font-semibold tracking-wide', meta.text)}>{meta.label}</span>
    </div>
  )
}

export function PainelTvAssistenteTable({ colunas, barbeiros }: Props) {
  const barbeirosPorId = useMemo(() => mapaBarbeiros(barbeiros), [barbeiros])

  if (colunas.length === 0) {
    return (
      <p className="py-8 text-center text-lg text-[var(--foreground-muted)]">
        Nenhuma assistente ativa no momento.
      </p>
    )
  }

  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold tracking-[0.2em] text-[var(--foreground-muted)]">
        ASSISTENTES
      </h2>

      <div className="space-y-3">
        <div className="hidden grid-cols-[minmax(180px,1fr)_minmax(240px,1.5fr)_minmax(220px,1.3fr)_140px] gap-4 px-5 text-xs font-semibold tracking-[0.15em] text-[var(--foreground-muted)] md:grid">
          <span>ASSISTENTE</span>
          <span>EM ATENDIMENTO</span>
          <span>PRÓXIMO</span>
          <span className="text-center">STATUS</span>
        </div>

        {colunas.map((coluna) => {
          const emAtendimentos = emAtendimentosDaAssistente(coluna)
          const proximo = proximoDaAssistente(coluna)
          const barbeirosAtivos = barbeirosAuxiliando(coluna, barbeirosPorId)

          return (
            <div
              key={coluna.id}
              className="grid gap-4 rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_70%,transparent)] px-5 py-5 md:grid-cols-[minmax(180px,1fr)_minmax(240px,1.5fr)_minmax(220px,1.3fr)_140px] md:items-center"
            >
              <div className="flex items-center gap-3">
                <InitialsAvatar name={coluna.nome} variant="vibrant" className="size-11 text-sm" />
                <div>
                  <p className="text-lg font-semibold">{coluna.nome}</p>
                  {coluna.turno ? (
                    <p className="text-sm text-[var(--foreground-muted)]">{coluna.turno}</p>
                  ) : null}
                  {barbeirosAtivos.length > 0 ? (
                    <BarbeirosBadges nomes={barbeirosAtivos} />
                  ) : null}
                </div>
              </div>

              <CelulaAtendimento itens={emAtendimentos} barbeirosPorId={barbeirosPorId} />
              <CelulaProximo item={proximo} barbeirosPorId={barbeirosPorId} />

              <div className="flex md:justify-center">
                <StatusPill status={coluna.status_operacional} />
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
