import { Check, Clock, ExternalLink, MapPin } from 'lucide-react'
import type { Settings } from '../../shared/types'
import { Modal } from '../../shared/components/Ui'
import { GOOGLE_BUSINESS_URL, type GooglePending } from '../useGoogleHours'

type Props = { pending: GooglePending; settings: Settings; onDone: () => void; onLater: () => void }

/** «el horario semanal y los días de cierre». */
const listText = (what: string[]) =>
  what.length <= 1 ? what[0] ?? 'el horario' : `${what.slice(0, -1).join(', ')} y ${what[what.length - 1]}`

/**
 * El aviso de Google. Sale en cuanto el horario cambia —ya guardado en la web, que el panel no
 * tiene botón de guardar y bloquearlo aquí sería arriesgarse a perder el cambio en pleno
 * servicio— y lleva a la ficha con un toque. «Luego» no lo borra: el recordatorio se queda en el
 * horario de la Carta hasta que se dice que está hecho.
 */
export function GoogleHoursModal({ pending, settings, onDone, onLater }: Props) {
  const url = settings.googleBusiness.trim() || GOOGLE_BUSINESS_URL
  const own = Boolean(settings.googleBusiness.trim())

  return (
    <Modal
      kicker="Ya está en la web"
      title="Ponlo también en Google"
      size="big"
      onClose={onLater}
      lead={<span className="adm-modal-ico" aria-hidden="true"><MapPin size={22} /></span>}
    >
      <div className="adm-google-body">
        <p>
          Has cambiado <b>{listText(pending.what)}</b>. La web ya lo enseña, pero la ficha de Google
          sigue con el horario de antes, y por ahí llega mucha gente: alguien busca el restaurante,
          lee «abierto» y se planta en la puerta.
        </p>
        <ol className="adm-google-steps">
          <li>Abre la ficha en Google.</li>
          <li>Entra en <b>Horario</b> (para un día suelto, en <b>Horario especial</b>).</li>
          <li>Pon lo mismo que acabas de poner aquí.</li>
        </ol>
        {!own && (
          <p className="adm-muted">
            Se abre el panel de Google Business. Para que este botón lleve directo a la ficha del
            restaurante, pega su dirección en <b>Ajustes · Datos · Ficha de Google</b>.
          </p>
        )}
      </div>
      {/*
        El orden del HTML es el del ordenador, de izquierda a derecha; en el móvil el pie se apila
        del revés, así que el principal —abrir Google— queda arriba, bajo el pulgar.
      */}
      <div className="modal-footer adm-google-foot">
        <button type="button" className="outline-btn" onClick={onLater}>
          <Clock size={18} /> Luego
        </button>
        <button type="button" className="outline-btn adm-google-done" onClick={onDone}>
          <Check size={18} /> Ya está hecho
        </button>
        <a className="primary-btn" href={url} target="_blank" rel="noopener noreferrer">
          <ExternalLink size={18} /> Abrir Google
        </a>
      </div>
    </Modal>
  )
}
