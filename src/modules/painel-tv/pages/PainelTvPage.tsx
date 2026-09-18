import { useEffect, useState } from 'react'

import { PainelTvAssistenteTable } from '@/modules/painel-tv/components/PainelTvAssistenteTable'
import { PainelTvBarbeirosCards } from '@/modules/painel-tv/components/PainelTvBarbeirosCards'
import { PainelTvHeader } from '@/modules/painel-tv/components/PainelTvHeader'
import { usePainelTv } from '@/modules/painel-tv/hooks/usePainelTv'
import { Skeleton } from '@/shared/ui/skeleton'

function todayIso() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatHora(date: Date) {
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function PainelTvPage() {
  const data = todayIso()
  const { snapshot, loading, error } = usePainelTv(data)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="min-h-svh bg-[var(--background)] px-4 py-6 text-[var(--foreground)] md:px-8 md:py-8">
      <div className="relative mx-auto flex max-w-[1600px] flex-col gap-8">
        <PainelTvHeader hora={formatHora(now)} />

        {error ? (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        ) : null}

        {loading && !snapshot ? (
          <div className="space-y-4">
            <Skeleton className="h-48 rounded-2xl" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-52 rounded-2xl" />
              ))}
            </div>
          </div>
        ) : (
          <>
            <PainelTvAssistenteTable
              colunas={snapshot?.assistentes ?? []}
              barbeiros={snapshot?.barbeiros ?? []}
            />
            <PainelTvBarbeirosCards
              barbeiros={snapshot?.barbeiros ?? []}
              atendimentos={snapshot?.atendimentos ?? []}
              now={now}
            />
          </>
        )}
      </div>
    </div>
  )
}
