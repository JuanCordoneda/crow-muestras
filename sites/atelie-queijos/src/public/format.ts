/**
 * Fechas, horas, precios y cifras como se escriben en cada idioma: «sáb., 31 de out. · 11h» en
 * portugués, «sam. 31 oct. · 11 h» en francés y «Sat 31 Oct · 11am» en inglés.
 *
 * Todo pasa por `Intl` con la zona fija (UTC para el día, que ya viene en hora de París): el HTML
 * que se pinta en el build y el que pinta el navegador dicen lo mismo, esté donde esté el visitante.
 */
import type { SiteLang } from '../shared/routing'
import type { Session } from './agenda'

const LOCALES: Record<SiteLang, string> = { pt: 'pt-BR', fr: 'fr-FR', en: 'en-GB' }

const asDate = (day: string) => new Date(`${day}T12:00:00Z`)
const format = (day: string, lang: SiteLang, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(LOCALES[lang], { timeZone: 'UTC', ...options }).format(asDate(day))

const capitalize = (text: string) => text.charAt(0).toLocaleUpperCase() + text.slice(1)

/** «11h» / «18h30» en portugués; «11 h» / «18 h 30» en francés; «11am» / «6.30pm» en inglés. */
export function timeLabel(time: string, lang: SiteLang) {
  const [hours, minutes] = time.split(':').map(Number)
  const mm = String(minutes).padStart(2, '0')
  if (lang === 'pt') return minutes ? `${hours}h${mm}` : `${hours}h`
  if (lang === 'fr') return minutes ? `${hours} h ${mm}` : `${hours} h`
  const suffix = hours >= 12 ? 'pm' : 'am'
  const twelve = hours % 12 || 12
  return minutes ? `${twelve}.${mm}${suffix}` : `${twelve}${suffix}`
}

/** Las piezas de la tarjeta de una sesión: «SÁB.», «31», «outubro». */
export function sessionParts(session: Session, lang: SiteLang) {
  return {
    weekday: format(session.date, lang, { weekday: 'short' }).replace(/\.$/, ''),
    day: format(session.date, lang, { day: 'numeric' }),
    month: format(session.date, lang, { month: 'long' }),
    time: timeLabel(session.time, lang),
  }
}

/** «Sábado, 31 de outubro · 11h»: la que va en el desplegable y en el mensaje de WhatsApp. */
export function sessionLabel(session: Session, lang: SiteLang) {
  const day = format(session.date, lang, { weekday: 'long', day: 'numeric', month: 'long' })
  return `${capitalize(day)} · ${timeLabel(session.time, lang)}`
}

/** «Sáb., 31 de out. · 11h»: la versión corta, para el héroe y la página de links. */
export function sessionShort(session: Session, lang: SiteLang) {
  const day = format(session.date, lang, { weekday: 'short', day: 'numeric', month: 'short' })
  return `${capitalize(day)} · ${timeLabel(session.time, lang)}`
}

/** «98 €» en portugués y francés; «€98» en inglés. Sin decimales: el precio es redondo. */
export const euros = (value: number, lang: SiteLang) => {
  const number = new Intl.NumberFormat(LOCALES[lang], { maximumFractionDigits: 0 }).format(value)
  return lang === 'en' ? `€${number}` : `${number} €`
}

/** «57,5 mil» / «57,5 k» / «57.5K»: como lo enseña el propio Instagram en cada idioma. */
export function compactCount(value: number, lang: SiteLang) {
  const thousands = new Intl.NumberFormat(LOCALES[lang], { maximumFractionDigits: 1 }).format(value / 1000)
  return lang === 'pt' ? `${thousands} mil` : lang === 'fr' ? `${thousands} k` : `${thousands}K`
}
