import { tokenStorage } from '@/shared/api/tokenStorage'

const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

export class ApiError extends Error {
  readonly status: number
  readonly errors?: Record<string, string[]>

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown
  auth?: boolean
}

export async function httpClient<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, auth = true, headers: customHeaders, ...rest } = options

  const headers = new Headers(customHeaders)
  headers.set('Accept', 'application/json')

  let requestBody: BodyInit | undefined

  if (body instanceof FormData) {
    requestBody = body
  } else if (body !== undefined) {
    headers.set('Content-Type', 'application/json')
    requestBody = JSON.stringify(body)
  }

  if (auth) {
    const token = tokenStorage.get()
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers,
    body: requestBody,
  })

  if (response.status === 204) {
    return undefined as T
  }

  const payload = await response.json().catch(() => ({}))

  if (!response.ok) {
    if (response.status === 401 && auth) {
      tokenStorage.clear()
    }

    const message =
      typeof payload.message === 'string'
        ? payload.message
        : 'Não foi possível concluir a requisição.'

    throw new ApiError(message, response.status, payload.errors)
  }

  return payload as T
}
