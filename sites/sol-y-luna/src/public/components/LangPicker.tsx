import type { Lang } from '../../shared/types'
import { LANG_NAMES, PUBLIC_LANGS } from '../../shared/i18n'
import { cx } from '../../shared/utils'

/**
 * Banderas en SVG y no en emoji: Windows no dibuja los emoji de bandera y se verían como dos
 * letras sueltas. Van simplificadas porque se leen a 20 px de ancho.
 */
export function Flag({ code }: { code: Lang }) {
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
      <rect width="60" height="40" fill="#fff" />
      <rect width="20" height="40" fill="#002395" />
      <rect x="40" width="20" height="40" fill="#ed2939" />
    </svg>
  )
}

type Props = {
  lang: Lang
  onChange: (lang: Lang) => void
  label: string
  /** Sobre la foto de la portada el botón va en claro. */
  light?: boolean
}

/**
 * Con dos idiomas no hace falta desplegable: un interruptor FR | ES, con el activo marcado. Un toque
 * cambia la web entera, que es lo que espera quien busca «Español» en la cabecera.
 */
export function LangPicker({ lang, onChange, label, light = false }: Props) {
  return (
    <div className={cx('lang-switch', light && 'is-light')} role="radiogroup" aria-label={label}>
      {PUBLIC_LANGS.map((code) => (
        <button
          type="button"
          key={code}
          role="radio"
          aria-checked={code === lang}
          aria-label={LANG_NAMES[code]}
          className={cx(code === lang && 'is-on')}
          lang={code}
          onClick={() => onChange(code)}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  )
}

/** Dentro del cajón de móvil los dos idiomas van con su nombre: un toque y listo. */
export function LangGrid({ lang, onChange, label }: Omit<Props, 'light'>) {
  return (
    <div className="lang-grid" role="radiogroup" aria-label={label}>
      {PUBLIC_LANGS.map((code) => (
        <button
          type="button"
          key={code}
          role="radio"
          aria-checked={code === lang}
          className={cx('lang-option', code === lang && 'active')}
          lang={code}
          onClick={() => onChange(code)}
        >
          <Flag code={code} />
          <span>{LANG_NAMES[code]}</span>
        </button>
      ))}
    </div>
  )
}
