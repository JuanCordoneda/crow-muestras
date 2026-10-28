/**
 * Las fotos del ateliê que usa la web. Los ficheros salen de `recursos/originales/atelie/` con
 * `npm run images` (scripts/fotos.mjs), en AVIF y webp y en todos los tamaños.
 */
import type { Texts } from './content'
import type { Story } from './components/Stories'

export const PHOTOS = {
  hero: '/img/atelie/tabua-queijos.webp',
  /** La misma tábua en 1:2, para móviles altos: el héroe no estira ni desperdicia píxeles. */
  heroMobile: '/img/atelie/tabua-queijos-movil.webp',
  table: '/img/atelie/mesa-atelie.webp',
  board: '/img/atelie/tabua-paes-queijos.webp',
  janaina: '/img/atelie/janaina-pedroza.webp',
  avatar: '/img/atelie/janaina-avatar.webp',
}

/** Las stories del ateliê, en el orden en que se cuentan: la mesa, lo que acompaña, la tábua y Janaína. */
export const atelierStories = (t: Texts): Story[] => [
  { src: PHOTOS.table, alt: t.live.photoAlt, ...t.stories.items[0] },
  { src: PHOTOS.board, alt: t.live.photoAlt2, ...t.stories.items[1] },
  { src: PHOTOS.hero, alt: t.hero.photoAlt, ...t.stories.items[2] },
  { src: PHOTOS.janaina, alt: t.host.photoAlt, ...t.stories.items[3] },
]
