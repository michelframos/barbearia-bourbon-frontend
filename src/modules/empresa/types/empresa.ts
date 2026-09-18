export type ModoSelecaoAssistente = 'manual' | 'automatico_sequencial'
export type FonteOrdemAssistente = 'manual' | 'checkin'
export type ResetCursorAssistente = 'meia_noite' | 'primeiro_checkin_dia'
export type MomentoAtribuicaoAssistente = 'iniciar_atendimento' | 'checkin_cliente'

export type Empresa = {
  id: number
  nome: string
  telefone: string | null
  endereco: string | null
  horario_abertura: string | null
  horario_fechamento: string | null
  intervalo_agenda_minutos: number
  painel_tv_auto_refresh: boolean
  painel_tv_intervalo_segundos: number
  notificacoes_ativas: boolean
  som_alerta_ativo: boolean
  modo_selecao_assistente: ModoSelecaoAssistente
  max_atendimentos_simultaneos_assistente: number
  ultima_assistente_sequencial_id: number | null
  fonte_ordem_assistente: FonteOrdemAssistente
  reset_cursor_assistente: ResetCursorAssistente
  momento_atribuicao_assistente: MomentoAtribuicaoAssistente
  cursor_sequencial_data: string | null
  status: string
}

export type EmpresaConfigPayload = {
  nome?: string
  telefone?: string | null
  endereco?: string | null
  horario_abertura?: string
  horario_fechamento?: string
  intervalo_agenda_minutos?: number
  painel_tv_auto_refresh?: boolean
  painel_tv_intervalo_segundos?: number
  notificacoes_ativas?: boolean
  som_alerta_ativo?: boolean
  modo_selecao_assistente?: ModoSelecaoAssistente
  max_atendimentos_simultaneos_assistente?: number
  fonte_ordem_assistente?: FonteOrdemAssistente
  reset_cursor_assistente?: ResetCursorAssistente
  momento_atribuicao_assistente?: MomentoAtribuicaoAssistente
}

export type ConfigOperacional = {
  modo_selecao_assistente: ModoSelecaoAssistente
  max_atendimentos_simultaneos_assistente: number
  fonte_ordem_assistente: FonteOrdemAssistente
  reset_cursor_assistente: ResetCursorAssistente
  momento_atribuicao_assistente: MomentoAtribuicaoAssistente
}
