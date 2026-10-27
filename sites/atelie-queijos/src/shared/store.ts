/**
 * Copia local de la carta y normalización de lo que llega del servidor o del navegador.
 *
 * La web se pinta al instante con la última carta que vio este navegador y se pone al día en
 * cuanto contesta el servidor. `normalizeMenu` acepta datos a medias o de versiones anteriores
 * sin romper la app: todo campo que falte cae a su valor por defecto.
 */
import { MENU_VERSION, seedMenu, seedSettings } from './data'
import {
  ALLERGENS, DISH_TAGS,
  type Allergen, type Category, type DayHours, type Dish, type DishOption, type DishStatus, type DishTag,
  type Lang, type Localized, type Menu, type Reservation, type ReservationSource, type ReservationStatus,
  type SeatingPreference, type Settings, type Special, type SpecialPeriod, SPECIAL_PERIODS,
} from './types'
import { LANGS } from './i18n'

const KEY = 'parisabor:menu'

const record = (value: unknown): Record<string, unknown> => (value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {})
const list = (value: unknown): unknown[] => (Array.isArray(value) ? value : [])
const text = (value: unknown, fallback = '') => (typeof value === 'string' ? value : fallback)
const number = (value: unknown, fallback = 0) => (Number.isFinite(Number(value)) && value !== '' && value !== null ? Number(value) : fallback)
const bool = (value: unknown, fallback = false) => (typeof value === 'boolean' ? value : fallback)

export const localized = (value: unknown, fallback?: Localized): Localized => {
  const source = typeof value === 'string' ? { es: value } : record(value)
  return Object.fromEntries(LANGS.map((lang) => [lang, text(source[lang], fallback?.[lang] ?? '')])) as Localized
}

const oneOf = <T extends string>(value: unknown, options: readonly T[], fallback: T): T =>
  (options as readonly string[]).includes(value as string) ? (value as T) : fallback

const normalizeDay = (value: unknown, fallback: DayHours): DayHours => {
  const day = record(value)
  return {
    closed: bool(day.closed, fallback.closed),
    open: text(day.open, fallback.open),
    close: text(day.close, fallback.close),
    // Un horario guardado antes de que existieran los partidos llega sin estos campos: es corrido.
    split: bool(day.split, fallback.split),
    open2: text(day.open2, fallback.open2),
    close2: text(day.close2, fallback.close2),
    lunch: bool(day.lunch, fallback.lunch),
    dinner: bool(day.dinner, fallback.dinner),
  }
}

export function normalizeSettings(value: unknown): Settings {
  const seed = seedSettings()
  const input = record(value)
  const services = record(input.services)
  const service = (key: 'lunch' | 'dinner') => {
    const entry = record(services[key])
    return { from: text(entry.from, seed.services[key].from), to: text(entry.to, seed.services[key].to) }
  }
  const hours = list(input.hours)
  return {
    name: text(input.name, seed.name),
    phone: text(input.phone, seed.phone),
    mobile: text(input.mobile, seed.mobile),
    whatsapp: text(input.whatsapp, seed.whatsapp),
    email: text(input.email, seed.email),
    address: text(input.address, seed.address),
    postcode: text(input.postcode, seed.postcode),
    town: text(input.town, seed.town),
    region: text(input.region, seed.region),
    latitude: number(input.latitude, seed.latitude),
    longitude: number(input.longitude, seed.longitude),
    instagram: text(input.instagram, seed.instagram),
    facebook: text(input.facebook, seed.facebook),
    tripadvisor: text(input.tripadvisor, seed.tripadvisor),
    google: text(input.google, seed.google),
    googleBusiness: text(input.googleBusiness, seed.googleBusiness),
    hours: seed.hours.map((fallback, index) => normalizeDay(hours[index], fallback)),
    services: { lunch: service('lunch'), dinner: service('dinner') },
    slotMinutes: Math.max(5, number(input.slotMinutes, seed.slotMinutes)),
    minNoticeMinutes: Math.max(0, number(input.minNoticeMinutes, seed.minNoticeMinutes)),
    bookingDays: Math.max(1, number(input.bookingDays, seed.bookingDays)),
    maxPartySize: Math.max(1, number(input.maxPartySize, seed.maxPartySize)),
    capacity: {
      lunch: Math.max(0, number(record(input.capacity).lunch, seed.capacity.lunch)),
      dinner: Math.max(0, number(record(input.capacity).dinner, seed.capacity.dinner)),
    },
    bookingEnabled: bool(input.bookingEnabled, seed.bookingEnabled),
    closedDates: list(input.closedDates).filter((entry): entry is string => typeof entry === 'string'),
    notice: localized(input.notice),
    // Una carta guardada antes de que existieran las sugerencias arranca con las de serie.
    specials: Array.isArray(input.specials) ? input.specials.map(normalizeSpecial) : seed.specials,
    // Solo huecos con una dirección de foto: lo demás se cae y se enseña la foto de serie.
    photos: Object.fromEntries(
      Object.entries(record(input.photos)).filter((entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].trim() !== ''),
    ),
  }
}

const normalizeSpecial = (value: unknown, index: number): Special => {
  const input = record(value)
  return {
    id: text(input.id) || `sugerencia-${index + 1}`,
    period: oneOf<SpecialPeriod>(input.period, SPECIAL_PERIODS, 'semana'),
    name: localized(input.name),
    description: localized(input.description),
    price: Math.max(0, number(input.price)),
    perPerson: bool(input.perPerson),
    photo: text(input.photo),
    dishId: text(input.dishId),
    visible: bool(input.visible, true),
  }
}

const normalizeCategory = (value: unknown, index: number): Category => {
  const input = record(value)
  return {
    id: text(input.id) || `categoria-${index + 1}`,
    name: localized(input.name),
    note: localized(input.note),
    footnote: localized(input.footnote),
    visible: bool(input.visible, true),
  }
}

const normalizeOption = (value: unknown, index: number): DishOption => {
  const input = record(value)
  return { id: text(input.id) || `opcion-${index + 1}`, label: localized(input.label), price: Math.max(0, number(input.price)) }
}

const normalizeDish = (value: unknown, index: number, categories: Category[]): Dish => {
  const input = record(value)
  const categoryId = text(input.categoryId)
  return {
    id: text(input.id) || `plato-${index + 1}`,
    categoryId: categories.some((category) => category.id === categoryId) ? categoryId : categories[0]?.id ?? '',
    name: localized(input.name),
    description: localized(input.description),
    price: Math.max(0, number(input.price)),
    perPerson: bool(input.perPerson),
    options: list(input.options).map(normalizeOption),
    photo: text(input.photo),
    tags: list(input.tags).filter((tag): tag is DishTag => (DISH_TAGS as readonly unknown[]).includes(tag)),
    allergens: list(input.allergens).filter((entry): entry is Allergen => (ALLERGENS as readonly unknown[]).includes(entry)),
    featured: bool(input.featured),
    status: oneOf<DishStatus>(input.status, ['disponible', 'agotado', 'oculto'], 'disponible'),
    updatedAt: number(input.updatedAt, Date.now()),
  }
}

export function normalizeMenu(value: unknown): Menu {
  const input = record(value)
  if (!Array.isArray(input.categories) || !Array.isArray(input.dishes)) return seedMenu()
  const categories = input.categories.map(normalizeCategory)
  return {
    version: number(input.version, MENU_VERSION),
    settings: normalizeSettings(input.settings),
    categories,
    dishes: input.dishes.map((dish, index) => normalizeDish(dish, index, categories)),
  }
}

export function normalizeReservation(value: unknown): Reservation {
  const input = record(value)
  const paella = record(input.paella)
  return {
    id: text(input.id),
    date: text(input.date),
    time: text(input.time),
    adults: Math.max(0, Math.round(number(input.adults, 2))),
    children: Math.max(0, Math.round(number(input.children))),
    name: text(input.name),
    phone: text(input.phone),
    email: text(input.email),
    note: text(input.note),
    paella: text(paella.dishId)
      ? { dishId: text(paella.dishId), servings: Math.max(2, Math.round(number(paella.servings, 2))), fideua: bool(paella.fideua) }
      : null,
    seating: oneOf<SeatingPreference>(input.seating, ['indiferente', 'terraza', 'interior'], 'indiferente'),
    lang: oneOf<Lang>(input.lang, LANGS, 'es'),
    status: oneOf<ReservationStatus>(input.status, ['pendiente', 'confirmada', 'sentada', 'cancelada', 'no-vino'], 'pendiente'),
    source: oneOf<ReservationSource>(input.source, ['web', 'telefono', 'panel'], 'web'),
    createdAt: number(input.createdAt, Date.now()),
    updatedAt: number(input.updatedAt, Date.now()),
  }
}

/**
 * La carta de este navegador, o la empaquetada con la web si no hay copia o es de una versión
 * anterior de la carta: una copia vieja no puede tapar una carta nueva desplegada.
 */
export function loadMenu(): Menu {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const stored = normalizeMenu(JSON.parse(raw))
      if (stored.version >= MENU_VERSION) return stored
    }
  } catch {
    /* copia corrupta o navegador sin almacenamiento: se usa la carta empaquetada */
  }
  return seedMenu()
}

export function hasStoredMenu() {
  try {
    return Boolean(localStorage.getItem(KEY))
  } catch {
    return false
  }
}

export function saveMenu(menu: Menu) {
  try {
    localStorage.setItem(KEY, JSON.stringify(menu))
  } catch {
    /* la copia local es un atajo, no un requisito */
  }
}
