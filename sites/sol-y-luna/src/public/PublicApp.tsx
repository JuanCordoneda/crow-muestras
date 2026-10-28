// El armazón va antes que las páginas: sus estilos se apoyan en él y a veces lo afinan.
import './public.css'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, ChevronRight, MapPin, Menu as MenuIcon, Phone, X } from 'lucide-react'
import type { Lang, Menu } from '../shared/types'
import { fetchMenu, primedMenu } from '../shared/api'
import { loadMenu, saveMenu } from '../shared/store'
import { detectLang, pick, saveLang } from '../shared/i18n'
import { linkTo, publicRoute, type PublicRoute } from '../shared/routing'
import { useScrollLock } from '../shared/useMedia'
import { cx, directionsLink, telLink, whatsappLink } from '../shared/utils'
import { textsFor } from './content'
import { updateStructuredData } from './structured-data'
import { SiteContext, useMadridNow, useScrolledPast, type Site } from './site'
import { BOOKING_WHATSAPP, EL_SOL, MEXI, SHOW_LE_1492, SITE_URL, VENUES, fullAddress, say } from './venues'
import { LE_1492 } from './components/Le1492' // LE-1492
import { Logo, PapelPicado, WhatsAppIcon } from './components/Brand'
import { LangGrid, LangPicker } from './components/LangPicker'
import { WhatsAppFab } from './components/WhatsAppFab'
import { HomePage } from './pages/HomePage'
import { VenuePage } from './pages/VenuePage'
import { BookingPage } from './pages/BookingPage'
import { PrivacyPage } from './pages/PrivacyPage'

type Props = { route: PublicRoute }

export function PublicApp({ route }: Props) {
  const [lang, setLangState] = useState<Lang>(detectLang)
  const [menu, setMenu] = useState<Menu>(() => primedMenu() ?? loadMenu())
  const [drawer, setDrawer] = useState(false)
  const now = useMadridNow()
  const t = textsFor(lang)
  const { settings } = menu
  const isHome = route.view === 'inicio'
  /** La portada y las páginas de cada local abren con una foto a pantalla completa. */
  const immersive = isHome || route.view === 'el-sol-la-luna' || route.view === 'mexi-and-co'

  /** Sobre la foto del héroe la cabecera va transparente; al bajar, se vuelve sólida. */
  const scrolled = useScrolledPast(immersive ? 120 : 0)
  /** El botón flotante espera a que se baje un poco: sobre el héroe ya está su «Réserver» grande. */
  const pastHero = useScrolledPast(immersive ? 220 : -1)

  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    saveLang(next)
    /**
     * El idioma elegido se escribe en la dirección: así el enlace que se comparte por WhatsApp
     * abre en el mismo idioma, y coincide con lo que el sitemap declara como alternativa.
     */
    const url = new URL(window.location.href)
    url.searchParams.set('lang', next)
    window.history.replaceState(null, '', url)
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  /**
   * La ficha que lee Google: un Restaurant por local, con su horario, su teléfono y su cocina.
   * En index.html va una copia escrita a mano, que es la que ve quien no ejecuta JavaScript.
   */
  useEffect(() => {
    updateStructuredData()
  }, [])

  /** La carta la publica el panel: se pinta la copia local y se reemplaza en cuanto contesta el servidor. */
  useEffect(() => {
    let cancelled = false
    fetchMenu()
      .then((remote) => {
        if (cancelled || !remote) return
        setMenu(remote)
        saveMenu(remote)
      })
      .catch(() => { /* sin servidor se sigue con la última carta vista */ })
    return () => { cancelled = true }
  }, [])

  /**
   * Título y descripción por página y por idioma. El HTML de cada dirección ya trae los suyos en
   * castellano, escritos en el build (`scripts/pages.mjs`) para quien no ejecuta JavaScript; esto
   * los pone al día al navegar sin recargar y los traduce al idioma en que se está leyendo.
   */
  useEffect(() => {
    const MARCA = t.meta.brand
    const meta: Record<PublicRoute['view'], { title: string; description: string }> = {
      inicio: { title: t.meta.title, description: t.meta.description },
      'el-sol-la-luna': { title: `${EL_SOL.name} · ${say(EL_SOL.cuisine, lang)} | ${t.hero.eyebrow}`, description: say(EL_SOL.intro, lang) },
      'mexi-and-co': { title: `${MEXI.name} · ${say(MEXI.cuisine, lang)} | ${t.hero.eyebrow}`, description: say(MEXI.intro, lang) },
      reserver: { title: `${t.booking.title} · ${MARCA}`, description: t.booking.text },
      privacidad: { title: `${t.privacy.title} · ${MARCA}`, description: t.privacy.updated },
      'no-encontrada': { title: `${t.notFound.title} · ${MARCA}`, description: t.meta.description },
    }
    const page = meta[route.view]
    document.title = page.title
    /**
     * La dirección canónica y la de compartir siguen a la página: index.html las deja puestas para
     * la primera, pero al navegar sin recargar hay que moverlas, o Google entiende que las páginas
     * de cada local son copias de la portada.
     */
    // Sin `?lang=` en la dirección, la página no tiene idioma fijo: es la versión x-default.
    const chosen = new URLSearchParams(window.location.search).get('lang')
    const canonical = `${SITE_URL}${window.location.pathname}${chosen ? `?lang=${lang}` : ''}`
    document.querySelector<HTMLLinkElement>('#canonical')?.setAttribute('href', canonical)
    document.querySelector<HTMLMetaElement>('#og-url')?.setAttribute('content', canonical)
    document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute('content', page.description)
  }, [route.view, t, lang])

  useScrollLock(drawer)
  /** Al cambiar de página no puede quedarse abierto el cajón. */
  useEffect(() => {
    setDrawer(false)
  }, [route])

  /**
   * Con el cajón abierto: Escape lo cierra y el Tab no se escapa por detrás. Al cerrarlo, el foco
   * vuelve al botón que lo abrió, que es donde el visitante cree que está.
   */
  const menuButton = useRef<HTMLButtonElement>(null)
  const drawerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!drawer) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDrawer(false)
        menuButton.current?.focus()
        return
      }
      if (event.key !== 'Tab') return
      const focusables = drawerRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, select, textarea')
      if (!focusables?.length) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      const active = document.activeElement
      if (event.shiftKey && (active === first || !drawerRef.current?.contains(active))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawer])

  /**
   * Entrada suave de lo que aparece al bajar. Solo se anima lo que está fuera de pantalla al pintar
   * (nada parpadea arriba) y nada si el teléfono pide menos movimiento. Al salir de la página, lo
   * pendiente se enseña igual: nunca se queda contenido invisible.
   */
  useEffect(() => {
    if (!('IntersectionObserver' in window) || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    let observer: IntersectionObserver | null = null
    const pending = new Set<HTMLElement>()
    const frame = window.setTimeout(() => {
      observer = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const element = entry.target as HTMLElement
          element.classList.add('is-in')
          pending.delete(element)
          observer?.unobserve(element)
        }
      }, { rootMargin: '0px 0px -8% 0px' })
      const selector = '.site-main > section:not(.hero), .facts, .venue-card, .mosaic-item, .review, .carte-section, .find-item'
      for (const element of document.querySelectorAll<HTMLElement>(selector)) {
        if (element.classList.contains('rv') || element.getBoundingClientRect().top < window.innerHeight) continue
        element.classList.add('rv')
        pending.add(element)
        observer.observe(element)
      }
    }, 60)
    return () => {
      window.clearTimeout(frame)
      observer?.disconnect()
      pending.forEach((element) => element.classList.add('is-in'))
    }
  }, [route.view, menu, lang])

  const site = useMemo<Site>(() => ({ lang, t, menu, now, setLang }), [lang, t, menu, now, setLang])

  const notice = pick(settings.notice, lang)
  /** El teléfono de la cabecera es el del local que se está mirando; en el resto, el de El Sol. */
  const current = route.view === 'mexi-and-co' ? MEXI : EL_SOL
  const call = telLink(current.phone ?? EL_SOL.phone ?? '')
  const whatsapp = whatsappLink(BOOKING_WHATSAPP, t.fab.message)
  const overlay = immersive && !scrolled && !drawer

  /** La navegación del grupo: un enlace por local y «Réserver» destacado. */
  const nav = [
    ...VENUES.map((venue) => ({ key: venue.id, label: venue.name, link: linkTo(publicRoute({ view: venue.id as 'el-sol-la-luna' | 'mexi-and-co' })) })),
    ...(SHOW_LE_1492 ? [{ key: 'le-1492', label: LE_1492.name, link: linkTo(publicRoute({ view: 'inicio', section: 'le-1492' })) }] : []), // LE-1492
    { key: 'reserver', label: t.nav.book, link: linkTo(publicRoute({ view: 'reserver' })) },
  ]

  return (
    <SiteContext.Provider value={site}>
      <div className={cx('site', immersive && 'is-home')}>
        <a className="skip-link" href="#contenido">{t.nav.skip}</a>
        <header className={cx('site-header', overlay && 'is-overlay')}>
          <a className="site-brand" {...linkTo(publicRoute({ view: 'inicio' }))} aria-label={t.nav.home_aria}>
            <Logo className="site-logo" />
          </a>

          <nav className="site-nav" aria-label={t.nav.navigation}>
            {nav.map((item) => (
              <a key={item.key} {...item.link} className={cx(route.view === item.key && 'active', item.key === 'reserver' && 'is-cta')} aria-current={route.view === item.key ? 'page' : undefined}>
                {item.label}
              </a>
            ))}
          </nav>

          <div className="site-header-actions">
            <LangPicker lang={lang} onChange={setLang} label={t.nav.language} light={overlay} />
            <a className="header-call" href={call} aria-label={t.nav.callNumber(current.phone ?? '')}><Phone size={18} /></a>
            <button type="button" className="header-menu" ref={menuButton} onClick={() => setDrawer(true)} aria-label={t.nav.openMenu} aria-expanded={drawer} aria-controls="site-drawer">
              <MenuIcon size={24} />
            </button>
          </div>
        </header>

        {/* Cajón de navegación de móvil: enlaces grandes, los teléfonos de cada local y los dos idiomas. */}
        <div className={cx('drawer-backdrop', drawer && 'is-open')} onClick={() => setDrawer(false)} aria-hidden="true" />
        <div id="site-drawer" className={cx('drawer', drawer && 'is-open')} ref={drawerRef} aria-hidden={!drawer} {...({ inert: !drawer || undefined } as { inert?: boolean })}>
          <div className="drawer-head">
            <Logo className="drawer-logo" />
            <button type="button" className="drawer-close" onClick={() => { setDrawer(false); menuButton.current?.focus() }} aria-label={t.nav.close}><X size={22} /></button>
          </div>
          <nav className="drawer-links">
            {nav.map((item) => (
              <a key={item.key} {...item.link} className={cx(route.view === item.key && 'active')} aria-current={route.view === item.key ? 'page' : undefined}>
                <span>{item.label}</span>
                <ChevronRight size={20} />
              </a>
            ))}
          </nav>
          <div className="drawer-contact">
            <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="drawer-row">
              <span className="drawer-icon is-whatsapp"><WhatsAppIcon size={18} /></span>
              <span><small>{t.nav.whatsapp} · {t.nav.book}</small><b>{EL_SOL.whatsapp}</b></span>
            </a>
            {VENUES.map((venue) => venue.phone && (
              <a key={venue.id} href={telLink(venue.phone)} className="drawer-row">
                <span className="drawer-icon"><Phone size={18} /></span>
                <span><small>{t.nav.call} · {venue.name}</small><b>{venue.phone}</b></span>
              </a>
            ))}
            <a href={directionsLink(`${EL_SOL.name}, ${fullAddress(EL_SOL)}`)} target="_blank" rel="noopener noreferrer" className="drawer-row">
              <span className="drawer-icon"><MapPin size={18} /></span>
              <span><small>{t.nav.findUs}</small><b>{EL_SOL.address} · {MEXI.address}</b></span>
            </a>
          </div>
          <div className="drawer-foot">
            <span className="drawer-label">{t.nav.language}</span>
            <LangGrid lang={lang} onChange={setLang} label={t.nav.language} />
          </div>
        </div>

        <main id="contenido" className={cx('site-main', `is-${route.view}`)}>
          {/* En las páginas con foto el aviso quedaría debajo de la cabecera transparente. */}
          {notice && !immersive && <p className="site-notice" role="note">{notice}</p>}
          {route.view === 'inicio' && <HomePage section={route.section} />}
          {route.view === 'el-sol-la-luna' && <VenuePage venue={EL_SOL} />}
          {route.view === 'mexi-and-co' && <VenuePage venue={MEXI} />}
          {route.view === 'reserver' && <BookingPage venue={route.venue} />}
          {route.view === 'privacidad' && <PrivacyPage />}
          {route.view === 'no-encontrada' && (
            <div className="info-page is-narrow not-found">
              <header className="page-head">
                <h1>{t.notFound.title}</h1>
                <p>{t.notFound.text}</p>
              </header>
              <div className="not-found-actions">
                <a className="btn btn-primary btn-lg" {...linkTo(publicRoute({ view: 'inicio' }))}>{t.notFound.home}</a>
                <a className="btn btn-ghost" {...linkTo(publicRoute({ view: 'reserver' }))}><CalendarDays size={18} /> {t.nav.book}</a>
              </div>
            </div>
          )}
        </main>

        <footer className="site-footer">
          <PapelPicado className="is-footer" />
          <div className="footer-brand">
            <Logo className="footer-logo" />
            <p>{t.footer.tagline}</p>
          </div>

          <div className="footer-grid">
            <section>
              <h2>{EL_SOL.name}</h2>
              <a href={directionsLink(`${EL_SOL.name}, ${fullAddress(EL_SOL)}`)} target="_blank" rel="noopener noreferrer"><MapPin size={16} /> {fullAddress(EL_SOL)}</a>
              {EL_SOL.phone && <a href={telLink(EL_SOL.phone)}><Phone size={16} /> {EL_SOL.phone}</a>}
              {EL_SOL.whatsapp && <a href={whatsapp} target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={16} /> {EL_SOL.whatsapp}</a>}
              <ul className="footer-hours">
                <li><span>{t.footer.monday}</span><span>17:00 – 23:00</span></li>
                <li><span>{t.footer.tuesdaySunday}</span><span>11:30 – 23:00</span></li>
              </ul>
            </section>
            <section>
              <h2>{MEXI.name}</h2>
              <a href={directionsLink(`${MEXI.name}, ${fullAddress(MEXI)}`)} target="_blank" rel="noopener noreferrer"><MapPin size={16} /> {fullAddress(MEXI)}</a>
              {MEXI.phone && <a href={telLink(MEXI.phone)}><Phone size={16} /> {MEXI.phone}</a>}
              <ul className="footer-hours">
                <li><span>{t.footer.every}</span><span>11:30 – 23:30</span></li>
              </ul>
            </section>
            {/* LE-1492: sin horario, solo la dirección. */}
            {SHOW_LE_1492 && (
              <section>
                <h2>{LE_1492.name}</h2>
                <a href={directionsLink(`${LE_1492.address}, ${LE_1492.postcode} ${LE_1492.town}`)} target="_blank" rel="noopener noreferrer"><MapPin size={16} /> {LE_1492.address}, {LE_1492.postcode} {LE_1492.town}</a>
              </section>
            )}
            <section>
              <h2>{t.footer.events}</h2>
              <a href={whatsappLink(BOOKING_WHATSAPP, t.events.message)} target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={16} /> {t.events.cta}</a>
              <a {...linkTo(publicRoute({ view: 'reserver' }))}><CalendarDays size={16} /> {t.nav.book}</a>
            </section>
          </div>

          <div className="footer-bottom">
            <span>{t.footer.rights(Number(now.date.slice(0, 4)))}</span>
            <span className="site-credit">
              <img src="/img/crow-agency-icon.webp" alt="" width={22} height={22} loading="lazy" />
              <img src="/img/crow-agency.webp" alt="Crow Agency" width={96} height={14} loading="lazy" />
            </span>
            <a {...linkTo(publicRoute({ view: 'privacidad' }))}>{t.footer.privacy}</a>
          </div>
        </footer>

        {/* Reservar por WhatsApp, siempre a mano: flota en todas las páginas y pantallas. */}
        <WhatsAppFab hidden={drawer} waiting={immersive && !pastHero} />
      </div>
    </SiteContext.Provider>
  )
}
