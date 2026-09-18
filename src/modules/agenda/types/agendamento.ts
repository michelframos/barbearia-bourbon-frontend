export type AgendamentoRef = {
  id: number
  nome: string
  telefone?: string | null
  duracao_minutos?: number
  preco?: string | number | null
}

export type StatusAgenda =
  | 'agendado'
  | 'confirmado'
  | 'em_atendimento'
  | 'concluido'
  | 'cancelado'
  | 'nao_compareceu'
  | string

export type Agendamento = {
  id: number
  id_empresa: number
  data: string
  hora: string
  id_cliente: number
  id_assistente: number | null
  id_barbeiro: number | null
  id_servico: number
  observacoes: string | null
  status_agenda: StatusAgenda
  status: 'a' | 'i' | string
  cliente?: AgendamentoRef | null
  assistente?: AgendamentoRef | null
  barbeiro?: AgendamentoRef | null
  servico?: AgendamentoRef | null
  created_at?: string
  updated_at?: string
}

export type AgendamentoPayload = {
  data: string
  hora: string
  id_cliente: number
  id_assistente?: number | null
  id_barbeiro?: number | null
  id_servico: number
  observacoes?: string | null
  status_agenda?: StatusAgenda
}

export type AgendaSlot = {
  hora: string
  disponivel: boolean
  agendamento: Agendamento | null
  agendamentos: Agendamento[]
}

export type AgendaGrade = {
  meta: {
    data: string
    horario_abertura: string
    horario_fechamento: string
    intervalo_agenda_minutos: number
    id_barbeiro: number | null
  }
  slots: AgendaSlot[]
}
