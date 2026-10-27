/**
 * La carta del panel y su guardado.
 *
 * Todo cambio se aplica al momento en pantalla y en este teléfono, y se manda al servidor
 * 800 ms después del último toque: marcar tres platos como agotados seguidos es una sola
 * petición. Si no hay red, los cambios esperan en el teléfono y se reintentan cada 15 s y en
 * cuanto vuelve la conexión; si se cierra la app antes, se suben al abrirla otra vez.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Menu } from '../shared/types'
import { fetchAdminMenu, pushMenu } from '../shared/api'
import { MENU_VERSION } from '../shared/data'
import { loadMenu, normalizeMenu, saveMenu } from '../shared/store'
import { isOffline, isUnauthorized, withTimeout } from './helpers'

export type SaveState = 'idle' | 'saving' | 'saved' | 'offline' | 'error'
export type MenuUpdate = Menu | ((previous: Menu) => Menu)
export type CommitMenu = (update: MenuUpdate) => void

/**
 * Copia propia del panel, aparte de la de la web (`elpuerto:menu`). La web pública guarda en su
 * clave la carta sin platos ocultos: si el panel partiera de ella y la subiera, borraría del
 * servidor los platos ocultos. Esta copia solo la escribe el panel y siempre va completa.
 */
const CACHE_KEY = 'mexiandco:admin-menu'
const DEBOUNCE = 800
const RETRY = 15_000
/**
 * Cambios pendientes más viejos que esto no se suben al abrir: un teléfono olvidado en un cajón
 * una semana no puede pisar la carta que se ha editado mientras tanto desde otro.
 */
const PENDING_TTL = 24 * 60 * 60 * 1000
const FETCH_TIMEOUT = 8000
const PUSH_TIMEOUT = 20_000

type Cache = { menu: Menu; dirty: boolean; savedAt: number }

function readCache(): Cache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw) as Partial<Cache> | null
    if (!data || typeof data !== 'object' || !data.menu) return null
    return { menu: normalizeMenu(data.menu), dirty: data.dirty === true, savedAt: Number(data.savedAt) || 0 }
  } catch {
    return null
  }
}

function writeCache(menu: Menu, dirty: boolean) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ menu, dirty, savedAt: Date.now() }))
  } catch {
    /* sin almacenamiento los cambios pendientes duran lo que la pestaña */
  }
}

type Options = { enabled: boolean; onUnauthorized: () => void }

export function useMenuSync({ enabled, onUnauthorized }: Options) {
  const [boot] = useState(() => {
    const cache = readCache()
    const pending = cache?.dirty && Date.now() - cache.savedAt < PENDING_TTL ? cache : null
    const usable = cache && (pending || cache.menu.version >= MENU_VERSION) ? cache : null
    return { menu: usable?.menu ?? loadMenu(), pending: Boolean(pending) }
  })

  const [menu, setMenu] = useState<Menu>(boot.menu)
  const [state, setState] = useState<SaveState>(boot.pending ? 'saving' : 'idle')
  /** Hay cambios que el servidor todavía no tiene. */
  const [pending, setPending] = useState(boot.pending)
  /**
   * Se puede editar. Hasta que el servidor contesta no: un cambio hecho sobre una copia vieja
   * obligaría a elegir entre perderlo o pisar la carta buena. Si el servidor no está, se abre
   * igual con la copia del teléfono, que es mejor que un panel bloqueado en pleno servicio.
   */
  const [ready, setReady] = useState(boot.pending)

  const latest = useRef(menu)
  const dirty = useRef(boot.pending)
  const revision = useRef(0)
  /** Ya se ha visto la carta del servidor en esta sesión (o se ha subido la nuestra). */
  const synced = useRef(false)
  const busy = useRef(false)
  const again = useRef(false)
  const timer = useRef(0)
  const live = useRef(enabled)
  live.current = enabled
  const unauthorized = useRef(onUnauthorized)
  unauthorized.current = onUnauthorized

  const markDirty = (value: boolean) => {
    dirty.current = value
    setPending(value)
  }

  /** Único punto de contacto con el servidor: sube lo pendiente o, si no hay nada, trae la carta. */
  const sync = useCallback(async () => {
    window.clearTimeout(timer.current)
    if (!live.current) return
    if (busy.current) {
      again.current = true
      return
    }
    if (!dirty.current && synced.current) return
    busy.current = true
    try {
      if (dirty.current) {
        const sent = revision.current
        const payload = latest.current
        setState('saving')
        await withTimeout(pushMenu(payload), PUSH_TIMEOUT)
        synced.current = true
        // Si se ha tocado algo mientras viajaba, sigue pendiente: lo sube la siguiente vuelta.
        if (revision.current === sent) {
          markDirty(false)
          writeCache(payload, false)
          setState('saved')
        }
      } else {
        const remote = await withTimeout(fetchAdminMenu(), FETCH_TIMEOUT)
        synced.current = true
        if (!dirty.current) {
          if (remote) {
            latest.current = remote
            setMenu(remote)
            saveMenu(remote)
            writeCache(remote, false)
            setState((previous) => (previous === 'offline' || previous === 'error' ? 'idle' : previous))
          } else {
            // Base recién creada y vacía: se siembra con la carta que tenemos.
            markDirty(true)
            again.current = true
          }
        }
      }
      setReady(true)
    } catch (error) {
      if (isUnauthorized(error)) {
        setState('error')
        unauthorized.current()
      } else if (isOffline(error)) {
        setState('offline')
        setReady(true)
      } else {
        setState('error')
        setReady(true)
      }
    } finally {
      busy.current = false
      if (again.current) {
        again.current = false
        if (dirty.current) timer.current = window.setTimeout(() => void sync(), DEBOUNCE)
      }
    }
  }, [])

  /** Al entrar (o volver a entrar tras pedir la contraseña) se sube lo pendiente o se trae la carta. */
  useEffect(() => {
    if (enabled) void sync()
  }, [enabled, sync])

  /** Sin conexión se reintenta solo: nadie en plena cena va a acordarse de pulsar «Reintentar». */
  useEffect(() => {
    if (!enabled || state !== 'offline') return
    const retry = window.setInterval(() => void sync(), RETRY)
    const onOnline = () => void sync()
    window.addEventListener('online', onOnline)
    return () => {
      window.clearInterval(retry)
      window.removeEventListener('online', onOnline)
    }
  }, [enabled, state, sync])

  /** Al salir de la app (cambiar a WhatsApp, bloquear el móvil) no se espera al temporizador. */
  useEffect(() => {
    if (!enabled) return
    const onHide = () => { if (document.visibilityState === 'hidden' && dirty.current) void sync() }
    document.addEventListener('visibilitychange', onHide)
    return () => document.removeEventListener('visibilitychange', onHide)
  }, [enabled, sync])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  /**
   * Aplica un cambio. Acepta una función sobre la carta más reciente para que dos toques
   * seguidos (agotado aquí, estrella allá) no se pisen por partir de la misma copia.
   */
  const commit = useCallback<CommitMenu>((update) => {
    const next = typeof update === 'function' ? update(latest.current) : update
    if (next === latest.current) return
    latest.current = next
    revision.current += 1
    markDirty(true)
    setMenu(next)
    saveMenu(next)
    writeCache(next, true)
    setState('saving')
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => void sync(), DEBOUNCE)
  }, [sync])

  const retry = useCallback(() => {
    // Reintentar a mano también vuelve a traer la carta si nunca llegó.
    if (!dirty.current) synced.current = false
    void sync()
  }, [sync])

  return { menu, commit, state, pending, ready, retry }
}
