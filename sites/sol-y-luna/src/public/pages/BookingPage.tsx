import { useSite } from '../site'
import { BookingSection } from '../components/BookingForm'
import './home.css'

/** `/reserver`: el formulario a pantalla completa, con el local de `?local=` ya elegido. */
export function BookingPage({ venue }: { venue?: string }) {
  const { t } = useSite()
  return (
    <div className="booking-page">
      <BookingSection id="reserver" head="h1" initialVenue={venue} eyebrow={t.booking.eyebrow} title={t.booking.title} text={t.booking.text} />
    </div>
  )
}
