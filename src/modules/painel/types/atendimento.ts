export type PainelRef = {
  id: number
  nome: string
  telefone?: string | null
  duracao_minutos?: number
  status_operacional?: string
  foto_url?: string | null
}

export type StatusAtendimento =
  | 'aguardando'
  | 'chamado'
  | 'em_atendimento'
  | 'concluido'
  | 'cancelado'
  | string

export type Atendimento = {
  id: number
  id_empresa: number
  id_agendamento: number | null
  id_cliente: number
  id_assistente: number | null
  id_barbeiro: number | null
  id_servico: number
  posicao_fila: number | null
  data: string
  hora_chegada: string | null
  hora_inicio: string | null
  hora_fim: string | null
  status_atendimento: StatusAtendimento
  observacoes: string | null
  cliente?: PainelRef | null
  assistente?: PainelRef | null
  barbeiro?: PainelRef | null
  servico?: PainelRef | null
}

export type CheckInPayload = {
  data?: string
  hora_chegada?: string
  id_cliente: number
  id_assistente?: number | null
  id_servico: number
  id_barbeiro?: number | null
  id_agendamento?: number | null
  posicao_fila?: number | null
  observacoes?: string | null
}

export type ConfigOperacional = {
  modo_selecao_assistente: 'manual' | 'automatico_sequencial'
  max_atendimentos_simultaneos_assistente: number
  fonte_ordem_assistente?: 'manual' | 'checkin'
  reset_cursor_assistente?: 'meia_noite' | 'primeiro_checkin_dia'
  momento_atribuicao_assistente?: 'iniciar_atendimento' | 'checkin_cliente'
}

export type PainelSlot = {
  posicao: number
  atendimento: Atendimento | null
}

export type PainelAssistenteColuna = {
  id: number
  nome: string
  turno?: string | null
  status_operacional: string
  capacidade: number
  ocupados: number
  slots: PainelSlot[]
}

export type PainelSnapshot = {
  data: string
  config_operacional?: ConfigOperacional
  resumo: {
    total: number
    aguardando: number
    chamados: number
    em_atendimento: number
    concluidos: number
    cancelados: number
  }
  assistentes: PainelAssistenteColuna[]
  barbeiros: PainelRef[]
  atendimentos: Atendimento[]
  finalizados: Atendimento[]
}
