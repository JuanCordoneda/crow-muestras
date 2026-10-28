import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import { ArrowUpRight, Pause, Play, X } from 'lucide-react'
import { Photo } from '../../shared/components/Photo'
import { useFocusTrap } from '../../shared/useFocusTrap'
import { useScrollLock } from '../../shared/useMedia'
import { cx } from '../../shared/utils'
import { BUSINESS } from '../business'
import { useSite } from '../site'
import { VerifiedBadge } from './Brand'

export type Story = { src: string; alt: string; kicker: string; caption: string }

type Props = { stories: Story[]; start: number; onClose: () => void; onBook: () => void }

/** Lo que dura cada story, como en Instagram. */
const DURATION = 5000
/** Un toque más largo que esto es «mantener para pausar», no «pasar». */
const HOLD = 220

/**
 * Las fotos del ateliê como stories de Instagram, que es el idioma de quien llega desde la bio:
 * barras de progreso arriba, toque a la derecha para avanzar y a la izquierda para volver, mantener
 * pulsado para pausar, y al final el botón de reservar como un sticker de enlace.
 *
 * El avance lo lleva la animación CSS de la barra activa (`animationend`): sin temporizadores que se
 * desincronicen al pausar. Con «reducir movimiento» no avanza solo.
 */
export function Stories({ stories, start, onClose, onBook }: Props) {
  const { t } = useSite()
  const copy = t.stories
  const [index, setIndex] = useState(start)
  const [paused, setPaused] = useState(false)
  const [still, setStill] = useState(false)
  const panel = useRef<HTMLDivElement>(null)
  const pressed = useRef<number>(0)
  const holdTimer = useRef<number>(0)

  useScrollLock(true)
  useFocusTrap(panel)
  useEffect(() => {
    setStill(Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches))
    panel.current?.focus()
  }, [])

  /** Pasada la última, se cierra: como en Instagram. */
  const next = useCallback(() => {
    if (index >= stories.length - 1) onClose()
    else setIndex(index + 1)
  }, [index, stories.length, onClose])
  const previous = useCallback(() => setIndex((current) => Math.max(0, current - 1)), [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      else if (event.key === 'ArrowRight') next()
      else if (event.key === 'ArrowLeft') previous()
      else if (event.key === ' ') { event.preventDefault(); setPaused((value) => !value) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, previous, onClose])

  /** Mantener pulsado pausa; soltar rápido avanza o retrocede según el lado. */
  const down = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('a, button')) return
    pressed.current = Date.now()
    holdTimer.current = window.setTimeout(() => setPaused(true), HOLD)
  }
  const up = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest('a, button')) return
    window.clearTimeout(holdTimer.current)
    const held = Date.now() - pressed.current >= HOLD
    if (held) {
      setPaused(false)
      return
    }
    const box = event.currentTarget.getBoundingClientRect()
    if (event.clientX - box.left < box.width * 0.35) previous()
    else next()
  }

  const story = stories[index]

  return (
    <div className="stories" role="dialog" aria-modal="true" aria-label={copy.title} onClick={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div className={cx('stories-frame', paused && 'is-paused')} ref={panel} tabIndex={-1}>
        <div className="stories-bars" aria-hidden="true">
          {stories.map((entry, position) => (
            <span key={entry.src} className={cx(position < index && 'is-done')}>
              {position === index && (
                <i
                  key={`${index}-${still}`}
                  className={cx(still && 'is-still')}
                  style={{ animationDuration: `${DURATION}ms` }}
                  onAnimationEnd={next}
                />
              )}
            </span>
          ))}
        </div>

        <header className="stories-head">
          <Photo className="stories-avatar" src="/img/atelie/janaina-avatar.webp" alt="" sizes="32px" />
          <b>{BUSINESS.instagramHandle.slice(1)}</b>
          <VerifiedBadge size={14} label={t.host.verified} />
          <small>{story.kicker}</small>
          <button type="button" className="stories-icon" onClick={() => setPaused((value) => !value)} aria-label={paused ? copy.play : copy.pause}>
            {paused ? <Play size={20} /> : <Pause size={20} />}
          </button>
          <button type="button" className="stories-icon" onClick={onClose} aria-label={copy.close}><X size={24} /></button>
        </header>

        <div className="stories-stage" onPointerDown={down} onPointerUp={up} onPointerCancel={() => { window.clearTimeout(holdTimer.current); setPaused(false) }}>
          {stories.map((entry, position) => (
            // Solo la actual y la siguiente están montadas: la siguiente ya está descargada al pasar.
            (position === index || position === index + 1) && (
              <Photo
                key={entry.src}
                className={cx('stories-photo', position === index && 'is-on')}
                src={entry.src}
                alt={position === index ? entry.alt : ''}
                sizes="(max-width: 760px) 75vh, 640px"
                priority={position === index}
                loading="eager"
                draggable={false}
              />
            )
          ))}
          <div className="stories-caption" aria-live="polite">
            <p>{story.caption}</p>
          </div>
        </div>

        <footer className="stories-foot">
          <a className="stories-cta" href="#reservar" onClick={(event) => { event.preventDefault(); onBook() }}>
            <ArrowUpRight size={18} /> {copy.cta}
          </a>
          <div className="stories-nav">
            <button type="button" onClick={previous} disabled={index === 0} aria-label={copy.previous}>‹</button>
            <button type="button" onClick={next} aria-label={copy.next}>›</button>
          </div>
        </footer>
      </div>
    </div>
  )
}
