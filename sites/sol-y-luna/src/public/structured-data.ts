/**
 * Las fichas de los restaurantes para Google (schema.org/Restaurant), una por local.
 *
 * index.html lleva una versión escrita a mano para quien lea el HTML sin ejecutar nada. Esto la
 * reemplaza con los datos de `venues.ts`, que es de donde bebe también la web: si cambia un
 * horario o un teléfono, lo que Google lee cambia con ellos. Google ejecuta JavaScript y se queda
 * con el JSON-LD que haya en la página al terminar.
 */
import type { DayHours } from '../shared/types'
import { WEEK_ORDER, dayRanges } from '../shared/hours'
import { telLink } from '../shared/utils'
import { EL_SOL, MEXI, SHOW_LE_1492, SITE_URL, type Venue } from './venues'
import { LE_1492 } from './components/Le1492' // LE-1492

/** Los días de la semana como los nombra schema.org, por índice de `Date.getDay()`. */
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/** Agrupa los días con el mismo horario: «Tu–Su 11:30–23:00» en vez de seis entradas iguales. */
function openingHours(hours: DayHours[]) {
  const groups = new Map<string, string[]>()
  for (const weekday of WEEK_ORDER) {
    const day = hours[weekday]
    if (!day) continue
    for (const range of dayRanges(day)) {
      const key = `${range.from}-${range.to}`
      groups.set(key, [...(groups.get(key) ?? []), DAYS[weekday]])
    }
  }
  return [...groups.entries()].map(([key, days]) => {
    const [opens, closes] = key.split('-')
    return { '@type': 'OpeningHoursSpecification', dayOfWeek: days.length === 1 ? days[0] : days, opens, closes }
  })
}

const international = (phone?: string) => (phone ? telLink(phone).replace('tel:', '') : undefined)

function restaurant(venue: Venue) {
  const page = `${SITE_URL}/${venue.id}`
  return {
    '@type': 'Restaurant',
    '@id': `${page}#restaurant`,
    name: venue.name,
    description: venue.intro.fr,
    url: page,
    // Sin foto propia, sin imagen: og.jpg es una sala de El Sol y Google la daría como de este local.
    image: venue.photo ? [`${SITE_URL}${venue.photo}`] : undefined,
    telephone: international(venue.phone),
    priceRange: '€€',
    servesCuisine: venue.cuisines,
    address: {
      '@type': 'PostalAddress',
      streetAddress: venue.address,
      postalCode: venue.postcode,
      addressLocality: venue.town,
      addressCountry: 'FR',
    },
    geo: venue.latitude ? { '@type': 'GeoCoordinates', latitude: venue.latitude, longitude: venue.longitude } : undefined,
    hasMap: venue.maps,
    openingHoursSpecification: openingHours(venue.hours),
    hasMenu: `${page}#carte`,
    acceptsReservations: `${SITE_URL}/reserver?local=${venue.id}`,
    // La nota solo se declara donde se enseña: Mexi & Co no la lleva a propósito.
    aggregateRating: venue.rating ? { '@type': 'AggregateRating', ratingValue: venue.rating.score, reviewCount: venue.rating.count, bestRating: 5 } : undefined,
    parentOrganization: { '@id': `${SITE_URL}/#groupe` },
  }
}

export function buildStructuredData() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#groupe`,
        name: 'Mexi-and-Co',
        url: `${SITE_URL}/`,
        logo: `${SITE_URL}/icons/icon-512.png`,
      },
      restaurant(EL_SOL),
      restaurant(MEXI),
      // LE-1492: sin teléfono ni horario confirmados, solo lo que se sabe (y solo si está encendido).
      ...(SHOW_LE_1492 ? [{
        '@type': 'Restaurant',
        '@id': `${SITE_URL}/#le-1492`,
        name: LE_1492.name,
        servesCuisine: ['Latino-américaine'],
        foundingDate: LE_1492.since,
        address: { '@type': 'PostalAddress', streetAddress: LE_1492.address, postalCode: LE_1492.postcode, addressLocality: LE_1492.town, addressCountry: 'FR' },
        parentOrganization: { '@id': `${SITE_URL}/#groupe` },
      }] : []),
    ],
  }
}

export function updateStructuredData() {
  let script = document.querySelector<HTMLScriptElement>('script[type="application/ld+json"]')
  if (!script) {
    script = document.createElement('script')
    script.type = 'application/ld+json'
    document.head.appendChild(script)
  }
  script.textContent = JSON.stringify(buildStructuredData())
}
