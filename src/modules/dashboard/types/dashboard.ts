export type DashboardRef = {
  id: number
  nome: string
  duracao_minutos?: number
  foto_url?: string | null
  status_operacional?: string
}

export type DashboardKpis = {
  trabalhando: number
  aguardando: number
  em_atendimento: number
  livres: number
  concluidos: number
  agendamentos_hoje: number
}

export type DashboardAgendamento = {
  id: number
  hora: string | null
  status_agenda: string
  observacoes: string | null
  cliente?: DashboardRef | null
  assistente?: DashboardRef | null
  barbeiro?: DashboardRef | null
  servico?: DashboardRef | null
}

export type DashboardAssistente = {
  id: number
  nome: string
  turno: string | null
  status_operacional: string
  ocupados: number
  capacidade: number
}

export type DashboardGraficoHora = {
  hora: string
  agendamentos: number
  concluidos: number
  em_andamento: number
}

export type DashboardSnapshot = {
  data: string
  kpis: DashboardKpis
  agenda: DashboardAgendamento[]
  assistentes: DashboardAssistente[]
  barbeiros: DashboardRef[]
  grafico_horas: DashboardGraficoHora[]
}
