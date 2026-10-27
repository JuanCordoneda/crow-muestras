import { useEffect, useState } from 'react'
import { ArrowRight, CalendarDays, Clock, MapPin, Navigation, Pause, Play, TrainFront, UtensilsCrossed } from 'lucide-react'
import { openState } from '../../shared/hours'
import { linkTo, publicRoute } from '../../shared/routing'
import { cx, directionsLink, whatsappLink } from '../../shared/utils'
import { Photo } from '../../shared/components/Photo'
import { OpenStatus } from '../components/OpenStatus'
import { PapelPicado, StarIcon, WhatsAppIcon } from '../components/Brand'
import { PhotoSoon } from '../components/PhotoSoon'
import { BookingSection } from '../components/BookingForm'
import { Le1492Card } from '../components/Le1492' // LE-1492
import { BOOKING_WHATSAPP, EL_SOL, MEXI, VENUES, fullAddress, say, scheduleOf, type Venue } from '../venues'
import { useSite } from '../site'
import './home.css'

/**
 * Fotos del héroe, en orden. Primero el lustre de botellas de El Sol & La Luna: es lo que se
 * recuerda del local y, en vertical, el móvil lo recorta justo por el centro. Todas las fotos son
 * de El Sol & La Luna: de Mexi & Co y Le 1492 todavía no hay.
 */
const HERO = ['/img/grupo/sol-interieur-lustre.webp', '/img/grupo/sol-interieur-deco.webp', '/img/grupo/sol-empanadas.webp']

/** Los platos con foto de la portada: todas de El Sol & La Luna, que es de donde hay fotos. */
const DISHES = [
  { photo: '/img/grupo/sol-empanadas.webp', name: { fr: 'Empanadas & ají maison', es: 'Empanadas y ají casero' } },
  { photo: '/img/grupo/sol-burrito-guacamole.webp', name: { fr: 'Burrito, riz & guacamole', es: 'Burrito, arroz y guacamole' } },
  { photo: '/img/grupo/sol-quesadilla.webp', name: { fr: 'Quesadilla', es: 'Quesadilla' } },
  { photo: '/img/grupo/sol-burrito.webp', name: { fr: 'Burrito gratiné', es: 'Burrito gratinado' } },
]

export function HomePage({ section }: { section?: string }) {
  const { t } = useSite()

  /** Al llegar desde un enlace a un bloque (`/#le-1492`), se baja hasta él una vez pintado. */
  useEffect(() => {
    if (!section) return
    const timer = window.setTimeout(() => document.getElementById(section)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
    return () => window.clearTimeout(timer)
  }, [section])

  return (
    <>
      <Hero />
      <QuickInfo />
      <Facts />
      <Venues />
      <Dishes />
      <Events />
      <BookingSection eyebrow={t.booking.eyebrow} title={t.booking.title} text={t.booking.text} />
      <Find />
      <span className="sr-only">{t.meta.description}</span>
    </>
  )
}

function Hero() {
  const { t, menu, now } = useSite()
  /** Un punto verde en cada local que está abierto ahora mismo: se ve de un vistazo dónde ir. */
  const isOpen = (venue: Venue) => openState(scheduleOf(menu.settings, venue.hours), now).kind === 'open'
  const [slide, setSlide] = useState(0)
  /** Solo se monta la foto que toca y las ya vistas: apiladas, `loading="lazy"` no las frenaría. */
  const [seen, setSeen] = useState<number[]>([0])
  /**
   * El pase se puede parar: quien elige una foto a mano manda sobre el reloj, y hay un botón para
   * detenerlo del todo (lo pide la norma de accesibilidad para cualquier movimiento automático).
   */
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setTimeout(() => setSlide((value) => (value + 1) % HERO.length), 6000)
    return () => window.clearTimeout(timer)
  }, [slide, paused])

  useEffect(() => {
    setSeen((previous) => (previous.includes(slide) ? previous : [...previous, slide]))
  }, [slide])

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-media">
        {HERO.map((src, index) =>
          seen.includes(index) ? (
            <Photo key={src} src={src} alt={t.hero.slides[index] ?? ''} className={cx('hero-shot', index === slide && 'is-on')} sizes="100vw" priority={index === 0} />
          ) : null,
        )}
      </div>
      <div className="hero-content">
        <span className="hero-eyebrow">{t.hero.eyebrow}</span>
        <h1 id="hero-title">
          {t.hero.titleA} <em>{t.hero.titleB}</em>
        </h1>
        <p className="hero-text">{t.hero.text}</p>
        <ul className="hero-venues" aria-label={t.nav.venues}>
          {VENUES.map((venue) => (
            <li key={venue.id}>
              <a {...linkTo(publicRoute({ view: venue.id as 'el-sol-la-luna' | 'mexi-and-co' }))} aria-label={`${venue.name} · ${isOpen(venue) ? t.status.open : t.status.closed}`}>
                <i className={cx('venue-dot', isOpen(venue) && 'is-open')} aria-hidden="true" />{venue.name}
              </a>
            </li>
          ))}
          <li><a {...linkTo(publicRoute({ view: 'inicio', section: 'le-1492' }))}>Le 1492</a></li>{/* LE-1492 */}
        </ul>
        <div className="hero-actions">
          <a className="btn btn-primary btn-lg" {...linkTo(publicRoute({ view: 'reserver' }))}>
            <CalendarDays size={19} /> {t.hero.book}
          </a>
          <a className="btn btn-light btn-lg" href="#adresses">
            <UtensilsCrossed size={18} /> {t.hero.venues}
          </a>
        </div>
        <div className="hero-dots" role="group" aria-label={t.hero.photosLabel}>
          {HERO.map((src, index) => (
            <button
              type="button"
              key={src}
              aria-pressed={index === slide}
              aria-label={t.hero.slides[index]}
              className={index === slide ? 'is-on' : ''}
              onClick={() => { setSlide(index); setPaused(true) }}
            />
          ))}
          <button
            type="button"
            className="hero-pause"
            aria-pressed={paused}
            aria-label={paused ? t.hero.play : t.hero.pause}
            title={paused ? t.hero.play : t.hero.pause}
            onClick={() => setPaused((value) => !value)}
          >
            {paused ? <Play size={12} fill="currentColor" /> : <Pause size={12} fill="currentColor" />}
          </button>
        </div>
      </div>
    </section>
  )
}

/** Tres respuestas de un vistazo: cuándo abre, cómo reservar y qué metro coger. */
function QuickInfo() {
  const { t, lang } = useSite()
  return (
    <div className="quick">
      <a className="quick-item" href="#adresses">
        <span className="quick-icon"><Clock size={20} /></span>
        <span className="quick-text">
          <small>{t.quick.everyday}</small>
          <b>11:30 – 23:30</b>
        </span>
      </a>
      <a className="quick-item" href={whatsappLink(BOOKING_WHATSAPP, t.fab.message)} target="_blank" rel="noopener noreferrer">
        <span className="quick-icon is-whatsapp"><WhatsAppIcon size={20} /></span>
        <span className="quick-text">
          <small>{t.quick.whatsapp}</small>
          <b>{t.quick.whatsappText}</b>
        </span>
      </a>
      <a className="quick-item" href={directionsLink(`${EL_SOL.name}, ${fullAddress(EL_SOL)}`)} target="_blank" rel="noopener noreferrer" lang={lang}>
        <span className="quick-icon"><TrainFront size={20} /></span>
        <span className="quick-text">
          <small>{t.quick.metro}</small>
          <b>{t.quick.metroText}</b>
        </span>
      </a>
    </div>
  )
}

/** Tres datos grandes que venden solos: cuántas direcciones, todos los días y la nota de Google. */
function Facts() {
  const { t, lang } = useSite()
  const rating = EL_SOL.rating
  return (
    <ul className="facts" aria-label={t.facts.label}>
      <li><b>3</b><small>{t.facts.venues}</small><span>{t.facts.venuesText}</span></li>
      <li><b className="is-word">{t.facts.days}</b><span>{t.facts.daysText}</span></li>
      {rating && (
        <li>
          <b className="is-rating">{rating.score.toLocaleString(lang === 'es' ? 'es-ES' : 'fr-FR')}<StarIcon size={22} /></b>
          <small>{t.facts.rating}</small>
          <span>{t.facts.ratingText}</span>
        </li>
      )}
    </ul>
  )
}

function SectionHead({ eyebrow, title, text, id, light = false }: { eyebrow: string; title: string; text?: string; id: string; light?: boolean }) {
  return (
    <header className={cx('section-head', light && 'is-light')}>
      <span className="eyebrow">{eyebrow}</span>
      <h2 id={id}>{title}</h2>
      {text && <p>{text}</p>}
    </header>
  )
}

/** La nota de Google como chip: estrella, nota y número de reseñas. */
export function RatingChip({ venue, light = false }: { venue: Venue; light?: boolean }) {
  const { t, lang } = useSite()
  if (!venue.rating) return null
  const score = venue.rating.score.toLocaleString(lang === 'es' ? 'es-ES' : 'fr-FR')
  return (
    <a className={cx('rating-chip', light && 'is-light')} href={venue.maps} target="_blank" rel="noopener noreferrer" aria-label={`${t.venues.google} : ${t.venues.rating(score, venue.rating.count)}`}>
      <StarIcon size={15} /> <b>{score}</b> <span>{t.venues.rating(score, venue.rating.count).replace(`${score} `, '')}</span>
    </a>
  )
}

function VenueCard({ venue }: { venue: Venue }) {
  const { t, lang } = useSite()
  const page = publicRoute({ view: venue.id as 'el-sol-la-luna' | 'mexi-and-co' })
  return (
    <article className="venue-card" aria-labelledby={`venue-${venue.id}`}>
      <a className="venue-card-photo" {...linkTo(page)} tabIndex={-1} aria-hidden="true">
        {venue.photo
          ? <Photo src={venue.photo} alt="" sizes="(max-width: 760px) 100vw, 380px" />
          : <PhotoSoon name={venue.name} label={t.venue.photoSoon} />}
        {venue.hint && <span className="venue-card-hint">{say(venue.hint, lang)}</span>}
      </a>
      <div className="venue-card-body">
        <span className="venue-card-cuisine">{say(venue.cuisine, lang)}</span>
        <h3 id={`venue-${venue.id}`}><a {...linkTo(page)}>{venue.name}</a></h3>
        <RatingChip venue={venue} />
        <a className="venue-card-line" href={directionsLink(`${venue.name}, ${fullAddress(venue)}`)} target="_blank" rel="noopener noreferrer"><MapPin size={16} /> {fullAddress(venue)}</a>
        <OpenStatus hours={venue.hours} className="venue-card-status" />
        <div className="venue-card-actions">
          <a className="btn btn-primary" {...linkTo(publicRoute({ view: 'reserver', venue: venue.id }))}><CalendarDays size={18} /> {t.venues.book}</a>
          <a className="btn btn-ghost" {...linkTo(page)}>{t.venues.menu} <ArrowRight size={17} /></a>
        </div>
      </div>
    </article>
  )
}

function Venues() {
  const { t } = useSite()
  return (
    <section className="venues" id="adresses" aria-labelledby="venues-title">
      <SectionHead eyebrow={t.venues.eyebrow} title={t.venues.title} text={t.venues.text} id="venues-title" />
      <div className="venues-grid">
        {VENUES.map((venue) => <VenueCard key={venue.id} venue={venue} />)}
        <Le1492Card />{/* LE-1492 */}
      </div>
    </section>
  )
}

function Dishes() {
  const { t, lang } = useSite()
  const menu = publicRoute({ view: 'el-sol-la-luna' })
  return (
    <section className="featured" aria-labelledby="featured-title">
      <SectionHead eyebrow={t.dishes.eyebrow} title={t.dishes.title} id="featured-title" />
      <div className="rail">
        {DISHES.map((dish) => (
          <a key={dish.photo} className="dish-card" {...linkTo(menu)}>
            <span className="dish-card-photo">
              <Photo src={dish.photo} alt="" sizes="(max-width: 760px) 72vw, 300px" />
            </span>
            <span className="dish-card-body">
              <small>{EL_SOL.name}</small>
              <strong>{say(dish.name, lang)}</strong>
            </span>
          </a>
        ))}
      </div>
      <div className="section-foot">
        <a className="text-link" {...linkTo(menu)}>{t.dishes.all} <ArrowRight size={17} /></a>
      </div>
    </section>
  )
}

/** Grupos y eventos: el bloque oscuro de la portada, con su botón directo a WhatsApp. */
function Events() {
  const { t } = useSite()
  return (
    <section className="events" id="evenements" aria-labelledby="events-title">
      <PapelPicado />
      <div className="events-photo">
        <Photo src="/img/grupo/sol-interieur-deco.webp" alt="" sizes="(max-width: 900px) 100vw, 50vw" />
      </div>
      <div className="events-body">
        <SectionHead eyebrow={t.events.eyebrow} title={t.events.title} text={t.events.text} id="events-title" light />
        <ul className="events-list">
          {t.events.items.map((item) => (
            <li key={item.title}>
              <strong>{item.title}</strong>
              <p>{item.text}</p>
            </li>
          ))}
        </ul>
        <div className="events-actions">
          <a className="btn btn-whatsapp btn-lg" href={whatsappLink(BOOKING_WHATSAPP, t.events.message)} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon size={20} /> {t.events.cta}
          </a>
        </div>
      </div>
    </section>
  )
}

/** Dónde están: los dos locales en el mismo plano, uno enfrente del otro. */
function Find() {
  const { t, lang } = useSite()
  return (
    <section className="visit" id="acces" aria-labelledby="find-title">
      <SectionHead eyebrow={t.find.eyebrow} title={t.find.title} text={t.find.text} id="find-title" />
      <div className="visit-grid">
        <div className="card map-card">
          <a className="map" href={EL_SOL.maps} target="_blank" rel="noopener noreferrer" aria-label={t.find.openMaps}>
            <Photo src="/img/grupo/mapa-quartier.webp" alt={t.find.mapAlt} sizes="(max-width: 900px) 100vw, 50vw" />
            <small className="map-credit">{t.find.mapCredit}</small>
          </a>
        </div>
        <div className="find-list">
          {[EL_SOL, MEXI].map((venue) => (
            <div className="card find-item" key={venue.id}>
              <h3>{venue.name}</h3>
              <p className="map-address"><MapPin size={18} /> <span><b>{venue.address}</b><br />{venue.postcode} {venue.town}{venue.hint ? ` · ${say(venue.hint, lang)}` : ''}</span></p>
              {venue.metro && <p className="map-hint"><TrainFront size={15} /> {t.venue.metro} {venue.metro}</p>}
              <a className="btn btn-indigo btn-sm" href={directionsLink(`${venue.name}, ${fullAddress(venue)}`)} target="_blank" rel="noopener noreferrer"><Navigation size={16} /> {t.find.openMaps}</a>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
