/**
 * Utilidades del panel: nombres de estados, agrupación por servicio, mensajes de WhatsApp,
 * precios escritos a mano… Viven aparte de los componentes para que la tarjeta, la hoja de
 * acciones y el formulario digan exactamente lo mismo con las mismas palabras.
 */
import type {
  Allergen, Dish, DishStatus, DishTag, Lang, Localized, Menu, Reservation, ReservationSource, ReservationStatus,
  SeatingPreference, Settings,
} from '../shared/types'
import { ApiError } from '../shared/api'
import { addDays, dayNumber, longDate, shortWeekday, timeLabel, toMinutes } from '../shared/hours'
import { LANGS, pick } from '../shared/i18n'
import { fold } from '../shared/utils'

/* ---------- reservas ---------- */

export const STATUS_LABEL: Record<ReservationStatus, string> = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  sentada: 'Sentados',
  cancelada: 'Cancelada',
  'no-vino': 'No vino',
}

export const SOURCE_LABEL: Record<ReservationSource, string> = { web: 'Web', telefono: 'Teléfono', panel: 'Panel' }

export const SEATING_LABEL: Record<SeatingPreference, string> = { indiferente: 'Sin preferencia', terraza: 'Terraza', interior: 'Interior' }

export const LANG_LABEL: Record<Lang, string> = { es: 'Castellano', en: 'Inglés', de: 'Alemán', fr: 'Francés' }

/** Cancelada y «no vino» no ocupan mesa: no cuentan en comensales ni en paellas. */
export const isActive = (reservation: Pick<Reservation, 'status'>) =>
  reservation.status !== 'cancelada' && reservation.status !== 'no-vino'

export const guests = (reservation: Pick<Reservation, 'adults' | 'children'>) => reservation.adults + reservation.children

const plural = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`

/** «4 adultos · 2 niños». Sin niños no se dice «0 niños»: es ruido en plena cena. */
export const partyLabel = (reservation: Pick<Reservation, 'adults' | 'children'>) =>
  [plural(reservation.adults, 'adulto', 'adultos'), reservation.children ? plural(reservation.children, 'niño', 'niños') : '']
    .filter(Boolean)
    .join(' · ')

export const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

/** «Hoy», «Mañana», «Ayer» o «mié 17»: lo que cabe en un botón y se entiende de un vistazo. */
export const dayLabel = (date: string, today: string) => {
  if (date === today) return 'Hoy'
  if (date === addDays(today, 1)) return 'Mañana'
  if (date === addDays(today, -1)) return 'Ayer'
  return `${shortWeekday(date, 'es')} ${dayNumber(date)}`
}

/** «miércoles, 17 de septiembre», con el año solo si no es el de hoy. */
export const fullDate = (date: string, today: string) => {
  const label = capitalize(longDate(date, 'es'))
  return date.slice(0, 4) === today.slice(0, 4) ? label : `${label} de ${date.slice(0, 4)}`
}

export function relativeTime(at: number, now: number) {
  const seconds = Math.max(0, Math.round((now - at) / 1000))
  if (seconds < 45) return 'hace un momento'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.round(hours / 24)
  return `hace ${plural(days, 'día', 'días')}`
}

export type ServiceKey = 'lunch' | 'dinner' | 'other'

export const SERVICE_LABEL: Record<ServiceKey, string> = { lunch: 'Comida', dinner: 'Cena', other: 'Otras horas' }

/**
 * Servicio al que pertenece una hora de llegada, según las franjas de reserva de los ajustes.
 * Lo que cae fuera (un grupo a las 16:00 apuntado a mano) va a «Otras horas» para que no se pierda.
 */
export function serviceOf(time: string, settings: Settings): ServiceKey {
  const minute = toMinutes(time)
  for (const key of ['lunch', 'dinner'] as const) {
    const range = settings.services[key]
    if (minute >= toMinutes(range.from) && minute <= toMinutes(range.to)) return key
  }
  return 'other'
}

export const byTime = (a: Reservation, b: Reservation) =>
  a.date.localeCompare(b.date) || a.time.localeCompare(b.time) || a.createdAt - b.createdAt

/** Búsqueda por nombre, email o teléfono. Con el teléfono vale un trozo: «6602» encuentra «666 02 27 33». */
export function matchesSearch(reservation: Reservation, query: string) {
  const text = fold(query.trim())
  if (!text) return true
  const digits = query.replace(/\D/g, '')
  return (
    fold(reservation.name).includes(text) ||
    fold(reservation.email).includes(text) ||
    (digits.length >= 3 && reservation.phone.replace(/\D/g, '').includes(digits))
  )
}

/** Los arroces que se pueden encargar: la sección de arroces y, por si la renombran, lo que se cobra por persona. */
export const riceDishes = (menu: Menu) => menu.dishes.filter((dish) => dish.categoryId === 'arroces' || dish.perPerson)

export const dishName = (dishes: Dish[], id: string) => {
  const dish = dishes.find((entry) => entry.id === id)
  return dish ? pick(dish.name, 'es') || 'Arroz sin nombre' : 'Arroz que ya no está en la carta'
}

/**
 * Raciones de cada arroz encargadas para un día. Es lo primero que mira la cocina por la mañana:
 * la paella se empieza con el pedido, no cuando se sienta la mesa.
 */
export function paellaTotals(list: Reservation[], dishes: Dish[]) {
  const totals = new Map<string, number>()
  for (const reservation of list) {
    if (!reservation.paella || !isActive(reservation)) continue
    // El arroz y la fideuà del mismo plato se cuentan por separado: son dos paellas distintas.
    const key = `${reservation.paella.dishId}${reservation.paella.fideua ? ':fideua' : ''}`
    totals.set(key, (totals.get(key) ?? 0) + reservation.paella.servings)
  }
  return [...totals]
    .map(([key, servings]) => {
      const fideua = key.endsWith(':fideua')
      const id = fideua ? key.slice(0, -':fideua'.length) : key
      return { id: key, name: `${dishName(dishes, id)}${fideua ? ' (fideuà)' : ''}`, servings }
    })
    .sort((a, b) => b.servings - a.servings || a.name.localeCompare(b.name, 'es'))
}

/**
 * Mensaje de confirmación por WhatsApp en el idioma en que se hizo la reserva. Un alemán que
 * reservó en alemán lee «Wir bestätigen…» y no tiene que pasar el mensaje por el traductor.
 */
export function confirmationMessage(reservation: Reservation, settings: Settings, dishes: Dish[]) {
  const lang = reservation.lang
  const name = reservation.name.trim().split(/\s+/)[0] || reservation.name.trim()
  const restaurant = settings.name.trim() || 'Restaurante El Puerto'
  const people = guests(reservation)
  const day = longDate(reservation.date, lang)
  const dish = reservation.paella ? dishes.find((entry) => entry.id === reservation.paella?.dishId) : undefined
  const rice = reservation.paella && dish ? { name: pick(dish.name, lang), servings: reservation.paella.servings } : null
  const time = reservation.time
  switch (lang) {
    case 'en':
      return `Hello ${name}, we confirm your booking at ${restaurant} on ${day} at ${timeLabel(time, 'en')} for ${plural(people, 'person', 'people')}. ${
        rice ? `Your rice dish (${rice.name}, ${rice.servings} servings) is ordered. ` : ''
      }We look forward to seeing you!`
    case 'de':
      return `Hallo ${name}, wir bestätigen Ihre Reservierung im ${restaurant} am ${day} um ${time} Uhr für ${plural(people, 'Person', 'Personen')}. ${
        rice ? `Ihr Reisgericht (${rice.name}, ${rice.servings} Portionen) ist vorbestellt. ` : ''
      }Wir freuen uns auf Ihren Besuch!`
    case 'fr':
      return `Bonjour ${name}, nous vous confirmons votre réservation au ${restaurant} le ${day} à ${time.replace(':', 'h')} pour ${plural(people, 'personne', 'personnes')}. ${
        rice ? `Votre riz (${rice.name}, ${rice.servings} parts) est commandé. ` : ''
      }À bientôt !`
    default:
      return `Hola ${name}, te confirmamos tu reserva en ${restaurant} el ${day} a las ${time} para ${plural(people, 'persona', 'personas')}. ${
        rice ? `Tu arroz (${rice.name}, ${rice.servings} raciones) queda encargado. ` : ''
      }¡Te esperamos!`
  }
}

/* ---------- carta ---------- */

export const ALLERGEN_LABEL: Record<Allergen, string> = {
  gluten: 'Gluten',
  crustaceos: 'Crustáceos',
  huevos: 'Huevos',
  pescado: 'Pescado',
  cacahuetes: 'Cacahuetes',
  soja: 'Soja',
  lacteos: 'Lácteos',
  'frutos-cascara': 'Frutos de cáscara',
  apio: 'Apio',
  mostaza: 'Mostaza',
  sesamo: 'Sésamo',
  sulfitos: 'Sulfitos',
  altramuces: 'Altramuces',
  moluscos: 'Moluscos',
}

export const TAG_LABEL: Record<DishTag, string> = { vegano: 'Vegano', vegetariano: 'Vegetariano', 'sin-gluten': 'Sin gluten', picante: 'Picante' }

export const DISH_STATUS_LABEL: Record<DishStatus, string> = { disponible: 'Disponible', agotado: 'Agotado', oculto: 'Oculto' }

/** Fotos del restaurante que ya van con la web: se pueden poner a un plato sin subir nada. */
export const GALLERY = [
  'paella-marisco', 'paella-terraza', 'chipirones', 'tartar-atun', 'solomillo-5-pimientas', 'ensalada-rucula', 'paella', 'costillas', 'carrillada', 'camembert',
  'churros', 'cocina-paellas', 'mesa-vistas', 'terraza', 'interior-azulejos', 'interior-barra', 'interior-salon',
  'interior-banco', 'espigon', 'atardecer-faro',
].map((name) => ({ name, src: `/img/${name}.webp` }))

export const emptyLocalized = (): Localized => ({ es: '', en: '', de: '', fr: '' })

/** ¿Hay texto en castellano sin su traducción? Es lo que marca el punto de la pestaña. */
export const missingIn = (lang: Lang, texts: Localized[]) =>
  lang === 'es' ? false : texts.some((text) => text.es.trim() !== '' && text[lang].trim() === '')

export const missingLangs = (texts: Localized[]) =>
  Object.fromEntries(LANGS.map((lang) => [lang, missingIn(lang, texts)])) as Record<Lang, boolean>

/**
 * Identificador legible a partir del nombre (`arroz-negro`). La web lo usa en los enlaces a una
 * sección (`/carta#arroces`), así que se decide al crear y ya no cambia aunque se renombre.
 */
export const slugify = (text: string) => fold(text).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48)

export function uniqueId(base: string, taken: Iterable<string>) {
  const used = new Set(taken)
  const root = base || 'nuevo'
  if (!used.has(root)) return root
  let index = 2
  while (used.has(`${root}-${index}`)) index += 1
  return `${root}-${index}`
}

/**
 * Precio escrito a mano: «21,50», «21.5», «21 €». Con coma y punto a la vez, el último separador
 * es el decimal. Devuelve `null` si no es un número, para avisar en vez de guardar un cero.
 */
export function parsePrice(raw: string): number | null {
  const clean = raw.replace(/[\s€]/g, '')
  if (!clean) return null
  const decimal = Math.max(clean.lastIndexOf(','), clean.lastIndexOf('.'))
  const normalized = decimal === -1 ? clean : `${clean.slice(0, decimal).replace(/[.,]/g, '')}.${clean.slice(decimal + 1)}`
  if (!/^\d*\.?\d*$/.test(normalized) || !/\d/.test(normalized)) return null
  const value = Number(normalized)
  return Number.isFinite(value) && value >= 0 ? Math.round(value * 100) / 100 : null
}

/** El precio como se escribe en el campo: «24» o «21,50». */
export const priceInput = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(2).replace('.', ','))

/**
 * Mueve un elemento un puesto arriba o abajo saltando los que no son de su grupo. Los platos van
 * todos en una lista: subir un arroz lo cambia de sitio con el arroz anterior, no con una pizza.
 */
export function moveWithin<T>(list: T[], item: T, delta: -1 | 1, sameGroup: (entry: T) => boolean): T[] {
  const index = list.indexOf(item)
  if (index < 0) return list
  let target = index + delta
  while (target >= 0 && target < list.length && !sameGroup(list[target])) target += delta
  if (target < 0 || target >= list.length) return list
  const next = [...list]
  next[index] = list[target]
  next[target] = item
  return next
}

/* ---------- red ---------- */

export const isUnauthorized = (error: unknown) => error instanceof ApiError && error.status === 401

/** Sin respuesta, respuesta caída (5xx) o que tarda demasiado: se reintenta más tarde. */
export const isOffline = (error: unknown) => !(error instanceof ApiError) || error.status >= 500 || error.status === 408

export const errorText = (error: unknown) => {
  if (isOffline(error)) return 'Sin conexión con el servidor.'
  if (isUnauthorized(error)) return 'La sesión ha caducado: vuelve a entrar.'
  return error instanceof Error && error.message ? error.message : 'Algo ha fallado.'
}

export class TimeoutError extends Error {}

/**
 * Pone tope a una petición. Con cobertura a medias (la cocina, el almacén) `fetch` puede quedarse
 * colgado un minuto: mejor dar la red por caída y reintentar que dejar el panel esperando.
 */
export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer = 0
  // Si gana el tope, el fallo tardío de la petición no debe acabar como error sin capturar.
  promise.catch(() => {})
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      timer = window.setTimeout(() => reject(new TimeoutError('Tiempo de espera agotado')), ms)
    }),
  ]).finally(() => window.clearTimeout(timer))
}

/* ---------- ficheros ---------- */

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Safari descarga en diferido: revocar la URL en el acto cancela la descarga.
  window.setTimeout(() => URL.revokeObjectURL(url), 4000)
}

/**
 * Reduce la foto del móvil antes de subirla. Una foto de cámara pesa 4–10 MB y el servidor
 * no guarda nada por encima de 1600 px: subir el original por 4G desde la cocina es esperar
 * medio minuto para nada. Si el navegador no puede (formato raro), se sube tal cual.
 */
export async function shrinkImage(file: File, maxSide = 2000): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif' || file.size < 600 * 1024) return file
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.decoding = 'async'
    image.src = url
    await image.decode()
    const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight))
    const width = Math.round(image.naturalWidth * scale)
    const height = Math.round(image.naturalHeight * scale)
    if (!width || !height) return file
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) return file
    context.drawImage(image, 0, 0, width, height)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.88))
    if (!blob || blob.size >= file.size) return file
    return new File([blob], `${file.name.replace(/\.[^.]+$/, '') || 'foto'}.jpg`, { type: 'image/jpeg' })
  } catch {
    return file
  } finally {
    URL.revokeObjectURL(url)
  }
}
