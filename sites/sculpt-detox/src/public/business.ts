/**
 * Los datos de Sculpt Detox en un solo sitio: lo que sale en la web, en la ficha para Google
 * (`structured-data.ts`) y en las páginas que escribe el build (`scripts/pages.mjs`).
 *
 * Lo marcado con «PENDIENTE» es lo que hay que confirmar con Michele antes de publicar.
 */
import type { SiteLang } from '../shared/routing'

export const SITE_URL = 'https://sculptdetox.com'

export const BUSINESS = {
  name: 'Sculpt Detox',
  owner: 'Michele Costa',
  /** Lo que pone su logo debajo del nombre. */
  ownerRole: { es: 'Masoterapeuta', en: 'Massage therapist' } as Record<SiteLang, string>,
  /** Con el +34: es como lo marca un teléfono extranjero, que es media clientela. */
  phone: '+34 631 21 32 14',
  /** El mismo número, en el formato de wa.me (sin + ni espacios). */
  whatsapp: '34631213214',
  /**
   * PENDIENTE: la web anterior decía `contacto@` en la página de contacto y `contact@` en el pie.
   * Va el del encargo; si el bueno es el otro, se cambia aquí y en `index.html`.
   */
  email: 'contact@sculptdetox.com',
  street: "Carrer de l'Historiador Josep Clapés, 13",
  postcode: '07800',
  town: 'Eivissa',
  region: 'Illes Balears',
  country: 'ES',
  /** El portal, según OpenStreetMap (vía 323997740). */
  latitude: 38.9093535,
  longitude: 1.4301479,
  instagram: 'https://www.instagram.com/sculptdetox/',
  instagramHandle: '@sculptdetox',
  /** La ficha de Google: abre el mapa con el centro, desde donde se deja la reseña. */
  googleMaps: "https://www.google.com/maps/search/?api=1&query=SculptDetox+Carrer+de+l'Historiador+Josep+Clap%C3%A9s+13+Eivissa",
  googleRating: 5,
  /**
   * PENDIENTE: cuántas reseñas tiene la ficha. La web anterior enseñaba 6 en su widget; Google
   * pide que el número de la ficha para buscadores sea el real.
   */
  googleReviewCount: 6,
  /** De lunes a viernes, con cita previa. Índice 0 = lunes. */
  hours: { days: [0, 1, 2, 3, 4], open: '09:00', close: '18:00' },
} as const

/** Ruta en Google Maps hasta el portal: en el móvil abre la app de mapas. */
export const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${BUSINESS.name}, ${BUSINESS.street}, ${BUSINESS.postcode} ${BUSINESS.town}`)}`

export const telUrl = `tel:${BUSINESS.phone.replace(/\s/g, '')}`

/** Enlace a WhatsApp con el mensaje ya escrito. */
export const whatsappUrl = (message = '') =>
  `https://wa.me/${BUSINESS.whatsapp}${message ? `?text=${encodeURIComponent(message)}` : ''}`

/**
 * Las fotos que faltan se enseñan como un hueco elegante con lo que debería ir ahí («Foto
 * pendiente · cabina»). Con `false` el hueco se queda pero sin el letrero, por si hay que
 * publicar antes de tener las fotos de Michele.
 */
export const SHOW_PHOTO_TODO = false

/**
 * Avisa a la analítica (Google Analytics / Google Ads / Meta) de un clic de reserva, si alguna
 * está instalada. La web no carga ninguna por su cuenta: el día que se añada la etiqueta (y el
 * aviso de cookies que exige), los clics en WhatsApp ya llegan como conversión.
 */
export function track(event: string, params: Record<string, string> = {}) {
  if (typeof window === 'undefined') return
  const w = window as unknown as { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void; fbq?: (...args: unknown[]) => void }
  try {
    w.dataLayer?.push({ event, ...params })
    w.gtag?.('event', event, params)
    w.fbq?.('track', 'Contact', params)
  } catch {
    /* la analítica nunca puede romper una reserva */
  }
}
