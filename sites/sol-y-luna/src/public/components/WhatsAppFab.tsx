import { whatsappLink } from '../../shared/utils'
import { BOOKING_WHATSAPP } from '../venues'
import { useSite } from '../site'
import { WhatsAppIcon } from './Brand'

/**
 * El botón flotante de reservar por WhatsApp, en todas las páginas y en todas las pantallas. Es el
 * atajo de quien ya sabe lo que quiere: un toque y escribe al restaurante. Quien prefiera elegir
 * día y hora tiene el formulario de `/reserver`, que manda al mismo número.
 *
 * `waiting`: en el móvil, sobre la foto de la portada o de un local, el botón espera fuera de
 * pantalla hasta que se baja un poco; si no, tapa la barra de datos rápidos justo debajo del
 * «Réserver une table» grande. En el ordenador se ve siempre.
 */
export function WhatsAppFab({ hidden = false, waiting = false }: { hidden?: boolean; waiting?: boolean }) {
  const { t } = useSite()
  return (
    <a
      className={`wa-fab${hidden ? ' is-hidden' : ''}${waiting ? ' is-waiting' : ''}`}
      href={whatsappLink(BOOKING_WHATSAPP, t.fab.message)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t.fab.aria}
      tabIndex={hidden ? -1 : undefined}
    >
      <WhatsAppIcon size={22} />
      <span>{t.fab.label}</span>
    </a>
  )
}
