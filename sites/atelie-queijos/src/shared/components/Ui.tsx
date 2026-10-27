import { useEffect, useRef, useState, type ReactNode } from 'react'
import { CircleAlert, CircleCheck, Undo2, X } from 'lucide-react'
import { useScrollLock } from '../useMedia'

/**
 * Tamaños del panel: `form` para los formularios cortos, `wide` para la ficha de un plato,
 * `big` para las confirmaciones y `record` para las fichas que van a dos columnas.
 */
export type ModalSize = 'form' | 'wide' | 'big' | 'record'

export function Modal({ kicker, title, onClose, children, size = 'form', lead, meta }: {
  kicker?: string
  title: string
  onClose: () => void
  children: ReactNode
  size?: ModalSize
  /** Marca de identidad a la izquierda del título: iniciales, icono… */
  lead?: ReactNode
  /** Distintivos bajo el título: tipo, estado, antigüedad. */
  meta?: ReactNode
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  /*
   * El fondo, congelado en un efecto aparte: el de arriba se rehace cada vez que cambia `onClose`,
   * que en la ficha de un plato es cada letra que se escribe, y la página saltaría con cada una.
   */
  useScrollLock(true)
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className={`modal modal-${size}`} onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-head">
          <div className="modal-head-main">
            {lead}
            <div className="modal-head-text">
              {kicker && <span className="kicker">{kicker}</span>}
              <h2>{title}</h2>
              {meta}
            </div>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Cerrar"><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

export type ConfirmRequest = { title: string; text: string; action: string; danger?: boolean; onConfirm: () => void }

export function ConfirmDialog({ request, onClose }: { request: ConfirmRequest; onClose: () => void }) {
  return (
    <Modal kicker="Confirmar" title={request.title} onClose={onClose} size="big">
      <p className="confirm-text">{request.text}</p>
      <div className="modal-footer">
        <button type="button" className="outline-btn" onClick={onClose}>Cancelar</button>
        <button type="button" className={request.danger ? 'danger-btn' : 'primary-btn'} onClick={() => { request.onConfirm(); onClose() }}>{request.action}</button>
      </div>
    </Modal>
  )
}

export type Toast = { id: string; text: string; tone: 'ok' | 'error'; onUndo?: () => void }

export function Toasts({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div className="toast-stack">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.tone}`}>
          {toast.tone === 'ok' ? <CircleCheck size={16} /> : <CircleAlert size={16} />}
          <span>{toast.text}</span>
          {toast.onUndo && (
            <button type="button" className="toast-undo" onClick={() => { toast.onUndo?.(); onDismiss(toast.id) }}><Undo2 size={13} /> Deshacer</button>
          )}
          <button type="button" className="toast-close" onClick={() => onDismiss(toast.id)} aria-label="Cerrar aviso"><X size={14} /></button>
        </div>
      ))}
    </div>
  )
}

export function Dropdown({ label, children, align = 'left', className = '', onOpen }: { label: ReactNode; children: (close: () => void) => ReactNode; align?: 'left' | 'right'; className?: string; onOpen?: () => void }) {
  const [open, setOpen] = useState(false)
  const holder = useRef<HTMLDivElement>(null)
  useEffect(() => { if (open) onOpen?.() }, [open])
  useEffect(() => {
    if (!open) return
    const onDown = (event: MouseEvent) => { if (!holder.current?.contains(event.target as Node)) setOpen(false) }
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    window.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('mousedown', onDown); window.removeEventListener('keydown', onKey) }
  }, [open])
  return (
    <div className="dropdown" ref={holder}>
      <button type="button" className={className} onClick={() => setOpen((value) => !value)}>{label}</button>
      {open && <div className={`dropdown-panel ${align === 'right' ? 'to-right' : ''}`}>{children(() => setOpen(false))}</div>}
    </div>
  )
}

export function EmptyState({ icon, title, text, action }: { icon: ReactNode; title: string; text: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">{icon}</span>
      <strong>{title}</strong>
      <p>{text}</p>
      {action}
    </div>
  )
}

/** Las sugerencias se buscan sin acentos: «atico» encuentra «Ático». */
const plain = (text: string) => text.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

export function ChipsInput({ value, onChange, suggestions, placeholder = 'Añadir…' }: { value: string[]; onChange: (next: string[]) => void; suggestions: string[]; placeholder?: string }) {
  const [draft, setDraft] = useState('')
  const add = (raw: string) => {
    const item = raw.trim()
    if (!item || value.some((existing) => existing.toLowerCase() === item.toLowerCase())) return setDraft('')
    onChange([...value, item])
    setDraft('')
  }
  return (
    <div className="chips-field">
      <div className="chips-row">
        {value.map((item) => (
          <span className="chip" key={item}>{item}<button type="button" onClick={() => onChange(value.filter((entry) => entry !== item))} aria-label={`Quitar ${item}`}><X size={11} /></button></span>
        ))}
        <input
          value={draft}
          placeholder={placeholder}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ',') { event.preventDefault(); add(draft) }
            if (event.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1))
          }}
          onBlur={() => add(draft)}
        />
      </div>
      {/* Solo caben seis atajos, así que lo que se escribe filtra el vocabulario. */}
      <div className="chip-suggestions">
        {suggestions
          .filter((item) => !value.some((entry) => entry.toLowerCase() === item.toLowerCase()) && plain(item).includes(plain(draft)))
          .slice(0, 6)
          .map((item) => (
            <button type="button" key={item} onClick={() => add(item)}>+ {item}</button>
          ))}
      </div>
    </div>
  )
}
