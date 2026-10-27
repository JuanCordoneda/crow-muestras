export const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

/** Los números franceses se escriben con el 0 delante: en el enlace van con el +33. */
const international = (digits: string) => (digits.length === 10 && digits.startsWith('0') ? `33${digits.slice(1)}` : digits)

/** Enlace `tel:` a partir de un número escrito con espacios (`01 43 54 41 56`). */
export const telLink = (phone: string) => {
  const digits = phone.replace(/[^\d+]/g, '')
  if (!digits) return ''
  return `tel:${digits.startsWith('+') ? digits : `+${international(digits)}`}`
}

/** Enlace a WhatsApp con el mensaje ya escrito. */
export const whatsappLink = (number: string, message = '') => {
  const digits = number.replace(/\D/g, '')
  if (!digits) return ''
  return `https://wa.me/${international(digits)}${message ? `?text=${encodeURIComponent(message)}` : ''}`
}

/**
 * Ruta en Google Maps hasta el restaurante: en el móvil abre la app de mapas. Se busca por nombre
 * y dirección, que Google resuelve a la ficha del local; sin dirección, por coordenadas.
 */
export const directionsLink = (query: string, latitude = 0, longitude = 0) =>
  `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query || `${latitude},${longitude}`)}`

/** Clases condicionales sin dependencia: `cx('a', on && 'b')`. */
export const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ')

/** Quita tildes y pasa a minúsculas: la búsqueda en la carta encuentra «atun» y «atún». */
export const fold = (value: string) => value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
