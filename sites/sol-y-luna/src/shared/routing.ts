/**
 * Rutas con direcciones de verdad (`/el-sol-la-luna`, `/reserver`), no con almohadilla: se comparten por
 * WhatsApp tal cual y Google las indexa como páginas. El servidor contesta cualquier ruta que no
 * sea un fichero con el index.html, así que un enlace directo siempre abre la web.
 */
import { useEffect, useState, type MouseEvent } from 'react'
import { stripBase, withBase } from './base'

/**
 * Las reservas no salen de la web: el formulario de `/reserver` arma el mensaje y abre WhatsApp.
 * `local` preselecciona el restaurante (`/reserver?local=mexi-and-co`).
 */
export type PublicRoute =
  /** `section` baja hasta un bloque de la portada (`/#le-1492`). */
  | { view: 'inicio'; section?: string }
  | { view: 'el-sol-la-luna' }
  | { view: 'mexi-and-co' }
  | { view: 'reserver'; venue?: string }
  | { view: 'privacidad' }
  | { view: 'no-encontrada' }

/** Las páginas de cada local: misma ruta que su identificador en `venues.ts`. */
const VENUE_VIEWS = ['el-sol-la-luna', 'mexi-and-co'] as const

/**
 * Direcciones que la gente escribe a mano o que circulan con otra forma: llevan a su página en
 * vez de a un error. Las de idioma (`/es`, `/fr`) abren la portada: el idioma lo recoge
 * `detectLang()` de la misma dirección.
 */
const LEGACY: Record<string, PublicRoute> = {
  '/reservar': { view: 'reserver' },
  '/reserva': { view: 'reserver' },
  '/reservation': { view: 'reserver' },
  '/reservations': { view: 'reserver' },
  '/el-sol-y-la-luna': { view: 'el-sol-la-luna' },
  '/mexi-co': { view: 'mexi-and-co' },
  '/privacidad': { view: 'privacidad' },
  '/es': { view: 'inicio' },
  '/fr': { view: 'inicio' },
}

/**
 * El panel son dos pantallas: la carta y los ajustes. La agenda de reservas está apagada —las
 * reservas las lleva Restoo—, así que `/admin` abre la carta y `/admin/reservas`, que es el enlace
 * que circula por los móviles del restaurante, cae también ahí en vez de dar un error.
 * Para volver a encenderla: `{ view: 'reservas' }` aquí y lo comentado en `AdminApp.tsx`.
 */
export type AdminRoute = { view: 'carta' } | { view: 'ajustes' }

export type Route = { area: 'public'; page: PublicRoute } | { area: 'admin'; page: AdminRoute }

export const publicRoute = (page: PublicRoute): Route => ({ area: 'public', page })
export const adminRoute = (page: AdminRoute): Route => ({ area: 'admin', page })

export function routePath(route: Route): string {
  if (route.area === 'admin') return route.page.view === 'carta' ? '/admin' : `/admin/${route.page.view}`
  const { page } = route
  if (page.view === 'inicio') return page.section ? `/#${encodeURIComponent(page.section)}` : '/'
  if (page.view === 'reserver') return page.venue ? `/reserver?local=${encodeURIComponent(page.venue)}` : '/reserver'
  if (page.view === 'privacidad') return '/confidentialite'
  return `/${page.view}`
}

export function readRoute(location: Pick<Location, 'pathname' | 'hash' | 'search'> = window.location): Route {
  const path = stripBase(location.pathname).replace(/\/+$/, '') || '/'
  // Los enlaces con almohadilla (`#/reserver`) también funcionan.
  const hashPath = location.hash.startsWith('#/') ? location.hash.slice(1).replace(/\/+$/, '') : ''
  const clean = path === '/' && hashPath ? hashPath : path
  const admin = clean.match(/^\/admin(?:\/(carta|ajustes|reservas))?$/)
  if (admin) return adminRoute(admin[1] === 'ajustes' ? { view: 'ajustes' } : { view: 'carta' })
  if (clean === '/reserver') {
    const venue = new URLSearchParams(location.search).get('local') ?? undefined
    return publicRoute({ view: 'reserver', venue })
  }
  if ((VENUE_VIEWS as readonly string[]).includes(clean.slice(1))) {
    return publicRoute({ view: clean.slice(1) as (typeof VENUE_VIEWS)[number] })
  }
  if (clean === '/confidentialite') return publicRoute({ view: 'privacidad' })
  if (clean === '/') {
    const section = !hashPath && location.hash.length > 1 ? decodeURIComponent(location.hash.slice(1)) : undefined
    return publicRoute({ view: 'inicio', section })
  }
  const old = LEGACY[clean.toLowerCase().replace(/^\/(es|fr)(?=\/)/, '')]
  if (old) return publicRoute(old)
  return publicRoute({ view: 'no-encontrada' })
}

const CHANGE = 'mexiandco:route'

/** Cambia de página sin recargar. Sube arriba del todo salvo que la ruta pida una sección. */
export function navigate(route: Route, options: { replace?: boolean } = {}) {
  const path = withBase(routePath(route))
  const current = `${window.location.pathname}${window.location.search}${window.location.hash}`
  if (path !== current) {
    // `?lang=` se conserva: quien entró con la web en castellano sigue en castellano al navegar.
    const keep = new URLSearchParams(window.location.search).get('lang')
    const url = new URL(path, window.location.origin)
    if (keep) url.searchParams.set('lang', keep)
    const target = `${url.pathname}${url.search}${url.hash}`
    if (options.replace) window.history.replaceState(null, '', target)
    else window.history.pushState(null, '', target)
  }
  /**
   * Entre páginas, un fundido corto como el de una app (View Transitions, Chrome y Safari 18). El
   * navegador fotografía la página de antes, se pinta la nueva y funde una sobre otra. Sin soporte,
   * o si el teléfono pide menos movimiento, se cambia de golpe como siempre.
   */
  const transition = (document as Document & { startViewTransition?: (update: () => Promise<void>) => unknown }).startViewTransition
  const calm = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (!transition || calm || path === current) {
    window.dispatchEvent(new Event(CHANGE))
    return
  }
  transition.call(document, () => new Promise<void>((resolve) => {
    window.dispatchEvent(new Event(CHANGE))
    // Dos fotogramas: el primero pinta la página nueva, el segundo ya la tiene en pantalla.
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  }))
}

/** La ruta actual, al día con los botones de atrás y adelante del navegador. */
export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => readRoute())
  useEffect(() => {
    const update = () => setRoute(readRoute())
    window.addEventListener('popstate', update)
    window.addEventListener(CHANGE, update)
    return () => {
      window.removeEventListener('popstate', update)
      window.removeEventListener(CHANGE, update)
    }
  }, [])
  return route
}

/**
 * Manejador para los `<a href>` de la app: navega sin recargar, pero respeta el clic con
 * modificador (abrir en otra pestaña) y el botón central.
 */
export const linkTo = (route: Route) => ({
  href: withBase(routePath(route)),
  onClick: (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    navigate(route)
  },
})

/** Enlace absoluto a una página, para compartir fuera de la app. */
export const absoluteLink = (route: Route) => `${window.location.origin}${routePath(route)}`
