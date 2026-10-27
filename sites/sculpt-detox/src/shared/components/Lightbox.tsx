import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Photo, thumbSrc } from './Photo'
import { useFocusTrap } from '../useFocusTrap'
import { useScrollLock } from '../useMedia'

export type GalleryPhoto = { id: string; src: string; caption: string }

/** Textos accesibles de la galería, ya traducidos. */
export type LightboxLabels = { gallery: string; close: string; previous: string; next: string; goTo: (index: number) => string }

const spanish: LightboxLabels = {
  gallery: 'Galería de fotos', close: 'Cerrar galería', previous: 'Anterior', next: 'Siguiente', goTo: (index) => `Ir a la foto ${index}`,
}

type Props = { photos: GalleryPhoto[]; index: number; onIndex: (next: number) => void; onClose: () => void; labels?: LightboxLabels }

/** A partir de aquí el arrastre se considera intención de cambiar de foto y no un toque. */
const SLOP = 10
/** Un gesto rápido pasa de foto aunque se haya recorrido poco. */
const FLICK = 0.45
/**
 * Fotos que se mantienen montadas a cada lado de la que se ve. Con ochenta fotos, tener las
 * ochenta en el DOM son ochenta descargas en cuanto el navegador decide que están "cerca";
 * con dos por lado el siguiente pase ya está cargado y no se paga el resto.
 */
const NEAR = 2

export function Lightbox({ photos, index, onIndex, onClose, labels = spanish }: Props) {
  const total = photos.length
  const safe = Math.min(Math.max(index, 0), Math.max(total - 1, 0))
  /** Desplazamiento en píxeles que el dedo lleva acumulado sobre el carrusel. */
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null)
  const gesture = useRef<{ x: number; y: number; time: number; axis: '' | 'x' | 'y' } | null>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const stripRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  /** La galería tapa la página entera: el tabulador se queda dentro y al cerrar vuelve a su sitio. */
  useFocusTrap(panelRef)

  /** Con muchas fotos la miniatura activa se sale de la tira: se la trae de vuelta al cambiar. */
  useEffect(() => {
    const active = stripRef.current?.children[safe] as HTMLElement | undefined
    active?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [safe])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (!total) return
      if (event.key === 'ArrowRight') onIndex((safe + 1) % total)
      if (event.key === 'ArrowLeft') onIndex((safe - 1 + total) % total)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, onIndex, safe, total])
  // Aparte del de las teclas, que se rehace con cada foto: el fondo se congela una vez y se queda.
  useScrollLock(true)

  const start = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') return
    gesture.current = { x: event.clientX, y: event.clientY, time: Date.now(), axis: '' }
  }

  const move = (event: React.PointerEvent<HTMLDivElement>) => {
    const from = gesture.current
    if (!from) return
    const x = event.clientX - from.x
    const y = event.clientY - from.y
    if (!from.axis) {
      if (Math.abs(x) < SLOP && Math.abs(y) < SLOP) return
      from.axis = Math.abs(x) > Math.abs(y) ? 'x' : 'y'
      // El gesto ya es un arrastre: el toque no debe abrir nada al soltar.
      stageRef.current?.setPointerCapture(event.pointerId)
    }
    // En los extremos el carrusel se resiste, así se nota que no hay más fotos.
    const edge = (x > 0 && safe === 0) || (x < 0 && safe === total - 1)
    setDrag(from.axis === 'x' ? { x: edge ? x / 3 : x, y: 0 } : { x: 0, y: Math.max(y, 0) })
  }

  const end = (event: React.PointerEvent<HTMLDivElement>) => {
    const from = gesture.current
    gesture.current = null
    setDrag(null)
    if (!from || !from.axis) return
    const x = event.clientX - from.x
    const y = event.clientY - from.y
    const elapsed = Math.max(Date.now() - from.time, 1)
    if (from.axis === 'y') {
      // Deslizar hacia abajo cierra la galería, como en las apps de fotos.
      if (y > 110 || y / elapsed > FLICK) onClose()
      return
    }
    const width = stageRef.current?.clientWidth || 1
    const far = Math.abs(x) > width * 0.22 || Math.abs(x) / elapsed > FLICK
    if (!far) return
    if (x < 0 && safe < total - 1) onIndex(safe + 1)
    if (x > 0 && safe > 0) onIndex(safe - 1)
  }

  if (!total) return null
  const photo = photos[safe]
  const shift = drag ? drag.x : 0
  const fade = drag && drag.y ? Math.max(1 - drag.y / 400, .45) : 1

  return (
    <div
      className="lightbox"
      ref={panelRef}
      tabIndex={-1}
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-label={labels.gallery}
      style={{ background: `rgba(16,14,40,${.95 * fade})` }}
    >
      <button type="button" className="lightbox-close" onClick={onClose} aria-label={labels.close}><X size={22} /></button>
      <div
        className="lightbox-stage"
        ref={stageRef}
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={() => { gesture.current = null; setDrag(null) }}
      >
        <div
          className={`lightbox-track${drag ? ' is-dragging' : ''}`}
          style={{ transform: `translate3d(calc(${-safe * 100}% + ${shift}px), ${drag ? drag.y : 0}px, 0)` }}
        >
          {photos.map((entry, position) => (
            <div className="lightbox-frame" key={entry.id} aria-hidden={position !== safe}>
              {Math.abs(position - safe) <= NEAR && (
                <Photo
                  src={entry.src}
                  alt={entry.caption || `Foto ${position + 1}`}
                  sizes="100vw"
                  priority={position === safe}
                  draggable={false}
                />
              )}
            </div>
          ))}
        </div>
        {total > 1 && (
          <>
            <button type="button" className="lightbox-nav left" onClick={() => onIndex((safe - 1 + total) % total)} aria-label={labels.previous}><ChevronLeft size={24} /></button>
            <button type="button" className="lightbox-nav right" onClick={() => onIndex((safe + 1) % total)} aria-label={labels.next}><ChevronRight size={24} /></button>
          </>
        )}
      </div>
      <div className="lightbox-foot">
        <span className="lightbox-count">{safe + 1} / {total}</span>
        {photo.caption && <span className="lightbox-caption">{photo.caption}</span>}
        {total > 1 && (
          <div className="lightbox-strip" ref={stripRef}>
            {photos.map((entry, position) => (
              <button type="button" key={entry.id} className={position === safe ? 'active' : ''} onClick={() => onIndex(position)} aria-label={labels.goTo(position + 1)}>
                <img src={thumbSrc(entry.src, 240)} alt="" loading="lazy" width={80} height={56} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
