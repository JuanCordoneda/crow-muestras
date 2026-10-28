import './links.css'
import { useState } from 'react'
import { BookOpen, CalendarDays, ChevronRight, Gift, Utensils } from 'lucide-react'
import { Photo } from '../../shared/components/Photo'
import { linkTo, publicRoute } from '../../shared/routing'
import { ATELIE, nextOpenSession, sessionId } from '../agenda'
import { BUSINESS, whatsappUrl } from '../business'
import { compactCount, sessionShort } from '../format'
import { useSite } from '../site'
import { CheeseBoard, VerifiedBadge, WhatsAppIcon } from '../components/Brand'
import { Stories } from '../components/Stories'
import { PHOTOS, atelierStories } from '../photos'

/**
 * La página de la bio de Instagram (`/links`). Quien llega aquí viene del perfil de Janaína con el
 * móvil en la mano y una sola idea: reservar o regalar. Así que nada de menú: su foto, su nombre y
 * botones grandes, el de reservar el primero y el más visible.
 */
export function LinksPage() {
  const { t, lang, onWhatsApp, book } = useSite()
  const next = nextOpenSession()
  const home = (section?: string) => linkTo(publicRoute({ view: 'inicio', lang, section }))
  const [story, setStory] = useState(-1)

  return (
    <div className="links">
      <header className="links-head">
        {/* El avatar con anillo, como en el perfil de Instagram: abre las stories del ateliê. */}
        <button type="button" className="story-ring is-large" onClick={() => setStory(0)} aria-label={t.stories.label}>
          <Photo className="links-avatar" src={PHOTOS.avatar} alt={t.host.photoAlt} sizes="112px" priority width={112} height={112} />
        </button>
        <span className="links-tap">{t.stories.label}</span>
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
      <CheeseBoard className="links-art board-draw" size={150} />
      {story >= 0 && <Stories stories={atelierStories(t)} start={story} onClose={() => setStory(-1)} onBook={() => { setStory(-1); next ? book(sessionId(next)) : book() }} />}
    </div>
  )
}
