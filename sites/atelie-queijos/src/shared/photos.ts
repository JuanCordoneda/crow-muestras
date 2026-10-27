import type { Settings } from './types'

/**
 * Los huecos de foto de la web: lo que el restaurante puede cambiar desde el panel sin tocar el
 * código. Cada hueco tiene la foto con la que se estrenó la web; mientras no se cambie, es la que
 * se enseña, así que una carta guardada sin `photos` sigue viéndose igual.
 *
 * Los identificadores no cambian: el pie de cada foto del local vive en las traducciones
 * (`t.place.photos.<id>`) y se emparejan por aquí.
 */
export const PHOTO_SLOTS = [
  { id: 'hero1', group: 'portada', label: 'Portada · primera', hint: 'La que se ve al entrar. Conviene que sea apaisada y a mucha resolución.', src: '/img/cocina-paellas.webp' },
  { id: 'hero2', group: 'portada', label: 'Portada · segunda', hint: '', src: '/img/espigon.webp' },
  { id: 'hero3', group: 'portada', label: 'Portada · tercera', hint: '', src: '/img/mesa-vistas.webp' },
  { id: 'arroces', group: 'portada', label: 'Los arroces', hint: 'Acompaña al bloque de paellas por encargo.', src: '/img/cocina-paellas.webp' },
  { id: 'historia', group: 'portada', label: 'La historia', hint: 'Va junto a «desde 1983».', src: '/img/espigon.webp' },
  { id: 'terraza', group: 'local', label: 'La terraza', hint: '', src: '/img/terraza.webp' },
  { id: 'mesa', group: 'local', label: 'Mesa con vistas', hint: '', src: '/img/mesa-vistas.webp' },
  { id: 'salon', group: 'local', label: 'El salón', hint: '', src: '/img/interior-salon.webp' },
  { id: 'azulejos', group: 'local', label: 'Los azulejos', hint: '', src: '/img/interior-azulejos.webp' },
  { id: 'barra', group: 'local', label: 'La barra', hint: '', src: '/img/interior-barra.webp' },
  { id: 'banco', group: 'local', label: 'El banco', hint: '', src: '/img/interior-banco.webp' },
] as const

export type PhotoSlot = (typeof PHOTO_SLOTS)[number]['id']

const DEFAULTS = Object.fromEntries(PHOTO_SLOTS.map((slot) => [slot.id, slot.src])) as Record<PhotoSlot, string>

/** La foto de un hueco: la que puso el restaurante o, si no ha puesto ninguna, la de serie. */
export const sitePhoto = (settings: Settings, slot: PhotoSlot) => settings.photos?.[slot]?.trim() || DEFAULTS[slot]
