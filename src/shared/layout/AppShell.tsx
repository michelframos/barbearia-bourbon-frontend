import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Outlet } from 'react-router-dom'

import { Sidebar } from '@/shared/layout/Sidebar'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib/utils'

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="relative min-h-svh bg-[var(--background)] text-[var(--foreground)]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 10% -10%, color-mix(in srgb, var(--accent) 14%, transparent), transparent 50%), radial-gradient(ellipse 60% 40% at 100% 0%, color-mix(in srgb, #1a2a3a 80%, transparent), transparent 45%)',
        }}
      />

      <div className="relative flex h-svh min-h-0 overflow-hidden">
        <div className="hidden lg:block">
          <div className="h-svh shrink-0">
            <Sidebar />
          </div>
        </div>

        <div
          className={cn(
            'fixed inset-0 z-40 bg-black/60 transition-opacity lg:hidden',
            mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0',
          )}
          onClick={() => setMobileOpen(false)}
        />

        <div
          className={cn(
            'fixed inset-y-0 left-0 z-50 transition-transform duration-300 lg:hidden',
            mobileOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          <Sidebar onNavigate={() => setMobileOpen(false)} />
        </div>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <header className="sticky top-0 z-30 flex shrink-0 items-center gap-3 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_88%,transparent)] px-4 py-3 backdrop-blur-md lg:hidden">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
              onClick={() => setMobileOpen((open) => !open)}
            >
              {mobileOpen ? <X /> : <Menu />}
            </Button>
            <span className="font-display text-lg text-[var(--accent)]">Bourbon</span>
          </header>

          <main className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-6 md:px-8 md:py-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
