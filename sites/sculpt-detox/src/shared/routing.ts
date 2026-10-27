/**
 * Rutas con direcciones de verdad (`/lipedema`, `/en/lipedema`), no con almohadilla: se comparten
 * por WhatsApp tal cual y Google las indexa como páginas. Cada idioma tiene su dirección —el
 * inglés va bajo `/en`— para que el buscador enseñe a cada visitante la suya (hreflang) y para que
 * el HTML que sale del servidor ya venga en el idioma bueno.
 */
import { useEffect, useState, type MouseEvent } from 'react'
import { stripBase, withBase } from './base'

export type SiteLang = 'es' | 'en'
export const SITE_LANGS: SiteLang[] = ['es', 'en']

/**
 * `lp-*` son las landings de publicidad: sin menú y con un solo botón, el de WhatsApp.
 * `section` baja hasta un bloque de la portada (`/#reservar`).
 */
export type PageView = 'inicio' | 'lipedema' | 'lp-lipedema' | 'lp-maderoterapia' | 'privacidad' | 'no-encontrada'
export type PublicRoute = { view: PageView; lang?: SiteLang; section?: string }

/** La dirección de cada página en cada idioma. Las de la publicidad, con la palabra que se busca. */
export const PAGE_PATHS: Record<Exclude<PageView, 'no-encontrada'>, Record<SiteLang, string>> = {
  inicio: { es: '/', en: '/en' },
  lipedema: { es: '/lipedema', en: '/en/lipedema' },
  'lp-lipedema': { es: '/lipedema-ibiza', en: '/en/lipedema-ibiza' },
  'lp-maderoterapia': { es: '/maderoterapia-ibiza', en: '/en/wood-therapy-ibiza' },
  privacidad: { es: '/privacidad', en: '/en/privacy' },
}

/**
 * Direcciones que la gente escribe a mano, las de la web anterior (WordPress) y las que circulan
 * con otra forma: llevan a su página en vez de a un error. El servidor contesta las mismas con un
 * 301 (`server.js`), que es lo que entiende Google; esto arregla al visitante en local.
 */
const ALIASES: Record<string, PublicRoute> = {
  '/es': { view: 'inicio', lang: 'es' },
  '/reservar': { view: 'inicio', lang: 'es', section: 'reservar' },
  '/reserva': { view: 'inicio', lang: 'es', section: 'reservar' },
  '/tratamientos': { view: 'inicio', lang: 'es', section: 'tratamientos' },
  '/contacto': { view: 'inicio', lang: 'es', section: 'contacto' },
  '/sobre-nosotros': { view: 'inicio', lang: 'es', section: 'michele' },
  '/en/book': { view: 'inicio', lang: 'en', section: 'reservar' },
  '/en/treatments': { view: 'inicio', lang: 'en', section: 'tratamientos' },
  '/en/contact': { view: 'inicio', lang: 'en', section: 'contacto' },
  '/en/maderoterapia-ibiza': { view: 'lp-maderoterapia', lang: 'en' },
  '/en/privacidad': { view: 'privacidad', lang: 'en' },
}

/**
 * El panel venía con la plantilla (la carta de un restaurante) y aquí no se usa: está
 * desconectado en `App.tsx`. Los tipos siguen para que su código compile tal cual.
 */
export type AdminRoute = { view: 'carta' } | { view: 'ajustes' }

export type Route = { area: 'public'; page: PublicRoute } | { area: 'admin'; page: AdminRoute }

export const publicRoute = (page: PublicRoute): Route => ({ area: 'public', page })
export const adminRoute = (page: AdminRoute): Route => ({ area: 'admin', page })

/** El idioma de una dirección: todo lo que cuelga de `/en` va en inglés. */
export const langOfPath = (pathname: string): SiteLang => (/^\/en(\/|$)/i.test(stripBase(pathname)) ? 'en' : 'es')

export function routePath(route: Route): string {
  if (route.area === 'admin') return route.page.view === 'carta' ? '/admin' : `/admin/${route.page.view}`
  const { page } = route
  const lang = page.lang ?? 'es'
  if (page.view === 'no-encontrada') return lang === 'en' ? '/en/404' : '/404'
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

const CHANGE = 'sculptdetox:route'

/** Cambia de página sin recargar. Sube arriba del todo salvo que la ruta pida una sección. */
export function navigate(route: Route, options: { replace?: boolean } = {}) {
  const path = withBase(routePath(route))
  const current = `${window.location.pathname}${window.location.hash}`
  if (path !== current) {
    // Los parámetros de campaña (`?gclid=`, `?utm_source=`) se quedan: la analítica los lee al navegar.
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
