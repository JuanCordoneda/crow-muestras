/**
 * Los datos de PariSabor en un solo sitio: lo que sale en la web, en la ficha para Google
 * (`structured-data.ts`) y en las páginas que escribe el build (`scripts/pages.mjs`).
 *
 * Las fechas, las plazas, el precio y el pago online del ateliê están aparte, en `agenda.ts`,
 * que es lo único que hay que tocar en el día a día.
 */
/**
 * PENDIENTE: la dirección definitiva. parisabor.com es el blog (WordPress), así que la web del
 * ateliê va en un subdominio. Si cambia, se cambia aquí, en `scripts/pages.mjs`, en `server.js`,
 * en `index.html`, en `public/sitemap.xml` y en `public/robots.txt`.
 */
export const SITE_URL = 'https://atelie.parisabor.com'

export const BUSINESS = {
  name: 'PariSabor',
  owner: 'Janaína Pedroza de Macedo',
  ownerShort: 'Janaína',
  /** Con el +33 y sin el 0: es como lo marca un teléfono brasileño. */
  phone: '+33 6 58 00 75 39',
  /** El mismo número, en el formato de wa.me (sin + ni espacios). */
  whatsapp: '33658007539',
  email: 'contato@parisabor.com',
  instagram: 'https://www.instagram.com/parisabor/',
  instagramHandle: '@parisabor',
  /** Lo que enseña su perfil (cuenta verificada). Se actualiza a mano de vez en cuando. */
  followers: 57_500,
  blog: 'https://parisabor.com',
  /** El post del ateliê (enero de 2025), el que el blog incrusta en su artículo: la prueba de que existe. */
  atelierPost: 'https://www.instagram.com/p/DFXhTH8sUNr/',
  partner: 'Fromagerie Marie-Anne Cantin',
  city: 'Paris',
} as const

/** Enlace a WhatsApp con el mensaje ya escrito. */
export const whatsappUrl = (message = '') =>
  `https://wa.me/${BUSINESS.whatsapp}${message ? `?text=${encodeURIComponent(message)}` : ''}`

/**
 * Las fotos que faltan se enseñan como un hueco elegante con el letrero «foto a substituir». Con
 * `false` el hueco se queda pero sin el letrero, por si hay que publicar antes de tener las fotos.
 */
export const SHOW_PHOTO_TODO = true

/**
 * Los textos provisionales (respuestas de las preguntas que Janaína tiene que confirmar, los
 * depoimentos) llevan una etiqueta «a completar». Con `false` se esconde la etiqueta, no el texto.
 */
export const SHOW_TEXT_TODO = true

/**
 * Avisa a la analítica (Google Analytics / Meta) de un clic de reserva, si alguna está instalada.
 * La web no carga ninguna por su cuenta: el día que se añada la etiqueta de Meta (y el aviso de
 * cookies que exige), los clics en WhatsApp ya llegan como conversión de la campaña de Instagram.
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

/** Abre WhatsApp en otra pestaña (la app, en el móvil); si el navegador la bloquea, en la misma. */
export function openWhatsApp(message: string) {
  const url = whatsappUrl(message)
  // Sin `noopener` en la llamada: con él, `window.open` devuelve siempre null y no se sabría si abrió.
  const opened = window.open(url, '_blank')
  if (opened) opened.opener = null
  else window.location.href = url
}
