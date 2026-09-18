import { LogOut } from 'lucide-react'
import { NavLink } from 'react-router-dom'

import { useAuth } from '@/modules/auth/hooks/useAuth'
import { mainNavItems } from '@/shared/layout/nav'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/lib/utils'

type SidebarProps = {
  onNavigate?: () => void
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const { user, logout } = useAuth()

  return (
    <aside className="flex h-full w-64 flex-col border-r border-[var(--border)] bg-[var(--sidebar)]">
      <div className="border-b border-[var(--border)] px-5 py-6">
        <p className="font-display text-2xl leading-none tracking-wide text-[var(--accent)]">
          Bourbon
        </p>
        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-[var(--foreground-muted)]">
          Barbearia
        </p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Principal">
        {mainNavItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                  isActive
                    ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                    : 'text-[var(--foreground-muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--foreground)]',
                )
              }
            >
              <Icon className="size-4 shrink-0 opacity-80 group-hover:opacity-100" />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="space-y-3 border-t border-[var(--border)] px-4 py-4">
        {user ? (
          <div className="px-1">
            <p className="truncate text-sm text-[var(--foreground)]">{user.name}</p>
            <p className="truncate text-xs text-[var(--foreground-muted)]">{user.email}</p>
          </div>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full justify-start"
          onClick={() => {
            void logout()
          }}
        >
          <LogOut />
          Sair
        </Button>
      </div>
    </aside>
  )
}
