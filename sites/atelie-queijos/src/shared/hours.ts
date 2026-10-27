/**
 * Horario y reservas, siempre en hora de Mallorca.
 *
 * El turista que mira la web desde su hotel suele llevar el teléfono en la hora de su país:
 * «abierto ahora» y las horas libres para hoy se calculan con la hora de Madrid, no con la del
 * aparato. Las fechas viajan como `YYYY-MM-DD` y las horas como `HH:MM`, sin objetos Date de por
 * medio, para que ningún cambio de zona horaria mueva una reserva de día.
 */
import type { DayHours, Lang, Settings } from './types'
import { LOCALES } from './i18n'

export const TIME_ZONE = 'Europe/Madrid'

export type Now = { date: string; minutes: number }

const pad = (value: number) => String(value).padStart(2, '0')

/** Día y minuto del día de ahora mismo en Mallorca. */
export function madridNow(at: Date = new Date()): Now {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(at)
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '0'
  return { date: `${get('year')}-${get('month')}-${get('day')}`, minutes: (Number(get('hour')) % 24) * 60 + Number(get('minute')) }
}

export const toMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number)
  return (hours || 0) * 60 + (minutes || 0)
}

export const fromMinutes = (total: number) => `${pad(Math.floor(total / 60) % 24)}:${pad(total % 60)}`

const utcDate = (date: string) => {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(Date.UTC(year, (month || 1) - 1, day || 1))
}

/** Días de la semana en el orden en que se leen en España y casi toda Europa: de lunes a domingo. */
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]

/** 0 = domingo … 6 = sábado. */
export const weekdayOf = (date: string) => utcDate(date).getUTCDay()

export const addDays = (date: string, days: number) => {
  const next = utcDate(date)
  next.setUTCDate(next.getUTCDate() + days)
  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`
}

export const isDateKey = (value: unknown): value is string => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
export const isTime = (value: unknown): value is string => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value)

/** Horario de un día concreto, o `null` si ese día no se abre (día de descanso o cierre puntual). */
export function hoursOn(settings: Settings, date: string): DayHours | null {
  if (settings.closedDates.includes(date)) return null
  const day = settings.hours[weekdayOf(date)]
  return !day || day.closed ? null : day
}

/** Un tramo de apertura: de `from` a `to`, en `HH:MM`. */
export type Range = { from: string; to: string }

/**
 * Los tramos que abre un día, en orden: uno, o dos si el horario es partido. Es el único sitio
 * donde se decide qué significa `split`, para que la web, el panel, la ficha de Google y la
 * validación del servidor no puedan discrepar.
 */
export function dayRanges(day: DayHours): Range[] {
  if (day.closed) return []
  const first: Range[] = day.open && day.close && day.close > day.open ? [{ from: day.open, to: day.close }] : []
  if (!day.split) return first
  // El segundo tramo solo cuenta si es posterior al primero: medio escrito no puede cerrar el día.
  const valid = day.open2 && day.close2 && day.close2 > day.open2 && day.open2 >= day.close
  return valid ? [...first, { from: day.open2, to: day.close2 }] : first
}

/** «12:00–16:00 · 19:00–23:00», o «12:00–22:00» si el día es corrido. */
export const rangesLabel = (day: DayHours, lang: Lang, dash = '–') =>
  dayRanges(day).map((range) => `${timeLabel(range.from, lang)}${dash}${timeLabel(range.to, lang)}`).join(' · ')

export type OpenState =
  /** Abierto: cierra a `closesAt`. `soon` si faltan menos de 45 minutos. */
  | { kind: 'open'; closesAt: string; soon: boolean }
  /** Hoy se abre, pero todavía no. */
  | { kind: 'later'; opensAt: string }
  /** Cerrado hasta el próximo día que se abre (`date`, a las `opensAt`). */
  | { kind: 'closed'; next: { date: string; opensAt: string } | null }

export function openState(settings: Settings, now: Now = madridNow()): OpenState {
  const today = hoursOn(settings, now.date)
  for (const range of today ? dayRanges(today) : []) {
    const openAt = toMinutes(range.from)
    const closeAt = toMinutes(range.to)
    // Antes de este tramo: o es la primera apertura del día, o es la siesta de un horario partido.
    if (now.minutes < openAt) return { kind: 'later', opensAt: range.from }
    if (now.minutes < closeAt) return { kind: 'open', closesAt: range.to, soon: closeAt - now.minutes <= 45 }
  }
  for (let offset = 1; offset <= 21; offset += 1) {
    const date = addDays(now.date, offset)
    const day = hoursOn(settings, date)
    const first = day ? dayRanges(day)[0] : undefined
    if (first) return { kind: 'closed', next: { date, opensAt: first.from } }
  }
  return { kind: 'closed', next: null }
}

export type ServiceId = 'lunch' | 'dinner'
export type ServiceSlots = { service: ServiceId; times: string[] }

/**
 * Horas a las que se puede reservar un día, por servicio. Van de la primera a la última hora de
 * llegada de cada franja, cada `slotMinutes`, sin salirse del horario del día. Para hoy se quitan
 * las que ya pasaron o no dejan margen a la cocina (`minNoticeMinutes`).
 */
export function slotsOn(settings: Settings, date: string, now: Now = madridNow()): ServiceSlots[] {
  const day = hoursOn(settings, date)
  // Fuera de la ventana de reservas no hay huecos: si no, el formulario ofrecería horas que el
  // servidor va a rechazar por estar demasiado lejos.
  if (!day || date < now.date || date > lastBookableDate(settings, now)) return []
  const step = Math.max(5, settings.slotMinutes || 30)
  const earliest = date === now.date ? now.minutes + Math.max(0, settings.minNoticeMinutes) : -1
  const result: ServiceSlots[] = []
  const ranges = dayRanges(day)
  for (const service of ['lunch', 'dinner'] as const) {
    if (!day[service]) continue
    const window = settings.services[service]
    const times: string[] = []
    // Con horario partido hay dos tramos: la hora tiene que caber en alguno, no entre los dos.
    for (const range of ranges) {
      const from = Math.max(toMinutes(window.from), toMinutes(range.from))
      /**
       * Nunca se da hora para la hora de cerrar: quien llega a las 22:00 en un sitio que cierra a
       * las 22:00 se encuentra la cocina apagada, y la web le diría «Cerrado ahora» al llegar.
       */
      const to = Math.min(toMinutes(window.to), toMinutes(range.to) - step)
      for (let minute = from; minute <= to; minute += step) {
        if (minute >= earliest) times.push(fromMinutes(minute))
      }
    }
    if (times.length) result.push({ service, times: [...new Set(times)].sort() })
  }
  return result
}

export type BookableDay = { date: string; weekday: number; open: boolean }

/** Último día que se puede reservar: hoy más los días de antelación que permita el restaurante. */
export const lastBookableDate = (settings: Settings, now: Now = madridNow()) => addDays(now.date, Math.max(1, settings.bookingDays))

/**
 * Los próximos días del selector de fecha, con los cerrados marcados para enseñarlos apagados.
 * Por defecto llega hasta el último día reservable, este incluido.
 */
export function upcomingDays(settings: Settings, now: Now = madridNow(), count = settings.bookingDays + 1): BookableDay[] {
  return Array.from({ length: Math.max(1, count) }, (_, offset) => {
    const date = addDays(now.date, offset)
    return { date, weekday: weekdayOf(date), open: slotsOn(settings, date, now).length > 0 }
  })
}

/** ¿Se puede reservar a esa hora de ese día? Es la misma regla que aplica el servidor. */
export function isBookable(settings: Settings, date: string, time: string, now: Now = madridNow()) {
  if (!isDateKey(date) || !isTime(time)) return false
  return slotsOn(settings, date, now).some((entry) => entry.times.includes(time))
}

/* ---------- formato ---------- */

const cache = new Map<string, Intl.DateTimeFormat>()
const formatter = (lang: Lang, options: Intl.DateTimeFormatOptions) => {
  const key = `${lang}:${JSON.stringify(options)}`
  let format = cache.get(key)
  if (!format) {
    // Las fechas se construyen a medianoche UTC: formatearlas en UTC evita que cambien de día.
    format = new Intl.DateTimeFormat(LOCALES[lang], { ...options, timeZone: 'UTC' })
    cache.set(key, format)
  }
  return format
}

/** «miércoles, 17 de septiembre», «Wednesday 17 September»… */
export const longDate = (date: string, lang: Lang) => formatter(lang, { weekday: 'long', day: 'numeric', month: 'long' }).format(utcDate(date))

/** «mié», «Wed», «Mi.», «mer.» */
export const shortWeekday = (date: string, lang: Lang) => formatter(lang, { weekday: 'short' }).format(utcDate(date)).replace(/\.$/, '')

export const dayNumber = (date: string) => String(utcDate(date).getUTCDate())

/** «sept», «Sep»… */
export const shortMonth = (date: string, lang: Lang) => formatter(lang, { month: 'short' }).format(utcDate(date)).replace(/\.$/, '')

/** Nombre del día de la semana a partir de su índice (0 = domingo). */
export const weekdayName = (weekday: number, lang: Lang, style: 'long' | 'short' = 'long') =>
  // El 4 de enero de 1970 fue domingo.
  formatter(lang, { weekday: style }).format(new Date(Date.UTC(1970, 0, 4 + weekday)))

/** «13:30» en todos los idiomas salvo el inglés, que prefiere «1:30 pm». */
export const timeLabel = (time: string, lang: Lang) => {
  if (lang !== 'en') return time
  const minutes = toMinutes(time)
  const hours = Math.floor(minutes / 60)
  const suffix = hours >= 12 ? 'pm' : 'am'
  const twelve = hours % 12 === 0 ? 12 : hours % 12
  return `${twelve}${minutes % 60 ? `:${pad(minutes % 60)}` : ''} ${suffix}`
}
