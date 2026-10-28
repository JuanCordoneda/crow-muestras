import { useEffect, useState } from 'react'
import { ArrowRight, Check, Clock, Instagram, Mail, MapPin, Navigation, Phone, ShieldCheck } from 'lucide-react'
import { linkTo, publicRoute } from '../../shared/routing'
import { Photo } from '../../shared/components/Photo'
import { cx } from '../../shared/utils'
import { BUSINESS, directionsUrl, telUrl, whatsappUrl } from '../business'
import { TREATMENTS, type Treatment, type TreatmentGroup } from '../treatments'
import { RoundBadge, Stars, WhatsAppIcon } from '../components/Brand'
import { Figure } from '../components/Figure'
import { Flag } from '../components/LangPicker'
import { BookingForm } from '../components/BookingForm'
import { useSite } from '../site'
import './home.css'
import { withBase } from '../../shared/base'

type Track = (source: string) => () => void

export function HomePage({ onWhatsApp }: { onWhatsApp: Track }) {
  return (
    <>
      <Hero onWhatsApp={onWhatsApp} />
      <TrustStrip />
      <Marquee />
      <Specialty />
      <Treatments />
      <Steps onWhatsApp={onWhatsApp} />
      <About />
      <Reviews />
      <Booking />
      <Faq />
      <Visit onWhatsApp={onWhatsApp} />
    </>
  )
}

export function SectionHead({ eyebrow, title, text, id, center = false }: { eyebrow: string; title: string; text?: string; id: string; center?: boolean }) {
  return (
    <header className={cx('section-head', center && 'is-center')}>
      <span className="eyebrow">{eyebrow}</span>
      <h2 id={id}>{title}</h2>
      {text && <p>{text}</p>}
    </header>
  )
}

/** El chip de Google: estrellas, nota y enlace a la ficha, donde se leen todas las reseñas. */
export function RatingChip({ className }: { className?: string }) {
  const { t } = useSite()
  return (
    <a className={cx('rating-chip', className)} href={BUSINESS.googleMaps} target="_blank" rel="noopener noreferrer" title={t.hero.ratingAria}>
      <Stars label="" size={14} />
      <span>{t.hero.rating}</span>
    </a>
  )
}

function Hero({ onWhatsApp }: { onWhatsApp: Track }) {
  const { t, lang } = useSite()
  /**
   * Media clientela es extranjera: el otro idioma se ofrece siempre, como una píldora con su bandera
   * a la vista (en el móvil, sobre la foto). Es un enlace y nunca salta solo: Google lee la portada
   * en castellano y así tiene que seguir. Va ya en el HTML, así que no mueve nada al cargar.
   */
  const other = lang === 'es' ? 'en' : 'es'

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="hero-media">
        <Photo
          src="/img/sculptdetox/michele-costa-retrato.webp"
          alt={t.hero.photoAlt}
          className="hero-shot"
          sizes="(min-width: 1024px) 600px, 100vw"
          priority
          width={1200}
          height={1324}
        />
        <RoundBadge text={t.badge} className="hero-badge" />
      </div>
      <div className="hero-content">
        <a className="hero-lang" href={withBase(other === 'en' ? '/en' : '/')} hrefLang={other} lang={other}>
          <Flag code={other} /> {t.hero.langHint} <ArrowRight size={14} aria-hidden="true" />
        </a>
        <RatingChip className="hero-rating" />
        <p className="hero-eyebrow">{t.hero.eyebrow}</p>
        <h1 id="hero-title">
          {t.hero.titleA}{' '}
          <em>
            {t.hero.titleB}
            {/* Un trazo dorado a mano bajo «sin cirugía», que se dibuja al abrir la web. */}
            <svg className="scribble" viewBox="0 0 320 22" preserveAspectRatio="none" aria-hidden="true" focusable="false">
              <path d="M3 15 C 70 5, 150 3, 210 8 S 300 16, 317 9" />
            </svg>
          </em>
        </h1>
        <p className="hero-text">{t.hero.text}</p>
        <div className="hero-actions">
          <a className="btn btn-primary btn-lg" href={whatsappUrl(t.wa.generic)} target="_blank" rel="noopener noreferrer" onClick={onWhatsApp('portada')}>
            <WhatsAppIcon size={20} /> {t.hero.book}
          </a>
          <a className="btn btn-light btn-lg" {...linkTo(publicRoute({ view: 'inicio', lang, section: 'tratamientos' }))}>
            {t.hero.treatments}
          </a>
        </div>
      </div>
    </section>
  )
}

/**
 * Cuatro motivos de un vistazo, justo debajo del héroe: la nota de Google, la experiencia, dónde
 * está y en qué idiomas atiende. Es lo que decide si quien llega de un anuncio sigue bajando.
 */
export function TrustStrip({ compact = false }: { compact?: boolean }) {
  const { t } = useSite()
  const items = compact ? t.trust.items.slice(1) : t.trust.items
  return (
    <ul className={cx('trust', compact && 'is-compact')} aria-label={t.trust.label}>
      {items.map((item, index) => (
        <li key={item.text}>
          <b>{item.value}{!compact && index === 0 && <Stars label="" size={12} />}</b>
          <span>{item.text}</span>
        </li>
      ))}
    </ul>
  )
}

/**
 * Una cinta que pasa despacio con los nombres de los tratamientos: da ritmo entre bloques y,
 * de paso, enseña de un vistazo todo lo que se hace. Es decoración (la lista de verdad está más
 * abajo), así que el lector de pantalla la salta; con menos movimiento, se queda quieta.
 */
function Marquee() {
  const { t, lang } = useSite()
  const names = TREATMENTS.map((treatment) => treatment.name[lang])
  const row = (copy: number) => (
    <span className="marquee-row" key={copy}>
      {names.map((name) => <span key={name}>{name}<i>✦</i></span>)}
    </span>
  )
  return (
    <div className="marquee" aria-label={t.marquee} role="img">
      <div className="marquee-track" aria-hidden="true">{row(0)}{row(1)}</div>
    </div>
  )
}

/**
 * «¿Qué te gustaría conseguir?»: se elige un objetivo y salen los tratamientos por los que
 * empezar, con su precio y su botón de reserva. Para quien llega de un anuncio sin saber qué es
 * la maderoterapia, es más fácil elegir por lo que quiere que por el nombre de una técnica.
 */
function Finder() {
  const { t, lang, book } = useSite()
  const copy = t.finder
  const labels = usePriceLabels()
  const [goalId, setGoalId] = useState(copy.goals[0].id)
  const goal = copy.goals.find((entry) => entry.id === goalId) ?? copy.goals[0]
  const picks = goal.ids.map((id) => TREATMENTS.find((item) => item.id === id)).filter(Boolean) as Treatment[]

  return (
    <div className="finder reveal" role="group" aria-labelledby="finder-title">
      <div className="finder-head">
        <span className="eyebrow">{copy.eyebrow}</span>
        <h3 id="finder-title">{copy.title}</h3>
        <p>{copy.text}</p>
      </div>
      <div className="finder-goals" role="radiogroup" aria-label={copy.label}>
        {copy.goals.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="radio"
            aria-checked={entry.id === goalId}
            className={cx('finder-goal', entry.id === goalId && 'is-on')}
            onClick={() => setGoalId(entry.id)}
          >
            {entry.label}
          </button>
        ))}
      </div>
      <div className="finder-result" aria-live="polite">
        <p className="finder-goal-text">{goal.text}</p>
        <span className="finder-result-label">{copy.result}</span>
        <ol className="finder-picks">
          {picks.map((item, index) => (
            <li key={item.id} className="finder-pick" style={{ animationDelay: `${index * 70}ms` }}>
              <span className="finder-pick-index" aria-hidden="true">{index + 1}</span>
              <div className="finder-pick-body">
                <strong>{item.name[lang]}</strong>
                <span className="finder-pick-meta">{item.tiers ? labels.line(item.tiers[0].price, item.tiers[0].minutes) : labels.line(item.price, item.minutes)}</span>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => book(item.tiers ? undefined : item.id)} aria-label={t.treatments.bookAria(item.name[lang])}>
                {t.treatments.book}
              </button>
            </li>
          ))}
        </ol>
        {goal.id === 'lipedema' && (
          <a className="text-link" {...linkTo(publicRoute({ view: 'lipedema', lang }))}>{copy.lipedema} <ArrowRight size={16} /></a>
        )}
      </div>
    </div>
  )
}

/** La especialidad, en grande: lipedema y post-operatorio, con su aviso y su página propia. */
function Specialty() {
  const { t, lang, book } = useSite()
  const copy = t.specialty
  return (
    <section className="specialty" id="especialidad" aria-labelledby="specialty-title">
      <div className="specialty-photo">
        <Figure src="/img/sculptdetox/antes-despues-lipedema-logo.webp" alt={copy.photoAlt} sizes="(min-width: 900px) 44vw, 100vw" width={1080} height={1350} />
      </div>
      <div className="specialty-body">
        <SectionHead eyebrow={copy.eyebrow} title={copy.title} id="specialty-title" />
        <p className="specialty-lead">{copy.lead}</p>
        <p className="specialty-text">{copy.text}</p>
        <ul className="ticks">
          {copy.points.map((point) => <li key={point}><Check size={17} aria-hidden="true" /> {point}</li>)}
        </ul>
        <p className="disclaimer"><ShieldCheck size={18} aria-hidden="true" /> {copy.disclaimer}</p>
        <div className="specialty-actions">
          <a className="btn btn-sage btn-lg" {...linkTo(publicRoute({ view: 'lipedema', lang }))}>{copy.more} <ArrowRight size={18} /></a>
          <button type="button" className="btn btn-ghost btn-lg" onClick={() => book('drenaje-brasileno')}>{copy.book}</button>
        </div>
      </div>
    </section>
  )
}

const LOCALES = { es: 'es-ES', en: 'en-GB' } as const

export function usePriceLabels() {
  const { t, lang } = useSite()
  const money = (value: number) =>
    new Intl.NumberFormat(LOCALES[lang], { style: 'currency', currency: 'EUR', minimumFractionDigits: Number.isInteger(value) ? 0 : 2 }).format(value)
  /** Sin precio en `treatments.ts`: «Consultar precio». En cuanto lo tenga, «Desde 45 €». */
  const price = (value: number | null) => (value === null ? t.treatments.priceOnRequest : t.treatments.from(money(value)))
  /** Sin duración no se enseña nada: devuelve `null` y quien la pinta se la salta. */
  const minutes = (value: number | null) => (value === null ? null : t.treatments.minutes(value))
  return {
    price,
    minutes,
    /** Precio y duración en una línea («Desde 45 € · 60 min»), sin el punto si falta la duración. */
    line: (amount: number | null, length: number | null) => [price(amount), minutes(length)].filter(Boolean).join(' · '),
  }
}

function TreatmentCard({ treatment, index }: { treatment: Treatment; index: number }) {
  const { t, lang, book } = useSite()
  const labels = usePriceLabels()
  const name = treatment.name[lang]
  return (
    <article className={cx('treatment', treatment.tiers && 'has-tiers')} id={`t-${treatment.id}`}>
      {treatment.photo && (
        <span className="treatment-photo"><Photo src={treatment.photo} alt="" sizes="(min-width: 900px) 30vw, 90vw" /></span>
      )}
      <span className="treatment-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
      <h3>{name}</h3>
      <p>{treatment.text[lang]}</p>
      {treatment.tiers ? (
        <ul className="tiers" aria-label={t.treatments.tiersLabel}>
          {treatment.tiers.map((tier) => (
            <li key={tier.id}>
              <div className="tier-head">
                <strong>{tier.name[lang].replace(/^Hydrafacial /, '')}</strong>
                <span className="tier-meta">{labels.line(tier.price, tier.minutes)}</span>
              </div>
              <p>{tier.text[lang]}</p>
              <button type="button" className="text-link" onClick={() => book(tier.id)} aria-label={t.treatments.bookAria(tier.name[lang])}>
                {t.treatments.book} <ArrowRight size={15} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="treatment-foot">
          <dl className="treatment-meta">
            <div><dt>{t.treatments.priceLabel}</dt><dd>{labels.price(treatment.price)}</dd></div>
            {treatment.minutes !== null && (
              <div><dt>{t.treatments.durationLabel}</dt><dd><Clock size={14} aria-hidden="true" /> {labels.minutes(treatment.minutes)}</dd></div>
            )}
          </dl>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => book(treatment.id)} aria-label={t.treatments.bookAria(name)}>
            {t.treatments.book}
          </button>
        </div>
      )}
    </article>
  )
}

function TreatmentGrid({ group }: { group: TreatmentGroup }) {
  const list = TREATMENTS.filter((treatment) => treatment.group === group)
  return (
    <div className={cx('treatment-grid', `is-${group}`)}>
      {list.map((treatment, index) => <TreatmentCard key={treatment.id} treatment={treatment} index={index} />)}
    </div>
  )
}

/**
 * Corporales y faciales en dos pestañas: en el móvil, las dieciséis tarjetas seguidas eran casi
 * diez pantallas. Las dos listas van en el HTML (Google lee las dos); la que no toca, oculta.
 * `/#faciales` abre directamente la de faciales.
 */
function Treatments() {
  const { t } = useSite()
  const copy = t.treatments
  const [group, setGroup] = useState<TreatmentGroup>('corporal')
  useEffect(() => {
    const sync = () => { if (window.location.hash === '#faciales') setGroup('facial') }
    sync()
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])
  const tabs: { id: TreatmentGroup; label: string; count: number }[] = [
    { id: 'corporal', label: copy.tabBody, count: TREATMENTS.filter((item) => item.group === 'corporal').length },
    { id: 'facial', label: copy.tabFacial, count: TREATMENTS.filter((item) => item.group === 'facial').length },
  ]
  /** Flechas izquierda y derecha entre pestañas, como pide el patrón de pestañas accesibles. */
  const onKey = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    const next = group === 'corporal' ? 'facial' : 'corporal'
    setGroup(next)
    document.getElementById(`tab-${next}`)?.focus()
  }

  return (
    <section className="treatments" id="tratamientos" aria-labelledby="treatments-title">
      <SectionHead eyebrow={copy.eyebrow} title={copy.title} text={copy.text} id="treatments-title" />
      <Finder />
      <div className="treatment-tabs" role="tablist" aria-label={copy.tabsLabel}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            id={`tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={group === tab.id}
            aria-controls={tab.id === 'corporal' ? 'corporales' : 'faciales'}
            tabIndex={group === tab.id ? 0 : -1}
            className={cx(group === tab.id && 'is-on')}
            onClick={() => setGroup(tab.id)}
            onKeyDown={onKey}
          >
            {tab.label} <small>{tab.count}</small>
          </button>
        ))}
      </div>

      <div id="corporales" role="tabpanel" aria-labelledby="tab-corporal" hidden={group !== 'corporal'}>
        <TreatmentGrid group="corporal" />
      </div>

      <div className="facial" id="faciales" role="tabpanel" aria-labelledby="tab-facial" hidden={group !== 'facial'}>
        <div className="facial-head">
          <SectionHead eyebrow={copy.facialEyebrow} title={copy.facialTitle} text={copy.facialText} id="facial-title" />
          <Figure className="facial-photo" alt={copy.facialPhotoAlt} todo={copy.facialPhotoTodo} />
        </div>
        <TreatmentGrid group="facial" />
      </div>

      <div className="results reveal">
        <div className="results-photo">
          <Photo src="/img/sculptdetox/antes-despues-piernas-cliente.webp" alt={copy.resultsAlt} sizes="(min-width: 900px) 50vw, 100vw" width={1500} height={1201} />
        </div>
        <div className="results-body">
          <span className="eyebrow">{copy.resultsEyebrow}</span>
          <h3>{copy.resultsTitle}</h3>
          <p>{copy.resultsText}</p>
        </div>
      </div>
    </section>
  )
}

/**
 * Sin foto a propósito: la que había era una imagen generada con IA. Cuando Michele mande una real
 * de la evaluación, vuelve a su lado (`.steps-photo`, con el arco abajo).
 */
function Steps({ onWhatsApp }: { onWhatsApp: Track }) {
  const { t } = useSite()
  const copy = t.steps
  return (
    <section className="steps" id="como-funciona" aria-labelledby="steps-title">
      <div className="steps-body">
        <SectionHead eyebrow={copy.eyebrow} title={copy.title} id="steps-title" />
        <StepList />
        <a className="btn btn-primary btn-lg steps-cta" href={whatsappUrl(t.wa.generic)} target="_blank" rel="noopener noreferrer" onClick={onWhatsApp('como-funciona')}>
          <WhatsAppIcon size={20} /> {copy.cta}
        </a>
      </div>
    </section>
  )
}

export function StepList() {
  const { t } = useSite()
  return (
    <ol className="step-list">
      {t.steps.items.map((step, index) => (
        <li key={step.title} className="step">
          <span className="step-number" aria-hidden="true">{index + 1}</span>
          <div>
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

function About() {
  const { t } = useSite()
  const copy = t.about
  return (
    <section className="about" id="michele" aria-labelledby="about-title">
      <div className="about-photos">
        <Figure className="about-main" src="/img/sculptdetox/michele-costa-retrato.webp" alt={copy.photoAlt} sizes="(min-width: 900px) 34vw, 78vw" width={1200} height={1324} />
        <Figure className="about-second" src="/img/sculptdetox/michele-costa-productos-curcuma.webp" alt={copy.productsAlt} sizes="(min-width: 900px) 16vw, 40vw" width={1200} height={1304} />
        <span className="about-years"><b>{copy.years}</b> {copy.yearsLabel}</span>
      </div>
      <div className="about-body">
        <span className="eyebrow">{copy.eyebrow}</span>
        <h2 id="about-title">{copy.title}</h2>
        <p className="about-role">{copy.role}</p>
        {copy.paragraphs.map((paragraph) => <p key={paragraph} className="about-text">{paragraph}</p>)}
        {/* La formación sale cuando Michele confirme centro y año: un «(pendiente)» a la vista suena a borrador. */}
        {!copy.training.some((item) => /pendiente|to be added/i.test(item)) && (
          <div className="training">
            <h3>{copy.trainingTitle}</h3>
            <ul>
              {copy.training.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}

export function ReviewCard({ index }: { index: number }) {
  const { t } = useSite()
  const item = t.reviews.items[index]
  return (
    <figure className="review">
      <Stars label={t.reviews.stars} />
      <blockquote><p>«{item.quote}»</p></blockquote>
      {item.original && (
        <p className="review-original"><span>{t.reviews.original}</span> <i lang="en">“{item.original}”</i></p>
      )}
      <figcaption>{t.reviews.source}</figcaption>
    </figure>
  )
}

/**
 * La reseña destacada, en grande: es la que mejor cuenta que las clientas repiten. El texto es el
 * de la reseña tal cual (en castellano, con el original en inglés debajo) y firma «Reseña de
 * Google», igual que las demás: la reseña no lleva nombre.
 */
function PullQuote({ index }: { index: number }) {
  const { t } = useSite()
  const item = t.reviews.items[index]
  return (
    <figure className="pull-quote">
      <span className="pull-quote-mark" aria-hidden="true">“</span>
      <blockquote><p>{item.quote}</p></blockquote>
      {item.original && (
        <p className="review-original"><span>{t.reviews.original}</span> <i lang="en">“{item.original}”</i></p>
      )}
      <figcaption><Stars label={t.reviews.stars} size={15} /> {t.reviews.source}</figcaption>
    </figure>
  )
}

function Reviews() {
  const { t, lang } = useSite()
  const copy = t.reviews
  return (
    <section className="reviews" id="opiniones" aria-labelledby="reviews-title">
      <SectionHead eyebrow={copy.eyebrow} title={copy.title} text={copy.text} id="reviews-title" center />
      <div className="reviews-score">
        <b>{lang === 'es' ? '5,0' : '5.0'}</b>
        <Stars label={t.hero.ratingAria} size={20} />
        <span>Google</span>
      </div>
      <PullQuote index={copy.featured} />
      <div className="review-grid">
        {copy.items.map((_, index) => index !== copy.featured && <ReviewCard key={index} index={index} />)}
      </div>
      <div className="reviews-actions">
        <a className="btn btn-ghost btn-lg" href={BUSINESS.googleMaps} target="_blank" rel="noopener noreferrer">
          <Stars label="" size={15} /> {copy.leave}
        </a>
      </div>
    </section>
  )
}

function Booking() {
  const { t } = useSite()
  const copy = t.booking
  return (
    <section className="booking" id="reservar" aria-labelledby="booking-title">
      <div className="booking-intro">
        <SectionHead eyebrow={copy.eyebrow} title={copy.title} text={copy.text} id="booking-title" />
        <ul className="booking-facts">
          <li><Clock size={17} aria-hidden="true" /> {t.visit.hours} · {t.visit.hoursNote}</li>
          <li><MapPin size={17} aria-hidden="true" /> {BUSINESS.street}, {BUSINESS.town}</li>
        </ul>
      </div>
      <div className="booking-card">
        <BookingForm />
      </div>
    </section>
  )
}

export function FaqList({ ids }: { ids?: number[] }) {
  const { t } = useSite()
  const items = ids ? ids.map((id) => t.faq.items[id]) : t.faq.items
  return (
    <div className="faq-list">
      {items.map((item) => (
        <details key={item.q} className="faq-item">
          <summary><h3>{item.q}</h3><span className="faq-toggle" aria-hidden="true" /></summary>
          <p>{item.a}</p>
        </details>
      ))}
    </div>
  )
}

function Faq() {
  const { t } = useSite()
  return (
    <section className="faq" id="preguntas" aria-labelledby="faq-title">
      <SectionHead eyebrow={t.faq.eyebrow} title={t.faq.title} id="faq-title" />
      <FaqList />
    </section>
  )
}

function Visit({ onWhatsApp }: { onWhatsApp: Track }) {
  const { t } = useSite()
  const copy = t.visit
  return (
    <section className="visit" id="contacto" aria-labelledby="visit-title">
      <SectionHead eyebrow={copy.eyebrow} title={copy.title} id="visit-title" />
      <div className="visit-grid">
        <a className="map" href={directionsUrl} target="_blank" rel="noopener noreferrer">
          <Photo src="/img/sculptdetox/mapa.webp" alt={copy.mapAlt} sizes="(min-width: 900px) 50vw, 100vw" width={1200} height={760} />
          <span className="map-pin" aria-hidden="true"><img src="/img/sculptdetox/emblema-240.webp" alt="" width={24} height={30} /></span>
          <small className="map-credit" aria-hidden="true">{copy.mapCredit}</small>
        </a>

        <div className="visit-card">
          <div className="visit-row">
            <MapPin size={20} aria-hidden="true" />
            <div>
              <h3>{copy.addressLabel}</h3>
              <address>{BUSINESS.street}<br />{BUSINESS.postcode} {BUSINESS.town}, {BUSINESS.region}</address>
            </div>
          </div>
          <div className="visit-row">
            <Clock size={20} aria-hidden="true" />
            <div>
              <h3>{copy.hoursLabel}</h3>
              <p><b>{copy.hours}</b><br />{copy.hoursNote}<br /><span className="muted">{copy.weekend}</span></p>
            </div>
          </div>
          <div className="visit-row">
            <Phone size={20} aria-hidden="true" />
            <div>
              <h3>{copy.contactLabel}</h3>
              <ul className="visit-links">
                <li><a href={whatsappUrl(t.wa.generic)} target="_blank" rel="noopener noreferrer" onClick={onWhatsApp('contacto')}><WhatsAppIcon size={16} /> WhatsApp · {BUSINESS.phone}</a></li>
                <li><a href={telUrl}><Phone size={16} /> {BUSINESS.phone}</a></li>
                <li><a href={`mailto:${BUSINESS.email}`}><Mail size={16} /> {BUSINESS.email}</a></li>
                <li><a href={BUSINESS.instagram} target="_blank" rel="noopener noreferrer"><Instagram size={16} /> {BUSINESS.instagramHandle}</a></li>
              </ul>
            </div>
          </div>
          <a className="btn btn-sage btn-lg btn-block" href={directionsUrl} target="_blank" rel="noopener noreferrer"><Navigation size={18} /> {copy.directions}</a>
        </div>

        <Figure className="visit-cabina" alt={copy.cabinaAlt} todo={copy.cabinaTodo} />
      </div>
    </section>
  )
}
