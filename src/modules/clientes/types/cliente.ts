export type ClienteAssistente = {
  id: number
  nome: string
}

export type Cliente = {
  id: number
  id_empresa: number
  nome: string
  telefone: string | null
  id_assistente_preferida: number | null
  assistente_preferida?: ClienteAssistente | null
  observacoes: string | null
  status: 'a' | 'i' | string
  created_at?: string
  updated_at?: string
}

export type ClientePayload = {
  nome: string
  telefone?: string | null
  id_assistente_preferida?: number | null
  observacoes?: string | null
  status?: string
}
