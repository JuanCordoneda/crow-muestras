import type { Lang, Localized } from './types'
import { stripBase } from './base'

export const LANGS: Lang[] = ['es', 'en', 'de', 'fr']

/**
 * Los idiomas de la web pública: francés, que es el principal, y castellano. El panel sigue
 * guardando los cuatro, pero el visitante solo ve estos dos.
 */
export const PUBLIC_LANGS: Lang[] = ['fr', 'es']

/** Configuración regional de cada idioma: decide cómo se escriben precios, fechas y horas. */
export const LOCALES: Record<Lang, string> = { es: 'es-ES', en: 'en-GB', de: 'de-DE', fr: 'fr-FR' }

/** El idioma se dice en su propia lengua: así lo reconoce quien no entiende la web. */
export const LANG_NAMES: Record<Lang, string> = { es: 'Español', en: 'English', de: 'Deutsch', fr: 'Français' }

const isLang = (value: unknown): value is Lang => typeof value === 'string' && (PUBLIC_LANGS as string[]).includes(value)

/** Un texto en el idioma pedido; si falta esa traducción, el castellano. */
export const pick = (text: Localized | undefined, lang: Lang) => (text?.[lang] ?? '').trim() || (text?.es ?? '').trim()

const money = new Map<Lang, Intl.NumberFormat>()

/** «21,75 €» en castellano, alemán y francés; «€21.75» en inglés. */
export const price = (value: number, lang: Lang) => {
  let format = money.get(lang)
  if (!format) {
    format = new Intl.NumberFormat(LOCALES[lang], { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 })
    money.set(lang, format)
  }
  return format.format(Number.isFinite(value) ? value : 0)
}

const LANG_KEY = 'mexiandco:lang'

/**
 * Idioma con el que se abre la web. Manda, por este orden: `?lang=` en el enlace, lo que eligió el
 * visitante en otra visita y el idioma de su teléfono. La web es francesa: quien no tenga el
 * teléfono en castellano (o en catalán, gallego o euskera) la ve en francés.
 */
export function detectLang(): Lang {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get('lang')?.toLowerCase()
    if (isLang(fromUrl)) return fromUrl
    const fromPath = stripBase(window.location.pathname).match(/^\/(es|fr)(\/|$)/)?.[1]
    if (isLang(fromPath)) return fromPath
    const saved = localStorage.getItem(LANG_KEY)
    if (isLang(saved)) return saved
  } catch {
    /* sin almacenamiento: se decide por el navegador */
  }
  const preferred = typeof navigator === 'undefined' ? [] : navigator.languages?.length ? navigator.languages : [navigator.language]
  const first = preferred[0]?.slice(0, 2).toLowerCase()
  if (first === 'es' || first === 'ca' || first === 'gl' || first === 'eu') return 'es'
  return 'fr'
}

export function saveLang(lang: Lang) {
  try {
    localStorage.setItem(LANG_KEY, lang)
  } catch {
    /* sin almacenamiento el idioma dura lo que la pestaña */
  }
}
