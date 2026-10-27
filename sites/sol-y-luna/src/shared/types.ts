/** Idiomas de la web. El castellano es el de referencia: lo que falte en otro idioma se enseña en castellano. */
export type Lang = 'es' | 'en' | 'de' | 'fr'

/** Un texto en los cuatro idiomas. */
export type Localized = Record<Lang, string>

/** Los catorce alérgenos de declaración obligatoria (Reglamento UE 1169/2011). */
export const ALLERGENS = [
  'gluten', 'crustaceos', 'huevos', 'pescado', 'cacahuetes', 'soja', 'lacteos',
  'frutos-cascara', 'apio', 'mostaza', 'sesamo', 'sulfitos', 'altramuces', 'moluscos',
] as const
export type Allergen = (typeof ALLERGENS)[number]

/** Distintivos del plato que ayudan a elegir. Solo se marcan cuando son ciertos sin matices. */
export const DISH_TAGS = ['vegano', 'vegetariano', 'sin-gluten', 'picante'] as const
export type DishTag = (typeof DISH_TAGS)[number]

/** 'agotado' se enseña tachado para que se sepa que existe; 'oculto' no sale en la web. */
export type DishStatus = 'disponible' | 'agotado' | 'oculto'

/** Variante con precio propio: las bolas de helado, los sabores de un corte… */
export type DishOption = { id: string; label: Localized; price: number }

export type Dish = {
  id: string
  categoryId: string
  name: Localized
  description: Localized
  /** Precio en euros. Con opciones, es el de la más barata. */
  price: number
  /** Los arroces se cobran por persona y con un mínimo de dos. */
  perPerson: boolean
  options: DishOption[]
  /** Ruta de la foto (`/img/…` o `/media/<hash>.webp`). Vacía = sin foto. */
  photo: string
  tags: DishTag[]
  allergens: Allergen[]
  /** Especialidad de la casa: sale en el carrusel de la portada. */
  featured: boolean
  status: DishStatus
  updatedAt: number
}

export type Category = {
  id: string
  name: Localized
  /** Aviso bajo el título de la sección: mínimos, precios por persona… */
  note: Localized
  /** Línea al pie de la sección: «Otros arroces bajo petición». */
  footnote: Localized
  visible: boolean
}

/** Sugerencias fuera de carta: las de esta semana y las del mes. */
export const SPECIAL_PERIODS = ['semana', 'mes'] as const
export type SpecialPeriod = (typeof SPECIAL_PERIODS)[number]

/**
 * Una sugerencia de la casa. Puede ir enlazada a un plato de la carta (toma de él la foto y el
 * precio si no se ponen) o ser algo que solo se hace esos días: un arroz de temporada, un pescado
 * del día. Si es un arroz, la web ofrece encargarlo con la reserva.
 */
export type Special = {
  id: string
  period: SpecialPeriod
  name: Localized
  description: Localized
  /** 0 = sin precio (o el del plato enlazado). */
  price: number
  perPerson: boolean
  photo: string
  /** Plato de la carta al que remite. Vacío = sugerencia suelta. */
  dishId: string
  visible: boolean
}

/**
 * Horario de un día de la semana. Las horas van en formato `HH:MM`, hora de Mallorca.
 *
 * Un día abre un tramo (`open`–`close`) o dos, si el horario es partido (`split`): de día y de
 * noche, con la cocina cerrada en medio. Es lo normal fuera de temporada, y sin el segundo tramo
 * había que poner 12:00–23:00 y la web decía «abierto» a las cinco de la tarde, que es mentira y
 * es justo la hora a la que alguien se planta en la puerta.
 */
export type DayHours = {
  closed: boolean
  open: string
  close: string
  /** Horario partido: el día vuelve a abrir de `open2` a `close2`. */
  split: boolean
  open2: string
  close2: string
  /** Ese día se sirve almuerzo / cena. */
  lunch: boolean
  dinner: boolean
}

/** Franja en la que se aceptan reservas (la hora de llegada, no la de cierre). */
export type Service = { from: string; to: string }

export type Settings = {
  name: string
  phone: string
  /** Segundo teléfono (móvil). Vacío = no se enseña. */
  mobile: string
  /** Número de WhatsApp con prefijo (`34666…`). Vacío = no se ofrece WhatsApp. */
  whatsapp: string
  email: string
  address: string
  postcode: string
  town: string
  region: string
  latitude: number
  longitude: number
  instagram: string
  facebook: string
  tripadvisor: string
  /** Enlace para dejar una reseña en Google (g.page/…). Vacío = no se ofrece. */
  google: string
  /**
   * Ficha del restaurante en Google Business, la que se edita para cambiar el horario. No sale en
   * la web: la usa el panel para llevar de un toque al sitio donde se corrige el horario en Google
   * cuando se cambia aquí. Vacío = se abre el panel general de Google Business.
   */
  googleBusiness: string
  /** Índice 0 = domingo … 6 = sábado, como `Date.getDay()`. */
  hours: DayHours[]
  services: { lunch: Service; dinner: Service }
  /** Minutos entre dos horas de reserva seguidas. */
  slotMinutes: number
  /** Con cuánta antelación mínima se puede reservar para hoy. */
  minNoticeMinutes: number
  /** Cuántos días por delante se puede reservar. */
  bookingDays: number
  /** Grupos más grandes reservan por teléfono. */
  maxPartySize: number
  /**
   * Comensales que se aceptan por turno desde la web. 0 = sin límite, que es como sale de fábrica:
   * hasta que el restaurante diga cuánta gente le cabe, la web no puede saber cuándo está lleno.
   */
  capacity: { lunch: number; dinner: number }
  /** Se aceptan reservas desde la web. */
  bookingEnabled: boolean
  /** Días de cierre puntual (vacaciones, festivos): `YYYY-MM-DD`. */
  closedDates: string[]
  /** Aviso en lo alto de la web (cierre por vacaciones, un plato del día…). Vacío = sin aviso. */
  notice: Localized
  /** Sugerencias de la semana y del mes, en el orden en que salen en la portada. */
  specials: Special[]
  /**
   * Fotos de la web por hueco (`hero1`, `terraza`…), las que cambia el panel. Lo que falte se
   * enseña con la foto de serie: ver `src/shared/photos.ts`.
   */
  photos: Record<string, string>
}

export type ReservationStatus = 'pendiente' | 'confirmada' | 'sentada' | 'cancelada' | 'no-vino'
export type ReservationSource = 'web' | 'telefono' | 'panel'
export type SeatingPreference = 'indiferente' | 'terraza' | 'interior'

export type Reservation = {
  id: string
  /** `YYYY-MM-DD`, día en Mallorca. */
  date: string
  /** `HH:MM`, hora de llegada. */
  time: string
  adults: number
  /** Menores de 12 años. */
  children: number
  name: string
  phone: string
  email: string
  note: string
  /**
   * Paella encargada con la reserva: plato de la sección de arroces, raciones y si se quiere en
   * fideuà en vez de en arroz (la casa hace las dos cosas con los mismos ingredientes).
   */
  paella: { dishId: string; servings: number; fideua?: boolean } | null
  seating: SeatingPreference
  /** Idioma en que se hizo: para contestar en el mismo. */
  lang: Lang
  status: ReservationStatus
  source: ReservationSource
  createdAt: number
  updatedAt: number
}

/** Lo que publica el panel y lee la web: carta, horarios y datos del restaurante. */
export type Menu = {
  version: number
  settings: Settings
  categories: Category[]
  dishes: Dish[]
}

/** Alta de reserva desde la web: el servidor pone el id, el estado y las fechas. */
export type ReservationRequest = Pick<
  Reservation,
  'date' | 'time' | 'adults' | 'children' | 'name' | 'phone' | 'email' | 'note' | 'paella' | 'seating' | 'lang'
>
