/**
 * Libro de reservas del panel: de hoy a dos meses vista, al día cada 30 s mientras el panel
 * está a la vista y en cuanto se vuelve a él.
 *
 * Los cambios de estado se pintan antes de que conteste el servidor (en plena cena no se puede
 * esperar a la red para marcar una mesa como sentada). Mientras viajan, una recarga que llegue
 * con el dato viejo no los deshace: se guardan como «pendientes de confirmar» encima de la lista.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Reservation } from '../shared/types'
import { ApiError, deleteReservation, fetchReservations, saveReservation } from '../shared/api'
import { addDays, madridNow } from '../shared/hours'
import { normalizeReservation } from '../shared/store'
import { isOffline, isUnauthorized, withTimeout } from './helpers'

export const RANGE_DAYS = 60
const REFRESH = 30_000
/** Volver a la pestaña y recibir el foco llegan casi a la vez: con una petición basta. */
const THROTTLE = 4000
const TIMEOUT = 12_000
/**
 * Las reservas se guardan también en el teléfono para poder consultar el libro sin cobertura.
 * Son datos personales: se borran al cerrar sesión.
 */
const CACHE_KEY = 'parisabor:admin-reservations'

type Cache = { at: number; items: Reservation[] }

function readCache(): Cache {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    const data = raw ? (JSON.parse(raw) as Partial<Cache>) : null
    if (data && Array.isArray(data.items)) return { at: Number(data.at) || 0, items: data.items.map(normalizeReservation).filter((entry) => entry.id) }
  } catch {
    /* copia ilegible: se espera al servidor */
  }
  return { at: 0, items: [] }
}

function writeCache(items: Reservation[]) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), items }))
  } catch {
    /* sin almacenamiento no hay consulta sin conexión, nada más */
  }
}

export function clearReservationCache() {
  try {
    localStorage.removeItem(CACHE_KEY)
  } catch {
    /* nada que borrar */
  }
}

/** Cambio local todavía sin confirmar por el servidor. `null` = borrada. */
type Override = { value: Reservation | null }

type Options = {
  enabled: boolean
  onUnauthorized: () => void
  /** Reserva web nueva que no estaba en la carga anterior. */
  onArrival: (reservation: Reservation) => void
}

const upsert = (list: Reservation[], reservation: Reservation) =>
  list.some((entry) => entry.id === reservation.id)
    ? list.map((entry) => (entry.id === reservation.id ? reservation : entry))
    : [...list, reservation]

export function useReservations({ enabled, onUnauthorized, onArrival }: Options) {
  const [boot] = useState(readCache)
  const [items, setItems] = useState<Reservation[]>(boot.items)
  const [loadedAt, setLoadedAt] = useState<number | null>(boot.at || null)
  /** El servidor ha contestado al menos una vez en esta sesión. */
  const [loaded, setLoaded] = useState(false)
  const [offline, setOffline] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  /** Ids ya vistos: `null` hasta la primera carga, para no avisar de todo lo que había al abrir. */
  const known = useRef<Set<string> | null>(null)
  const overrides = useRef(new Map<string, Override>())
  /** Días sueltos fuera del rango (una fecha pasada consultada a mano). */
  const extraDays = useRef<string[]>([])
  const busy = useRef(false)
  const again = useRef(false)
  const lastRun = useRef(0)
  const live = useRef(enabled)
  live.current = enabled
  const callbacks = useRef({ onUnauthorized, onArrival })
  callbacks.current = { onUnauthorized, onArrival }

  const withOverrides = (list: Reservation[]) => {
    if (!overrides.current.size) return list
    const byId = new Map(list.map((entry) => [entry.id, entry]))
    overrides.current.forEach((override, id) => {
      if (override.value) byId.set(id, override.value)
      else byId.delete(id)
    })
    return [...byId.values()]
  }

  const handleError = (error: unknown) => {
    if (isUnauthorized(error)) callbacks.current.onUnauthorized()
    else if (isOffline(error)) setOffline(true)
  }

  const refresh = useCallback(async (force = false) => {
    if (!live.current) return
    if (busy.current) {
      if (force) again.current = true
      return
    }
    if (!force && Date.now() - lastRun.current < THROTTLE) return
    busy.current = true
    lastRun.current = Date.now()
    setRefreshing(true)
    const today = madridNow().date
    const from = today
    const to = addDays(today, RANGE_DAYS)
    try {
      const outside = extraDays.current.filter((date) => date < from || date > to)
      const [main, ...others] = await withTimeout(
        Promise.all([fetchReservations(from, to), ...outside.map((date) => fetchReservations(date, date))]),
        TIMEOUT,
      )
      const fresh = [...main, ...others.flat()]
      if (known.current) {
        const seen = known.current
        main
          .filter((entry) => !seen.has(entry.id) && entry.status === 'pendiente' && entry.source === 'web')
          .slice(0, 3)
          .forEach((entry) => callbacks.current.onArrival(entry))
      }
      known.current = new Set([...(known.current ?? []), ...fresh.map((entry) => entry.id)])
      setItems(withOverrides(fresh))
      writeCache(main)
      setLoadedAt(Date.now())
      setLoaded(true)
      setOffline(false)
    } catch (error) {
      handleError(error)
    } finally {
      busy.current = false
      setRefreshing(false)
      if (again.current) {
        again.current = false
        void refresh(true)
      }
    }
  }, [])

  useEffect(() => {
    if (!enabled) return
    void refresh(true)
    const tick = () => { if (document.visibilityState === 'visible') void refresh() }
    const timer = window.setInterval(tick, REFRESH)
    document.addEventListener('visibilitychange', tick)
    window.addEventListener('focus', tick)
    window.addEventListener('online', tick)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', tick)
      window.removeEventListener('focus', tick)
      window.removeEventListener('online', tick)
    }
  }, [enabled, refresh])

  /** Trae un día fuera del rango cargado (el selector de fecha permite ir al pasado o más allá de 60 días). */
  const loadDay = useCallback((date: string) => {
    const today = madridNow().date
    if (date >= today && date <= addDays(today, RANGE_DAYS)) return
    if (extraDays.current.includes(date)) return
    // Pocos días sueltos: cada uno es una petición más en cada recarga.
    extraDays.current = [...extraDays.current.slice(-2), date]
    void refresh(true)
  }, [refresh])

  /**
   * Guarda una reserva nueva o cambiada. Se pinta al instante y, si el servidor la rechaza,
   * vuelve a como estaba (salvo que otro cambio posterior ya la haya reemplazado).
   */
  const save = useCallback(async (next: Reservation, previous: Reservation | null): Promise<Reservation> => {
    const stamped: Reservation = { ...next, updatedAt: Date.now() }
    const override: Override = { value: stamped }
    overrides.current.set(stamped.id, override)
    known.current?.add(stamped.id)
    setItems((list) => upsert(list, stamped))
    try {
      const saved = await withTimeout(saveReservation(stamped), TIMEOUT)
      if (overrides.current.get(stamped.id) === override) {
        overrides.current.delete(stamped.id)
        setItems((list) => upsert(list, saved))
      }
      setOffline(false)
      return saved
    } catch (error) {
      if (overrides.current.get(stamped.id) === override) {
        overrides.current.delete(stamped.id)
        setItems((list) => (previous ? upsert(list, previous) : list.filter((entry) => entry.id !== stamped.id)))
      }
      handleError(error)
      throw error
    }
  }, [])

  const remove = useCallback(async (reservation: Reservation) => {
    const override: Override = { value: null }
    overrides.current.set(reservation.id, override)
    setItems((list) => list.filter((entry) => entry.id !== reservation.id))
    try {
      await withTimeout(deleteReservation(reservation.id), TIMEOUT).catch((error) => {
        // Ya la había borrado otro teléfono: el resultado es el que se buscaba.
        if (!(error instanceof ApiError && error.status === 404)) throw error
      })
      if (overrides.current.get(reservation.id) === override) overrides.current.delete(reservation.id)
      setOffline(false)
    } catch (error) {
      if (overrides.current.get(reservation.id) === override) {
        overrides.current.delete(reservation.id)
        setItems((list) => upsert(list, reservation))
      }
      handleError(error)
      throw error
    }
  }, [])

  return { items, loaded, loadedAt, offline, refreshing, refresh, loadDay, save, remove }
}

export type ReservationsApi = ReturnType<typeof useReservations>
