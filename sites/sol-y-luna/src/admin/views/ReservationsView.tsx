import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CalendarDays, CalendarPlus, ChevronRight, CloudOff, CookingPot, Plus, RefreshCw, Search, X } from 'lucide-react'
import type { Menu, Reservation, ReservationStatus } from '../../shared/types'
import { EmptyState, type ConfirmRequest } from '../../shared/components/Ui'
import { addDays, hoursOn, isDateKey, madridNow, rangesLabel } from '../../shared/hours'
import { cx } from '../../shared/utils'
import {
  SERVICE_LABEL, byTime, dayLabel, errorText, fullDate, guests, isActive, matchesSearch, paellaTotals, relativeTime, serviceOf,
  type ServiceKey,
} from '../helpers'
import type { PushToast } from '../hooks'
import { useNow } from '../hooks'
import type { ReservationsApi } from '../useReservations'
import { ReservationCard } from '../components/ReservationCard'
import { ReservationForm } from '../components/ReservationForm'
import { ReservationSheet } from '../components/ReservationSheet'

type Props = {
  api: ReservationsApi
  menu: Menu
  date: string
  onDate: (date: string) => void
  toast: PushToast
  confirm: (request: ConfirmRequest) => void
}

const STRIP_DAYS = 14
const PENDING_PREVIEW = 4

/** Cómo se cuenta cada cambio de estado en el aviso, con el nombre delante para saber de quién era. */
const STATUS_TOAST: Record<ReservationStatus, (name: string) => string> = {
  pendiente: (name) => `${name}: vuelve a pendiente`,
  confirmada: (name) => `Reserva de ${name} confirmada`,
  sentada: (name) => `${name}: sentados`,
  cancelada: (name) => `Reserva de ${name} cancelada`,
  'no-vino': (name) => `${name}: no vino`,
}

type Editing = { reservation: Reservation | null; date: string }

export function ReservationsView({ api, menu, date, onDate, toast, confirm }: Props) {
  const { items, loaded, loadedAt, offline, refreshing } = api
  const { settings, dishes } = menu
  const now = useNow(20_000)
  const today = useMemo(() => madridNow(new Date(now)).date, [now])

  const [query, setQuery] = useState('')
  const [showAllPending, setShowAllPending] = useState(false)
  const [showInactive, setShowInactive] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const [editing, setEditing] = useState<Editing | null>(null)
  const [focusId, setFocusId] = useState<string | null>(null)

  /** La lista más reciente, para que «Deshacer» parta del estado actual y no del de hace 7 segundos. */
  const latest = useRef(items)
  latest.current = items

  /** Las funciones del libro son estables: sacarlas del objeto evita repintar todas las tarjetas. */
  const { loadDay, save, remove, refresh } = api

  /** Días fuera del rango cargado (el pasado, o más allá de dos meses) se piden sueltos. */
  useEffect(() => { if (isDateKey(date)) loadDay(date) }, [date, loadDay])

  /**
   * El panel se queda abierto toda la noche en la barra. Al pasar de las doce, quien estaba
   * mirando «Hoy» tiene que seguir en «Hoy»: si no, por la mañana la cocina abre el panel y ve
   * el día de ayer, vacío, sin las paellas que hay que empezar. Solo arrastra al que iba al día:
   * si se había ido a mirar el sábado, ahí se queda.
   */
  const previousToday = useRef(today)
  useEffect(() => {
    const before = previousToday.current
    previousToday.current = today
    if (before !== today && date === before) onDate(today)
  }, [today, date, onDate])

  /* ---------- acciones ---------- */

  const changeStatus = useCallback((reservation: Reservation, status: ReservationStatus) => {
    if (reservation.status === status) return
    const previousStatus = reservation.status
    const name = reservation.name || 'Sin nombre'
    save({ ...reservation, status }, reservation).catch((error) => toast(`No se ha guardado el cambio de ${name}. ${errorText(error)}`, 'error'))
    toast(STATUS_TOAST[status](name), 'ok', () => {
      const current = latest.current.find((entry) => entry.id === reservation.id)
      if (!current) return
      save({ ...current, status: previousStatus }, current).catch((error) => toast(`No se ha podido deshacer. ${errorText(error)}`, 'error'))
    })
    // Confirmar vibra un instante: en la barra, con ruido, el dedo necesita saber que ha pulsado.
    navigator.vibrate?.(15)
  }, [save, toast])

  const removeReservation = (reservation: Reservation) => confirm({
    title: 'Borrar la reserva',
    text: `Se borrará la reserva de ${reservation.name || 'sin nombre'} (${dayLabel(reservation.date, today).toLowerCase()}, ${reservation.time}). Si solo no va a venir, mejor márcala como cancelada: queda constancia.`,
    action: 'Borrar',
    danger: true,
    onConfirm: () => {
      setOpenId(null)
      remove(reservation)
        .then(() => toast(`Reserva de ${reservation.name || 'sin nombre'} borrada`, 'ok', () => {
          save(reservation, null).catch((error) => toast(`No se ha podido recuperar. ${errorText(error)}`, 'error'))
        }))
        .catch((error) => toast(`No se ha borrado. ${errorText(error)}`, 'error'))
    },
  })

  const saveFromForm = async (reservation: Reservation) => {
    const previous = latest.current.find((entry) => entry.id === reservation.id) ?? null
    const saved = await save(reservation, previous)
    toast(previous ? `Reserva de ${saved.name} actualizada` : `Reserva de ${saved.name} creada`)
    if (saved.date !== date) onDate(saved.date)
    setFocusId(saved.id)
  }

  /** Salta al día de una reserva y la deja resaltada un momento para encontrarla en la lista. */
  const jumpTo = (reservation: Reservation) => {
    setQuery('')
    onDate(reservation.date)
    setFocusId(reservation.id)
  }

  useEffect(() => {
    if (!focusId) return
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(`reserva-${focusId}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    })
    const timer = window.setTimeout(() => setFocusId(null), 2600)
    return () => {
      window.cancelAnimationFrame(frame)
      window.clearTimeout(timer)
    }
  }, [focusId, date])

  /* ---------- datos derivados ---------- */

  const days = useMemo(() => Array.from({ length: STRIP_DAYS }, (_, offset) => addDays(today, offset)), [today])

  const counts = useMemo(() => {
    const result = new Map<string, number>()
    for (const reservation of items) if (isActive(reservation)) result.set(reservation.date, (result.get(reservation.date) ?? 0) + 1)
    return result
  }, [items])

  const pending = useMemo(() => items.filter((entry) => entry.status === 'pendiente' && entry.date >= today).sort(byTime), [items, today])

  const dayItems = useMemo(() => items.filter((entry) => entry.date === date).sort(byTime), [items, date])
  const active = useMemo(() => dayItems.filter(isActive), [dayItems])
  const inactive = useMemo(() => dayItems.filter((entry) => !isActive(entry)), [dayItems])
  const groups = useMemo(() => {
    const buckets: Record<ServiceKey, Reservation[]> = { lunch: [], dinner: [], other: [] }
    for (const reservation of active) buckets[serviceOf(reservation.time, settings)].push(reservation)
    return (['lunch', 'dinner', 'other'] as const).filter((key) => buckets[key].length).map((key) => ({ key, items: buckets[key] }))
  }, [active, settings])
  const paellas = useMemo(() => paellaTotals(dayItems, dishes), [dayItems, dishes])
  const diners = active.reduce((sum, entry) => sum + guests(entry), 0)
  const dayPending = active.filter((entry) => entry.status === 'pendiente').length

  const searching = query.trim() !== ''
  const results = useMemo(() => (searching ? items.filter((entry) => matchesSearch(entry, query)).sort(byTime) : []), [items, query, searching])

  const hours = isDateKey(date) ? hoursOn(settings, date) : null
  const open = openId ? items.find((entry) => entry.id === openId) ?? null : null

  /* ---------- tira de días ---------- */

  const strip = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const holder = strip.current
    const chip = holder?.querySelector<HTMLElement>('[aria-pressed="true"]')
    if (!holder || !chip) return
    // Se centra a mano: `scrollIntoView` movería también la página en vertical.
    holder.scrollTo({ left: chip.offsetLeft - holder.clientWidth / 2 + chip.clientWidth / 2, behavior: 'smooth' })
  }, [date, today, searching])

  const openSheet = useCallback((reservation: Reservation) => setOpenId(reservation.id), [])
  const cardProps = { dishes, settings, now, onStatus: changeStatus, onOpen: openSheet }
  const firstLoad = !loaded && !loadedAt && !offline

  return (
    <div className="adm-view adm-reservations">
      <header className="adm-view-head">
        <div>
          <h1>Reservas</h1>
          <p className="adm-updated" aria-live="polite">
            {offline ? <><CloudOff size={15} aria-hidden="true" /> Sin conexión</> : null}
            {loadedAt ? `${offline ? ' · datos de ' : 'Actualizado '}${relativeTime(loadedAt, now)}` : offline ? '' : 'Cargando…'}
          </p>
        </div>
        <button type="button" className={cx('adm-icon-btn is-outline', refreshing && 'is-spinning')} onClick={() => void refresh(true)} aria-label="Actualizar reservas">
          <RefreshCw size={20} />
        </button>
      </header>

      <label className="adm-search">
        <Search size={18} aria-hidden="true" />
        <input
          type="search"
          value={query}
          placeholder="Buscar por nombre o teléfono"
          aria-label="Buscar reservas por nombre o teléfono"
          enterKeyHint="search"
          onChange={(event) => setQuery(event.currentTarget.value)}
        />
        {query && <button type="button" className="adm-icon-btn" onClick={() => setQuery('')} aria-label="Borrar búsqueda"><X size={18} /></button>}
      </label>

      {searching ? (
        <section className="adm-results" aria-label="Resultados de la búsqueda">
          <p className="adm-muted">
            {results.length ? `${results.length} ${results.length === 1 ? 'reserva' : 'reservas'} de hoy a dos meses vista` : 'Ninguna reserva coincide con la búsqueda.'}
          </p>
          <div className="adm-res-list">
            {results.map((reservation) => (
              <ReservationCard key={reservation.id} reservation={reservation} dayTag={dayLabel(reservation.date, today)} {...cardProps} />
            ))}
          </div>
        </section>
      ) : (
        <>
          {pending.length > 0 && (
            <section className="adm-pending" aria-labelledby="adm-pending-title">
              <h2 id="adm-pending-title">Pendientes de confirmar <span className="adm-count">{pending.length}</span></h2>
              <ul>
                {(showAllPending ? pending : pending.slice(0, PENDING_PREVIEW)).map((reservation) => (
                  <li key={reservation.id}>
                    <button type="button" onClick={() => jumpTo(reservation)}>
                      <span className="adm-pending-when"><b>{dayLabel(reservation.date, today)}</b> {reservation.time}</span>
                      <span className="adm-pending-name">{reservation.name || 'Sin nombre'}</span>
                      <span className="adm-pending-party">{guests(reservation)} p.</span>
                      <ChevronRight size={18} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
              {pending.length > PENDING_PREVIEW && (
                <button type="button" className="adm-link-btn" onClick={() => setShowAllPending((value) => !value)}>
                  {showAllPending ? 'Ver menos' : `Ver las ${pending.length}`}
                </button>
              )}
            </section>
          )}

          <div className="adm-days">
            <div className="adm-days-strip" ref={strip} role="group" aria-label="Elegir día">
              {days.map((day) => {
                const count = counts.get(day) ?? 0
                const dayOpen = Boolean(hoursOn(settings, day))
                return (
                  <button
                    key={day}
                    type="button"
                    className={cx('adm-day', day === date && 'is-on', !dayOpen && 'is-closed')}
                    aria-pressed={day === date}
                    aria-label={`${fullDate(day, today)}: ${count} ${count === 1 ? 'reserva' : 'reservas'}${dayOpen ? '' : ', cerrado'}`}
                    onClick={() => onDate(day)}
                  >
                    <span className="adm-day-name">{dayLabel(day, today)}</span>
                    <span className={cx('adm-day-count', count > 0 && 'has-some')}>{count}</span>
                  </button>
                )
              })}
            </div>
            <label className={cx('adm-day-jump', !days.includes(date) && 'is-on')}>
              <CalendarDays size={20} aria-hidden="true" />
              <span className="sr-only">Ir a otra fecha</span>
              <input
                type="date"
                value={date}
                onChange={(event) => { if (isDateKey(event.currentTarget.value)) onDate(event.currentTarget.value) }}
                onClick={(event) => {
                  // En el ordenador el calendario solo sale al pinchar su icono; en el móvil ya lo abre el toque.
                  if (!window.matchMedia('(pointer: fine)').matches) return
                  try {
                    event.currentTarget.showPicker()
                  } catch {
                    /* navegador sin `showPicker`: queda el campo de fecha normal */
                  }
                }}
              />
            </label>
          </div>

          <div className="adm-day-head">
            <h2>{isDateKey(date) ? fullDate(date, today) : 'Día'}</h2>
            <span className={cx('adm-day-hours', !hours && 'is-closed')}>{hours ? rangesLabel(hours, 'es') : 'Cerrado'}</span>
          </div>

          <div className="adm-summary" aria-label="Resumen del día">
            <div><strong>{active.length}</strong><span>{active.length === 1 ? 'reserva' : 'reservas'}</span></div>
            <div><strong>{diners}</strong><span>comensales</span></div>
            <div className={cx(dayPending > 0 && 'is-warn')}><strong>{dayPending}</strong><span>{dayPending === 1 ? 'pendiente' : 'pendientes'}</span></div>
            <div className="adm-summary-rice">
              <span className="adm-summary-rice-title"><CookingPot size={16} aria-hidden="true" /> Paellas encargadas</span>
              {paellas.length ? (
                <ul>
                  {paellas.map((entry) => <li key={entry.id}><b>{entry.name}</b> × {entry.servings}</li>)}
                </ul>
              ) : (
                <span className="adm-muted">Ninguna</span>
              )}
            </div>
          </div>

          {firstLoad ? (
            <div className="adm-res-list" aria-busy="true" aria-label="Cargando reservas">
              {[0, 1, 2].map((index) => <div key={index} className="adm-skeleton adm-skeleton-card" />)}
            </div>
          ) : active.length === 0 && inactive.length === 0 ? (
            <EmptyState
              icon={offline && !loadedAt ? <CloudOff size={24} /> : <CalendarPlus size={24} />}
              title={offline && !loadedAt ? 'Sin conexión' : 'No hay reservas para este día'}
              text={
                offline && !loadedAt
                  ? 'No se han podido traer las reservas. En cuanto vuelva la conexión aparecerán aquí.'
                  : hours
                    ? 'Las reservas de la web y las que apuntes por teléfono aparecerán aquí.'
                    : 'El restaurante cierra este día. Si hace falta, puedes apuntar una reserva igualmente.'
              }
              action={
                <button type="button" className="btn btn-primary" onClick={() => setEditing({ reservation: null, date })}>
                  <Plus size={18} /> Nueva reserva
                </button>
              }
            />
          ) : (
            <>
              {groups.map((group) => {
                const range = group.key === 'other' ? null : settings.services[group.key]
                const people = group.items.reduce((sum, entry) => sum + guests(entry), 0)
                return (
                  <section className="adm-service" key={group.key} aria-label={SERVICE_LABEL[group.key]}>
                    <h3 className="adm-service-head">
                      <span>
                        {SERVICE_LABEL[group.key]}{range && <small> {range.from}–{range.to}</small>}
                        {/* Aforo del turno: cuánta gente hay apuntada de la que cabe, si el restaurante lo ha configurado. */}
                        {group.key !== 'other' && settings.capacity[group.key] > 0 && (
                          <small className={cx('adm-service-load', people >= settings.capacity[group.key] && 'is-full')}>
                            {' · '}{people}/{settings.capacity[group.key]} comensales
                          </small>
                        )}
                      </span>
                      <span className="adm-service-count">{group.items.length} {group.items.length === 1 ? 'reserva' : 'reservas'} · {people} pax</span>
                    </h3>
                    <div className="adm-res-list">
                      {group.items.map((reservation) => (
                        <ReservationCard key={reservation.id} reservation={reservation} highlight={focusId === reservation.id} {...cardProps} />
                      ))}
                    </div>
                  </section>
                )
              })}
              {inactive.length > 0 && (
                <section className="adm-service is-inactive">
                  <button type="button" className="adm-service-toggle" aria-expanded={showInactive || inactive.some((entry) => entry.id === focusId)} onClick={() => setShowInactive((value) => !value)}>
                    Canceladas y no vinieron <span className="adm-count is-muted">{inactive.length}</span>
                    <ChevronRight size={18} aria-hidden="true" />
                  </button>
                  {(showInactive || inactive.some((entry) => entry.id === focusId)) && (
                    <div className="adm-res-list">
                      {inactive.map((reservation) => (
                        <ReservationCard key={reservation.id} reservation={reservation} highlight={focusId === reservation.id} {...cardProps} />
                      ))}
                    </div>
                  )}
                </section>
              )}
            </>
          )}
        </>
      )}

      <button type="button" className="adm-fab" onClick={() => setEditing({ reservation: null, date })}>
        <Plus size={22} aria-hidden="true" /> Nueva reserva
      </button>

      {open && (
        <ReservationSheet
          reservation={open}
          dishes={dishes}
          settings={settings}
          today={today}
          now={now}
          onStatus={(status) => changeStatus(open, status)}
          onEdit={() => { setOpenId(null); setEditing({ reservation: open, date: open.date }) }}
          onDelete={() => removeReservation(open)}
          onClose={() => setOpenId(null)}
        />
      )}
      {editing && (
        <ReservationForm
          reservation={editing.reservation}
          defaultDate={editing.date}
          menu={menu}
          onSave={saveFromForm}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
