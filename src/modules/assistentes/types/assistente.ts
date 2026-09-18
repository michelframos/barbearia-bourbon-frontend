export type VinculoBarbeiroDia = {
  id_barbeiro: number
  dia_semana: number
}

export type Assistente = {
  id: number
  id_empresa: number
  nome: string
  telefone: string | null
  turno: string | null
  ordem_sequencial?: number | null
  hora_checkin?: string | null
  status_operacional: 'livre' | 'exclusiva' | 'offline' | string
  status: 'a' | 'i' | string
  vinculos_barbeiro_dia?: VinculoBarbeiroDia[]
  created_at?: string
  updated_at?: string
}

export type AssistentePayload = {
  nome: string
  telefone?: string | null
  turno?: string | null
  ordem_sequencial?: number | null
  hora_checkin?: string | null
  status_operacional?: string
  status?: string
  vinculos_barbeiro_dia?: VinculoBarbeiroDia[]
}
