// Client for the INT-Hub Auth endpoints.
// Docs: <API_PROXY_TARGET>/swagger-ui/index.html (see docs/API.md)

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''
const STORAGE_KEY = 'pasti.session'

/** JwtResponse */
export interface Session {
  accessToken: string
  refreshToken: string
  email: string
}

/** FieldViolation */
export interface FieldViolation {
  field: string
  message: string
}

/** ApiErrorResponse */
interface ApiErrorBody {
  timestamp?: string
  status?: number
  error?: string
  message?: string
  path?: string
  fieldErrors?: FieldViolation[]
}

export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: FieldViolation[]
  /** Parsed error body, for endpoints whose 4xx body is not ApiErrorResponse. */
  readonly body: unknown

  constructor(status: number, message: string, fieldErrors: FieldViolation[] = [], body?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
    this.body = body
  }
}

const NETWORK_ERROR = 'Tidak dapat terhubung ke server. Periksa koneksi Anda.'

/** Fired when the refresh token is rejected and the user must log in again. */
export const SESSION_EXPIRED_EVENT = 'pasti:session-expired'

/** Turns a Response into its body, or throws ApiError for non-2xx. */
export async function parseResponse<T>(res: Response): Promise<T> {
  if (res.ok) {
    if (res.status === 204) return undefined as T
    const type = res.headers.get('content-type') ?? ''
    return (type.includes('json') ? res.json() : res.text()) as Promise<T>
  }

  // Errors are usually ApiErrorResponse JSON, but some (e.g. pasti-test 502) are plain text.
  const text = await res.text().catch(() => '')
  let body: ApiErrorBody & Record<string, unknown> = {}
  try {
    body = JSON.parse(text)
  } catch {
    body = { message: text.trim() }
  }
  throw new ApiError(res.status, body.message || res.statusText || 'Terjadi kesalahan', body.fieldErrors, body)
}

async function request<T>(path: string, init: RequestInit): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, init)
  } catch {
    throw new ApiError(0, NETWORK_ERROR)
  }
  return parseResponse<T>(res)
}

function postJson<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// "Tetap masuk" keeps the session in localStorage; otherwise it lives only
// for the browser tab in sessionStorage.
export function getSession(): Session | null {
  const raw = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as Session
  } catch {
    return null
  }
}

function saveSession(session: Session, remember: boolean) {
  clearSession()
  ;(remember ? localStorage : sessionStorage).setItem(STORAGE_KEY, JSON.stringify(session))
}

function isRemembered() {
  return localStorage.getItem(STORAGE_KEY) !== null
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY)
  sessionStorage.removeItem(STORAGE_KEY)
}

/** POST /int/v1/auth/login — 401 wrong credentials, 403 user blocked. */
export async function login(email: string, password: string, remember: boolean): Promise<Session> {
  const session = await postJson<Session>('/int/v1/auth/login', { email, password })
  saveSession(session, remember)
  return session
}

/** POST /int/v1/auth/refresh — rotates both tokens. */
export async function refresh(): Promise<Session> {
  const current = getSession()
  if (!current) throw new ApiError(401, 'Sesi berakhir. Silakan masuk kembali.')
  try {
    const next = await postJson<Session>('/int/v1/auth/refresh', { refreshToken: current.refreshToken })
    saveSession(next, isRemembered())
    return next
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      clearSession()
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
    }
    throw err
  }
}

/** POST /int/v1/auth/logout — the local session is cleared even if the call fails. */
export async function logout(): Promise<void> {
  const current = getSession()
  clearSession()
  if (!current) return
  try {
    await postJson<void>('/int/v1/auth/logout', { refreshToken: current.refreshToken })
  } catch {
    // Token already gone server-side (404) or network error: nothing left to do.
  }
}

/** GET /int/v1/auth/test — public connectivity check. */
export async function checkConnection(): Promise<boolean> {
  try {
    await request<string>('/int/v1/auth/test', { method: 'GET' })
    return true
  } catch {
    return false
  }
}

/**
 * fetch() for protected endpoints: attaches the bearer token and, on a 401,
 * refreshes once and retries.
 */
let refreshing: Promise<Session> | null = null

export async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const send = async (token?: string) => {
    const headers = new Headers(init.headers)
    if (token) headers.set('Authorization', `Bearer ${token}`)
    try {
      return await fetch(`${BASE_URL}${path}`, { ...init, headers })
    } catch {
      throw new ApiError(0, NETWORK_ERROR)
    }
  }

  const res = await send(getSession()?.accessToken)
  if (res.status !== 401 || !getSession()) return res

  refreshing ??= refresh().finally(() => {
    refreshing = null
  })
  const next = await refreshing
  return send(next.accessToken)
}

/** authFetch + parseResponse for protected JSON endpoints. */
export async function apiJson<T>(path: string, method: 'GET' | 'POST' = 'GET', body?: unknown): Promise<T> {
  const init: RequestInit = { method }
  if (body !== undefined) {
    init.headers = { 'Content-Type': 'application/json' }
    init.body = JSON.stringify(body)
  }
  return parseResponse<T>(await authFetch(path, init))
}

/** Reads the `exp` claim of the access token, if present. */
export function tokenExpiry(accessToken: string): Date | null {
  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return typeof payload.exp === 'number' ? new Date(payload.exp * 1000) : null
  } catch {
    return null
  }
}

/** Maps API errors to copy shown on the login form. */
export function loginErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.status === 401) return 'Email atau kata sandi salah.'
    if (err.status === 403) return 'Akun Anda diblokir. Hubungi administrator.'
    return err.message
  }
  return 'Terjadi kesalahan. Silakan coba lagi.'
}
