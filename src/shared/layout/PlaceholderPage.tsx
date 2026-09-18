type PlaceholderPageProps = {
  title: string
  description: string
}

export function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="animate-fade-in">
      <header className="mb-8 space-y-1">
        <h1 className="font-display text-2xl tracking-tight text-[var(--foreground)] md:text-3xl">
          {title}
        </h1>
        <p className="max-w-2xl text-sm text-[var(--foreground-muted)] md:text-base">
          {description}
        </p>
      </header>

      <div className="relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              'radial-gradient(ellipse at 20% 0%, color-mix(in srgb, var(--accent) 22%, transparent), transparent 55%)',
          }}
        />
        <p className="relative text-sm text-[var(--foreground-muted)]">
          Conteúdo desta área será implementado nas próximas fases.
        </p>
      </div>
    </div>
  )
}
