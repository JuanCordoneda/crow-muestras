import { useState } from 'react'
import { ArrowRight, Beer, CalendarDays, Flame, Leaf, PartyPopper, ShoppingBasket, Sparkles } from 'lucide-react'
import { linkTo, publicRoute } from '../../shared/routing'
import { cx, whatsappLink } from '../../shared/utils'
import { Photo } from '../../shared/components/Photo'
import { BOOKING_WHATSAPP, EL_SOL, MEXI, say, type FrEs, type Venue } from '../venues'
import { useSite } from '../site'
import { OpenStatus } from './OpenStatus'
import { PhotoSoon } from './PhotoSoon'

type Action = 'book' | 'event' | 'takeaway'

/**
 * Una gana y su respuesta: a qué local ir, por qué, qué pedir y qué botón toca. Todo sale de la
 * carta de `venues.ts`: nada que el restaurante no sirva.
 */
type Mood = {
  id: string
  icon: typeof Flame
  label: FrEs
  venue: Venue
  why: FrEs
  dishes: string[]
  photo?: string
  action: Action
}

const MOODS: Mood[] = [
  {
    id: 'colombie',
    icon: Flame,
    label: { fr: 'Envie de Colombie', es: 'Antojo de Colombia' },
    venue: EL_SOL,
    why: { fr: 'La bandeja paisa généreuse, les empanadas maison et l’ají qui va avec.', es: 'La bandeja paisa generosa, las empanadas caseras y su ají.' },
    dishes: ['Bandeja paisa', 'Empanadas & ají', 'Picada'],
    photo: '/img/grupo/sol-empanadas.webp',
    action: 'book',
  },
  {
    id: 'mexique',
    icon: Sparkles,
    label: { fr: 'Envie de Mexique', es: 'Antojo de México' },
    venue: MEXI,
    why: { fr: 'Burritos roulés minute, tacos et fajitas grésillantes, juste en face d’El Sol.', es: 'Burritos al momento, tacos y fajitas chisporroteando, justo enfrente de El Sol.' },
    dishes: ['Burritos', 'Tacos', 'Fajitas'],
    action: 'book',
  },
  {
    id: 'veggie',
    icon: Leaf,
    label: { fr: 'Végétarien', es: 'Vegetariano' },
    venue: MEXI,
    why: { fr: 'Chaque plat de la carte existe en version végétarienne.', es: 'Cada plato de la carta tiene su versión vegetariana.' },
    dishes: ['Nachos & guacamole', 'Quesadillas', 'Burritos veggie'],
    action: 'book',
  },
  {
    id: 'groupe',
    icon: PartyPopper,
    label: { fr: 'En groupe', es: 'En grupo' },
    venue: EL_SOL,
    why: { fr: 'La picada à partager, les margaritas en pichet et une salle qui met l’ambiance.', es: 'La picada para compartir, las jarras de margarita y un comedor con ambiente.' },
    dishes: ['Picada colombienne', 'Margarita en pichet', 'Guacamole & nachos'],
    photo: '/img/grupo/sol-interieur-lustre.webp',
    action: 'event',
  },
  {
    id: 'emporter',
    icon: ShoppingBasket,
    label: { fr: 'À emporter', es: 'Para llevar' },
    venue: MEXI,
    why: { fr: 'Vos plats à emporter, et l’épicerie pour cuisiner mexicain chez vous.', es: 'Tus platos para llevar, y la tienda para cocinar mexicano en casa.' },
    dishes: ['Burritos', 'Tortillas', 'Salsas & piments'],
    action: 'takeaway',
  },
  {
    id: 'verre',
    icon: Beer,
    label: { fr: 'Juste un verre', es: 'Solo una copa' },
    venue: EL_SOL,
    why: { fr: 'La margarita frozen au verre ou en pichet, avec la musique qui va bien.', es: 'La margarita frozen en copa o en jarra, con la música que toca.' },
    dishes: ['Margarita frozen', 'Guacamole & nachos'],
    photo: '/img/grupo/sol-interieur-deco.webp',
    action: 'book',
  },
]

/**
 * «Ce soir, on va où ?»: quien no conoce el grupo elige una gana y la web le dice adónde ir, qué
 * pedir y si está abierto ahora mismo, con el botón que toca (reservar, organizar el evento o
 * pedir para llevar). El título cambia con la hora: a mediodía pregunta por el mediodía.
 */
export function MoodFinder() {
  const { t, lang, now } = useSite()
  const [chosen, setChosen] = useState(MOODS[0].id)
  const mood = MOODS.find((entry) => entry.id === chosen) ?? MOODS[0]
  const venuePage = publicRoute({ view: mood.venue.id as 'el-sol-la-luna' | 'mexi-and-co' })
  const title = now.minutes < 16 * 60 ? t.mood.titleLunch : t.mood.titleEvening

  return (
    <section className="mood" aria-labelledby="mood-title">
      <header className="section-head">
        <span className="eyebrow">{t.mood.eyebrow}</span>
        <h2 id="mood-title">{title}</h2>
        <p>{t.mood.text}</p>
      </header>
      <div className="mood-chips" role="radiogroup" aria-label={t.mood.eyebrow}>
        {MOODS.map((entry) => {
          const Icon = entry.icon
          return (
            <button
              type="button"
              key={entry.id}
              role="radio"
              aria-checked={entry.id === chosen}
              className={cx('mood-chip', entry.id === chosen && 'is-on')}
              onClick={() => setChosen(entry.id)}
            >
              <Icon size={17} aria-hidden="true" /> {say(entry.label, lang)}
            </button>
          )
        })}
      </div>

      <article className="mood-card" key={mood.id} aria-live="polite">
        <a className="mood-photo" {...linkTo(venuePage)} tabIndex={-1} aria-hidden="true">
          {mood.photo
            ? <Photo src={mood.photo} alt="" sizes="(max-width: 760px) 100vw, 480px" />
            : <PhotoSoon name={mood.venue.name} label={t.venue.photoSoon} />}
        </a>
        <div className="mood-body">
          <span className="mood-kicker">{t.mood.pick}</span>
          <h3><a {...linkTo(venuePage)}>{mood.venue.name}</a></h3>
          <p className="mood-why">{say(mood.why, lang)}</p>
          <ul className="mood-dishes" aria-label={t.mood.order}>
            {mood.dishes.map((dish) => <li key={dish}>{dish}</li>)}
          </ul>
          <OpenStatus hours={mood.venue.hours} className="mood-status" />
          <div className="mood-actions">
            {mood.action === 'book' && (
              <a className="btn btn-primary btn-lg" {...linkTo(publicRoute({ view: 'reserver', venue: mood.venue.id }))}><CalendarDays size={19} /> {t.mood.book}</a>
            )}
            {mood.action === 'event' && (
              <a className="btn btn-whatsapp btn-lg" href={whatsappLink(BOOKING_WHATSAPP, t.events.message)} target="_blank" rel="noopener noreferrer"><PartyPopper size={19} /> {t.events.cta}</a>
            )}
            {mood.action === 'takeaway' && (
              <a className="btn btn-whatsapp btn-lg" href={whatsappLink(BOOKING_WHATSAPP, t.mexi.takeawayMessage)} target="_blank" rel="noopener noreferrer"><ShoppingBasket size={19} /> {t.mexi.takeaway}</a>
            )}
            <a className="btn btn-ghost btn-lg" {...linkTo(venuePage)}>{t.venues.menu} <ArrowRight size={17} /></a>
          </div>
        </div>
      </article>
    </section>
  )
}
