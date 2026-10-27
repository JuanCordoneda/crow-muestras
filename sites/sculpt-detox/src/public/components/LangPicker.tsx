import type { SiteLang } from '../../shared/routing'
import { cx } from '../../shared/utils'

/**
 * Banderas en SVG y no en emoji: Windows no dibuja los emoji de bandera y se verían como dos
 * letras sueltas. Van simplificadas porque se leen a 20 px de ancho.
 */
export function Flag({ code }: { code: SiteLang }) {
  const common = { viewBox: '0 0 60 40', className: 'flag', 'aria-hidden': true as const }
  if (code === 'es') {
    return (
      <svg {...common}>
        <rect width="60" height="40" fill="#c60b1e" />
        <rect y="10" width="60" height="20" fill="#ffc400" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <rect width="60" height="40" fill="#012169" />
      <path d="M0 0 60 40M60 0 0 40" stroke="#fff" strokeWidth="9" />
      <path d="M0 0 60 40M60 0 0 40" stroke="#c8102e" strokeWidth="4" />
      <path d="M30 0V40M0 20H60" stroke="#fff" strokeWidth="13" />
      <path d="M30 0V40M0 20H60" stroke="#c8102e" strokeWidth="7" />
    </svg>
  )
}

type Props = {
  /** El idioma al que lleva el botón (el contrario del de la página). */
  to: SiteLang
  /** La misma página en ese idioma. */
  href: string
  short: string
  name: string
  label: string
  light?: boolean
  /** En el cajón del móvil el botón va con el nombre del idioma entero. */
  wide?: boolean
}

/**
 * Con dos idiomas sobra el desplegable: un enlace a la misma página en el otro idioma. Es un
 * enlace de verdad (y no un botón), así que Google también lo sigue y descubre la versión inglesa.
 */
export function LangSwitch({ to, href, short, name, label, light = false, wide = false }: Props) {
  return (
    <a className={cx('lang-current', light && 'is-light', wide && 'is-wide')} href={href} hrefLang={to} lang={to} aria-label={`${wide ? name : short} · ${label}`} title={label}>
      <Flag code={to} />
      <span>{wide ? name : short}</span>
    </a>
  )
}
