// El armazón va antes que las páginas: sus estilos se apoyan en él y a veces lo afinan.
import './public.css'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronRight, Clock, Instagram, Mail, MapPin, Menu as MenuIcon, Phone, X } from 'lucide-react'
import { PAGE_PATHS, linkTo, navigate, publicRoute, type PublicRoute, type SiteLang } from '../shared/routing'
import { useScrollLock } from '../shared/useMedia'
import { cx } from '../shared/utils'
import { textsFor, type Texts } from './content'
import { BUSINESS, SITE_URL, directionsUrl, telUrl, track, whatsappUrl } from './business'
import { SiteContext, useScrolledPast, type Site } from './site'
import { Logo, WhatsAppIcon } from './components/Brand'
import { LangSwitch } from './components/LangPicker'
import { HomePage } from './pages/HomePage'
import { LipedemaPage } from './pages/LipedemaPage'
import { LandingPage } from './pages/LandingPage'
import { PrivacyPage } from './pages/PrivacyPage'
import { withBase } from '../shared/base'

type Props = { route: PublicRoute }

/** Título y descripción de cada página, los mismos que escribe el build en su HTML. */
export const pageMeta = (t: Texts, view: PublicRoute['view']) => ({
  inicio: { title: t.meta.title, description: t.meta.description },
  lipedema: { title: t.meta.lipedemaTitle, description: t.meta.lipedemaDescription },
  'lp-lipedema': { title: t.meta.lpLipedemaTitle, description: t.meta.lpLipedemaDescription },
  'lp-maderoterapia': { title: t.meta.lpMaderoTitle, description: t.meta.lpMaderoDescription },
  privacidad: { title: t.meta.privacyTitle, description: t.meta.privacyDescription },
  'no-encontrada': { title: t.meta.notFoundTitle, description: t.meta.description },
})[view]

/** La misma página en el otro idioma (una que no existe lleva a la portada del otro). */
const otherLangHref = (route: PublicRoute, lang: SiteLang) => {
  const other: SiteLang = lang === 'es' ? 'en' : 'es'
  const view = route.view === 'no-encontrada' ? 'inicio' : route.view
  return { other, href: withBase(PAGE_PATHS[view][other]) }
}

export function PublicApp({ route }: Props) {
  const lang: SiteLang = route.lang ?? 'es'
  const t = textsFor(lang)
  const [chosen, setChosen] = useState('')
  const [drawer, setDrawer] = useState(false)
  const isHome = route.view === 'inicio'
  const isLanding = route.view === 'lp-lipedema' || route.view === 'lp-maderoterapia'

  /** Sobre la foto de la portada (en el móvil) la cabecera va transparente; al bajar, se vuelve sólida. */
  const scrolled = useScrolledPast(isHome ? 80 : 0)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  /**
   * Título, descripción y canónico al navegar sin recargar. El HTML de cada dirección ya trae los
   * suyos desde el build (`scripts/pages.mjs`), que es lo que leen Google y WhatsApp.
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

  const book = useCallback((treatmentId?: string) => {
    if (treatmentId) setChosen(treatmentId)
    navigate(publicRoute({ view: 'inicio', lang, section: 'reservar' }))
  }, [lang])

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
      const selector = '.section-head, .treatment, .step, .review, .benefit, .faq-item, .reveal'
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

  /**
   * El botón flotante sobra donde ya hay uno igual: sobre el héroe de la portada y con el
   * formulario de reserva delante. Ahí se retira para no tapar texto ni duplicar la llamada.
   */
  const [fabAway, setFabAway] = useState(isHome)
  useEffect(() => {
    if (!isHome || !('IntersectionObserver' in window)) { setFabAway(false); return }
    const watched = ['.hero', '#reservar'].map((selector) => document.querySelector(selector)).filter(Boolean) as Element[]
    const visible = new Set<Element>()
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) entry.isIntersecting ? visible.add(entry.target) : visible.delete(entry.target)
      setFabAway(visible.size > 0)
    }, { rootMargin: '0px 0px -35% 0px' })
    watched.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [isHome, route.view])

  const site = useMemo<Site>(() => ({ lang, t, chosen, book }), [lang, t, chosen, book])
  const { other, href: otherHref } = otherLangHref(route, lang)
  const overlay = isHome && !scrolled && !drawer
  const waMessage = route.view === 'lp-lipedema' || route.view === 'lipedema' ? t.wa.lipedema : route.view === 'lp-maderoterapia' ? t.wa.madero : t.wa.generic
  const onWhatsApp = (source: string) => () => track('whatsapp_click', { source, page: route.view, lang })

  const home = (section?: string) => linkTo(publicRoute({ view: 'inicio', lang, section }))
  const nav = [
    { key: 'tratamientos', label: t.nav.treatments, link: home('tratamientos') },
    { key: 'lipedema', label: t.nav.lipedema, link: linkTo(publicRoute({ view: 'lipedema', lang })) },
    { key: 'michele', label: t.nav.michele, link: home('michele') },
    { key: 'opiniones', label: t.nav.reviews, link: home('opiniones') },
    { key: 'preguntas', label: t.nav.faq, link: home('preguntas') },
    { key: 'contacto', label: t.nav.contact, link: home('contacto') },
  ]
  const year = new Date().getFullYear()

  const fab = (
    <a className={cx('wa-fab', fabAway && 'is-away')} href={whatsappUrl(waMessage)} target="_blank" rel="noopener noreferrer" aria-label={t.nav.fab} aria-hidden={fabAway || undefined} tabIndex={fabAway ? -1 : undefined} onClick={onWhatsApp('flotante')}>
      <WhatsAppIcon size={26} />
      <span>{t.nav.fab}</span>
    </a>
  )

  if (isLanding) {
    return (
      <SiteContext.Provider value={site}>
        <div className="site is-landing">
          <a className="skip-link" href="#contenido">{t.nav.skip}</a>
          <header className="site-header is-landing">
            <span className="site-brand"><Logo className="site-logo" /></span>
            <div className="site-header-actions">
              <LangSwitch to={other} href={otherHref} short={t.nav.switchShort} name={t.nav.switchName} label={t.nav.switchLabel} />
            </div>
          </header>
          <main id="contenido" className="site-main">
            <LandingPage kind={route.view === 'lp-lipedema' ? 'lipedema' : 'madero'} onWhatsApp={onWhatsApp} />
          </main>
          <footer className="landing-footer">
            <p><MapPin size={15} /> {BUSINESS.street}, {BUSINESS.postcode} {BUSINESS.town}</p>
            <p><Clock size={15} /> {t.visit.hours} · {t.visit.hoursNote}</p>
            <p className="landing-footer-legal">
              <span>{t.footer.rights(year)}</span>
              <a {...linkTo(publicRoute({ view: 'privacidad', lang }))}>{t.footer.privacy}</a>
            </p>
          </footer>
          {fab}
        </div>
      </SiteContext.Provider>
    )
  }

  return (
    <SiteContext.Provider value={site}>
      <div className={cx('site', isHome && 'is-home')}>
        <a className="skip-link" href="#contenido">{t.nav.skip}</a>
        <header className={cx('site-header', overlay && 'is-overlay')}>
          <a className="site-brand" {...home()} title={t.nav.homeAria}>
            <Logo className="site-logo" />
          </a>

          <nav className="site-nav" aria-label={t.nav.navigation}>
            {nav.map((item) => (
              <a key={item.key} {...item.link} className={cx(item.key === 'lipedema' && route.view === 'lipedema' && 'active')} aria-current={item.key === 'lipedema' && route.view === 'lipedema' ? 'page' : undefined}>
                {item.label}
              </a>
            ))}
            <a {...home('reservar')} className="is-cta">{t.nav.book}</a>
          </nav>

          <div className="site-header-actions">
            <LangSwitch to={other} href={otherHref} short={t.nav.switchShort} name={t.nav.switchName} label={t.nav.switchLabel} light={overlay} />
            <a className="header-call" href={telUrl} aria-label={`${t.nav.call} ${BUSINESS.phone}`}><Phone size={19} /></a>
            <button type="button" className="header-menu" ref={menuButton} onClick={() => setDrawer(true)} aria-label={t.nav.openMenu} aria-expanded={drawer} aria-controls="site-drawer">
              <MenuIcon size={24} />
            </button>
          </div>
        </header>

        {/*
          Cajón de navegación de móvil: enlaces grandes, contacto a mano y el otro idioma. Cerrado va
          con `visibility: hidden`, que ya lo saca del tabulador y del lector de pantalla.
        */}
        <div className={cx('drawer-backdrop', drawer && 'is-open')} onClick={() => setDrawer(false)} aria-hidden="true" />
        <div id="site-drawer" className={cx('drawer', drawer && 'is-open')} ref={drawerRef} aria-hidden={!drawer}>
          <div className="drawer-head">
            <Logo className="drawer-logo" />
            <button type="button" className="drawer-close" onClick={() => { setDrawer(false); menuButton.current?.focus() }} aria-label={t.nav.close}><X size={22} /></button>
          </div>
          <nav className="drawer-links" aria-label={t.nav.navigation}>
            {nav.map((item) => (
              <a key={item.key} {...item.link} onClick={(event) => { setDrawer(false); item.link.onClick(event) }}>
                <span>{item.label}</span>
                <ChevronRight size={20} />
              </a>
            ))}
          </nav>
          <div className="drawer-book">
            <a className="btn btn-primary btn-lg btn-block" {...home('reservar')} onClick={(event) => { setDrawer(false); home('reservar').onClick(event) }}>{t.nav.book}</a>
          </div>
          <div className="drawer-contact">
            <a href={whatsappUrl(t.wa.generic)} target="_blank" rel="noopener noreferrer" className="drawer-row" onClick={onWhatsApp('menu')}>
              <span className="drawer-icon is-whatsapp"><WhatsAppIcon size={19} /></span>
              <span><small>{t.nav.whatsapp}</small><b>{BUSINESS.phone}</b></span>
            </a>
            <a href={telUrl} className="drawer-row">
              <span className="drawer-icon"><Phone size={18} /></span>
              <span><small>{t.nav.call}</small><b>{BUSINESS.phone}</b></span>
            </a>
            <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="drawer-row">
              <span className="drawer-icon"><MapPin size={18} /></span>
              <span><small>{t.nav.findUs}</small><b>{BUSINESS.street}, {BUSINESS.town}</b></span>
            </a>
            <div className="drawer-row is-static">
              <span className="drawer-icon"><Clock size={18} /></span>
              <span><small>{t.nav.hours}</small><b>{t.visit.hours}</b></span>
            </div>
          </div>
          <div className="drawer-foot">
            <span className="drawer-label">{t.nav.language}</span>
            <LangSwitch to={other} href={otherHref} short={t.nav.switchShort} name={t.nav.switchName} label={t.nav.switchLabel} wide />
          </div>
        </div>

        <main id="contenido" className={cx('site-main', `is-${route.view}`)}>
          {route.view === 'inicio' && <HomePage onWhatsApp={onWhatsApp} />}
          {route.view === 'lipedema' && <LipedemaPage onWhatsApp={onWhatsApp} />}
          {route.view === 'privacidad' && <PrivacyPage />}
          {route.view === 'no-encontrada' && (
            <div className="info-page is-narrow not-found">
              <header className="page-head">
                <h1>{t.notFound.title}</h1>
                <p>{t.notFound.text}</p>
              </header>
              <div className="not-found-actions">
                <a className="btn btn-primary btn-lg" {...home()}>{t.notFound.home}</a>
                <a className="btn btn-ghost" {...home('tratamientos')}>{t.nav.treatments}</a>
              </div>
            </div>
          )}
        </main>

        <footer className="site-footer">
          <div className="footer-brand">
            <img className="footer-logo" src="/img/sculptdetox/logo-240.webp" srcSet="/img/sculptdetox/logo-240.webp 240w, /img/sculptdetox/logo-480.webp 480w" sizes="180px" alt={`${BUSINESS.name} · ${BUSINESS.owner} · ${BUSINESS.ownerRole[lang]}`} width={240} height={194} loading="lazy" decoding="async" />
            <p>{t.footer.tagline}</p>
          </div>

          <div className="footer-grid">
            <section>
              <h2>{t.footer.visit}</h2>
              <a href={directionsUrl} target="_blank" rel="noopener noreferrer"><MapPin size={16} /> <span>{BUSINESS.street}<br />{BUSINESS.postcode} {BUSINESS.town}</span></a>
            </section>
            <section>
              <h2>{t.footer.contact}</h2>
              <a href={whatsappUrl(t.wa.generic)} target="_blank" rel="noopener noreferrer" onClick={onWhatsApp('pie')}><WhatsAppIcon size={16} /> WhatsApp</a>
              <a href={telUrl}><Phone size={16} /> {BUSINESS.phone}</a>
              <a href={`mailto:${BUSINESS.email}`}><Mail size={16} /> {BUSINESS.email}</a>
            </section>
            <section>
              <h2>{t.footer.hours}</h2>
              <p className="footer-hours"><b>{t.visit.hours}</b><span>{t.visit.hoursNote}</span><span>{t.visit.weekend}</span></p>
            </section>
            <section>
              <h2>{t.footer.follow}</h2>
              <a href={BUSINESS.instagram} target="_blank" rel="noopener noreferrer"><Instagram size={16} /> {BUSINESS.instagramHandle}</a>
            </section>
          </div>

          <div className="footer-bottom">
            <span>{t.footer.rights(year)}</span>
            <a {...linkTo(publicRoute({ view: 'privacidad', lang }))}>{t.footer.privacy}</a>
            <span className="site-credit">
              {t.footer.credit}
              <img src="/img/crow-agency-icon.webp" alt="" width={22} height={22} loading="lazy" />
              <img src="/img/crow-agency-240.webp" alt="Crow Agency" width={96} height={14} loading="lazy" />
            </span>
          </div>
        </footer>

        {fab}
      </div>
    </SiteContext.Provider>
  )
}
