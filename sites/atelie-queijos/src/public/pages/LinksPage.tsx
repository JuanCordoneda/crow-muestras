import './links.css'
import { BookOpen, CalendarDays, ChevronRight, Gift, Utensils } from 'lucide-react'
import { linkTo, publicRoute } from '../../shared/routing'
import { ATELIE, nextOpenSession, sessionId } from '../agenda'
import { BUSINESS, whatsappUrl } from '../business'
import { compactCount, sessionShort } from '../format'
import { useSite } from '../site'
import { CheeseBoard, VerifiedBadge, WhatsAppIcon } from '../components/Brand'

/**
 * La página de la bio de Instagram (`/links`). Quien llega aquí viene del perfil de Janaína con el
 * móvil en la mano y una sola idea: reservar o regalar. Así que nada de menú: su foto, su nombre y
 * botones grandes, el de reservar el primero y el más visible.
 */
export function LinksPage() {
  const { t, lang, onWhatsApp, book } = useSite()
  const next = nextOpenSession()
  const home = (section?: string) => linkTo(publicRoute({ view: 'inicio', lang, section }))

  return (
    <div className="links">
      <header className="links-head">
        <img className="links-avatar" src="/img/atelie/janaina-avatar.webp" alt={t.host.photoAlt} width={112} height={112} decoding="async" {...{ fetchpriority: 'high' }} />
        <h1>{t.links.name}</h1>
        <p className="links-handle">
          <a href={BUSINESS.instagram} target="_blank" rel="noopener noreferrer">{BUSINESS.instagramHandle}</a>
          <VerifiedBadge size={15} label={t.host.verified} />
          <span>· {compactCount(BUSINESS.followers, lang)}</span>
        </p>
        <p className="links-bio">{t.links.bio}</p>
      </header>

      <nav className="links-list" aria-label={t.nav.navigation}>
        {/* Quien llega desde la bio ya tiene la próxima sesión elegida en el formulario: un toque menos. */}
        <a
          className="links-btn is-main"
          {...home('reservar')}
          onClick={(event) => {
            if (!next || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return home('reservar').onClick(event)
            event.preventDefault()
            book(sessionId(next))
          }}
        >
          <span className="links-icon"><CalendarDays size={21} /></span>
          <span className="links-label">
            <b>{t.links.book}</b>
            {next && <small>{t.links.next} {sessionShort(next, lang)} · {t.dates.left(next.left, ATELIE.maxPeople)}</small>}
          </span>
          <ChevronRight size={20} />
        </a>
        <a className="links-btn" {...home('presente')}>
          <span className="links-icon"><Gift size={20} /></span>
          <span className="links-label"><b>{t.links.gift}</b></span>
          <ChevronRight size={20} />
        </a>
        <a className="links-btn is-soon" {...home('experiencias')}>
          <span className="links-icon"><Utensils size={20} /></span>
          <span className="links-label"><b>{t.links.dinners}</b></span>
          <ChevronRight size={20} />
        </a>
        <a className="links-btn" href={BUSINESS.blog} target="_blank" rel="noopener noreferrer">
          <span className="links-icon"><BookOpen size={20} /></span>
          <span className="links-label"><b>{t.links.blog}</b></span>
          <ChevronRight size={20} />
        </a>
        <a className="links-btn is-whatsapp" href={whatsappUrl(t.wa.generic)} target="_blank" rel="noopener noreferrer" onClick={onWhatsApp('links')}>
          <span className="links-icon"><WhatsAppIcon size={21} /></span>
          <span className="links-label"><b>{t.links.whatsapp}</b></span>
          <ChevronRight size={20} />
        </a>
      </nav>

      <a className="links-site" {...home()}>{t.links.site}</a>
      <CheeseBoard className="links-art" size={150} />
    </div>
  )
}
