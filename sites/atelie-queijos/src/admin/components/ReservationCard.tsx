import { memo } from 'react'
import { Armchair, Check, CookingPot, Ellipsis, MessageCircle, Phone, Sun, Users } from 'lucide-react'
import type { Dish, Reservation, ReservationStatus, Settings } from '../../shared/types'
import { cx, telLink, whatsappLink } from '../../shared/utils'
import { STATUS_LABEL, confirmationMessage, dishName, isActive, partyLabel } from '../helpers'

/** Durante dos horas una reserva web sin confirmar lleva la marca «Nueva»: es la que hay que mirar. */
const NEW_FOR = 2 * 60 * 60 * 1000

type Props = {
  reservation: Reservation
  dishes: Dish[]
  settings: Settings
  now: number
  /** Etiqueta de día delante de la hora, para las listas que mezclan días (búsqueda). */
  dayTag?: string
  highlight?: boolean
  onStatus: (reservation: Reservation, status: ReservationStatus) => void
  onOpen: (reservation: Reservation) => void
}

export function StatusChip({ status }: { status: ReservationStatus }) {
  return <span className={cx('adm-status', `is-${status}`)}>{STATUS_LABEL[status]}</span>
}

/**
 * Tarjeta de una reserva. Lo que se busca con prisa va en grande (hora, nombre, cuántos son)
 * y las acciones de todos los días van a la vista, en una fila de botones anchos para el pulgar.
 * Tocar el cuerpo abre la ficha con el resto de acciones.
 */
export const ReservationCard = memo(function ReservationCard({ reservation, dishes, settings, now, dayTag, highlight, onStatus, onOpen }: Props) {
  const { status } = reservation
  const fresh = status === 'pendiente' && now - reservation.createdAt < NEW_FOR
  const tel = telLink(reservation.phone)
  const whatsapp = whatsappLink(reservation.phone, confirmationMessage(reservation, settings, dishes))
  const primary: { status: ReservationStatus; label: string } | null =
    status === 'pendiente' ? { status: 'confirmada', label: 'Confirmar' } : status === 'confirmada' ? { status: 'sentada', label: 'Sentados' } : null

  return (
    <article id={`reserva-${reservation.id}`} className={cx('adm-res', `is-${status}`, highlight && 'is-highlight', !isActive(reservation) && 'is-off')}>
      <button type="button" className="adm-res-body" onClick={() => onOpen(reservation)}>
        <span className="adm-res-time">
          {dayTag && <small>{dayTag}</small>}
          {reservation.time}
        </span>
        <span className="adm-res-info">
          <span className="adm-res-head">
            <strong className="adm-res-name">{reservation.name || 'Sin nombre'}</strong>
            <StatusChip status={status} />
          </span>
          <span className="adm-res-party"><Users size={16} aria-hidden="true" /> {partyLabel(reservation)}</span>
          <span className="adm-res-tags">
            {fresh && <span className="adm-tag is-new">Nueva</span>}
            {reservation.paella && (
              <span className="adm-tag is-paella">
                <CookingPot size={14} aria-hidden="true" /> {reservation.paella.fideua ? 'Fideuà' : 'Paella'}: {dishName(dishes, reservation.paella.dishId)} × {reservation.paella.servings}
              </span>
            )}
            {reservation.seating !== 'indiferente' && (
              <span className="adm-tag">
                {reservation.seating === 'terraza' ? <Sun size={14} aria-hidden="true" /> : <Armchair size={14} aria-hidden="true" />}
                {reservation.seating === 'terraza' ? 'Terraza' : 'Interior'}
              </span>
            )}
            <span className="adm-tag is-lang" title="Idioma de la reserva">{reservation.lang.toUpperCase()}</span>
          </span>
          {reservation.note && <span className="adm-res-note">{reservation.note}</span>}
        </span>
      </button>
      <div className="adm-res-actions">
        {primary && (
          <button type="button" className={cx('adm-act', primary.status === 'confirmada' ? 'is-primary' : 'is-soft')} onClick={() => onStatus(reservation, primary.status)}>
            <Check size={20} aria-hidden="true" /> <span>{primary.label}</span>
          </button>
        )}
        {tel && (
          <a className="adm-act" href={tel}>
            <Phone size={20} aria-hidden="true" /> <span>Llamar</span>
          </a>
        )}
        {whatsapp && (
          <a className="adm-act" href={whatsapp} target="_blank" rel="noopener noreferrer">
            <MessageCircle size={20} aria-hidden="true" /> <span>WhatsApp</span>
          </a>
        )}
        <button type="button" className="adm-act" onClick={() => onOpen(reservation)} aria-label={`Más acciones para ${reservation.name || 'esta reserva'}`}>
          <Ellipsis size={20} aria-hidden="true" /> <span>Más</span>
        </button>
      </div>
    </article>
  )
})
