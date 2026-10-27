/**
 * El recordatorio de Google.
 *
 * Cambiar el horario aquí lo cambia en la web al instante, pero no en la ficha de Google, que es
 * por donde llega la mitad de la gente: alguien busca el restaurante, Google dice «abierto» y se
 * planta en la puerta un día de cierre. Google no deja escribir el horario sin pedirle acceso a su
 * API (un trámite aparte), así que lo que se puede hacer es que no se olvide: en cuanto cambia el
 * horario sale un aviso con el enlace a la ficha, y si se deja para luego el recordatorio se queda
 * ahí —guardado en el teléfono— hasta que se dice que está hecho.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Settings } from '../shared/types'
import { dayRanges, madridNow } from '../shared/hours'

const KEY = 'mexiandco:google-horario'

/** El panel general de Google Business, cuando el restaurante no ha puesto el de su ficha. */
export const GOOGLE_BUSINESS_URL = 'https://business.google.com/'

export type GooglePending = { since: number; what: string[] }

/**
 * Lo que Google tiene que saber: el horario semanal, los turnos y los cierres de hoy en adelante.
 * Los cierres que ya pasaron no cuentan —quitarlos de la lista no cambia nada en Google— y el
 * resto de los ajustes (teléfono, fotos, la carta) tampoco: eso no vive en el horario de la ficha.
 */
const fingerprint = (settings: Settings) => {
  const today = madridNow().date
  return JSON.stringify({
    hours: settings.hours.map((day) => dayRanges(day).map((range) => `${range.from}-${range.to}`).join('|') || 'x'),
    services: settings.services,
    closedDates: settings.closedDates.filter((date) => date >= today),
  })
}

/** Qué ha cambiado, para decirlo en el aviso en vez de un «algo del horario». */
function changes(before: Settings, after: Settings): string[] {
  const today = madridNow().date
  const list: string[] = []
  const week = (settings: Settings) =>
    settings.hours.map((day) => dayRanges(day).map((range) => `${range.from}-${range.to}`).join('|') || 'x').join('//')
  if (week(before) !== week(after)) list.push('el horario semanal')
  if (JSON.stringify(before.services) !== JSON.stringify(after.services)) list.push('los turnos')
  const closed = (settings: Settings) => settings.closedDates.filter((date) => date >= today).join('|')
  if (closed(before) !== closed(after)) list.push('los días de cierre')
  return list
}

const read = (): GooglePending | null => {
  try {
    const raw = localStorage.getItem(KEY)
    const data = raw ? (JSON.parse(raw) as Partial<GooglePending>) : null
    if (!data || typeof data.since !== 'number') return null
    return { since: data.since, what: Array.isArray(data.what) ? data.what.filter((entry): entry is string => typeof entry === 'string') : [] }
  } catch {
    return null
  }
}

const write = (pending: GooglePending | null) => {
  try {
    if (pending) localStorage.setItem(KEY, JSON.stringify(pending))
    else localStorage.removeItem(KEY)
  } catch {
    /* sin almacenamiento el recordatorio dura lo que la pestaña */
  }
}

type Options = { settings: Settings; ready: boolean }

export function useGoogleHours({ settings, ready }: Options) {
  const [pending, setPending] = useState<GooglePending | null>(() => read())
  /** El aviso se enseña una vez por cambio; el recordatorio se queda hasta que se dice que sí. */
  const [asking, setAsking] = useState(false)
  /**
   * La foto del horario con la que se compara. Se toma cuando la carta ya es la buena: antes, lo
   * que cambia es la copia del teléfono sustituida por la del servidor, y eso no es un cambio.
   */
  const seen = useRef<string | null>(null)
  const previous = useRef<Settings>(settings)

  useEffect(() => {
    if (!ready) return
    const print = fingerprint(settings)
    if (seen.current === null) {
      seen.current = print
      previous.current = settings
      return
    }
    if (seen.current === print) {
      previous.current = settings
      return
    }
    const what = changes(previous.current, settings)
    seen.current = print
    previous.current = settings
    if (!what.length) return
    const next = { since: Date.now(), what }
    setPending(next)
    write(next)
    setAsking(true)
  }, [settings, ready])

  const done = useCallback(() => {
    setPending(null)
    write(null)
    setAsking(false)
  }, [])

  const later = useCallback(() => setAsking(false), [])
  const ask = useCallback(() => setAsking(true), [])

  return { pending, asking, done, later, ask }
}
