import { useMemo, useState } from 'react'
import { CalendarX, CalendarCheck, ChevronDown, Clock, Lock, MapPin, Moon, Settings as SettingsIcon } from 'lucide-react'
import type { DayHours, Menu, Settings } from '../../shared/types'
import { addDays, dayNumber, hoursOn, madridNow, openState, rangesLabel, shortMonth, shortWeekday, timeLabel, weekdayName, weekdayOf } from '../../shared/hours'
import { adminRoute, navigate } from '../../shared/routing'
import { cx } from '../../shared/utils'
import { PanelCard } from './PanelCard'
import { capitalize } from '../helpers'
import { useNow, type PushToast } from '../hooks'
import type { useGoogleHours } from '../useGoogleHours'
import type { CommitMenu } from '../useMenuSync'
import { Chip } from './Fields'

type Props = {
  menu: Menu
  commit: CommitMenu
  toast: PushToast
  google: ReturnType<typeof useGoogleHours>
  open: boolean
  onToggle: () => void
}

/** Hoy y los seis días siguientes: la semana que de verdad se mira. */
const SPAN = 7

/** «los lunes», «los sábados»: de lunes a viernes el plural no cambia, sábado y domingo sí. */
const weekdayPlural = (weekday: number) => {
  const name = weekdayName(weekday, 'es')
  return name.endsWith('s') ? name : `${name}s`
}

type Day = {
  date: string
  offset: number
  weekday: number
  /** Cierre puntual: solo ese día, el que se pone y se quita aquí. */
  punctual: boolean
  /** Descanso semanal: ese día de la semana no se abre nunca. */
  weekly: boolean
  hours: DayHours | null
}

/**
 * El horario, arriba del todo de la Carta. Es lo primero que pregunta el restaurante y lo que más
 * cuesta que esté al día en la web: aquí se ve el estado de hoy tal como lo lee un cliente, se
 * cierra o se reabre un día, y se cambian las horas sin ir a ningún otro sitio.
 *
 * Las dos cosas que se pueden hacer con un día no son la misma y conviene no confundirlas:
 *
 * - **Cerrar el día** es un cierre puntual (`closedDates`): afecta a esa fecha y a ninguna más, así
 *   que cerrar el martes que viene no cierra todos los martes.
 * - **Cambiar las horas** es tocar el horario semanal (`hours`), que va por día de la semana y no
 *   por fecha: cambiar las de ese martes las cambia todos los martes. El modelo no guarda horas
 *   sueltas para una fecha, así que aquí se dice con todas las letras en vez de dejar creer otra
 *   cosa. Para un día suelto con otro horario, lo que hay es cerrarlo y avisar.
 */
export function HoursPanel({ menu, commit, toast, google, open, onToggle }: Props) {
  // El panel se queda abierto toda la tarde: sin el reloj, a las diez seguiría diciendo «Abierto».
  const tick = useNow(30_000)
  const now = useMemo(() => madridNow(new Date(tick)), [tick])
  /** Qué día tiene el editor abierto. Solo uno: en el móvil dos abiertos ya no caben. */
  const [editing, setEditing] = useState<string | null>(null)
  const { settings } = menu
  const state = openState(settings, now)

  const setClosed = (date: string, closed: boolean) => {
    commit((current) => {
      const rest = current.settings.closedDates.filter((entry) => entry !== date)
      return { ...current, settings: { ...current.settings, closedDates: (closed ? [...rest, date] : rest).sort() } }
    })
  }

  /** Cambia el horario de un día de la semana: el mismo dato que se edita en Ajustes. */
  const setDay = (weekday: number, patch: Partial<DayHours>) =>
    commit((current) => ({
      ...current,
      settings: {
        ...current.settings,
        hours: current.settings.hours.map((day, index) => (index === weekday ? { ...day, ...patch } : day)),
      },
    }))

  const days: Day[] = Array.from({ length: SPAN }, (_, offset) => {
    const date = addDays(now.date, offset)
    const weekday = weekdayOf(date)
    return {
      date,
      offset,
      weekday,
      punctual: settings.closedDates.includes(date),
      weekly: settings.hours[weekday]?.closed ?? false,
      hours: hoursOn(settings, date),
    }
  })

  const today = days[0]
  const todayClosed = today.punctual || today.weekly

  const toggleToday = () => {
    setClosed(today.date, !today.punctual)
    toast(today.punctual ? 'Hoy vuelve a estar abierto' : 'Hoy queda cerrado: la web ya lo dice')
  }

  /** Lo mismo que lee un cliente en la portada, con las mismas palabras. */
  const line =
    state.kind === 'open'
      ? state.soon
        ? `Abierto, pero cierra a las ${timeLabel(state.closesAt, 'es')}`
        : `Abierto · hasta las ${timeLabel(state.closesAt, 'es')}`
      : state.kind === 'later'
        ? `Todavía cerrado · abre a las ${timeLabel(state.opensAt, 'es')}`
        : state.next
          ? `Cerrado · abre ${state.next.date === addDays(now.date, 1) ? 'mañana' : weekdayName(weekdayOf(state.next.date), 'es')} a las ${timeLabel(state.next.opensAt, 'es')}`
          : 'Cerrado'

  const goToSettings = () => {
    navigate(adminRoute({ view: 'ajustes' }))
    window.setTimeout(() => document.getElementById('ajustes-horario')?.scrollIntoView({ block: 'start' }), 60)
  }

  const tone = state.kind === 'open' ? (state.soon ? 'is-soon' : 'is-open') : state.kind === 'later' ? 'is-later' : 'is-closed'

  return (
    <PanelCard
      id="horario"
      className="adm-hours"
      icon={<Clock size={20} />}
      title="Horario"
      lead="Lo que la web enseña ahora mismo. Cierra o reabre un día, o cambia sus horas."
      // Plegado, lo que se venía a mirar: lo mismo que lee un cliente, y si falta Google.
      summary={<>{line}{google.pending ? ' · falta ponerlo en Google' : ''}</>}
      open={open}
      onToggle={onToggle}
    >

      {/*
        Queda de quien dejó el aviso de Google para luego. Se queda aquí, y guardado en el teléfono,
        hasta que se dice que está hecho: es lo único que impide que la ficha se quede atrás.
      */}
      {google.pending && (
        <p className="adm-google-todo">
          <MapPin size={18} aria-hidden="true" />
          <span>Falta ponerlo en Google.</span>
          <button type="button" className="adm-link-btn" onClick={google.ask}>Ver cómo</button>
        </p>
      )}

      {/*
        Hoy, en grande y arriba: el estado con las mismas palabras que lee el cliente en la portada
        —si aquí está mal, está mal en la web— y el botón de cerrarlo dentro del mismo bloque. No se
        repite abajo en la lista: salía dos veces y solo servía para alargar la tarjeta.
      */}
      <div className={cx('adm-today', tone)}>
        <div className="adm-today-head">
          <span className="adm-hours-date is-big" aria-hidden="true">
            <b>{dayNumber(today.date)}</b>
            <small>{shortWeekday(today.date, 'es')}</small>
          </span>
          <p className="adm-today-text" role="status">
            <b>Hoy, {capitalize(weekdayName(today.weekday, 'es'))}</b>
            <span className="adm-today-state"><i aria-hidden="true" />{line}</span>
          </p>
        </div>
        {!today.weekly && (
          <button type="button" className={cx('btn btn-block', today.punctual ? 'btn-indigo' : 'adm-btn-danger-ghost')} onClick={toggleToday}>
            {today.punctual ? <><CalendarCheck size={18} /> Reabrir hoy</> : <><CalendarX size={18} /> Cerrar hoy</>}
          </button>
        )}
        <DayEditor day={today} settings={settings} setDay={setDay} toast={toast} />
      </div>

      {/*
        Los días que vienen, uno bajo otro: en una fila que se deslizaba, los últimos quedaban fuera
        de la pantalla y nadie los veía, que es lo contrario de lo que hace falta para no dejar sin
        avisar un cierre. El renglón abre el día; dentro se cierra y se cambian las horas.
      */}
      <ul className="adm-hours-days" aria-label="Los próximos días">
        {days.slice(1).map((day) => {
          const name = day.offset === 1 ? 'Mañana' : capitalize(weekdayName(day.weekday, 'es'))
          const closed = day.punctual || day.weekly
          const open = editing === day.date
          return (
            <li key={day.date} className={cx('adm-hours-item', open && 'is-open')}>
              <button
                type="button"
                className={cx('adm-hours-row', day.weekly && 'is-weekly', day.punctual && 'is-punctual')}
                aria-expanded={open}
                aria-label={`${name}, ${dayNumber(day.date)} de ${shortMonth(day.date, 'es')}`}
                onClick={() => setEditing(open ? null : day.date)}
              >
                <span className="adm-hours-date" aria-hidden="true">
                  <b>{dayNumber(day.date)}</b>
                  <small>{shortWeekday(day.date, 'es')}</small>
                </span>
                <span className="adm-hours-row-text">
                  <strong>{name}</strong>
                  {/* La hora, en grande y en negrita: es el dato que se viene a mirar. */}
                  {day.hours
                    ? <em className="adm-hours-time">{rangesLabel(day.hours, 'es')}</em>
                    : <small>{day.weekly ? 'Descanso semanal' : 'Cerrado este día'}</small>}
                </span>
                <span className="adm-hours-state" aria-hidden="true">
                  <span className={cx('adm-hours-pill', day.weekly && 'is-weekly', day.punctual && 'is-punctual')}>
                    {day.weekly ? <Lock size={16} /> : closed ? <><CalendarX size={15} /> Cerrado</> : 'Abierto'}
                  </span>
                  <ChevronDown size={18} className="adm-chevron" />
                </span>
              </button>
              {open && (
                <div className="adm-hours-edit">
                  {!day.weekly && (
                    <button
                      type="button"
                      className={cx('btn btn-block btn-sm', day.punctual ? 'btn-indigo' : 'adm-btn-danger-ghost')}
                      onClick={() => setClosed(day.date, !day.punctual)}
                    >
                      {day.punctual
                        ? <><CalendarCheck size={18} /> Reabrir el {dayNumber(day.date)}</>
                        : <><CalendarX size={18} /> Cerrar solo el {dayNumber(day.date)}</>}
                    </button>
                  )}
                  <DayEditor day={day} settings={settings} setDay={setDay} toast={toast} />
                </div>
              )}
            </li>
          )
        })}
      </ul>

      {/* Lleva al apartado, no solo a la pantalla: en Ajustes hay siete tarjetas antes. */}
      <button type="button" className="adm-link-btn adm-hours-more" onClick={goToSettings}>
        <SettingsIcon size={16} aria-hidden="true" /> Horario semanal, turnos y vacaciones
      </button>
    </PanelCard>
  )
}

/**
 * Las horas de un día, editables aquí mismo. Lo que se toca es el **horario semanal**: el modelo
 * guarda las horas por día de la semana, no por fecha, así que cambiar las de este martes las
 * cambia todos los martes. En vez de esconderlo, el editor lo dice en su título y al pie, y el
 * aviso de que ha cambiado sale igual que si se hubiera tocado en Ajustes.
 *
 * Para dejar un día suelto con otro horario no hay dónde guardarlo: lo que hay es cerrarlo y
 * avisar en la web.
 */
function DayEditor({ day, settings, setDay, toast }: {
  day: Day
  settings: Settings
  setDay: (weekday: number, patch: Partial<DayHours>) => void
  toast: PushToast
}) {
  const week = settings.hours[day.weekday]
  if (!week) return null
  const plural = weekdayPlural(day.weekday)
  const wrong = !week.closed && week.open && week.close && week.close <= week.open
  /** El tramo de noche mal puesto: o del revés, o empezando antes de cerrar el de día. */
  const wrong2 = week.split && week.open2 && week.close2 && (week.close2 <= week.open2 || week.open2 < week.close)

  if (week.closed) {
    return (
      <div className="adm-hours-edit-body">
        <p className="adm-hours-edit-note">
          <Lock size={15} aria-hidden="true" /> Los {plural} no se abre. Es el horario semanal, así que abrirlo vale para todos los {plural}.
        </p>
        <button
          type="button"
          className="btn btn-ghost btn-sm btn-block"
          onClick={() => {
            setDay(day.weekday, { closed: false, open: week.open || '12:00', close: week.close || '22:00', lunch: week.lunch || !week.dinner, dinner: week.dinner })
            toast(`Los ${plural} pasan a estar abiertos`)
          }}
        >
          <CalendarCheck size={18} /> Abrir los {plural}
        </button>
      </div>
    )
  }

  return (
    <div className="adm-hours-edit-body">
      <span className="adm-hours-edit-title">Horario de los {plural}</span>
      <span className="adm-time-range adm-hours-range">
        <input type="time" step={900} aria-label={`Los ${plural}: abre`} value={week.open} onChange={(event) => setDay(day.weekday, { open: event.currentTarget.value })} />
        <span aria-hidden="true">–</span>
        <input type="time" step={900} aria-label={`Los ${plural}: cierra`} value={week.close} onChange={(event) => setDay(day.weekday, { close: event.currentTarget.value })} />
      </span>
      {wrong && <small className="adm-error">La hora de cierre tiene que ser posterior a la de apertura.</small>}

      {/*
        Horario partido: cerrar entre el almuerzo y la cena. Sin esto había que poner 12:00–23:00 y
        la web decía «abierto» a las cinco de la tarde, que es cuando alguien se planta en la puerta.
      */}
      {week.split ? (
        <>
          <span className="adm-hours-edit-title">Y por la noche</span>
          <span className="adm-time-range adm-hours-range">
            <input type="time" step={900} aria-label={`Los ${plural}: abre por la noche`} value={week.open2} onChange={(event) => setDay(day.weekday, { open2: event.currentTarget.value })} />
            <span aria-hidden="true">–</span>
            <input type="time" step={900} aria-label={`Los ${plural}: cierra por la noche`} value={week.close2} onChange={(event) => setDay(day.weekday, { close2: event.currentTarget.value })} />
          </span>
          {wrong2 && <small className="adm-error">La noche tiene que empezar después de cerrar al mediodía, y acabar más tarde de lo que empieza.</small>}
          <button type="button" className="adm-link-btn" onClick={() => setDay(day.weekday, { split: false })}>
            Quitar el corte: abierto todo el día
          </button>
        </>
      ) : (
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => setDay(day.weekday, { split: true, open2: week.open2 || '19:00', close2: week.close2 || week.close || '23:00' })}
        >
          <Moon size={17} /> Cerrar por la tarde y abrir de noche
        </button>
      )}

      <span className="adm-chips">
        <Chip on={week.lunch} onChange={(lunch) => setDay(day.weekday, { lunch })}>Almuerzo</Chip>
        <Chip on={week.dinner} onChange={(dinner) => setDay(day.weekday, { dinner })}>Cena</Chip>
      </span>
      {/* Lo que más se malentiende del panel: se dice donde se toca, no en una ayuda aparte. */}
      <p className="adm-hours-edit-note">Cambia todos los {plural}, no solo este.</p>
    </div>
  )
}
