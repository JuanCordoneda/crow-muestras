/**
 * LE 1492 — LOCAL POR CONFIRMAR.
 *
 * No sabemos si sigue abierto ni tenemos carta ni horario, así que vive entero en este fichero:
 * la tarjeta de la portada y su hueco en el formulario de reservas. Hoy está escondido: lo enciende
 * `SHOW_LE_1492` en `venues.ts`. Si el local cerró, se borra este fichero y las líneas marcadas con
 * `LE-1492` (en `venues.ts`, `HomePage.tsx`, `BookingForm.tsx`, `PublicApp.tsx`, `structured-data.ts`,
 * `index.html` y `llms.txt`). Nada más depende de él.
 */
import { CalendarDays, MapPin } from 'lucide-react'
import { linkTo, publicRoute } from '../../shared/routing'
import { directionsLink } from '../../shared/utils'
import { say, type FrEs } from '../venues'
import { useSite } from '../site'
import { PhotoSoon } from './PhotoSoon'

export const LE_1492 = {
  id: 'le-1492' as const,
  name: 'Le 1492',
  cuisine: { fr: 'Cuisine latino-américaine', es: 'Cocina latinoamericana' } as FrEs,
  address: 'Marché Saint-Germain, rue Clément',
  postcode: '75006',
  town: 'Paris',
  since: '2005',
}

const TEXT = {
  since: { fr: 'Depuis 2005', es: 'Desde 2005' },
}

/**
 * La tarjeta de Le 1492 en la portada: la misma forma que las otras dos, con lo poco que se sabe.
 * Sin foto, carta ni horario no se anuncia que faltan: el cartel con el nombre y la dirección.
 */
export function Le1492Card() {
  const { t, lang } = useSite()
  const directions = directionsLink(`${LE_1492.address}, ${LE_1492.postcode} ${LE_1492.town}`)
  return (
    <article className="venue-card is-pending" id="le-1492" aria-labelledby="venue-le-1492">
      <span className="venue-card-photo">
        <PhotoSoon name={LE_1492.name} tone="terracota" />
      </span>
      <div className="venue-card-body">
        <span className="venue-card-cuisine">{say(LE_1492.cuisine, lang)} · {say(TEXT.since, lang)}</span>
        <h3 id="venue-le-1492">{LE_1492.name}</h3>
        <a className="venue-card-line" href={directions} target="_blank" rel="noopener noreferrer"><MapPin size={16} /> {LE_1492.address}, {LE_1492.postcode} {LE_1492.town}</a>
        <div className="venue-card-actions">
          <a className="btn btn-primary" {...linkTo(publicRoute({ view: 'reserver', venue: LE_1492.id }))}><CalendarDays size={18} /> {t.venues.book}</a>
        </div>
      </div>
    </article>
  )
}
