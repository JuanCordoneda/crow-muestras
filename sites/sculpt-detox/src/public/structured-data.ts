/**
 * La ficha de Sculpt Detox para Google (schema.org/HealthAndBeautyBusiness) y lo que acompaña a
 * cada página: las preguntas frecuentes de la portada y la miga de pan de `/lipedema`.
 *
 * No se calcula en el navegador: `scripts/pages.mjs` la escribe en el HTML de cada página y cada
 * idioma, que es lo que lee un buscador aunque no ejecute nada. Sale de los mismos datos que la
 * web (`business.ts`, `treatments.ts`, los textos), así que no hay una copia a mano que mantener.
 */
import { PAGE_PATHS, type PageView, type SiteLang } from '../shared/routing'
import { BUSINESS, SITE_URL } from './business'
import { TREATMENTS } from './treatments'
import { textsFor } from './content'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const url = (path: string) => `${SITE_URL}${path === '/' ? '/' : path}`

export function businessJsonLd(lang: SiteLang) {
  const t = textsFor(lang)
  const offers = TREATMENTS.flatMap((treatment) =>
    (treatment.tiers ?? [treatment]).map((item) => ({
      '@type': 'Offer',
      itemOffered: { '@type': 'Service', name: item.name[lang], description: item.text[lang] },
      // Sin precio todavía: Google no admite un «desde XX». Se declara en cuanto esté en treatments.ts.
      ...(item.price !== null ? { priceSpecification: { '@type': 'PriceSpecification', minPrice: item.price, priceCurrency: 'EUR' } } : {}),
    })),
  )
  return {
    '@context': 'https://schema.org',
    '@type': 'HealthAndBeautyBusiness',
    '@id': `${SITE_URL}/#negocio`,
    name: BUSINESS.name,
    alternateName: ['Sculpt Detox Ibiza', 'SculptDetox', `${BUSINESS.name} · ${BUSINESS.owner}`],
    description: t.meta.description,
    slogan: t.meta.tagline,
    url: url(PAGE_PATHS.inicio[lang]),
    inLanguage: lang,
    image: [`${SITE_URL}/og.jpg`, `${SITE_URL}/img/sculptdetox/michele-costa-retrato.webp`],
    logo: `${SITE_URL}/img/sculptdetox/logo.png`,
    telephone: BUSINESS.phone,
    email: BUSINESS.email,
    currenciesAccepted: 'EUR',
    address: {
      '@type': 'PostalAddress',
      streetAddress: BUSINESS.street,
      postalCode: BUSINESS.postcode,
      addressLocality: BUSINESS.town,
      addressRegion: BUSINESS.region,
      addressCountry: BUSINESS.country,
    },
    geo: { '@type': 'GeoCoordinates', latitude: BUSINESS.latitude, longitude: BUSINESS.longitude },
    hasMap: BUSINESS.googleMaps,
    areaServed: { '@type': 'Place', name: 'Ibiza' },
    openingHoursSpecification: [{
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: BUSINESS.hours.days.map((day) => DAYS[day]),
      opens: BUSINESS.hours.open,
      closes: BUSINESS.hours.close,
    }],
    contactPoint: [{
      '@type': 'ContactPoint',
      contactType: 'reservations',
      telephone: BUSINESS.phone,
      email: BUSINESS.email,
      availableLanguage: ['Spanish', 'English'],
    }],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: BUSINESS.googleRating,
      bestRating: 5,
      reviewCount: BUSINESS.googleReviewCount,
    },
    founder: { '@type': 'Person', name: BUSINESS.owner, jobTitle: BUSINESS.ownerRole[lang] },
    knowsLanguage: ['es', 'en'],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: lang === 'es' ? 'Tratamientos corporales y faciales' : 'Body and facial treatments',
      itemListElement: offers,
    },
    sameAs: [BUSINESS.instagram],
  }
}

function faqJsonLd(lang: SiteLang, ids?: number[]) {
  const items = textsFor(lang).faq.items
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    inLanguage: lang,
    mainEntity: (ids ? ids.map((id) => items[id]) : items).map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  }
}

/** Todo lo que lleva una página, en el orden en que se escribe en su `<head>`. */
export function jsonLdFor(view: Exclude<PageView, 'no-encontrada'>, lang: SiteLang) {
  const t = textsFor(lang)
  const blocks: object[] = [businessJsonLd(lang)]
  if (view === 'inicio') blocks.push(faqJsonLd(lang))
  if (view === 'lipedema') {
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: t.nav.home, item: url(PAGE_PATHS.inicio[lang]) },
        { '@type': 'ListItem', position: 2, name: t.lipedemaPage.breadcrumb, item: url(PAGE_PATHS.lipedema[lang]) },
      ],
    })
    blocks.push(faqJsonLd(lang, t.lipedemaPage.faqIds))
  }
  return blocks
}
