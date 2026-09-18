export type AuthUser = {
  id: number
  id_empresa: number
  name: string
  email: string
  perfil: string
  id_assistente: number | null
  id_barbeiro: number | null
}

export type LoginPayload = {
  email: string
  password: string
  device_name?: string
}

export type LoginResponse = {
  message: string
  token: string
  token_type: string
  data: AuthUser
}

export type MeResponse = {
  data: AuthUser
}
