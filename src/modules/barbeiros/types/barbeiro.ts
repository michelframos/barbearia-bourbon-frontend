export type BarbeiroServico = {
  id: number
  nome: string
  duracao_minutos?: number
  preco?: string | number | null
  status?: string
}

export type BarbeiroAtendimentoAtual = {
  id: number
  hora_inicio: string | null
  cliente?: { id: number; nome: string } | null
  servico?: { id: number; nome: string } | null
}

export type Barbeiro = {
  id: number
  id_empresa: number
  nome: string
  telefone: string | null
  foto?: string | null
  foto_url?: string | null
  status_operacional: 'disponivel' | 'em_atendimento' | 'offline' | 'aguardando' | string
  hora_entrada: string | null
  atendimento_atual?: BarbeiroAtendimentoAtual | null
  status: 'a' | 'i' | string
  servicos?: BarbeiroServico[]
  servico_ids?: number[]
  created_at?: string
  updated_at?: string
}

export type BarbeiroPayload = {
  nome: string
  telefone?: string | null
  status_operacional?: string
  hora_entrada?: string | null
  status?: string
  servico_ids?: number[]
}
