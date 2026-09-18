import type { LucideIcon } from 'lucide-react'
import {
  CalendarDays,
  ClipboardList,
  History,
  LayoutDashboard,
  ListChecks,
  MonitorPlay,
  Scissors,
  Settings,
  UserRound,
  Users,
} from 'lucide-react'

export type NavItem = {
  label: string
  to: string
  icon: LucideIcon
}

/** Navegação principal (9 áreas do Figma + Serviços como cadastro mestre) */
export const mainNavItems: NavItem[] = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'Assistentes', to: '/assistentes', icon: Users },
  { label: 'Serviços', to: '/servicos', icon: ListChecks },
  { label: 'Painel', to: '/painel', icon: ClipboardList },
  { label: 'Agenda', to: '/agenda', icon: CalendarDays },
  { label: 'Clientes', to: '/clientes', icon: UserRound },
  { label: 'Histórico', to: '/historico', icon: History },
  { label: 'Barbeiros', to: '/barbeiros', icon: Scissors },
  { label: 'Painel TV', to: '/painel-tv', icon: MonitorPlay },
  { label: 'Configurações', to: '/configuracoes', icon: Settings },
]
