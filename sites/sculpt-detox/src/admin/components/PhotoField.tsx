import { useRef, useState } from 'react'
import { Check, ImageOff, ImagePlus, Images, Trash2 } from 'lucide-react'
import { uploadPhoto } from '../../shared/api'
import { Photo, thumbSrc } from '../../shared/components/Photo'
import { cx } from '../../shared/utils'
import { GALLERY, isOffline, isUnauthorized, shrinkImage } from '../helpers'

type Props = { value: string; onChange: (src: string) => void; alt: string }

/**
 * Foto del plato: subir una del móvil, elegir una de las que ya tiene la web o quitarla.
 * Las fotos subidas van al almacén del servidor, que las pasa a webp y saca las versiones para
 * móvil; el plato solo guarda la dirección.
 */
export function PhotoField({ value, onChange, alt }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState<{ name: string; size: number } | null>(null)
  const [error, setError] = useState('')
  const [gallery, setGallery] = useState(false)

  const upload = async (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Ese archivo no es una foto.')
      return
    }
    setError('')
    setUploading({ name: file.name, size: file.size })
    try {
      const ready = await shrinkImage(file)
      setUploading({ name: ready.name, size: ready.size })
      const media = await uploadPhoto(ready)
      onChange(media.src)
      setGallery(false)
    } catch (failure) {
      setError(
        isUnauthorized(failure)
          ? 'La sesión ha caducado: sal del panel y vuelve a entrar para subir fotos.'
          : isOffline(failure)
            ? 'Sin conexión: la foto no se ha subido. Inténtalo cuando vuelva la cobertura.'
            : `No se ha podido subir la foto${failure instanceof Error && failure.message ? `: ${failure.message}` : '.'}`,
      )
    } finally {
      setUploading(null)
    }
  }

  return (
    <div className="adm-photo">
      <div className="adm-photo-main">
        <div className={cx('adm-photo-preview', !value && 'is-empty')}>
          {value ? (
            <Photo src={value} alt={alt} sizes="160px" width={160} height={120} />
          ) : (
            <span><ImageOff size={26} aria-hidden="true" /> Sin foto</span>
          )}
        </div>
        <div className="adm-photo-actions">
          <button type="button" className="btn btn-indigo btn-sm" disabled={Boolean(uploading)} onClick={() => input.current?.click()}>
            <ImagePlus size={18} /> {uploading ? 'Subiendo…' : 'Subir foto'}
          </button>
          <button type="button" className={cx('btn btn-ghost btn-sm', gallery && 'is-on')} aria-expanded={gallery} onClick={() => setGallery((open) => !open)}>
            <Images size={18} /> Elegir de la galería
          </button>
          {value && (
            <button type="button" className="btn btn-sm adm-btn-danger-ghost" disabled={Boolean(uploading)} onClick={() => onChange('')}>
              <Trash2 size={18} /> Quitar foto
            </button>
          )}
        </div>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        hidden
        onChange={(event) => {
          void upload(event.currentTarget.files?.[0])
          event.currentTarget.value = ''
        }}
      />
      {uploading && (
        <div className="adm-progress" role="status" aria-live="polite">
          <span className="adm-progress-bar"><i /></span>
          <small>Subiendo {uploading.name} ({Math.max(1, Math.round(uploading.size / 1024))} KB)…</small>
        </div>
      )}
      {error && <p className="adm-error" role="alert">{error}</p>}
      {gallery && (
        <div className="adm-gallery" role="group" aria-label="Fotos de la web">
          {GALLERY.map((photo) => (
            <button
              key={photo.src}
              type="button"
              className={cx(photo.src === value && 'is-on')}
              aria-pressed={photo.src === value}
              aria-label={`Usar la foto ${photo.name.replace(/-/g, ' ')}`}
              onClick={() => { onChange(photo.src); setGallery(false) }}
            >
              <img src={thumbSrc(photo.src, 240)} alt="" loading="lazy" width={120} height={90} />
              {photo.src === value && <span className="adm-gallery-check"><Check size={16} /></span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
