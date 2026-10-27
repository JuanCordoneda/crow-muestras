/**
 * La ficha de PariSabor para Google (schema.org) y lo que acompaña a cada página: las sesiones
 * del ateliê como eventos con su precio y plazas, y las preguntas frecuentes de la portada.
 *
 * No se calcula en el navegador: `scripts/pages.mjs` la escribe en el HTML de cada página y cada
 * idioma, que es lo que lee un buscador aunque no ejecute nada. Sale de los mismos datos que la
 * web (`business.ts`, `agenda.ts`, los textos), así que no hay una copia a mano que mantener.
 * Como las sesiones cambian, se rehace en cada `npm run build`.
 */
import { PAGE_PATHS, type PageView, type SiteLang } from '../shared/routing'
import { ATELIE, upcomingSessions } from './agenda'
import { BUSINESS, SITE_URL } from './business'
import { textsFor } from './content'

const url = (path: string) => `${SITE_URL}${path === '/' ? '/' : path}`
const LANGUAGE: Record<SiteLang, string> = { pt: 'pt-BR', fr: 'fr-FR', en: 'en' }
const IMAGES = ['/og.jpg', '/img/atelie/tabua-queijos.webp', '/img/atelie/mesa-atelie.webp'].map((path) => `${SITE_URL}${path}`)

const founder = () => ({
  '@type': 'Person',
  name: BUSINESS.owner,
  image: `${SITE_URL}/img/atelie/janaina-pedroza.webp`,
  sameAs: [BUSINESS.instagram, BUSINESS.blog],
})

export function businessJsonLd(lang: SiteLang) {
  const t = textsFor(lang)
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#parisabor`,
    name: BUSINESS.name,
    description: t.meta.tagline,
    url: url(PAGE_PATHS.inicio[lang]),
    logo: `${SITE_URL}/icons/icon-512.png`,
    image: IMAGES,
    email: BUSINESS.email,
    telephone: BUSINESS.phone,
    founder: founder(),
    areaServed: { '@type': 'City', name: 'Paris' },
    contactPoint: [{
      '@type': 'ContactPoint',
      contactType: 'reservations',
      telephone: BUSINESS.phone,
      email: BUSINESS.email,
      availableLanguage: ['Portuguese', 'French', 'English'],
    }],
    sameAs: [BUSINESS.instagram, BUSINESS.blog],
  }
}

/**
 * Cada sesión con plazas, como un evento. PENDIENTE: la dirección del ateliê; mientras no esté,
 * el lugar es «Paris» (Google lo acepta, pero con la calle sale mejor en los resultados de eventos).
 */
function sessionsJsonLd(lang: SiteLang) {
  const t = textsFor(lang)
  const name = `${t.hero.titleA} ${t.hero.titleB}`
  return upcomingSessions().map((session) => {
    const start = `${session.date}T${session.time}:00`
    const [hours, minutes] = session.time.split(':').map(Number)
    const total = hours * 60 + minutes + ATELIE.duration
    const end = `${session.date}T${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}:00`
    return {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name,
      description: t.hero.text,
      inLanguage: LANGUAGE[lang],
      startDate: start,
      endDate: end,
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
      maximumAttendeeCapacity: ATELIE.maxPeople,
      remainingAttendeeCapacity: Math.max(0, session.left),
      image: IMAGES,
      location: { '@type': 'Place', name: 'Paris', address: { '@type': 'PostalAddress', addressLocality: 'Paris', addressCountry: 'FR' } },
      organizer: { '@type': 'Organization', name: BUSINESS.name, url: SITE_URL },
      performer: { '@type': 'Person', name: BUSINESS.owner },
      offers: {
        '@type': 'Offer',
        price: ATELIE.price,
        priceCurrency: 'EUR',
        availability: session.left > 0 ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut',
        url: `${url(PAGE_PATHS.inicio[lang])}#reservar`,
      },
    }
  })
}

function faqJsonLd(lang: SiteLang) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: LANGUAGE[lang],
    mainEntity: textsFor(lang).faq.items.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }
}

/** Todo lo que lleva una página, en el orden en que se escribe en su `<head>`. */
export function jsonLdFor(view: Exclude<PageView, 'no-encontrada'>, lang: SiteLang) {
  const blocks: object[] = [businessJsonLd(lang)]
  if (view === 'inicio') blocks.push(...sessionsJsonLd(lang), faqJsonLd(lang))
  return blocks
}
