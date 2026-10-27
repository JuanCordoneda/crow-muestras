import { Camera } from 'lucide-react'
import { cx } from '../../shared/utils'
import { PapelPicado, Sun } from './Brand'

/**
 * PLACEHOLDER: el cartel que ocupa el sitio de la foto de un local que todavía no tiene. Rayos de
 * sol sobre el color de la casa, la guirnalda de papel picado, el sol y el nombre en grande: se lee
 * como un cartel de fiesta y no como un hueco roto. Cuando lleguen las fotos, basta con poner `photo` en `venues.ts`.
 */
export function PhotoSoon({ name, label, tone = 'noche', className = '' }: { name: string; label: string; tone?: 'noche' | 'terracota'; className?: string }) {
  return (
    <span className={cx('photo-soon', `is-${tone}`, className)} role="img" aria-label={`${name} · ${label}`}>
      <PapelPicado className="is-soon" />
      <Sun className="photo-soon-sun" />
      <b>{name}</b>
      <small><Camera size={13} /> {label}</small>
    </span>
  )
}
