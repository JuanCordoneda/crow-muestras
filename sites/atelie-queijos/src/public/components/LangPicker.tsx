import { SITE_LANGS, type SiteLang } from '../../shared/routing'
import { cx } from '../../shared/utils'

/** Cada idioma se nombra en su propia lengua: así lo reconoce quien no entiende la página. */
export const LANG_NAMES: Record<SiteLang, string> = { pt: 'Português', fr: 'Français', en: 'English' }

type Props = {
  lang: SiteLang
  /** La misma página en cada idioma. */
  hrefs: Record<SiteLang, string>
  label: string
  switchTo: (name: string) => string
  light?: boolean
  /** En el cajón del móvil los botones van con el nombre del idioma entero. */
  wide?: boolean
}

/**
 * Tres idiomas caben a la vista: PT · FR · EN, sin desplegable que abrir. Son enlaces de verdad (y
 * no botones), así que Google también los sigue y descubre las versiones francesa e inglesa.
 */
export function LangSwitch({ lang, hrefs, label, switchTo, light = false, wide = false }: Props) {
  return (
    <nav className={cx('lang-switch', light && 'is-light', wide && 'is-wide')} aria-label={label}>
      {SITE_LANGS.map((code) => (
        <a
          key={code}
          href={hrefs[code]}
          hrefLang={code}
          lang={code}
          className={cx(code === lang && 'is-on')}
          aria-current={code === lang ? 'true' : undefined}
          aria-label={code === lang ? LANG_NAMES[code] : switchTo(LANG_NAMES[code])}
        >
          {wide ? LANG_NAMES[code] : code.toUpperCase()}
        </a>
      ))}
    </nav>
  )
}
