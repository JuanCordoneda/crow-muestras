/**
 * Rutas con direcciones de verdad (`/links`, `/fr`, `/en/links`), no con almohadilla: se comparten
 * por WhatsApp y desde la bio de Instagram tal cual, y Google las indexa como páginas. Cada idioma
 * tiene su dirección —el portugués en la raíz, el francés bajo `/fr` y el inglés bajo `/en`— para
 * que el buscador enseñe a cada visitante la suya (hreflang) y para que el HTML que sale del
 * servidor ya venga en el idioma bueno.
 */
import { useEffect, useState, type MouseEvent } from 'react'
import { stripBase, withBase } from './base'

/** Portugués primero: el público de @parisabor es brasileño. */
export type SiteLang = 'pt' | 'fr' | 'en'
export const SITE_LANGS: SiteLang[] = ['pt', 'fr', 'en']

/**
 * `links` es la página de la bio de Instagram: sin menú, con los botones grandes.
 * `section` baja hasta un bloque de la portada (`/#reservar`).
 */
export type PageView = 'inicio' | 'links' | 'privacidade' | 'no-encontrada'
export type PublicRoute = { view: PageView; lang?: SiteLang; section?: string }

/** La dirección de cada página en cada idioma. */
export const PAGE_PATHS: Record<Exclude<PageView, 'no-encontrada'>, Record<SiteLang, string>> = {
  inicio: { pt: '/', fr: '/fr', en: '/en' },
  links: { pt: '/links', fr: '/fr/links', en: '/en/links' },
  privacidade: { pt: '/privacidade', fr: '/fr/confidentialite', en: '/en/privacy' },
}

/**
 * Direcciones que la gente escribe a mano o que circulan con otra forma: llevan a su página en vez
 * de a un error. El servidor contesta las mismas con un 301 (`server.js`), que es lo que entiende
 * Google; esto arregla al visitante en local.
 */
const ALIASES: Record<string, PublicRoute> = {
  '/pt': { view: 'inicio', lang: 'pt' },
  '/reservar': { view: 'inicio', lang: 'pt', section: 'reservar' },
  '/reserva': { view: 'inicio', lang: 'pt', section: 'reservar' },
  '/presente': { view: 'inicio', lang: 'pt', section: 'presente' },
  '/vale-presente': { view: 'inicio', lang: 'pt', section: 'presente' },
  '/link': { view: 'links', lang: 'pt' },
  '/bio': { view: 'links', lang: 'pt' },
  '/fr/reserver': { view: 'inicio', lang: 'fr', section: 'reservar' },
  '/fr/cadeau': { view: 'inicio', lang: 'fr', section: 'presente' },
  '/en/book': { view: 'inicio', lang: 'en', section: 'reservar' },
  '/en/gift': { view: 'inicio', lang: 'en', section: 'presente' },
}

/**
 * El panel venía con la plantilla (la carta de un restaurante) y aquí no se usa: está
 * desconectado en `App.tsx`. Los tipos siguen para que su código compile tal cual.
 */
export type AdminRoute = { view: 'carta' } | { view: 'ajustes' }

export type Route = { area: 'public'; page: PublicRoute } | { area: 'admin'; page: AdminRoute }

export const publicRoute = (page: PublicRoute): Route => ({ area: 'public', page })
export const adminRoute = (page: AdminRoute): Route => ({ area: 'admin', page })

/** El idioma de una dirección: lo que cuelga de `/fr` va en francés, lo de `/en` en inglés. */
export const langOfPath = (pathname: string): SiteLang => {
  const prefix = stripBase(pathname).match(/^\/(fr|en)(\/|$)/i)?.[1]?.toLowerCase()
  return prefix === 'fr' || prefix === 'en' ? prefix : 'pt'
}

export function routePath(route: Route): string {
  if (route.area === 'admin') return route.page.view === 'carta' ? '/admin' : `/admin/${route.page.view}`
  const { page } = route
  const lang = page.lang ?? 'pt'
  if (page.view === 'no-encontrada') return lang === 'pt' ? '/404' : `/${lang}/404`
  const path = PAGE_PATHS[page.view][lang]
  return page.section ? `${path}#${encodeURIComponent(page.section)}` : path
}

/** La ruta de una dirección. Se usa en el navegador y al pintar las páginas en el build. */
export function routeFor(pathname: string, hash = ''): PublicRoute {
  const clean = stripBase(pathname).replace(/\/+$/, '').toLowerCase() || '/'
  const lang = langOfPath(clean)
  const section = hash.length > 1 ? decodeURIComponent(hash.slice(1)) : undefined
  for (const [view, paths] of Object.entries(PAGE_PATHS) as [Exclude<PageView, 'no-encontrada'>, Record<SiteLang, string>][]) {
    if (paths[lang] === clean) return { view, lang, section: view === 'inicio' ? section : undefined }
  }
  const alias = ALIASES[clean]
  if (alias) return alias
  return { view: 'no-encontrada', lang }
}

export function readRoute(location: Pick<Location, 'pathname' | 'hash'> = window.location): Route {
  const path = stripBase(location.pathname).replace(/\/+$/, '') || '/'
  const admin = path.match(/^\/admin(?:\/(carta|ajustes|reservas))?$/)
  if (admin) return adminRoute(admin[1] === 'ajustes' ? { view: 'ajustes' } : { view: 'carta' })
  return publicRoute(routeFor(location.pathname, location.hash))
}

const CHANGE = 'parisabor:route'

/** Cambia de página sin recargar. Sube arriba del todo salvo que la ruta pida una sección. */
export function navigate(route: Route, options: { replace?: boolean } = {}) {
  const path = withBase(routePath(route))
  const current = `${window.location.pathname}${window.location.hash}`
  if (path !== current) {
    // Los parámetros de campaña (`?utm_source=instagram`) se quedan: la analítica los lee al navegar.
    const target = `${path.split('#')[0]}${window.location.search}${path.includes('#') ? `#${path.split('#')[1]}` : ''}`
    if (options.replace) window.history.replaceState(null, '', target)
    else window.history.pushState(null, '', target)
  }
  window.dispatchEvent(new Event(CHANGE))
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
