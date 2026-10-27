import {
  Armchair, Ban, Check, Clock, CookingPot, Globe, Mail, MessageCircle, Pencil, Phone, RotateCcw, StickyNote, Trash2, UserCheck, UserX, Users,
} from 'lucide-react'
import type { ReactNode } from 'react'
import type { Dish, Reservation, ReservationStatus, Settings } from '../../shared/types'
import { Modal } from '../../shared/components/Ui'
import { cx, telLink, whatsappLink } from '../../shared/utils'
import {
  LANG_LABEL, SEATING_LABEL, SOURCE_LABEL, STATUS_LABEL, confirmationMessage, dayLabel, dishName, fullDate, partyLabel, relativeTime,
} from '../helpers'
import { StatusChip } from './ReservationCard'

type Props = {
  reservation: Reservation
  dishes: Dish[]
  settings: Settings
  today: string
  now: number
  onStatus: (status: ReservationStatus) => void
  onEdit: () => void
  onDelete: () => void
  onClose: () => void
}

const STATUS_ACTIONS: { status: ReservationStatus; label: string; icon: ReactNode; tone: string }[] = [
  { status: 'confirmada', label: 'Confirmar', icon: <Check size={20} />, tone: 'primary' },
  { status: 'sentada', label: 'Sentados', icon: <UserCheck size={20} />, tone: 'ok' },
  { status: 'no-vino', label: 'No vino', icon: <UserX size={20} />, tone: 'muted' },
  { status: 'cancelada', label: 'Cancelar', icon: <Ban size={20} />, tone: 'danger' },
  { status: 'pendiente', label: 'Pendiente', icon: <RotateCcw size={20} />, tone: 'warn' },
]

function Row({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li>
      <span className="adm-sheet-ico" aria-hidden="true">{icon}</span>
      <span>{children}</span>
    </li>
  )
}

/** Ficha de una reserva con todas sus acciones. En el móvil sube desde abajo, a mano del pulgar. */
export function ReservationSheet({ reservation, dishes, settings, today, now, onStatus, onEdit, onDelete, onClose }: Props) {
  const tel = telLink(reservation.phone)
  const whatsapp = whatsappLink(reservation.phone, confirmationMessage(reservation, settings, dishes))
  return (
    <Modal
      kicker={`${dayLabel(reservation.date, today)} · ${reservation.time}`}
      title={reservation.name || 'Sin nombre'}
      onClose={onClose}
      meta={<span className="adm-sheet-meta"><StatusChip status={reservation.status} /></span>}
    >
      <ul className="adm-sheet-details">
        <Row icon={<Clock size={18} />}>{fullDate(reservation.date, today)}, {reservation.time}</Row>
        <Row icon={<Users size={18} />}>{partyLabel(reservation)}</Row>
        {reservation.paella && (
          <Row icon={<CookingPot size={18} />}>
            <strong>Paella: {dishName(dishes, reservation.paella.dishId)} × {reservation.paella.servings}</strong>
          </Row>
        )}
        {reservation.seating !== 'indiferente' && <Row icon={<Armchair size={18} />}>{SEATING_LABEL[reservation.seating]}</Row>}
        {reservation.note && <Row icon={<StickyNote size={18} />}><span className="adm-sheet-note">{reservation.note}</span></Row>}
        {reservation.phone && (
          <Row icon={<Phone size={18} />}>
            {tel ? <a href={tel}>{reservation.phone}</a> : reservation.phone}
          </Row>
        )}
        {reservation.email && <Row icon={<Mail size={18} />}><a href={`mailto:${reservation.email}`}>{reservation.email}</a></Row>}
        <Row icon={<Globe size={18} />}>
          {LANG_LABEL[reservation.lang]} · {SOURCE_LABEL[reservation.source]} · creada {relativeTime(reservation.createdAt, now)}
        </Row>
      </ul>

      {(tel || whatsapp) && (
        <div className="adm-sheet-contact">
          {tel && <a className="btn btn-ghost" href={tel}><Phone size={18} /> Llamar</a>}
          {whatsapp && (
            <a className="btn btn-ghost" href={whatsapp} target="_blank" rel="noopener noreferrer">
              <MessageCircle size={18} /> WhatsApp
            </a>
          )}
        </div>
      )}

      <span className="adm-kicker adm-sheet-label">Cambiar estado</span>
      <div className="adm-sheet-status">
        {STATUS_ACTIONS.map((action) => {
          const current = action.status === reservation.status
          return (
            <button
              key={action.status}
              type="button"
              className={cx('adm-sheet-btn', `tone-${action.tone}`, current && 'is-current')}
              disabled={current}
              aria-pressed={current}
              onClick={() => { onStatus(action.status); onClose() }}
            >
              {action.icon}
              <span>{current ? `Ahora: ${STATUS_LABEL[action.status].toLowerCase()}` : action.label}</span>
            </button>
          )
        })}
      </div>

      <div className="adm-sheet-foot">
        <button type="button" className="danger-btn ghost" onClick={onDelete}><Trash2 size={18} /> Borrar</button>
        <button type="button" className="btn btn-indigo" onClick={onEdit}><Pencil size={18} /> Editar</button>
      </div>
    </Modal>
  )
}
