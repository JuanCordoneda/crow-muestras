import { useEffect, useRef, useState, type FormEvent } from 'react'
import { BOOKABLE } from '../treatments'
import { track, whatsappUrl } from '../business'
import { useSite } from '../site'
import { cx } from '../../shared/utils'
import { WhatsAppIcon } from './Brand'

type Slot = '' | 'morning' | 'afternoon'
type First = '' | 'yes' | 'no'
type Field = 'treatment' | 'day' | 'slot' | 'name' | 'first'

const LOCALES = { es: 'es-ES', en: 'en-GB' } as const

/** Hoy en Ibiza (`YYYY-MM-DD`), que es lo que entiende `<input type="date">`. */
const todayInIbiza = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid' }).format(new Date())

/** Sábado o domingo: se avisa, pero no se bloquea (Michele propone el día más cercano). */
const isWeekend = (day: string) => {
  if (!day) return false
  const weekday = new Date(`${day}T12:00:00`).getDay()
  return weekday === 0 || weekday === 6
}

/**
 * La reserva no pasa por ningún servidor: el formulario arma el mensaje y abre WhatsApp con él
 * escrito, en el idioma en que se está leyendo la web. Michele contesta desde su teléfono.
 */
export function BookingForm() {
  const { t, lang, chosen } = useSite()
  const copy = t.booking
  const [treatment, setTreatment] = useState(chosen)
  const [day, setDay] = useState('')
  const [slot, setSlot] = useState<Slot>('')
  const [name, setName] = useState('')
  const [first, setFirst] = useState<First>('')
  const [tried, setTried] = useState(false)
  const [minDay, setMinDay] = useState<string | undefined>(undefined)
  const form = useRef<HTMLFormElement>(null)

  /** «Reservar» en una tarjeta trae su tratamiento ya elegido. */
  useEffect(() => { if (chosen) setTreatment(chosen) }, [chosen])
  /** La fecha mínima depende del reloj: se pone en el navegador, no en el HTML del build. */
  useEffect(() => { setMinDay(todayInIbiza()) }, [])

  const errors: Partial<Record<Field, string>> = {}
  if (!treatment) errors.treatment = copy.errors.treatment
  if (!day) errors.day = copy.errors.day
  if (!slot) errors.slot = copy.errors.slot
  if (!name.trim()) errors.name = copy.errors.name
  if (!first) errors.first = copy.errors.first
  const shown = tried ? errors : {}

  const submit = (event: FormEvent) => {
    event.preventDefault()
    setTried(true)
    const firstError = (['treatment', 'day', 'slot', 'name', 'first'] as Field[]).find((field) => errors[field])
    if (firstError) {
      form.current?.querySelector<HTMLElement>(`[data-field="${firstError}"]`)?.focus()
      return
    }
    const option = BOOKABLE.find((entry) => entry.id === treatment)
    const message = copy.message({
      treatment: option ? option.name[lang] : treatment,
      day: new Date(`${day}T12:00:00`).toLocaleDateString(LOCALES[lang], { weekday: 'long', day: 'numeric', month: 'long' }),
      slot: slot === 'morning' ? copy.morning.toLowerCase() : copy.afternoon.toLowerCase(),
      name: name.trim(),
      first: first === 'yes' ? copy.yes.toLowerCase() : copy.no.toLowerCase(),
    })
    const url = whatsappUrl(message)
    track('whatsapp_click', { source: 'formulario', treatment, lang })
    // En el móvil abre la app; si el navegador bloquea la pestaña nueva, se va en la misma.
    // Sin `noopener` en la llamada: con él, `window.open` devuelve siempre null y no se sabría si abrió.
    const opened = window.open(url, '_blank')
    if (opened) opened.opener = null
    else window.location.href = url
  }

  const described = (field: Field) => (shown[field] ? `booking-${field}-error` : undefined)
  const error = (field: Field) => shown[field] && <p className="field-error" id={`booking-${field}-error`}>{shown[field]}</p>

  return (
    <form className="booking-form" ref={form} onSubmit={submit} noValidate>
      <div className={cx('field', shown.treatment && 'is-invalid')}>
        <label htmlFor="booking-treatment">{copy.treatment}</label>
        <select
          id="booking-treatment"
          data-field="treatment"
          value={treatment}
          onChange={(event) => setTreatment(event.currentTarget.value)}
          aria-invalid={Boolean(shown.treatment)}
          aria-describedby={described('treatment')}
        >
          <option value="">{copy.treatmentPlaceholder}</option>
          {(['corporal', 'facial'] as const).map((group) => (
            <optgroup key={group} label={copy.groups[group]}>
              {BOOKABLE.filter((entry) => entry.group === group).map((entry) => (
                <option key={entry.id} value={entry.id}>{entry.name[lang]}</option>
              ))}
            </optgroup>
          ))}
        </select>
        {error('treatment')}
      </div>

      <div className={cx('field', shown.day && 'is-invalid')}>
        <label htmlFor="booking-day">{copy.day}</label>
        <input
          id="booking-day"
          data-field="day"
          type="date"
          min={minDay}
          value={day}
          onChange={(event) => setDay(event.currentTarget.value)}
          aria-invalid={Boolean(shown.day)}
          aria-describedby={described('day') ?? (isWeekend(day) ? 'booking-day-weekend' : undefined)}
        />
        {error('day')}
        {isWeekend(day) && <p className="field-hint" id="booking-day-weekend">{copy.weekend}</p>}
      </div>

      <fieldset className={cx('field', 'choice', shown.slot && 'is-invalid')} aria-describedby={described('slot')}>
        <legend>{copy.slot}</legend>
        <div className="choice-row">
          {(['morning', 'afternoon'] as const).map((value, index) => (
            <label key={value} className={cx('choice-option', slot === value && 'is-on')}>
              <input type="radio" name="slot" value={value} checked={slot === value} onChange={() => setSlot(value)} data-field={index === 0 ? 'slot' : undefined} />
              <span>{value === 'morning' ? copy.morning : copy.afternoon}</span>
            </label>
          ))}
        </div>
        {error('slot')}
      </fieldset>

      <div className={cx('field', shown.name && 'is-invalid')}>
        <label htmlFor="booking-name">{copy.name}</label>
        <input
          id="booking-name"
          data-field="name"
          type="text"
          autoComplete="given-name"
          placeholder={copy.namePlaceholder}
          value={name}
          maxLength={60}
          onChange={(event) => setName(event.currentTarget.value)}
          aria-invalid={Boolean(shown.name)}
          aria-describedby={described('name')}
        />
        {error('name')}
      </div>

      <fieldset className={cx('field', 'choice', shown.first && 'is-invalid')} aria-describedby={described('first')}>
        <legend>{copy.first}</legend>
        <div className="choice-row">
          {(['yes', 'no'] as const).map((value, index) => (
            <label key={value} className={cx('choice-option', first === value && 'is-on')}>
              <input type="radio" name="first" value={value} checked={first === value} onChange={() => setFirst(value)} data-field={index === 0 ? 'first' : undefined} />
              <span>{value === 'yes' ? copy.yes : copy.no}</span>
            </label>
          ))}
        </div>
        {error('first')}
      </fieldset>

      <button type="submit" className="btn btn-primary btn-lg btn-block">
        <WhatsAppIcon size={20} /> {copy.submit}
      </button>
      <p className="booking-note">{copy.note}</p>
    </form>
  )
}
