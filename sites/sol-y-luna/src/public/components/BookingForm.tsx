import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { CalendarDays, CalendarPlus, Check, MessageCircle, PartyPopper, Send, Users, Zap } from 'lucide-react'
import type { DayHours } from '../../shared/types'
import { addDays, dayNumber, dayRanges, hoursOn, longDate, shortMonth, shortWeekday, toMinutes } from '../../shared/hours'
import { cx, whatsappLink } from '../../shared/utils'
import { BOOKING_WHATSAPP, EL_SOL, MEXI, SHOW_LE_1492, SITE_URL, fullAddress, say, scheduleOf, type FrEs } from '../venues'
import { LE_1492 } from './Le1492' // LE-1492
import { useSite } from '../site'
import { WhatsAppIcon } from './Brand'

/** Los locales que se pueden elegir. Sin horario (`hours` vacío) se ofrecen todas las horas. */
const CHOICES: { id: string; name: string; cuisine: FrEs; hours: DayHours[]; where: string }[] = [
  { ...EL_SOL, where: fullAddress(EL_SOL) },
  { ...MEXI, where: fullAddress(MEXI) },
  ...(SHOW_LE_1492 ? [{ ...LE_1492, hours: [], where: `${LE_1492.address}, ${LE_1492.postcode} ${LE_1492.town}` }] : []), // LE-1492
]

/** Una cita de calendario (.ics) para la reserva: dos horas, en hora de París, con la dirección. */
function calendarFile(title: string, date: string, time: string, where: string, note: string) {
  const stamp = (day: string, clock: string) => `${day.replace(/-/g, '')}T${clock.replace(':', '')}00`
  const [hours, minutes] = time.split(':').map(Number)
  // Las reservas acaban como muy tarde a las 21:30, así que dos horas después sigue siendo el mismo día.
  const end = hours + 2 > 23 ? '23:59' : `${String(hours + 2).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
  const escape = (text: string) => text.replace(/([,;\\])/g, '\\$1')
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Mexi-and-Co//Reservation//FR', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
    `UID:${date}-${time.replace(':', '')}-${Math.random().toString(36).slice(2)}@mexiandco`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '')}`,
    `DTSTART;TZID=Europe/Paris:${stamp(date, time)}`,
    `DTEND;TZID=Europe/Paris:${stamp(date, end)}`,
    `SUMMARY:${escape(title)}`, `LOCATION:${escape(where)}`, `DESCRIPTION:${escape(note)}`, `URL:${SITE_URL}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n')
  return URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }))
}

/** Las horas que se ofrecen, en botones: el mediodía y la noche. */
const SLOTS = {
  lunch: ['12:00', '12:30', '13:00', '13:30'],
  dinner: ['19:00', '19:30', '20:00', '20:30', '21:00', '21:30'],
}

/** Cuántos días se enseñan en la tira; para más adelante está «Autre date». */
const DAYS_SHOWN = 14
/** Para hoy, la hora tiene que dejar este margen: nadie puede llegar «hace cinco minutos». */
const NOTICE_MINUTES = 30
/** A partir de aquí se pregunta la ocasión: es un grupo y conviene preparar la mesa. */
const GROUP_FROM = 9
const PEOPLE = Array.from({ length: 12 }, (_, index) => index + 1)

/** «Mardi 28 octobre»: mayúscula solo al principio, que en francés y castellano los meses van en minúscula. */
const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

type Errors = Partial<Record<'date' | 'time' | 'name' | 'phone', string>>

export function BookingForm({ initialVenue }: { initialVenue?: string }) {
  const { t, lang, menu, now } = useSite()
  const [venueId, setVenueId] = useState(() => CHOICES.find((choice) => choice.id === initialVenue)?.id ?? CHOICES[0].id)
  const [date, setDate] = useState(now.date)
  const [time, setTime] = useState('')
  const [people, setPeople] = useState(2)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [occasion, setOccasion] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  /** Lo último que se mandó: para el resumen y por si WhatsApp no llegó a abrirse. */
  const [sent, setSent] = useState<{ url: string; summary: string; calendar: string; invite: string } | null>(null)
  const dateInput = useRef<HTMLInputElement>(null)

  /** Al llegar con `?local=` desde otra página, el formulario cambia de local sin recargar. */
  useEffect(() => {
    const match = CHOICES.find((choice) => choice.id === initialVenue)
    if (match) setVenueId(match.id)
  }, [initialVenue])

  const venue = CHOICES.find((choice) => choice.id === venueId) ?? CHOICES[0]
  const known = venue.hours.length > 0
  const schedule = useMemo(() => scheduleOf(menu.settings, venue.hours), [menu.settings, venue.hours])

  /** ¿Se puede llegar a esa hora? Dentro del horario del local y, si es hoy, con margen. */
  const available = (day: string, slot: string) => {
    if (day < now.date) return false
    if (day === now.date && toMinutes(slot) < now.minutes + NOTICE_MINUTES) return false
    if (!known) return true
    const hours = hoursOn(schedule, day)
    // La última llegada, media hora antes de cerrar: la cocina tiene que tener tiempo.
    return Boolean(hours && dayRanges(hours).some((range) => toMinutes(slot) >= toMinutes(range.from) && toMinutes(slot) <= toMinutes(range.to) - 30))
  }
  const dayOpen = (day: string) => [...SLOTS.lunch, ...SLOTS.dinner].some((slot) => available(day, slot))

  const days = useMemo(() => Array.from({ length: DAYS_SHOWN }, (_, offset) => addDays(now.date, offset)), [now.date])
  const custom = !days.includes(date)

  /** Si el cambio de local o de día deja la hora fuera de horario, se suelta en vez de mandarla mal. */
  useEffect(() => {
    if (time && !available(date, time)) setTime('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venueId, date, now.minutes])

  /** Si hoy ya no queda ninguna hora, se propone mañana: es lo que buscaba quien entra a las 22:30. */
  useEffect(() => {
    if (date === now.date && !dayOpen(now.date)) setDate(addDays(now.date, 1))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venueId, now.date])

  const dayLabel = (day: string) => (day === now.date ? t.booking.today : day === addDays(now.date, 1) ? t.booking.tomorrow : shortWeekday(day, lang))

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const next: Errors = {}
    if (!date) next.date = t.booking.errors.date
    if (!time) next.time = t.booking.errors.time
    if (!name.trim()) next.name = t.booking.errors.name
    if (phone.replace(/\D/g, '').length < 8) next.phone = t.booking.errors.phone
    setErrors(next)
    if (Object.keys(next).length) {
      // Se baja hasta el primer campo que falta: en el móvil el error queda fuera de la pantalla.
      const first = (['date', 'time', 'name', 'phone'] as const).find((key) => next[key])
      document.getElementById(`booking-${first}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    const message = t.booking.message(venue.name, {
      date: longDate(date, lang),
      time,
      people: people >= 12 ? '12+' : String(people),
      name: name.trim(),
      phone: phone.trim(),
      occasion: people >= GROUP_FROM ? occasion.trim() : '',
    })
    const url = whatsappLink(BOOKING_WHATSAPP, message)
    const summary = [venue.name, capital(longDate(date, lang)), time, people >= 12 ? t.booking.manyPeople : t.booking.people(people)].join(' · ')
    const when = `${longDate(date, lang)} · ${time}`
    setSent({
      url,
      summary,
      calendar: calendarFile(t.booking.calendarTitle(venue.name), date, time, venue.where, t.booking.calendarNote),
      // Sin número: WhatsApp pregunta a quién mandarlo, que es justo lo que se quiere.
      invite: `https://wa.me/?text=${encodeURIComponent(t.booking.inviteMessage(venue.name, when, venue.where))}`,
    })
    // En el móvil, `window.open` abre la app de WhatsApp; si el navegador lo bloquea, se va igual.
    if (!window.open(url, '_blank', 'noopener')) window.location.href = url
  }

  return (
    <form className="booking-form" onSubmit={submit} noValidate>
      <fieldset className="booking-field">
        <legend>{t.booking.venueLabel}</legend>
        <div className="venue-choice" role="radiogroup" aria-label={t.booking.venueLabel}>
          {CHOICES.map((choice) => (
            <button
              type="button"
              key={choice.id}
              role="radio"
              aria-checked={choice.id === venueId}
              className={cx('venue-option', choice.id === venueId && 'is-on')}
              onClick={() => setVenueId(choice.id)}
            >
              <span className="venue-option-tick" aria-hidden="true"><Check size={14} strokeWidth={3} /></span>
              <strong>{choice.name}</strong>
              <small>{say(choice.cuisine, lang)}</small>
            </button>
          ))}
        </div>
        {!known && <p className="booking-hint">{t.booking.hoursSoon}</p>}
      </fieldset>

      <fieldset className="booking-field" id="booking-date">
        <legend>{t.booking.dateLabel}</legend>
        <div className="day-rail">
          {days.map((day) => {
            const open = dayOpen(day)
            return (
              <button
                type="button"
                key={day}
                className={cx('day-chip', day === date && 'is-on')}
                aria-pressed={day === date}
                aria-label={`${longDate(day, lang)}${open ? '' : ` · ${t.booking.closedThatDay}`}`}
                disabled={!open}
                onClick={() => { setDate(day); setErrors((value) => ({ ...value, date: undefined })) }}
              >
                <small>{dayLabel(day)}</small>
                <b>{dayNumber(day)}</b>
                <small>{shortMonth(day, lang)}</small>
              </button>
            )
          })}
          <label className={cx('day-chip', 'is-other', custom && date && 'is-on')}>
            <CalendarDays size={18} aria-hidden="true" />
            <small>{custom && date ? `${dayNumber(date)} ${shortMonth(date, lang)}` : t.booking.otherDate}</small>
            <input
              ref={dateInput}
              type="date"
              className="day-other-input"
              min={now.date}
              value={date}
              aria-label={t.booking.otherDate}
              onChange={(event) => { if (event.target.value) setDate(event.target.value) }}
            />
          </label>
        </div>
        {date && <p className="booking-picked">{capital(longDate(date, lang))}</p>}
        {errors.date && <p className="booking-error" role="alert">{errors.date}</p>}
      </fieldset>

      <fieldset className="booking-field" id="booking-time">
        <legend>{t.booking.timeLabel}</legend>
        {(['lunch', 'dinner'] as const).map((service) => (
          <div className="slot-group" key={service}>
            <span className="slot-label">{service === 'lunch' ? t.booking.lunch : t.booking.dinner}</span>
            <div className="slots">
              {SLOTS[service].map((slot) => {
                const free = available(date, slot)
                return (
                  <button
                    type="button"
                    key={slot}
                    className={cx('slot', slot === time && 'is-on')}
                    aria-pressed={slot === time}
                    disabled={!free}
                    title={free ? undefined : t.booking.unavailable}
                    onClick={() => { setTime(slot); setErrors((value) => ({ ...value, time: undefined })) }}
                  >
                    {slot}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
        {errors.time && <p className="booking-error" role="alert">{errors.time}</p>}
      </fieldset>

      <fieldset className="booking-field">
        <legend>{t.booking.peopleLabel}</legend>
        <div className="people-rail">
          {PEOPLE.map((count) => (
            <button
              type="button"
              key={count}
              className={cx('people-chip', count === people && 'is-on', count === 12 && 'is-many')}
              aria-pressed={count === people}
              aria-label={count === 12 ? t.booking.manyPeople : t.booking.people(count)}
              onClick={() => setPeople(count)}
            >
              {count === 12 ? '12+' : count}
            </button>
          ))}
        </div>
        <p className="booking-picked"><Users size={15} aria-hidden="true" /> {people >= 12 ? t.booking.manyPeople : t.booking.people(people)}</p>
      </fieldset>

      {people >= GROUP_FROM && (
        <label className="booking-input is-occasion">
          <span>{t.booking.occasionLabel}</span>
          <input type="text" value={occasion} onChange={(event) => setOccasion(event.target.value)} placeholder={t.booking.occasionPlaceholder} autoComplete="off" />
        </label>
      )}

      <div className="booking-pair">
        <label className="booking-input" id="booking-name">
          <span>{t.booking.nameLabel}</span>
          <input
            type="text"
            value={name}
            onChange={(event) => { setName(event.target.value); setErrors((value) => ({ ...value, name: undefined })) }}
            placeholder={t.booking.namePlaceholder}
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
          />
          {errors.name && <em className="booking-error" role="alert">{errors.name}</em>}
        </label>
        <label className="booking-input" id="booking-phone">
          <span>{t.booking.phoneLabel}</span>
          <input
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={(event) => { setPhone(event.target.value); setErrors((value) => ({ ...value, phone: undefined })) }}
            placeholder={t.booking.phonePlaceholder}
            autoComplete="tel"
            aria-invalid={Boolean(errors.phone)}
          />
          {errors.phone && <em className="booking-error" role="alert">{errors.phone}</em>}
        </label>
      </div>

      <button type="submit" className="btn btn-whatsapp btn-lg btn-block">
        <WhatsAppIcon size={21} /> {t.booking.submit}
      </button>
      {sent ? (
        <div className="booking-sent" role="status">
          <span className="booking-sent-icon" aria-hidden="true"><Check size={18} strokeWidth={3} /></span>
          <div>
            <strong>{t.booking.sentTitle}</strong>
            <p>{sent.summary}</p>
            <small>{t.booking.sentText} <a href={sent.url} target="_blank" rel="noopener noreferrer">{t.booking.sentRetry}</a></small>
            <div className="booking-sent-actions">
              <a className="btn btn-white btn-sm" href={sent.calendar} download="reservation.ics"><CalendarPlus size={16} /> {t.booking.calendar}</a>
              <a className="btn btn-white btn-sm" href={sent.invite} target="_blank" rel="noopener noreferrer"><Send size={16} /> {t.booking.invite}</a>
            </div>
          </div>
        </div>
      ) : (
        <p className="booking-note"><MessageCircle size={15} aria-hidden="true" /> {t.booking.note}</p>
      )}
    </form>
  )
}

/** El formulario con sus tres razones al lado: en el móvil, las razones van debajo del título. */
export function BookingSection({ initialVenue, eyebrow, title, text, id = 'reserver', head = 'h2' }: { initialVenue?: string; eyebrow: string; title: string; text: string; id?: string; head?: 'h1' | 'h2' }) {
  const { t } = useSite()
  const Heading = head
  const icons = [Zap, PartyPopper, Check]
  return (
    <section className="booking" id={id} aria-labelledby={`${id}-title`}>
      <div className="booking-aside">
        <header className="section-head">
          <span className="eyebrow">{eyebrow}</span>
          <Heading id={`${id}-title`}>{title}</Heading>
          <p>{text}</p>
        </header>
        <ul className="benefits" aria-label={t.booking.benefitsTitle}>
          {t.booking.benefits.map((benefit, index) => {
            const Icon = icons[index] ?? Check
            return (
              <li key={benefit.title}>
                <span className="benefit-icon" aria-hidden="true"><Icon size={19} /></span>
                <span><strong>{benefit.title}</strong><small>{benefit.text}</small></span>
              </li>
            )
          })}
        </ul>
      </div>
      <div className="booking-card card">
        <BookingForm initialVenue={initialVenue} />
      </div>
    </section>
  )
}
