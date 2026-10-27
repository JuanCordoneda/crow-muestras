import { useMemo, useRef, useState, type FormEvent } from 'react'
import { CalendarX, Check, Plus } from 'lucide-react'
import type { Lang, Menu, Reservation, ReservationStatus, SeatingPreference } from '../../shared/types'
import { ConfirmDialog, Modal } from '../../shared/components/Ui'
import { hoursOn, isDateKey, isTime, madridNow, slotsOn } from '../../shared/hours'
import { LANGS, pick } from '../../shared/i18n'
import { cx, uid } from '../../shared/utils'
import {
  DISH_STATUS_LABEL, LANG_LABEL, SERVICE_LABEL, STATUS_LABEL, errorText, fullDate, guests, isOffline, riceDishes,
} from '../helpers'
import { Field, Group, Segmented, Stepper } from './Fields'

type Props = {
  /** `null` = reserva nueva (normalmente, una llamada). */
  reservation: Reservation | null
  defaultDate: string
  menu: Menu
  onSave: (reservation: Reservation) => Promise<unknown>
  onClose: () => void
}

type Errors = Partial<Record<'name' | 'date' | 'time' | 'party', string>>

const blank = (date: string): Reservation => {
  const now = Date.now()
  return {
    id: uid(),
    date,
    time: '',
    adults: 2,
    children: 0,
    name: '',
    phone: '',
    email: '',
    note: '',
    paella: null,
    seating: 'indiferente',
    lang: 'es',
    // Quien apunta una llamada ya ha confirmado de palabra: nace confirmada.
    status: 'confirmada',
    source: 'telefono',
    createdAt: now,
    updatedAt: now,
  }
}

const STATUS_OPTIONS: ReservationStatus[] = ['pendiente', 'confirmada', 'sentada', 'cancelada', 'no-vino']

/**
 * Alta y edición de reservas desde el panel. No se cierra hasta que el servidor la ha guardado:
 * una reserva apuntada por teléfono que se pierde sin avisar es una mesa que llega y no está.
 */
export function ReservationForm({ reservation, defaultDate, menu, onSave, onClose }: Props) {
  const today = madridNow().date
  const [initial] = useState<Reservation>(() => reservation ?? blank(defaultDate < today ? today : defaultDate))
  const [draft, setDraft] = useState<Reservation>(initial)
  const { settings } = menu

  /**
   * Horas de la franja de ese día. Para el panel no rige la antelación mínima de la web
   * (se calculan como si fuera medianoche): la sala sí puede apuntar a alguien para dentro de 10 minutos.
   */
  const slots = useMemo(
    () => (isDateKey(draft.date) ? slotsOn(settings, draft.date, { date: today, minutes: 0 }) : []),
    [settings, draft.date, today],
  )
  const inSlots = slots.some((group) => group.times.includes(draft.time))
  const [custom, setCustom] = useState(() => Boolean(initial.time) && !slots.some((group) => group.times.includes(initial.time)))
  const [errors, setErrors] = useState<Errors>({})
  const [failure, setFailure] = useState('')
  const [busy, setBusy] = useState(false)
  const [asking, setAsking] = useState(false)
  const form = useRef<HTMLFormElement>(null)

  const rice = useMemo(() => riceDishes(menu), [menu])
  const closed = isDateKey(draft.date) && !hoursOn(settings, draft.date)
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial)

  const patch = (next: Partial<Reservation>) => setDraft((previous) => ({ ...previous, ...next }))

  const requestClose = () => {
    if (dirty && !busy) setAsking(true)
    else onClose()
  }

  const validate = (): Errors => {
    const found: Errors = {}
    if (!draft.name.trim()) found.name = 'Escribe el nombre de la reserva.'
    if (!isDateKey(draft.date)) found.date = 'Elige el día.'
    if (!isTime(draft.time)) found.time = 'Elige la hora de llegada.'
    if (draft.adults < 1) found.party = 'Tiene que haber al menos un adulto.'
    return found
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (busy) return
    const found = validate()
    setErrors(found)
    setFailure('')
    if (Object.keys(found).length) {
      // Lleva al primer campo con fallo: en el móvil puede estar fuera de la vista.
      window.requestAnimationFrame(() => form.current?.querySelector('.has-error')?.scrollIntoView({ block: 'center', behavior: 'smooth' }))
      return
    }
    setBusy(true)
    try {
      await onSave({
        ...draft,
        name: draft.name.trim(),
        phone: draft.phone.trim(),
        email: draft.email.trim(),
        note: draft.note.trim(),
      })
      onClose()
    } catch (error) {
      setFailure(
        isOffline(error)
          ? 'Sin conexión: la reserva NO se ha guardado. Apunta los datos o inténtalo de nuevo en un momento.'
          : `No se ha podido guardar: ${errorText(error)}`,
      )
      setBusy(false)
    }
  }

  const choosePaella = (dishId: string) => {
    if (!dishId) return patch({ paella: null })
    // Por defecto, una ración por comensal (el mínimo de un arroz son dos).
    patch({ paella: { dishId, servings: draft.paella?.servings ?? Math.max(2, guests(draft)) } })
  }

  return (
    <Modal kicker={reservation ? 'Editar reserva' : 'Reserva por teléfono'} title={reservation ? reservation.name || 'Reserva' : 'Nueva reserva'} onClose={requestClose} size="wide">
      <form ref={form} className="adm-form" onSubmit={submit} noValidate>
        <div className="adm-form-row">
          <Field label="Día" error={errors.date} hint={isDateKey(draft.date) ? fullDate(draft.date, today) : undefined}>
            <input
              type="date"
              value={draft.date}
              onChange={(event) => { const date = event.currentTarget.value; patch({ date }); setErrors((previous) => ({ ...previous, date: undefined })) }}
              required
            />
          </Field>
        </div>
        {closed && (
          <p className="adm-inline-warn"><CalendarX size={18} aria-hidden="true" /> Ese día el restaurante está cerrado. Puedes apuntarla igualmente.</p>
        )}

        <Group label="Hora de llegada" className={errors.time ? 'has-error' : undefined}>
          {/* El aviso va pegado a la etiqueta: al final de la rejilla de horas quedaría fuera de la vista. */}
          {errors.time && <small className="adm-error" role="alert">{errors.time}</small>}
          {slots.map((group) => (
            <div className="adm-slots" key={group.service}>
              <span className="adm-slots-label">{SERVICE_LABEL[group.service]}</span>
              <div className="adm-slots-grid">
                {group.times.map((time) => (
                  <button
                    key={time}
                    type="button"
                    className={cx('adm-slot', !custom && draft.time === time && 'is-on')}
                    aria-pressed={!custom && draft.time === time}
                    onClick={() => { setCustom(false); patch({ time }); setErrors((previous) => ({ ...previous, time: undefined })) }}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="adm-slot-custom">
            <button
              type="button"
              className={cx('adm-slot', (custom || (!inSlots && Boolean(draft.time))) && 'is-on')}
              aria-pressed={custom}
              onClick={() => setCustom(true)}
            >
              Otra hora
            </button>
            {(custom || !slots.length || (!inSlots && Boolean(draft.time))) && (
              <input
                type="time"
                step={300}
                aria-label="Hora de llegada"
                value={draft.time}
                onChange={(event) => { patch({ time: event.currentTarget.value }); setErrors((previous) => ({ ...previous, time: undefined })) }}
              />
            )}
          </div>
        </Group>

        <div className="adm-form-row is-two">
          <Group label="Adultos" error={errors.party}>
            <Stepper label="Adultos" value={draft.adults} min={1} max={99} onChange={(adults) => patch({ adults })} />
          </Group>
          <Group label="Niños" hint="Menores de 12">
            <Stepper label="Niños" value={draft.children} min={0} max={50} onChange={(children) => patch({ children })} />
          </Group>
        </div>

        <Field label="Nombre" error={errors.name}>
          <input
            value={draft.name}
            autoComplete="off"
            autoCapitalize="words"
            enterKeyHint="next"
            onChange={(event) => { patch({ name: event.currentTarget.value }); setErrors((previous) => ({ ...previous, name: undefined })) }}
          />
        </Field>
        <div className="adm-form-row is-two">
          <Field label="Teléfono" hint="Para llamar o escribir por WhatsApp">
            <input type="tel" inputMode="tel" autoComplete="off" value={draft.phone} onChange={(event) => patch({ phone: event.currentTarget.value })} />
          </Field>
          <Field label="Email" hint="Opcional">
            <input type="email" inputMode="email" autoComplete="off" autoCapitalize="off" value={draft.email} onChange={(event) => patch({ email: event.currentTarget.value })} />
          </Field>
        </div>

        <Group label="Zona">
          <Segmented<SeatingPreference>
            label="Zona"
            value={draft.seating}
            onChange={(seating) => patch({ seating })}
            options={[{ value: 'indiferente', label: 'Indiferente' }, { value: 'terraza', label: 'Terraza' }, { value: 'interior', label: 'Interior' }]}
          />
        </Group>

        <div className="adm-form-row is-two">
          <Field label="Paella encargada" hint={rice.length ? 'Precio por persona, mínimo 2 raciones' : 'No hay arroces en la carta'}>
            <select value={draft.paella?.dishId ?? ''} onChange={(event) => choosePaella(event.currentTarget.value)}>
              <option value="">Sin paella</option>
              {rice.map((dish) => (
                <option key={dish.id} value={dish.id}>
                  {pick(dish.name, 'es') || 'Sin nombre'}{dish.status !== 'disponible' ? ` (${DISH_STATUS_LABEL[dish.status].toLowerCase()})` : ''}
                </option>
              ))}
              {draft.paella && !rice.some((dish) => dish.id === draft.paella?.dishId) && (
                <option value={draft.paella.dishId}>Arroz que ya no está en la carta</option>
              )}
            </select>
          </Field>
          {draft.paella && (
            <Group label="Raciones">
              <Stepper
                label="Raciones"
                value={draft.paella.servings}
                min={2}
                max={60}
                onChange={(servings) => setDraft((previous) => (previous.paella ? { ...previous, paella: { ...previous.paella, servings } } : previous))}
              />
            </Group>
          )}
        </div>

        <Field label="Nota" hint="Alergias, trona, cumpleaños, mesa preferida…">
          <textarea rows={3} value={draft.note} onChange={(event) => patch({ note: event.currentTarget.value })} />
        </Field>

        <div className="adm-form-row is-two">
          <Field label="Estado">
            <select value={draft.status} onChange={(event) => patch({ status: event.currentTarget.value as ReservationStatus })}>
              {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{STATUS_LABEL[status]}</option>)}
            </select>
          </Field>
          <Field label="Idioma del cliente" hint="Para el mensaje de WhatsApp">
            <select value={draft.lang} onChange={(event) => patch({ lang: event.currentTarget.value as Lang })}>
              {LANGS.map((lang) => <option key={lang} value={lang}>{LANG_LABEL[lang]}</option>)}
            </select>
          </Field>
        </div>

        {failure && <p className="adm-form-failure" role="alert">{failure}</p>}

        <div className="adm-sheet-bar">
          <button type="button" className="btn btn-white" onClick={requestClose}>Cancelar</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {reservation ? <Check size={18} /> : <Plus size={18} />}
            {busy ? 'Guardando…' : reservation ? 'Guardar cambios' : 'Crear reserva'}
          </button>
        </div>
      </form>
      {asking && (
        <ConfirmDialog
          request={{
            title: '¿Descartar la reserva?',
            text: 'Hay datos escritos que todavía no se han guardado. Si sales ahora se pierden.',
            action: 'Descartar',
            danger: true,
            onConfirm: onClose,
          }}
          onClose={() => setAsking(false)}
        />
      )}
    </Modal>
  )
}
