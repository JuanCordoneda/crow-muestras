import { useState } from 'react'
import { ArrowLeft, CalendarDays, Clock, Images, Leaf, MapPin, Navigation, Phone, Quote, ShoppingBasket, TrainFront, UtensilsCrossed } from 'lucide-react'
import { WEEK_ORDER, hoursOn, rangesLabel, weekdayName, weekdayOf } from '../../shared/hours'
import { linkTo, publicRoute } from '../../shared/routing'
import { cx, directionsLink, telLink, whatsappLink } from '../../shared/utils'
import { Photo, srcSetFor } from '../../shared/components/Photo'
import { Lightbox, type GalleryPhoto } from '../../shared/components/Lightbox'
import { OpenStatus } from '../components/OpenStatus'
import { PapelPicado, StarIcon, WhatsAppIcon } from '../components/Brand'
import { PhotoSoon } from '../components/PhotoSoon'
import { BookingSection } from '../components/BookingForm'
import { BOOKING_WHATSAPP, fullAddress, say, scheduleOf, type MenuItem, type Venue } from '../venues'
import { useSite } from '../site'
import { RatingChip } from './HomePage'
import './home.css'

/**
 * La página de un local: héroe, datos rápidos, carta, lo propio de cada casa (las reseñas de El
 * Sol & La Luna; la épicerie y «Votre avis compte» de Mexi & Co), fotos, horario con mapa y el
 * formulario de reserva con el local ya elegido.
 */
export function VenuePage({ venue }: { venue: Venue }) {
  const { t, lang } = useSite()
  const isSol = venue.id === 'el-sol-la-luna'
  const isMexi = venue.id === 'mexi-and-co'
  return (
    <>
      <VenueHero venue={venue} eyebrow={isSol ? t.sol.eyebrow : t.mexi.eyebrow} />
      <QuickInfo venue={venue} />
      {isSol && <Reviews venue={venue} />}
      <Carte venue={venue} />
      {isMexi && <Shop />}
      {isMexi && <AskReview venue={venue} />}
      {venue.gallery?.length ? <Gallery venue={venue} /> : null}
      <Visit venue={venue} />
      <BookingSection
        id="reserver"
        initialVenue={venue.id}
        eyebrow={t.venue.bookEyebrow}
        title={t.venue.bookTitle(venue.name)}
        text={t.venue.bookText}
      />
      <span className="sr-only">{say(venue.intro, lang)}</span>
    </>
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

function VenueHero({ venue, eyebrow }: { venue: Venue; eyebrow: string }) {
  const { t, lang } = useSite()
  return (
    <section className={cx('hero', 'is-venue', !venue.photo && 'no-photo')} aria-labelledby="hero-title">
      <div className="hero-media">
        {venue.photo && venue.photoWide ? (
          // Dirección de arte: la vertical en el móvil, la apaisada en pantallas anchas. Con
          // <picture> el navegador solo descarga la que va a pintar.
          <picture>
            <source media="(min-width: 761px)" srcSet={srcSetFor(venue.photoWide)} sizes="100vw" />
            <Photo src={venue.photo} alt="" className="hero-shot is-on" sizes="100vw" priority />
          </picture>
        ) : venue.photo
          ? <Photo src={venue.photo} alt="" className="hero-shot is-on" sizes="100vw" priority />
          : <PhotoSoon name={venue.name} label={t.venue.photoSoon} className="hero-soon" />}
      </div>
      <div className="hero-content">
        <a className="hero-back" {...linkTo(publicRoute({ view: 'inicio', section: 'adresses' }))}><ArrowLeft size={15} /> {t.venue.back}</a>
        <OpenStatus hours={venue.hours} className="hero-status" />
        <span className="hero-eyebrow">{eyebrow}</span>
        <h1 id="hero-title">
          {venue.name} <em>{say(venue.cuisine, lang)}</em>
        </h1>
        <p className="hero-text">{say(venue.intro, lang)}</p>
        <RatingChip venue={venue} light />
        <div className="hero-actions">
          <a className="btn btn-primary btn-lg" href="#reserver">
            <CalendarDays size={19} /> {t.hero.book}
          </a>
          <a className="btn btn-light btn-lg" href="#carte">
            <UtensilsCrossed size={18} /> {t.venues.menu}
          </a>
        </div>
      </div>
    </section>
  )
}

/** Tres respuestas de un vistazo: el horario de hoy, llamar y cómo llegar. */
function QuickInfo({ venue }: { venue: Venue }) {
  const { t, menu, now, lang } = useSite()
  const today = hoursOn(scheduleOf(menu.settings, venue.hours), now.date)
  return (
    <div className="quick">
      <a className="quick-item" href="#horaires">
        <span className="quick-icon"><Clock size={20} /></span>
        <span className="quick-text">
          <small>{t.quick.today}</small>
          <b>{today ? rangesLabel(today, lang) : t.status.closedDay}</b>
        </span>
      </a>
      {venue.phone && (
        <a className="quick-item" href={telLink(venue.phone)}>
          <span className="quick-icon"><Phone size={20} /></span>
          <span className="quick-text">
            <small>{t.nav.call}</small>
            <b>{venue.phone}</b>
          </span>
        </a>
      )}
      <a className="quick-item" href={directionsLink(`${venue.name}, ${fullAddress(venue)}`)} target="_blank" rel="noopener noreferrer">
        <span className="quick-icon"><Navigation size={20} /></span>
        <span className="quick-text">
          <small>{t.nav.findUs}</small>
          <b>{venue.address}</b>
        </span>
      </a>
    </div>
  )
}

/** Tres frases de reseñas de Google, con la nota al lado: lo que convence a quien duda. */
function Reviews({ venue }: { venue: Venue }) {
  const { t } = useSite()
  return (
    <section className="reviews" aria-labelledby="reviews-title">
      <SectionHead eyebrow={t.venue.reviewsEyebrow} title={t.venue.reviewsTitle} id="reviews-title" />
      <div className="reviews-rating"><RatingChip venue={venue} /></div>
      <ul className="reviews-list">
        {t.sol.reviews.map((quote) => (
          <li key={quote} className="review">
            <Quote size={22} className="review-mark" aria-hidden="true" />
            <blockquote>« {quote} »</blockquote>
            <small className="review-foot">{t.venue.reviewsSource}</small>
          </li>
        ))}
      </ul>
    </section>
  )
}

function ItemPrice({ item }: { item: MenuItem }) {
  const { t, lang } = useSite()
  const price = item.price ?? item.options?.find((option) => option.price)?.price
  const label = price ? new Intl.NumberFormat(lang === 'es' ? 'es-ES' : 'fr-FR', { style: 'currency', currency: 'EUR' }).format(price) : t.venue.priceOnSite
  return <b className={cx('carte-price', !price && 'is-onsite')}>{label}</b>
}

/** Las variantes (verre, pichet) en una línea, con su precio si lo tienen. */
function ItemOptions({ item }: { item: MenuItem }) {
  const { lang } = useSite()
  if (!item.options?.length) return null
  const format = (value: number) => new Intl.NumberFormat(lang === 'es' ? 'es-ES' : 'fr-FR', { style: 'currency', currency: 'EUR' }).format(value)
  return (
    <span className="carte-options">
      {item.options.map((option) => (
        <span key={option.label.fr}>{say(option.label, lang)}{option.price ? ` · ${format(option.price)}` : ''}</span>
      ))}
    </span>
  )
}

/**
 * La carta, en el bloque oscuro: nombre, puntos y «Prix sur place» (o el precio en cuanto lo
 * haya en `venues.ts`). Los platos con foto llevan su miniatura.
 */
function Carte({ venue }: { venue: Venue }) {
  const { t, lang } = useSite()
  return (
    <section className="carte" id="carte" aria-labelledby="carte-title">
      <PapelPicado />
      <div className="carte-inner">
        <SectionHead eyebrow={t.venue.menuEyebrow} title={t.venue.menuTitle} id="carte-title" light />
        <div className="carte-sections">
          {venue.menu.map((section) => (
            <div className="carte-section" key={section.id}>
              <h3>{say(section.title, lang)}</h3>
              {section.note && <p className="carte-note"><Leaf size={15} /> {say(section.note, lang)}</p>}
              <ul className="carte-list">
                {section.items.map((item) => (
                  <li key={item.name} className={cx(item.photo && 'has-photo')}>
                    {item.photo && (
                      <span className="carte-photo"><Photo src={item.photo} alt="" sizes="72px" /></span>
                    )}
                    <div className="carte-item">
                      <div className="carte-line">
                        <strong>{item.name}</strong>
                        <i aria-hidden="true" />
                        <ItemPrice item={item} />
                      </div>
                      <p>{say(item.description, lang)}</p>
                      <ItemOptions item={item} />
                      {(item.badge || item.veggie) && (
                        <span className="carte-tags">
                          {item.badge && <span className="carte-badge">{say(item.badge, lang)}</span>}
                          {item.veggie && <span className="carte-badge is-veggie"><Leaf size={12} /> {t.venue.veggie}</span>}
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="carte-allergens">{t.venue.allergens}</p>
      </div>
    </section>
  )
}

/** L’épicerie de Mexi & Co: lo que se puede llevar a casa y un botón para pedir por WhatsApp. */
function Shop() {
  const { t } = useSite()
  return (
    <section className="shop" aria-labelledby="shop-title">
      <div className="shop-card">
        <span className="shop-icon" aria-hidden="true"><ShoppingBasket size={26} /></span>
        <SectionHead eyebrow={t.mexi.shopEyebrow} title={t.mexi.shopTitle} text={t.mexi.shopText} id="shop-title" />
        <ul className="shop-items">
          {t.mexi.shopItems.map((item) => <li key={item}>{item}</li>)}
        </ul>
        <a className="btn btn-whatsapp btn-lg" href={whatsappLink(BOOKING_WHATSAPP, t.mexi.takeawayMessage)} target="_blank" rel="noopener noreferrer">
          <WhatsAppIcon size={20} /> {t.mexi.takeaway}
        </a>
      </div>
    </section>
  )
}

/** «Votre avis compte»: en vez de enseñar la nota, se pide la reseña a quien ya ha venido. */
function AskReview({ venue }: { venue: Venue }) {
  const { t } = useSite()
  return (
    <section className="social" aria-labelledby="ask-title">
      <span className="social-stars" aria-hidden="true">{[0, 1, 2, 3, 4].map((index) => <StarIcon key={index} size={22} />)}</span>
      <h2 id="ask-title">{t.mexi.reviewTitle}</h2>
      <p>{t.mexi.reviewText}</p>
      <div className="social-actions">
        <a className="btn btn-primary btn-lg" href={venue.maps} target="_blank" rel="noopener noreferrer"><StarIcon size={18} /> {t.mexi.reviewCta}</a>
      </div>
    </section>
  )
}

function Gallery({ venue }: { venue: Venue }) {
  const { t, lang } = useSite()
  const [open, setOpen] = useState<number | null>(null)
  const photos: GalleryPhoto[] = (venue.gallery ?? []).map((photo) => ({ id: photo.src, src: photo.src, caption: say(photo.caption, lang) }))
  return (
    <section className="place" aria-labelledby="place-title">
      <SectionHead eyebrow={t.venue.galleryEyebrow} title={t.venue.galleryTitle} id="place-title" />
      <div className="mosaic">
        {photos.slice(0, 5).map((photo, index) => (
          <button type="button" key={photo.id} className={`mosaic-item is-${index}`} onClick={() => setOpen(index)} aria-label={photo.caption}>
            <Photo src={photo.src} alt="" sizes={index === 0 ? '(max-width: 760px) 100vw, 50vw' : '(max-width: 760px) 50vw, 25vw'} />
            {index === 4 && photos.length > 5 && (
              <span className="mosaic-more"><Images size={16} /> {t.venue.seeAll(photos.length)}</span>
            )}
          </button>
        ))}
      </div>
      {open !== null && <Lightbox photos={photos} index={open} onIndex={setOpen} onClose={() => setOpen(null)} labels={t.lightbox} />}
    </section>
  )
}

function Visit({ venue }: { venue: Venue }) {
  const { t, lang, menu, now } = useSite()
  const todayWeekday = weekdayOf(now.date)
  const directions = directionsLink(`${venue.name}, ${fullAddress(venue)}`)
  const schedule = scheduleOf(menu.settings, venue.hours)
  const closedToday = !hoursOn(schedule, now.date)

  return (
    <section className="visit" id="horaires" aria-labelledby="visit-title">
      <SectionHead eyebrow={t.venue.visitEyebrow} title={t.venue.visitTitle} id="visit-title" />
      <div className="visit-grid">
        <div className="card hours-card">
          <div className="hours-head">
            <h3>{t.venue.hoursTitle}</h3>
            <OpenStatus hours={venue.hours} />
          </div>
          <ul className="hours-list">
            {WEEK_ORDER.map((weekday) => {
              const day = venue.hours[weekday]
              const isToday = weekday === todayWeekday
              return (
                <li key={weekday} className={cx(isToday && 'is-today', (!day || day.closed) && 'is-closed')}>
                  <span>
                    {weekdayName(weekday, lang)}
                    {isToday && <em>{t.venue.today}</em>}
                  </span>
                  <b>{isToday && closedToday ? t.venue.closed : day && !day.closed ? rangesLabel(day, lang, ' – ') : t.venue.closed}</b>
                </li>
              )
            })}
          </ul>
          {venue.metro && <p className="hours-services"><span><TrainFront size={15} /> {t.venue.metro} {venue.metro}</span></p>}
        </div>

        <div className="card map-card">
          <a className="map" href={venue.maps} target="_blank" rel="noopener noreferrer" aria-label={t.venue.openMaps}>
            <Photo src="/img/grupo/mapa-quartier.webp" alt={t.find.mapAlt} sizes="(max-width: 900px) 100vw, 50vw" />
            <small className="map-credit">{t.find.mapCredit}</small>
          </a>
          <div className="map-body">
            <p className="map-address"><MapPin size={18} /> <span><b>{venue.address}</b><br />{venue.postcode} {venue.town}</span></p>
            {venue.hint && <p className="map-hint">{say(venue.hint, lang)}</p>}
            <div className="map-actions">
              <a className="btn btn-indigo" href={directions} target="_blank" rel="noopener noreferrer"><Navigation size={18} /> {t.venue.openMaps}</a>
              {venue.phone && <a className="btn btn-ghost" href={telLink(venue.phone)}><Phone size={18} /> {venue.phone}</a>}
              {venue.whatsapp && (
                <a className="btn btn-ghost" href={whatsappLink(venue.whatsapp, t.fab.message)} target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={18} /> {venue.whatsapp}</a>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
