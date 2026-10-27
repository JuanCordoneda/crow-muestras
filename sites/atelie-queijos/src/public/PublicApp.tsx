// El armazón va antes que las páginas: sus estilos se apoyan en él y a veces lo afinan.
import './public.css'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, CalendarDays, ChevronRight, Instagram, Link2, Mail, Menu as MenuIcon, X } from 'lucide-react'
import { PAGE_PATHS, SITE_LANGS, linkTo, navigate, publicRoute, type PublicRoute, type SiteLang } from '../shared/routing'
import { withBase } from '../shared/base'
import { useScrollLock } from '../shared/useMedia'
import { cx } from '../shared/utils'
import { textsFor, type Texts } from './content'
import { BUSINESS, SITE_URL, track, whatsappUrl } from './business'
import { SiteContext, useScrolledPast, type Site } from './site'
import { Logo, WhatsAppIcon } from './components/Brand'
import { LangSwitch } from './components/LangPicker'
import { HomePage } from './pages/HomePage'
import { LinksPage } from './pages/LinksPage'
import { PrivacyPage } from './pages/PrivacyPage'

type Props = { route: PublicRoute }

/** Título y descripción de cada página, los mismos que escribe el build en su HTML. */
export const pageMeta = (t: Texts, view: PublicRoute['view']) => ({
  inicio: { title: t.meta.title, description: t.meta.description },
  links: { title: t.meta.linksTitle, description: t.meta.linksDescription },
  privacidade: { title: t.meta.privacyTitle, description: t.meta.privacyDescription },
  'no-encontrada': { title: t.meta.notFoundTitle, description: t.meta.description },
})[view]

/** La misma página en cada idioma (una que no existe lleva a la portada de cada uno). */
const langHrefs = (route: PublicRoute) => {
  const view = route.view === 'no-encontrada' ? 'inicio' : route.view
  return Object.fromEntries(SITE_LANGS.map((code) => [code, withBase(PAGE_PATHS[view][code])])) as Record<SiteLang, string>
}

export function PublicApp({ route }: Props) {
  const lang: SiteLang = route.lang ?? 'pt'
  const t = textsFor(lang)
  const [chosen, setChosen] = useState<Site['chosen']>(null)
  const [drawer, setDrawer] = useState(false)
  const isHome = route.view === 'inicio'
  const isLinks = route.view === 'links'

  /** Sobre la foto de la portada la cabecera va transparente; al bajar, se vuelve sólida. */
  const scrolled = useScrolledPast(isHome ? 80 : 0)
  /** La barra de reservar aparece cuando los botones del héroe ya han salido de la pantalla. */
  const pastHero = useScrolledPast(isHome ? 560 : -1)
  /** Con el formulario en pantalla la barra sobra, y en el móvil taparía el botón de enviar. */
  const [atBooking, setAtBooking] = useState(false)
  useEffect(() => {
    const target = isHome ? document.getElementById('reservar') : null
    if (!target || !('IntersectionObserver' in window)) return
    const observer = new IntersectionObserver(([entry]) => setAtBooking(entry.isIntersecting), { rootMargin: '0px 0px -25% 0px' })
    observer.observe(target)
    return () => observer.disconnect()
  }, [isHome, lang])

  useEffect(() => {
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : lang
  }, [lang])

  /**
   * Título, descripción y canónico al navegar sin recargar. El HTML de cada dirección ya trae los
   * suyos desde el build (`scripts/pages.mjs`), que es lo que leen Google, WhatsApp e Instagram.
   */
  useEffect(() => {
    const page = pageMeta(t, route.view)
    document.title = page.title
    document.querySelector<HTMLMetaElement>('meta[name="description"]')?.setAttribute('content', page.description)
    if (route.view !== 'no-encontrada') {
      const canonical = `${SITE_URL}${PAGE_PATHS[route.view][lang]}`
      document.querySelector<HTMLLinkElement>('#canonical')?.setAttribute('href', canonical)
      document.querySelector<HTMLMetaElement>('#og-url')?.setAttribute('content', canonical)
    }
  }, [route.view, t, lang])

  /** `/#reservar`: baja hasta el bloque en cuanto la página está pintada. */
  useEffect(() => {
    if (!route.section) return
    const frame = requestAnimationFrame(() => document.getElementById(route.section!)?.scrollIntoView({ block: 'start' }))
    return () => cancelAnimationFrame(frame)
  }, [route])

  const book = useCallback((sessionId?: string) => {
    if (sessionId) setChosen({ id: sessionId, at: Date.now() })
    track('book_click', { session: sessionId ?? '', lang })
    navigate(publicRoute({ view: 'inicio', lang, section: 'reservar' }))
  }, [lang])

  const onWhatsApp = useCallback((source: string) => () => track('whatsapp_click', { source, page: route.view, lang }), [route.view, lang])

  useScrollLock(drawer)
  /** Al cambiar de página no puede quedarse abierto el cajón. */
  useEffect(() => { setDrawer(false) }, [route])

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
      const focusables = drawerRef.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
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
      const selector = '.section-head, .live-item, .live-photos, .host-photo, .date-card, .booking-card, .gift-inner, .groups-list li, .more-card, .review, .faq-item'
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
  }, [route.view, lang])

  const site = useMemo<Site>(() => ({ lang, t, chosen, book, onWhatsApp }), [lang, t, chosen, book, onWhatsApp])
  const hrefs = langHrefs(route)
  const overlay = isHome && !scrolled && !drawer
  const barVisible = (!isHome || pastHero) && !atBooking
  const home = (section?: string) => linkTo(publicRoute({ view: 'inicio', lang, section }))
  const year = new Date().getFullYear()

  const nav = [
    { key: 'atelie', label: t.nav.atelier },
    { key: 'datas', label: t.nav.dates },
    { key: 'janaina', label: t.nav.janaina },
    { key: 'presente', label: t.nav.gift },
    { key: 'grupos', label: t.nav.groups },
    { key: 'duvidas', label: t.nav.faq },
  ]

  /** La página de links va sola: ni cabecera ni pie, solo los botones (y los idiomas arriba). */
  if (isLinks) {
    return (
      <SiteContext.Provider value={site}>
        <div className="site is-links">
          <main id="contenido" className="site-main">
            <div className="links-langs">
              <LangSwitch lang={lang} hrefs={hrefs} label={t.nav.language} switchTo={t.nav.switchTo} />
            </div>
            <LinksPage />
          </main>
        </div>
      </SiteContext.Provider>
    )
  }

  return (
    <SiteContext.Provider value={site}>
      <div className={cx('site', isHome && 'is-home')}>
        <a className="skip-link" href="#contenido">{t.nav.skip}</a>
        <header className={cx('site-header', overlay && 'is-overlay')}>
          <a className="site-brand" {...home()} aria-label={t.nav.homeAria}>
            <Logo className="site-logo" />
          </a>

          <nav className="site-nav" aria-label={t.nav.navigation}>
            {nav.map((item) => {
              const link = home(item.key)
              return <a key={item.key} {...link}>{item.label}</a>
            })}
            <a {...home('reservar')} className="is-cta">{t.nav.book}</a>
          </nav>

          <div className="site-header-actions">
            <LangSwitch lang={lang} hrefs={hrefs} label={t.nav.language} switchTo={t.nav.switchTo} light={overlay} />
            <a className="header-call" href={whatsappUrl(t.wa.generic)} target="_blank" rel="noopener noreferrer" aria-label={t.nav.talk} onClick={onWhatsApp('cabecalho')}><WhatsAppIcon size={21} /></a>
            <button type="button" className="header-menu" ref={menuButton} onClick={() => setDrawer(true)} aria-label={t.nav.openMenu} aria-expanded={drawer} aria-controls="site-drawer">
              <MenuIcon size={24} />
            </button>
          </div>
        </header>

        {/* Cajón de navegación de móvil: enlaces grandes, reservar, contacto a mano y los tres idiomas. */}
        <div className={cx('drawer-backdrop', drawer && 'is-open')} onClick={() => setDrawer(false)} aria-hidden="true" />
        <div id="site-drawer" className={cx('drawer', drawer && 'is-open')} ref={drawerRef} aria-hidden={!drawer} {...({ inert: !drawer || undefined } as { inert?: boolean })}>
          <div className="drawer-head">
            <Logo className="drawer-logo" />
            <button type="button" className="drawer-close" onClick={() => { setDrawer(false); menuButton.current?.focus() }} aria-label={t.nav.close}><X size={22} /></button>
          </div>
          <nav className="drawer-links" aria-label={t.nav.navigation}>
            {nav.map((item) => {
              const link = home(item.key)
              return (
                <a key={item.key} {...link} onClick={(event) => { setDrawer(false); link.onClick(event) }}>
                  <span>{item.label}</span>
                  <ChevronRight size={20} />
                </a>
              )
            })}
          </nav>
          <div className="drawer-book">
            <a className="btn btn-primary btn-lg btn-block" {...home('reservar')} onClick={(event) => { setDrawer(false); home('reservar').onClick(event) }}>{t.hero.book}</a>
          </div>
          <div className="drawer-contact">
            <a href={whatsappUrl(t.wa.generic)} target="_blank" rel="noopener noreferrer" className="drawer-row" onClick={onWhatsApp('menu')}>
              <span className="drawer-icon is-whatsapp"><WhatsAppIcon size={19} /></span>
              <span><small>{t.nav.whatsapp}</small><b>{BUSINESS.phone}</b></span>
            </a>
            <a href={BUSINESS.instagram} target="_blank" rel="noopener noreferrer" className="drawer-row">
              <span className="drawer-icon"><Instagram size={18} /></span>
              <span><small>{t.nav.instagram}</small><b>{BUSINESS.instagramHandle}</b></span>
            </a>
            <a href={`mailto:${BUSINESS.email}`} className="drawer-row">
              <span className="drawer-icon"><Mail size={18} /></span>
              <span><small>{t.nav.email}</small><b>{BUSINESS.email}</b></span>
            </a>
          </div>
          <div className="drawer-foot">
            <span className="drawer-label">{t.nav.language}</span>
            <LangSwitch lang={lang} hrefs={hrefs} label={t.nav.language} switchTo={t.nav.switchTo} wide />
          </div>
        </div>

        <main id="contenido" className={cx('site-main', `is-${route.view}`)}>
          {route.view === 'inicio' && <HomePage />}
          {route.view === 'privacidade' && <PrivacyPage />}
          {route.view === 'no-encontrada' && (
            <div className="info-page is-narrow not-found">
              <header className="page-head">
                <h1>{t.notFound.title}</h1>
                <p>{t.notFound.text}</p>
              </header>
              <div className="not-found-actions">
                <a className="btn btn-primary btn-lg" {...home()}>{t.notFound.home}</a>
                <a className="btn btn-ghost" {...home('reservar')}>{t.nav.book}</a>
              </div>
            </div>
          )}
        </main>

        <footer className="site-footer">
          <div className="footer-brand">
            <Logo className="footer-logo" />
            <p>{t.footer.tagline}</p>
          </div>

          <div className="footer-grid">
            <section>
              <h2>{t.footer.contact}</h2>
              <a href={whatsappUrl(t.wa.generic)} target="_blank" rel="noopener noreferrer" onClick={onWhatsApp('rodape')}><WhatsAppIcon size={16} /> {t.nav.whatsapp} · {BUSINESS.phone}</a>
              <a href={`mailto:${BUSINESS.email}`}><Mail size={16} /> {BUSINESS.email}</a>
            </section>
            <section>
              <h2>{t.footer.follow}</h2>
              <a href={BUSINESS.instagram} target="_blank" rel="noopener noreferrer"><Instagram size={16} /> {BUSINESS.instagramHandle}</a>
            </section>
            <section>
              <h2>{t.footer.more}</h2>
              <a {...home('reservar')}><CalendarDays size={16} /> {t.hero.book}</a>
              <a href={BUSINESS.blog} target="_blank" rel="noopener noreferrer"><BookOpen size={16} /> {t.footer.blog}</a>
              <a {...linkTo(publicRoute({ view: 'links', lang }))}><Link2 size={16} /> {t.footer.links}</a>
            </section>
          </div>

          <div className="footer-bottom">
            <span>{t.footer.rights(year)}</span>
            <a {...linkTo(publicRoute({ view: 'privacidade', lang }))}>{t.footer.privacy}</a>
            <span className="site-credit">
              {t.footer.credit}
              <img src="/img/crow-agency-icon.webp" alt="" width={22} height={22} loading="lazy" />
              <img src="/img/crow-agency.webp" alt="Crow Agency" width={96} height={14} loading="lazy" />
            </span>
          </div>
        </footer>

        {/* Barra fija de móvil: WhatsApp y reservar siempre a un toque del pulgar. */}
        <nav className={cx('action-bar', barVisible && 'is-visible')} aria-label={t.nav.book} aria-hidden={!barVisible}>
          <a className="btn btn-white" href={whatsappUrl(t.wa.generic)} target="_blank" rel="noopener noreferrer" tabIndex={barVisible ? undefined : -1} onClick={onWhatsApp('barra')}><WhatsAppIcon size={19} /> {t.nav.whatsapp}</a>
          <a className="btn btn-primary" {...home('reservar')} tabIndex={barVisible ? undefined : -1}><CalendarDays size={18} /> {t.hero.book}</a>
        </nav>
      </div>
    </SiteContext.Provider>
  )
}
