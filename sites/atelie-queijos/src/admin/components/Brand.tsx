import type { SVGProps } from 'react'

/**
 * La ola del logo de El Puerto (la misma del favicon). Va dibujada aquí y no importada de la web
 * pública: el panel es otro trozo de la app y no debe arrastrar sus componentes.
 */
export function Wave(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false" {...props}>
      <path
        fill="currentColor"
        d="M0 54.64L0 61.71C26.82 62.74 32.14 15.56 46.15 24.2C35.08 44.13 49.33 57.07 64 59.62L63.86 51.8C45.08 47.88 44.92 28.36 58.56 22.78C20.92 1.26 28.72 53.98 0 54.64"
      />
    </svg>
  )
}

/** Marca del panel: la ola en su pastilla y «El Puerto · Panel». */
export function Brand() {
  return (
    <span className="adm-brand">
      <span className="adm-brand-mark"><Wave /></span>
      <span className="adm-brand-text">El Puerto <small>· Panel</small></span>
    </span>
  )
}
