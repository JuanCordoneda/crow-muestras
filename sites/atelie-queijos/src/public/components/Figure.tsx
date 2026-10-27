import { Photo } from '../../shared/components/Photo'
import { SHOW_PHOTO_TODO } from '../business'
import { useSite } from '../site'
import { cx } from '../../shared/utils'
import { CheeseBoard } from './Brand'

type Props = {
  /** Sin `src`, el hueco queda reservado con su letrero hasta que lleguen las fotos de Janaína. */
  src?: string
  alt: string
  /** Qué foto va aquí («Janaína cortando um queijo»…). Sale en el letrero del hueco. */
  todo?: string
  sizes?: string
  priority?: boolean
  className?: string
}

/**
 * Una foto de la web o, si aún no existe, un hueco a la altura: el mismo tamaño, un fondo crema
 * con la tábua de trazo fino en marca de agua y el letrero «Foto a substituir». Se buscan todos
 * con `data-todo` en el HTML.
 */
export function Figure({ src, alt, todo, sizes, priority, className }: Props) {
  const { t } = useSite()
  if (src) {
    return (
      <figure className={cx('figure', className)}>
        <Photo src={src} alt={alt} sizes={sizes} priority={priority} />
      </figure>
    )
  }
  return (
    <figure className={cx('figure', 'is-todo', className)} data-todo={todo} role="img" aria-label={alt}>
      <CheeseBoard className="figure-mark" size={120} />
      {SHOW_PHOTO_TODO && <figcaption className="figure-todo">{t.photoTodo}{todo ? ` · ${todo}` : ''}</figcaption>}
    </figure>
  )
}

/** La etiqueta «a completar» de un texto provisional. */
export function TodoTag() {
  const { t } = useSite()
  return <span className="todo-tag" data-todo="texto">{t.textTodo}</span>
}
