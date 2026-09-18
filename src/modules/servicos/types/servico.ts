export type Servico = {
  id: number
  id_empresa: number
  nome: string
  duracao_minutos: number
  preco: string | number | null
  status: 'a' | 'i' | string
  created_at?: string
  updated_at?: string
}

export type ServicoPayload = {
  nome: string
  duracao_minutos?: number
  preco?: number | null
  status?: string
}
