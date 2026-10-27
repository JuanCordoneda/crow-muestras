import './home.css'
import { useState, type ReactNode } from 'react'
import { ArrowUpRight, BookOpen, Briefcase, CalendarDays, Check, ChevronDown, Clock, Croissant, Euro, Expand, Globe, Instagram, Footprints, Gift, Grape, Layers, Minus, PartyPopper, Plus, Quote, Slice, Sparkles, Users, UtensilsCrossed, Wine } from 'lucide-react'
import { Photo } from '../../shared/components/Photo'
import { Lightbox, type GalleryPhoto } from '../../shared/components/Lightbox'
import { cx } from '../../shared/utils'
import { ATELIE, nextOpenSession, sessionId, upcomingSessions } from '../agenda'
import { BUSINESS, SHOW_TEXT_TODO, whatsappUrl } from '../business'
import { compactCount, euros, sessionLabel, sessionParts, sessionShort } from '../format'
import { useSite } from '../site'
import { BookingForm } from '../components/BookingForm'
import { CheeseBoard, VerifiedBadge, VineLeaf, WhatsAppIcon } from '../components/Brand'
import { Figure, TodoTag } from '../components/Figure'

/** Las fotos del ateliê, sacadas del artículo de parisabor.com (enero de 2025). */
const PHOTOS = {
  hero: '/img/atelie/tabua-queijos.webp',
  table: '/img/atelie/mesa-atelie.webp',
  board: '/img/atelie/tabua-paes-queijos.webp',
  janaina: '/img/atelie/janaina-pedroza.webp',
}

const LIVE_ICONS = [Layers, Slice, Grape, UtensilsCrossed]
const GROUP_ICONS = [Briefcase, PartyPopper, Wine]
const MORE_ICONS = [Croissant, BookOpen, Footprints]

/** Un enlace de WhatsApp con su mensaje y su aviso a la analítica. */
function WaLink({ message, source, className, children }: { message: string; source: string; className?: string; children: ReactNode }) {
  const { onWhatsApp } = useSite()
  return (
    <a className={className} href={whatsappUrl(message)} target="_blank" rel="noopener noreferrer" onClick={onWhatsApp(source)}>
      {children}
    </a>
  )
}

export function HomePage() {
  const { t, lang, book } = useSite()
  const sessions = upcomingSessions()
  const next = nextOpenSession()
  const [giftPeople, setGiftPeople] = useState(2)
  /** La foto abierta a pantalla completa (-1: ninguna). */
  const [photo, setPhoto] = useState(-1)
  const gallery: GalleryPhoto[] = [
    { id: 'tabua', src: PHOTOS.hero, caption: t.hero.photoAlt },
    { id: 'mesa', src: PHOTOS.table, caption: t.live.photoAlt },
    { id: 'paes', src: PHOTOS.board, caption: t.live.photoAlt2 },
  ]
  const followers = compactCount(BUSINESS.followers, lang)

  return (
    <>
      {/* ---------- héroe ---------- */}
      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-media">
          <Photo className="hero-shot is-on" src={PHOTOS.hero} alt={t.hero.photoAlt} sizes="100vw" priority />
        </div>
        <div className="hero-content">
          <a className="hero-byline" href={BUSINESS.instagram} target="_blank" rel="noopener noreferrer">
            <img src="/img/atelie/janaina-avatar-240.webp" alt="" width={34} height={34} decoding="async" />
            <span>{t.hero.byline}</span>
            <VerifiedBadge size={15} label={t.host.verified} />
            <small>{followers}</small>
          </a>
          <h1 id="hero-title">{t.hero.titleA} <em>{t.hero.titleB}</em></h1>
          <p className="hero-text">{t.hero.text}</p>
          <ul className="hero-chips">
            <li><Clock size={16} /> {t.hero.duration}</li>
            <li><Users size={16} /> {t.hero.group}</li>
            <li><Euro size={16} /> {t.hero.price(ATELIE.price)}</li>
          </ul>
          <div className="hero-actions">
            <a className="btn btn-primary btn-lg" href="#reservar">{t.hero.book}</a>
            <a className="btn btn-light btn-lg" href="#datas">{t.hero.dates}</a>
          </div>
          {next && (
            <button type="button" className="hero-next" onClick={() => book(sessionId(next))}>
              <CalendarDays size={16} />
              <span>{t.hero.next} <b>{sessionShort(next, lang)}</b></span>
              <em>{t.dates.left(next.left, ATELIE.maxPeople)}</em>
            </button>
          )}
        </div>
      </section>

      {/* ---------- o que você vai viver ---------- */}
      <section className="live" id="atelie" aria-labelledby="live-title">
        <div className="section-head">
          <span className="eyebrow">{t.live.eyebrow}</span>
          <h2 id="live-title">{t.live.title}</h2>
          <p>{t.live.lead}</p>
        </div>
        <ol className="live-list">
          {t.live.items.map((item, index) => {
            const Icon = LIVE_ICONS[index] ?? Sparkles
            return (
              <li key={item.title} className="live-item">
                <span className="live-icon"><Icon size={22} strokeWidth={1.6} /></span>
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </li>
            )
          })}
        </ol>
        <div className="live-photos">
          <button type="button" className="live-photo is-a" onClick={() => setPhoto(1)} aria-label={`${t.live.gallery}: ${t.live.photoAlt}`}>
            <Figure src={PHOTOS.table} alt={t.live.photoAlt} sizes="(min-width: 761px) 30vw, 60vw" />
          </button>
          <button type="button" className="live-photo is-b" onClick={() => setPhoto(2)} aria-label={`${t.live.gallery}: ${t.live.photoAlt2}`}>
            <Figure src={PHOTOS.board} alt={t.live.photoAlt2} sizes="(min-width: 761px) 24vw, 45vw" />
          </button>
          <button type="button" className="live-gallery" onClick={() => setPhoto(0)}><Expand size={16} /> {t.live.gallery} · {gallery.length}</button>
        </div>
        <p className="partner-line"><VineLeaf size={22} /> {t.host.partner}</p>
      </section>

      {/* ---------- com quem ---------- */}
      <section className="host" id="janaina" aria-labelledby="host-title">
        <div className="host-photo">
          <Figure src={PHOTOS.janaina} alt={t.host.photoAlt} sizes="(min-width: 761px) 40vw, 100vw" />
        </div>
        <div className="host-body">
          <div className="section-head">
            <span className="eyebrow">{t.host.eyebrow}</span>
            <h2 id="host-title">{t.host.title}</h2>
          </div>
          <p className="host-role">{t.host.role}</p>
          <p className="host-text">{t.host.text}</p>
          <div className="host-cards">
            <a className="host-card" href={BUSINESS.instagram} target="_blank" rel="noopener noreferrer">
              <b>{followers}</b>
              <span>{t.host.followers}</span>
              <small>{BUSINESS.instagramHandle} <VerifiedBadge size={14} label={t.host.verified} /></small>
            </a>
            <a className="host-card is-post" href={BUSINESS.atelierPost} target="_blank" rel="noopener noreferrer">
              <span className="host-post-thumb"><img src="/img/atelie/mesa-atelie-240.webp" alt="" width={120} height={160} loading="lazy" decoding="async" /><Instagram size={18} /></span>
              <span>{t.host.post} <ArrowUpRight size={15} /></span>
              <small>{t.host.postNote}</small>
            </a>
            <div className="host-card is-partner">
              <VineLeaf size={26} />
              <span>{t.host.partner}</span>
              <small>{t.host.partnerNote}</small>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- próximas datas ---------- */}
      <section className="dates" id="datas" aria-labelledby="dates-title">
        <div className="section-head">
          <span className="eyebrow">{t.dates.eyebrow}</span>
          <h2 id="dates-title">{t.dates.title}</h2>
          <p>{t.dates.lead}</p>
          <p className="dates-tz"><Globe size={15} /> {t.dates.parisTime}</p>
        </div>
        {sessions.length ? (
          <ul className="dates-list">
            {sessions.map((session) => {
              const parts = sessionParts(session, lang)
              const full = session.left <= 0
              const low = !full && session.left <= 3
              return (
                <li key={sessionId(session)} className={cx('date-card', full && 'is-full', low && 'is-low')}>
                  <div className="date-day" aria-hidden="true">
                    <small>{parts.weekday}</small>
                    <b>{parts.day}</b>
                    <small>{parts.month}</small>
                  </div>
                  <div className="date-body">
                    <strong><span className="sr-only">{sessionLabel(session, lang)}</span><span aria-hidden="true">{parts.time}</span></strong>
                    <span className="date-left">{full ? t.dates.full : t.dates.left(session.left, ATELIE.maxPeople)}</span>
                    <span className="seats" aria-hidden="true">
                      {Array.from({ length: ATELIE.maxPeople }, (_, index) => <i key={index} className={cx(index >= ATELIE.maxPeople - session.left && 'is-free')} />)}
                    </span>
                  </div>
                  {full ? (
                    <WaLink className="btn btn-ghost btn-sm" message={t.wa.waitlist(sessionLabel(session, lang))} source="lista-de-espera">{t.dates.waitlist}</WaLink>
                  ) : (
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => book(sessionId(session))}>{t.dates.book}</button>
                  )}
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="dates-none">{t.dates.none}</p>
        )}
        <p className="dates-other">
          <span>{t.dates.other}</span>
          <WaLink className="text-link" message={t.wa.otherDate} source="outra-data"><WhatsAppIcon size={17} /> {t.dates.otherCta}</WaLink>
        </p>
      </section>

      {/* ---------- reserva ---------- */}
      <section className="booking" id="reservar" aria-labelledby="booking-title">
        {/* En el móvil: título, los tres pasos en una fila y el formulario enseguida; lo incluido, después. */}
        <div className="section-head booking-head">
          <span className="eyebrow">{t.booking.eyebrow}</span>
          <h2 id="booking-title">{t.booking.title}</h2>
          <p>{t.booking.lead}</p>
        </div>
        <div className="booking-how">
          <h3 className="booking-subtitle">{t.booking.stepsTitle}</h3>
          <ol className="booking-steps">
            {t.booking.steps.map((step, index) => (
              <li key={step.title}>
                <b aria-hidden="true">{index + 1}</b>
                <div><strong>{step.title}</strong><p>{step.text}</p></div>
              </li>
            ))}
          </ol>
        </div>
        <div className="booking-card card">
          <BookingForm />
        </div>
        <div className="booking-aside">
          <div className="booking-included">
            <h3 className="booking-subtitle">{t.booking.includedTitle}</h3>
            <ul>
              {t.booking.included.map((item) => <li key={item}><Check size={17} /> {item}</li>)}
            </ul>
            <p className="booking-price"><b>{euros(ATELIE.price, lang)}</b> <span>{t.hero.perPerson} · {t.hero.duration} · {t.hero.group}</span></p>
          </div>
          <CheeseBoard className="booking-art" size={170} />
        </div>
      </section>

      {/* ---------- vale-presente ---------- */}
      <section className="gift" id="presente" aria-labelledby="gift-title">
        <div className="gift-inner">
          <CheeseBoard className="gift-art" size={220} />
          <div className="section-head is-light">
            <span className="eyebrow"><Gift size={15} /> {t.gift.eyebrow}</span>
            <h2 id="gift-title">{t.gift.title}</h2>
            <p>{t.gift.text}</p>
          </div>
          <ul className="gift-points">
            {t.gift.points.map((point, index) => (
              <li key={point}><VineLeaf size={18} /> <span>{point}{SHOW_TEXT_TODO && t.gift.pointsTodo[index] && <> <TodoTag /></>}</span></li>
            ))}
          </ul>
          <div className="gift-order">
            <span id="gift-people-label">{t.gift.people}</span>
            <div className="stepper is-light" role="group" aria-labelledby="gift-people-label">
              <button type="button" onClick={() => setGiftPeople((count) => Math.max(1, count - 1))} disabled={giftPeople <= 1} aria-label={t.booking.fewer}><Minus size={18} /></button>
              <output aria-live="polite">{t.booking.peopleUnit(giftPeople)}</output>
              <button type="button" onClick={() => setGiftPeople((count) => Math.min(ATELIE.maxPeople, count + 1))} disabled={giftPeople >= ATELIE.maxPeople} aria-label={t.booking.more}><Plus size={18} /></button>
            </div>
            <small>{euros(ATELIE.price * giftPeople, lang)}</small>
          </div>
          <WaLink className="btn btn-butter btn-lg btn-block" message={t.wa.gift(giftPeople)} source="vale-presente"><WhatsAppIcon size={20} /> {t.gift.cta}</WaLink>
        </div>
      </section>

      {/* ---------- grupos e eventos privados ---------- */}
      <section className="groups" id="grupos" aria-labelledby="groups-title">
        <div className="section-head">
          <span className="eyebrow">{t.groups.eyebrow}</span>
          <h2 id="groups-title">{t.groups.title}</h2>
          <p>{t.groups.text}</p>
        </div>
        <ul className="groups-list">
          {t.groups.items.map((item, index) => {
            const Icon = GROUP_ICONS[index] ?? Sparkles
            return (
              <li key={item.title}>
                <span className="live-icon"><Icon size={20} strokeWidth={1.6} /></span>
                <div><h3>{item.title}</h3><p>{item.text}</p></div>
              </li>
            )
          })}
        </ul>
        <div className="section-foot">
          <WaLink className="btn btn-wine-ghost btn-lg" message={t.wa.groups} source="grupos"><WhatsAppIcon size={19} /> {t.groups.cta}</WaLink>
        </div>
      </section>

      {/* ---------- outras experiências ---------- */}
      <section className="more" id="experiencias" aria-labelledby="more-title">
        <div className="section-head">
          <span className="eyebrow">{t.more.eyebrow}</span>
          <h2 id="more-title">{t.more.title}</h2>
          <p>{t.more.lead}</p>
        </div>
        <ul className="more-list">
          {t.more.items.map((item, index) => {
            const Icon = MORE_ICONS[index] ?? Sparkles
            return (
              <li key={item.title} className="more-card">
                <span className="more-soon">{t.more.soon}</span>
                <span className="live-icon"><Icon size={22} strokeWidth={1.6} /></span>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <WaLink className="text-link" message={t.wa.notify(item.title)} source={`em-breve-${index + 1}`}>{t.more.notify}</WaLink>
              </li>
            )
          })}
        </ul>
      </section>

      {/* ---------- depoimentos ---------- */}
      <section className="reviews" id="depoimentos" aria-labelledby="reviews-title">
        <div className="section-head">
          <span className="eyebrow">{t.reviews.eyebrow}</span>
          <h2 id="reviews-title">{t.reviews.title}</h2>
          <p>{t.reviews.lead}</p>
        </div>
        {/* PENDIENTE: depoimentos reales (con permiso) en `reviews.items` de los tres idiomas. */}
        <ul className="reviews-list">
          {t.reviews.items.map((review, index) => (
            <li key={index} className="review is-todo" data-todo="depoimento">
              <Quote size={22} className="review-mark" />
              <blockquote>{review.quote}</blockquote>
              <footer><b>{review.name}</b><small>{review.place}</small></footer>
              {SHOW_TEXT_TODO && <span className="todo-tag">{t.reviews.todo}</span>}
            </li>
          ))}
        </ul>
      </section>

      {/* ---------- perguntas frequentes ---------- */}
      <section className="faq" id="duvidas" aria-labelledby="faq-title">
        <div className="section-head">
          <span className="eyebrow">{t.faq.eyebrow}</span>
          <h2 id="faq-title">{t.faq.title}</h2>
        </div>
        <div className="faq-list">
          {t.faq.items.map((item) => (
            <details key={item.q} className="faq-item">
              <summary><span>{item.q}</span><ChevronDown size={20} /></summary>
              <p>{item.a}{SHOW_TEXT_TODO && item.todo && <> <TodoTag /></>}</p>
            </details>
          ))}
        </div>
        <div className="faq-more">
          <strong>{t.faq.more}</strong>
          <WaLink className="btn btn-ghost" message={t.wa.generic} source="duvidas"><WhatsAppIcon size={18} /> {t.nav.talk}</WaLink>
        </div>
      </section>

      {photo >= 0 && <Lightbox photos={gallery} index={photo} onIndex={setPhoto} onClose={() => setPhoto(-1)} labels={t.live.lightbox} />}
    </>
  )
}
