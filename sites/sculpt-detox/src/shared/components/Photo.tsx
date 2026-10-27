import type { ImgHTMLAttributes } from 'react'
import { PHOTO_VARIANTS } from '../photo-variants'

/**
 * Foto de la web. Sirve la variante que de verdad cabe en pantalla:
 * un móvil se lleva la de 480 px (≈20 kB) en vez del original de 1400 px (≈120 kB).
 * Para fotos externas o subidas desde el panel no hay variantes y se pinta el original.
 */
type Props = ImgHTMLAttributes<HTMLImageElement> & {
  src: string
  /** Anchura que ocupará la imagen; guía al navegador para elegir del srcset. */
  sizes?: string
  /** La foto que abre la pantalla no se difiere: es el LCP y va a máxima prioridad. */
  priority?: boolean
}

/**
 * Las fotos del almacén (`/media/<hash>.webp`) llevan siempre las mismas variantes,
 * así que el srcset sale de la propia URL: no hace falta manifiesto ni una consulta previa.
 * Van a la par con `VARIANTS` de server/media.js; si a una foto antigua le falta un tamaño,
 * el servidor da el siguiente.
 */
const MEDIA_SIZES = [240, 480, 760, 900]
const MEDIA_FULL = 1600
const isMedia = (src: string) => /^\/media\/[0-9a-f]{32}\.webp$/.test(src)

/** Todas las anchuras disponibles de una foto, listas para `srcset`. Sin variantes, `undefined`. */
export function srcSetFor(src: string) {
  const variant = PHOTO_VARIANTS[src]
  const base = src.replace(/\.[^.]+$/, '')
  if (variant) return [...variant.sizes.map((width) => `${base}-${width}.webp ${width}w`), `${src} ${variant.w}w`].join(', ')
  if (isMedia(src)) return [...MEDIA_SIZES.map((width) => `${base}-${width}.webp ${width}w`), `${src} ${MEDIA_FULL}w`].join(', ')
  return undefined
}

/** La variante más pequeña que cubre `width` píxeles: para miniaturas que no pasan por `srcset`. */
export function thumbSrc(src: string, width: number) {
  const base = src.replace(/\.[^.]+$/, '')
  if (isMedia(src)) return `${base}-${MEDIA_SIZES.find((size) => size >= width) ?? MEDIA_SIZES[MEDIA_SIZES.length - 1]}.webp`
  const variant = PHOTO_VARIANTS[src]
  const size = variant?.sizes.find((entry) => entry >= width)
  return size ? `${base}-${size}.webp` : src
}

export function Photo({ src, sizes = '100vw', priority = false, ...rest }: Props) {
  const srcSet = srcSetFor(src)

  return (
    <img
      {...rest}
      src={src}
      srcSet={srcSet}
      sizes={srcSet ? sizes : undefined}
      loading={priority ? 'eager' : (rest.loading ?? 'lazy')}
      decoding="async"
      {...(priority ? { fetchpriority: 'high' } : {})}
    />
  )
}
