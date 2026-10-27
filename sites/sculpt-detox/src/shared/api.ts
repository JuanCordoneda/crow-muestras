/**
 * Cliente de la API del servidor (`server/api.js`). En desarrollo Vite hace de proxy hacia el
 * backend; en producción es el mismo origen.
 *
 * | Ruta                          | Quién   | Qué hace                                                   |
 * | ----------------------------- | ------- | ---------------------------------------------------------- |
 * | GET    /api/menu              | público | Carta, horario y datos. Sin los platos ocultos.            |
 * | PUT    /api/menu              | panel   | Guarda la carta entera. Devuelve la carta guardada.        |
 * | POST   /api/reservations      | público | Solicitud de reserva. 201 con la reserva; 422 si no vale.  |
 * | GET    /api/reservations      | panel   | Reservas entre `?from=` y `?to=` (YYYY-MM-DD, incluidos).  |
 * | PUT    /api/reservations/:id  | panel   | Crea o actualiza una reserva (las del teléfono, estados).  |
 * | DELETE /api/reservations/:id  | panel   | Borra una reserva.                                         |
 * | GET/POST /api/session         | panel   | ¿Hace falta contraseña? / Comprueba una contraseña.        |
 * | POST   /api/media             | panel   | Sube una foto (cuerpo binario, cabecera `x-filename`).     |
 * | POST   /api/translate         | panel   | Traduce textos del castellano al inglés, alemán y francés. |
 */
import { normalizeMenu, normalizeReservation } from './store'
import type { Menu, Reservation } from './types'

const BASE = '/api'
const TOKEN_KEY = 'sculptdetox:admin-token'

/** Error de la API con el código HTTP y el motivo que da el servidor (`{ error, field? }`). */
export class ApiError extends Error {
  status: number
  code: string
  field: string
  constructor(status: number, code: string, message: string, field = '') {
    super(message)
    this.status = status
    this.code = code
    this.field = field
  }
}

/**
 * La contraseña del panel se guarda en este navegador para no tener que escribirla en cada
 * visita, y viaja en una cabecera propia: en la URL acabaría en el historial y en los registros.
 */
export const adminToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? ''
  } catch {
    return ''
  }
}

export const setAdminToken = (token: string) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* sin almacenamiento la sesión dura lo que la pestaña */
  }
}

const headers = (admin: boolean): Record<string, string> => {
  const result: Record<string, string> = { 'content-type': 'application/json' }
  const token = admin ? adminToken() : ''
  if (token) result['x-admin-token'] = token
  return result
}

async function request<T>(path: string, init: RequestInit & { admin?: boolean } = {}): Promise<T> {
  const { admin = false, ...rest } = init
  const response = await fetch(`${BASE}${path}`, { ...rest, headers: { ...headers(admin), ...(rest.headers as Record<string, string> | undefined) } })
  const body = await response.text()
  let data: unknown = null
  try {
    data = body ? JSON.parse(body) : null
  } catch {
    data = null
  }
  if (!response.ok) {
    const info = (data && typeof data === 'object' ? data : {}) as { error?: string; message?: string; field?: string }
    throw new ApiError(response.status, info.error ?? String(response.status), info.message ?? info.error ?? response.statusText, info.field ?? '')
  }
  return data as T
}

/* ---------- sesión del panel ---------- */

export type Session = { required: boolean; ok: boolean }

export const checkSession = () => request<Session>('/session', { admin: true })

/** Valida una contraseña contra el servidor y, si es buena, la deja guardada. */
export async function signIn(password: string): Promise<boolean> {
  try {
    await request('/session', { method: 'POST', body: JSON.stringify({ password }) })
    setAdminToken(password)
    return true
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return false
    throw error
  }
}

export const signOut = () => setAdminToken('')

/* ---------- carta ---------- */

declare global {
  interface Window {
    /** Petición de la carta que lanza index.html antes de que baje la app. */
    __menu?: Promise<unknown>
  }
}

let primed: Menu | null = null
/** La carta del servidor, si ya había contestado antes de pintar la web por primera vez. */
export const primedMenu = () => primed

/**
 * Espera a la petición de index.html, como mucho `timeout` ms. Sin ella, en la primera visita se
 * pintaría la carta empaquetada y la del servidor la reemplazaría un instante después.
 */
export function primeMenu(timeout: number): Promise<void> {
  const pending = window.__menu
  if (!pending) return Promise.resolve()
  return Promise.race([
    pending.then((data) => { if (data) primed = normalizeMenu(data) }),
    new Promise<void>((resolve) => window.setTimeout(resolve, timeout)),
  ]).catch(() => {})
}

/**
 * Carta publicada. Reaprovecha la petición de index.html y, si falló, pide otra.
 *
 * Va sin la contraseña del panel a propósito: en el móvil del encargado, que sí la tiene guardada,
 * la web pública enseñaría los platos ocultos y las secciones apagadas.
 */
export async function fetchMenu(): Promise<Menu | null> {
  if (primed) return primed
  const pending = window.__menu
  window.__menu = undefined
  const early = pending ? await pending.catch(() => null) : null
  if (early) return normalizeMenu(early)
  const data = await request<unknown>('/menu')
  return data ? normalizeMenu(data) : null
}

/** Carta completa para el panel, con los platos ocultos. */
export async function fetchAdminMenu(): Promise<Menu | null> {
  const data = await request<unknown>('/menu', { admin: true })
  return data ? normalizeMenu(data) : null
}

export async function pushMenu(menu: Menu): Promise<Menu> {
  return normalizeMenu(await request<unknown>('/menu', { method: 'PUT', admin: true, body: JSON.stringify(menu) }))
}

/** Traduce textos en castellano al inglés, alemán y francés (en el mismo orden). */
export async function translateTexts(texts: string[]): Promise<Record<'en' | 'de' | 'fr', string>[]> {
  const data = await request<{ translations: Record<'en' | 'de' | 'fr', string>[] }>('/translate', { method: 'POST', admin: true, body: JSON.stringify({ texts }) })
  return data.translations
}

/* ---------- reservas ---------- */

/**
 * Solo las del panel: las reservas de los clientes las toma Restoo, fuera de esta web, así que
 * aquí no hay ni huecos libres ni alta desde la web (el servidor sigue aceptando `POST`).
 */
export async function fetchReservations(from: string, to: string): Promise<Reservation[]> {
  const data = await request<unknown[]>(`/reservations?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`, { admin: true })
  return (Array.isArray(data) ? data : []).map(normalizeReservation)
}

export async function saveReservation(reservation: Reservation): Promise<Reservation> {
  return normalizeReservation(
    await request<unknown>(`/reservations/${encodeURIComponent(reservation.id)}`, { method: 'PUT', admin: true, body: JSON.stringify(reservation) }),
  )
}

export async function deleteReservation(id: string): Promise<void> {
  await request(`/reservations/${encodeURIComponent(id)}`, { method: 'DELETE', admin: true })
}

/* ---------- fotos ---------- */

export type Media = { id: string; src: string; name: string; width: number; height: number; bytes: number; sizes: number[]; createdAt: number }

/** Sube una foto al almacén y devuelve su ficha. Va en crudo, no en JSON: en base64 pesaría un tercio más. */
export async function uploadPhoto(file: File): Promise<Media> {
  const upload: Record<string, string> = {
    'content-type': file.type || 'application/octet-stream',
    'x-filename': encodeURIComponent(file.name),
  }
  const token = adminToken()
  if (token) upload['x-admin-token'] = token
  const response = await fetch(`${BASE}/media`, { method: 'POST', headers: upload, body: file })
  const body = await response.text()
  const data = body ? JSON.parse(body) : null
  if (!response.ok) throw new ApiError(response.status, data?.error || 'upload', data?.message || data?.error || `No se pudo subir ${file.name}`)
  return data as Media
}
