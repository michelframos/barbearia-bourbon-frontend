import { atendimentoAtivoDoBarbeiro } from '@/modules/painel-tv/lib/painelTvHelpers'
import type { Atendimento, PainelRef } from '@/modules/painel/types/atendimento'
import { elapsedFromHora } from '@/shared/lib/elapsed'
import { InitialsAvatar } from '@/shared/ui/initials-avatar'
import { cn } from '@/shared/lib/utils'

type Props = {
  barbeiros: PainelRef[]
  atendimentos: Atendimento[]
  now: Date
}

function StatusDot({ className }: { className: string }) {
  return <span className={cn('size-2 rounded-full', className)} />
}

export function PainelTvBarbeirosCards({ barbeiros, atendimentos, now }: Props) {
  if (barbeiros.length === 0) return null

  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold tracking-[0.2em] text-[var(--foreground-muted)]">
        BARBEIROS
      </h2>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {barbeiros.map((barbeiro) => {
          const operacional = barbeiro.status_operacional ?? 'offline'
          const ativo = atendimentoAtivoDoBarbeiro(barbeiro.id, atendimentos)
          const emServico = operacional === 'em_atendimento' && ativo
          const timer = ativo?.hora_inicio ? elapsedFromHora(ativo.hora_inicio, now) : null

          return (
            <article
              key={barbeiro.id}
              className={cn(
                'relative flex min-h-[200px] flex-col rounded-2xl border bg-[color-mix(in_srgb,var(--surface)_70%,transparent)] p-5',
                emServico
                  ? 'border-sky-500/50 shadow-[0_0_0_1px_color-mix(in_srgb,#38bdf8_25%,transparent)]'
                  : 'border-[var(--border)]',
              )}
            >
              <div className="flex items-start gap-3">
                <InitialsAvatar
                  name={barbeiro.nome}
                  variant="vibrant"
                  className="size-11 text-sm"
                  src={barbeiro.foto_url}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-semibold">{barbeiro.nome}</p>
                  <p
                    className={cn(
                      'mt-0.5 inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide',
                      emServico && 'text-sky-400',
                      operacional === 'disponivel' && 'text-emerald-400',
                      operacional === 'aguardando' && 'text-amber-400',
                      operacional === 'offline' && 'text-[var(--foreground-muted)]',
                    )}
                  >
                    <StatusDot
                      className={cn(
                        emServico && 'bg-sky-400',
                        operacional === 'disponivel' && 'bg-emerald-400',
                        operacional === 'aguardando' && 'bg-amber-400',
                        operacional === 'offline' && 'bg-[var(--foreground-muted)]',
                      )}
                    />
                    {emServico
                      ? 'EM ATENDIMENTO'
                      : operacional === 'disponivel'
                        ? 'DISPONÍVEL'
                        : operacional === 'aguardando'
                          ? 'AGUARDANDO'
                          : 'OFFLINE'}
                  </p>
                </div>
              </div>

              {ativo ? (
                <div className="mt-4 flex flex-1 flex-col justify-between">
                  <div>
                    <p className="text-base font-medium">{ativo.cliente?.nome ?? 'Cliente'}</p>
                    <p className="text-sm text-[var(--foreground-muted)]">
                      {ativo.servico?.nome ?? 'Serviço'}
                    </p>
                  </div>
                  {timer ? (
                    <p className="mt-6 text-center font-display text-4xl tabular-nums tracking-tight text-[var(--accent)] md:text-5xl">
                      {timer}
                    </p>
                  ) : null}
                </div>
              ) : (
                <div className="flex flex-1 items-end justify-end">
                  {operacional === 'disponivel' ? (
                    <p className="text-sm text-[var(--foreground-muted)]/50">—</p>
                  ) : null}
                </div>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
