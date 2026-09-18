import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

import { Button } from '@/shared/ui/button'

type Props = {
  hora: string
}

export function PainelTvHeader({ hora }: Props) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <Button variant="outline" size="sm" asChild className="shrink-0">
          <Link to="/painel">
            <ArrowLeft className="size-4" />
            Painel operacional
          </Link>
        </Button>
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-[0.25em] text-[var(--foreground-muted)]">
            BOURBON
          </p>
          <h1 className="font-display text-2xl text-[var(--accent)] md:text-3xl">Barbearia</h1>
        </div>
      </div>
      <p className="font-display text-4xl tabular-nums text-[var(--foreground)] md:text-5xl">
        {hora}
      </p>
    </header>
  )
}
