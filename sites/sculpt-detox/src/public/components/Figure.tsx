import { Photo } from '../../shared/components/Photo'
import { SHOW_PHOTO_TODO } from '../business'
import { useSite } from '../site'
import { cx } from '../../shared/utils'

type Props = {
  /** Sin `src`, el hueco queda reservado con su letrero hasta que lleguen las fotos de Michele. */
  src?: string
  alt: string
  /** Qué foto va aquí («cabina», «manos trabajando»…). Sale en el letrero del hueco. */
  todo?: string
  /** Pie bajo la foto: «Imagen ilustrativa». */
  note?: string
  sizes?: string
  priority?: boolean
  className?: string
  /** Tamaño real de la foto: reserva el hueco antes de que llegue y no salta nada al cargar. */
  width?: number
  height?: number
}

/**
 * Una foto de la web o, si aún no existe, un hueco a la altura: el mismo tamaño, un fondo de
 * arena con el emblema en marca de agua y el letrero de lo que falta. Se buscan todos con
 * `data-todo` en el HTML.
 */
export function Figure({ src, alt, todo, note, sizes, priority, className, width, height }: Props) {
  const { t } = useSite()
  if (src) {
    return (
      <figure className={cx('figure', className)}>
        <Photo src={src} alt={alt} sizes={sizes} priority={priority} width={width} height={height} />
        {note && <figcaption className="figure-note">{note}</figcaption>}
      </figure>
    )
  }
  return (
    <div className={cx('figure', 'is-todo', className)} data-todo={todo} role="img" aria-label={alt}>
      <img className="figure-mark" src="/img/sculptdetox/emblema-120.webp" alt="" width={120} height={150} loading="lazy" decoding="async" />
      {SHOW_PHOTO_TODO && todo && <span className="figure-todo" aria-hidden="true">{t.photoTodo} · {todo}</span>}
    </div>
  )
}
