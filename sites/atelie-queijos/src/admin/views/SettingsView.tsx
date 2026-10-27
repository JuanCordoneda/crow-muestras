import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  CalendarX, Clock, Download, ExternalLink, Globe, Images, Languages, LogOut, Megaphone, Plus, RotateCcw, Store, Upload, X,
} from 'lucide-react'
import type { DayHours, Lang, Localized, Menu, Settings } from '../../shared/types'
import type { Session } from '../../shared/api'
import type { ConfirmRequest } from '../../shared/components/Ui'
import { MENU_VERSION, seedMenu } from '../../shared/data'
import { addDays, isDateKey, madridNow, weekdayName } from '../../shared/hours'
import { LANG_NAMES } from '../../shared/i18n'
import { linkTo, publicRoute } from '../../shared/routing'
import { PHOTO_SLOTS, sitePhoto } from '../../shared/photos'
import { normalizeMenu } from '../../shared/store'
import { cx } from '../../shared/utils'
import { capitalize, downloadJson, fullDate } from '../helpers'
import type { PushToast } from '../hooks'
import type { CommitMenu, SaveState } from '../useMenuSync'
import { Chip, Field, Group, Switch } from '../components/Fields'
// AGENDA: import { Segmented, Stepper } from '../components/Fields'
import { PhotoField } from '../components/PhotoField'
import { autoTranslate } from '../autoTranslate'

type Props = {
  menu: Menu
  ready: boolean
  commit: CommitMenu
  saveState: SaveState
  pendingChanges: boolean
  session: Session | null
  toast: PushToast
  confirm: (request: ConfirmRequest) => void
  onSignOut: () => void
}

/** La semana se enseña de lunes a domingo, como la piensa el restaurante; `hours` va de domingo (0) a sábado. */
const WEEK = [1, 2, 3, 4, 5, 6, 0]

/* AGENDA: las opciones de antelación del formulario de reserva.
const NOTICE_MINUTES = [0, 15, 30, 60, 90, 120, 180, 240, 1440]
const noticeLabel = (minutes: number) =>
  minutes === 0 ? 'Sin margen' : minutes < 60 ? `${minutes} min` : minutes === 1440 ? '1 día' : minutes % 60 ? `${Math.floor(minutes / 60)} h ${minutes % 60} min` : `${minutes / 60} h`
*/

const SECTIONS = [
  { id: 'datos', label: 'Datos' },
  { id: 'fotos', label: 'Fotos' },
  { id: 'horario', label: 'Horario' },
  { id: 'turnos', label: 'Turnos' },
  { id: 'cierres', label: 'Cierres' },
  { id: 'aviso', label: 'Aviso' },
  { id: 'copia', label: 'Copia' },
  { id: 'sesion', label: 'Sesión' },
]

function Card({ id, icon, title, lead, children }: { id: string; icon: ReactNode; title: string; lead?: string; children: ReactNode }) {
  return (
    <section className="adm-card" id={`ajustes-${id}`} aria-labelledby={`ajustes-${id}-title`}>
      <header className="adm-card-head">
        <span className="adm-card-ico" aria-hidden="true">{icon}</span>
        <div>
          <h2 id={`ajustes-${id}-title`}>{title}</h2>
          {lead && <p>{lead}</p>}
        </div>
      </header>
      {children}
    </section>
  )
}

/**
 * Ajustes del restaurante. Se guardan solos, con el mismo flujo que la carta (van dentro de ella):
 * no hay botón de guardar que olvidar, y la barra de arriba dice si ya está en el servidor.
 */
export function SettingsView({ menu, ready, commit, saveState, pendingChanges, session, toast, confirm, onSignOut }: Props) {
  const { settings } = menu
  const today = madridNow().date
  const [closedDraft, setClosedDraft] = useState('')
  /** Segunda fecha del cierre: vacía es un día suelto; con fecha, toda la temporada de golpe. */
  const [closedUntil, setClosedUntil] = useState('')
  const importInput = useRef<HTMLInputElement>(null)

  const set = (patch: Partial<Settings>) => commit((current) => ({ ...current, settings: { ...current.settings, ...patch } }))

  const setDay = (weekday: number, patch: Partial<DayHours>) =>
    commit((current) => ({
      ...current,
      settings: {
        ...current.settings,
        hours: current.settings.hours.map((day, index) => (index === weekday ? { ...day, ...patch } : day)),
      },
    }))

  const setService = (service: 'lunch' | 'dinner', edge: 'from' | 'to', value: string) =>
    commit((current) => ({
      ...current,
      settings: {
        ...current.settings,
        services: { ...current.settings.services, [service]: { ...current.settings.services[service], [edge]: value } },
      },
    }))

  /** Vacío = el hueco vuelve a la foto de serie, así que se quita en vez de guardarse en blanco. */
  const setPhoto = (slot: string, src: string) =>
    commit((current) => {
      const photos = { ...current.settings.photos }
      if (src.trim()) photos[slot] = src.trim()
      else delete photos[slot]
      return { ...current, settings: { ...current.settings, photos } }
    })

  const setNotice = (lang: Lang, value: string) =>
    commit((current) => ({ ...current, settings: { ...current.settings, notice: { ...current.settings.notice, [lang]: value } } }))

  /**
   * El aviso se escribe en castellano y se traduce al salir de la caja. Se guarda cómo estaba al
   * entrar para saber si ha cambiado; si mientras se traducía se ha vuelto a tocar, se descarta.
   */
  const noticeBefore = useRef<Localized | null>(null)
  const [noticeTranslating, setNoticeTranslating] = useState(false)
  const translateNotice = async () => {
    const before = noticeBefore.current
    noticeBefore.current = null
    if (!before) return
    const after = { ...settings.notice, es: settings.notice.es.trim() }
    setNoticeTranslating(true)
    const { texts: [notice], failed } = await autoTranslate([{ before, after }])
    setNoticeTranslating(false)
    commit((current) => (current.settings.notice.es.trim() === after.es
      ? { ...current, settings: { ...current.settings, notice: { ...current.settings.notice, en: notice.en, de: notice.de, fr: notice.fr } } }
      : current))
    if (failed) toast('El traductor no responde: el aviso sale en castellano hasta que lo vuelvas a editar.', 'error')
  }

  const addClosedDate = () => {
    if (!isDateKey(closedDraft)) return
    /** Del primer día al último, ambos incluidos; sin «hasta», un solo día. */
    const until = isDateKey(closedUntil) && closedUntil >= closedDraft ? closedUntil : closedDraft
    const range: string[] = []
    for (let date = closedDraft; date <= until && range.length < 400; date = addDays(date, 1)) range.push(date)
    const nuevos = range.filter((date) => !settings.closedDates.includes(date))
    if (!nuevos.length) {
      toast(range.length === 1 ? 'Ese día ya estaba en la lista.' : 'Esos días ya estaban en la lista.')
      return
    }
    commit((current) => ({
      ...current,
      settings: { ...current.settings, closedDates: [...new Set([...current.settings.closedDates, ...range])].sort() },
    }))
    toast(nuevos.length === 1 ? 'Día de cierre añadido' : `${nuevos.length} días de cierre añadidos`)
    setClosedDraft('')
    setClosedUntil('')
  }

  const removeClosedDate = (date: string) =>
    commit((current) => ({ ...current, settings: { ...current.settings, closedDates: current.settings.closedDates.filter((entry) => entry !== date) } }))

  const pastDates = settings.closedDates.filter((date) => date < today)

  /* ---------- copia de seguridad ---------- */

  const exportMenu = () => {
    downloadJson(`el-puerto-carta-${today}.json`, menu)
    toast('Copia descargada')
  }

  const importMenu = async (file: File | undefined) => {
    if (!file) return
    let data: unknown
    try {
      data = JSON.parse(await file.text())
    } catch {
      toast('Ese archivo no es una copia de la carta (no es JSON).', 'error')
      return
    }
    const shape = data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
    // `normalizeMenu` devuelve la carta original ante cualquier cosa rara: aquí hay que avisar, no sustituir.
    if (!Array.isArray(shape.categories) || !Array.isArray(shape.dishes)) {
      toast('Ese archivo no es una copia de la carta: le faltan las secciones o los platos.', 'error')
      return
    }
    const imported = normalizeMenu(data)
    confirm({
      title: 'Importar carta',
      text: `Se reemplazará la carta actual (${menu.categories.length} secciones, ${menu.dishes.length} platos) y los ajustes por los del archivo «${file.name}»: ${imported.categories.length} secciones y ${imported.dishes.length} platos.`,
      action: 'Reemplazar',
      danger: true,
      onConfirm: () => replaceMenu({ ...imported, version: Math.max(imported.version, MENU_VERSION) }, 'Carta importada'),
    })
  }

  const replaceMenu = (next: Menu, message: string) => {
    let previous: Menu | null = null
    commit((current) => {
      previous = current
      return next
    })
    toast(message, 'ok', () => { if (previous) commit(previous) })
  }

  const restoreSeed = () => confirm({
    title: 'Restaurar la carta original',
    text: 'Vuelven la carta, los horarios y los datos con los que se estrenó la web. Se pierden los platos, precios y fotos cambiados desde entonces. Mejor descarga antes una copia.',
    action: 'Restaurar',
    danger: true,
    onConfirm: () => replaceMenu(seedMenu(), 'Carta original restaurada'),
  })

  const signOut = () => {
    if (pendingChanges || saveState === 'saving') {
      confirm({
        title: 'Hay cambios sin guardar',
        text: 'Hay cambios de la carta que todavía no han llegado al servidor. Se subirán cuando vuelvas a entrar desde este teléfono.',
        action: 'Cerrar sesión',
        danger: true,
        onConfirm: onSignOut,
      })
      return
    }
    onSignOut()
  }

  const jump = (id: string) => document.getElementById(`ajustes-${id}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' })

  /**
   * En qué apartado está la vista. Ajustes es largo y en un móvil se pierde el sitio: el índice se
   * queda arriba y marca dónde estás, así que vale para saltar y para saber por dónde vas.
   */
  const [here, setHere] = useState(SECTIONS[0].id)
  useEffect(() => {
    if (!ready) return
    const cards = SECTIONS.map((section) => document.getElementById(`ajustes-${section.id}`)).filter((node): node is HTMLElement => Boolean(node))
    if (!cards.length) return
    const watcher = new IntersectionObserver(
      (entries) => {
        // La de más arriba de las que se ven: es la que el pulgar tiene delante.
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        const first = visible[0]?.target.id.replace('ajustes-', '')
        if (first) setHere(first)
      },
      { rootMargin: '-96px 0px -55% 0px', threshold: 0 },
    )
    cards.forEach((card) => watcher.observe(card))
    return () => watcher.disconnect()
  }, [ready])

  if (!ready) {
    return (
      <div className="adm-view" aria-busy="true">
        <header className="adm-view-head"><div><h1>Ajustes</h1><p className="adm-updated">Cargando…</p></div></header>
        {[0, 1, 2].map((index) => <div key={index} className="adm-skeleton adm-skeleton-card" />)}
      </div>
    )
  }

  /* AGENDA:
  const noticeOptions = NOTICE_MINUTES.includes(settings.minNoticeMinutes) ? NOTICE_MINUTES : [...NOTICE_MINUTES, settings.minNoticeMinutes].sort((a, b) => a - b)
  const slotValues = [15, 30, 60].includes(settings.slotMinutes) ? [15, 30, 60] : [15, 30, 60, settings.slotMinutes].sort((a, b) => a - b)
  */

  return (
    <div className="adm-view adm-settings">
      <header className="adm-view-head">
        <div>
          <h1>Ajustes</h1>
          <p className="adm-updated">Los cambios se guardan solos y salen en la web al momento.</p>
        </div>
      </header>

      <nav className="adm-jump is-sticky" aria-label="Ir a un apartado">
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            className={cx('adm-filter', here === section.id && 'is-on')}
            aria-current={here === section.id ? 'true' : undefined}
            onClick={() => jump(section.id)}
          >
            {section.label}
          </button>
        ))}
      </nav>

      <Card id="datos" icon={<Store size={20} />} title="Datos del restaurante" lead="Lo que sale en la web, en Google y en los enlaces de llamar y escribir.">
        <div className="adm-form">
          <Field label="Nombre"><input value={settings.name} onChange={(event) => set({ name: event.currentTarget.value })} /></Field>
          <div className="adm-form-row is-two">
            <Field label="Teléfono"><input type="tel" inputMode="tel" value={settings.phone} onChange={(event) => set({ phone: event.currentTarget.value })} /></Field>
            <Field label="Móvil" hint="Vacío = no se enseña."><input type="tel" inputMode="tel" value={settings.mobile} onChange={(event) => set({ mobile: event.currentTarget.value })} /></Field>
          </div>
          <Field label="WhatsApp" hint="Con prefijo, p. ej. 34666022733. Vacío = no se ofrece WhatsApp en la web">
            <input type="tel" inputMode="numeric" value={settings.whatsapp} placeholder="34666022733" onChange={(event) => set({ whatsapp: event.currentTarget.value })} />
          </Field>
          <Field label="Email"><input type="email" inputMode="email" autoCapitalize="off" value={settings.email} onChange={(event) => set({ email: event.currentTarget.value })} /></Field>
          <Field label="Dirección"><input value={settings.address} onChange={(event) => set({ address: event.currentTarget.value })} /></Field>
          <div className="adm-form-row is-two">
            <Field label="Código postal"><input inputMode="numeric" value={settings.postcode} onChange={(event) => set({ postcode: event.currentTarget.value })} /></Field>
            <Field label="Localidad"><input value={settings.town} onChange={(event) => set({ town: event.currentTarget.value })} /></Field>
          </div>
          <Field label="Región"><input value={settings.region} onChange={(event) => set({ region: event.currentTarget.value })} /></Field>
          <Field label="Instagram" hint="Dirección completa del perfil."><input type="url" inputMode="url" autoCapitalize="off" value={settings.instagram} onChange={(event) => set({ instagram: event.currentTarget.value })} /></Field>
          <Field label="Facebook"><input type="url" inputMode="url" autoCapitalize="off" value={settings.facebook} onChange={(event) => set({ facebook: event.currentTarget.value })} /></Field>
          <Field label="Tripadvisor"><input type="url" inputMode="url" autoCapitalize="off" value={settings.tripadvisor} onChange={(event) => set({ tripadvisor: event.currentTarget.value })} /></Field>
          <Field label="Google · reseñas" hint="El enlace para dejar reseña (g.page/…), que sale en la web. Vacío = no se ofrece.">
            <input type="url" inputMode="url" autoCapitalize="off" value={settings.google} onChange={(event) => set({ google: event.currentTarget.value })} />
          </Field>
          {/*
            No sale en la web: es el atajo del propio panel. Cuando se cambia el horario aquí, el
            aviso de Google lleva a esta dirección; sin ella abre el panel general y hay que buscar
            la ficha a mano, que es justo lo que hace que no se cambie nunca.
          */}
          <Field
            label="Google · ficha del restaurante"
            hint="Para el panel, no para la web: adonde lleva el aviso de «ponlo también en Google». Abre tu ficha en Google Business y pega aquí su dirección."
          >
            <input
              type="url"
              inputMode="url"
              autoCapitalize="off"
              placeholder="https://business.google.com/…"
              value={settings.googleBusiness}
              onChange={(event) => set({ googleBusiness: event.currentTarget.value })}
            />
          </Field>
        </div>
      </Card>

      <Card id="fotos" icon={<Images size={20} />} title="Fotos de la web" lead="Las fotos de la portada y del local. Se cambian una a una y salen en la web al momento.">
        {/*
          Cada hueco tiene su foto de serie: quitarla no deja la web sin foto, la devuelve a la que
          traía. Así nadie deja la portada en blanco desde el móvil en mitad del servicio.
        */}
        <div className="adm-slots">
          <h3 className="adm-slots-title">Portada</h3>
          {PHOTO_SLOTS.filter((slot) => slot.group === 'portada').map((slot) => (
            <Field key={slot.id} label={slot.label} hint={slot.hint || undefined}>
              <PhotoField value={sitePhoto(settings, slot.id)} alt={slot.label} onChange={(src) => setPhoto(slot.id, src)} />
              {!settings.photos[slot.id] && <small className="adm-muted">Es la foto de serie. Al subir otra, la sustituye.</small>}
            </Field>
          ))}
          <h3 className="adm-slots-title">El local</h3>
          {PHOTO_SLOTS.filter((slot) => slot.group === 'local').map((slot) => (
            <Field key={slot.id} label={slot.label} hint={slot.hint || undefined}>
              <PhotoField value={sitePhoto(settings, slot.id)} alt={slot.label} onChange={(src) => setPhoto(slot.id, src)} />
              {!settings.photos[slot.id] && <small className="adm-muted">Es la foto de serie. Al subir otra, la sustituye.</small>}
            </Field>
          ))}
        </div>
      </Card>

      <Card id="horario" icon={<Clock size={20} />} title="Horario semanal" lead="Lo que la web enseña y con lo que calcula «Abierto ahora». Hora de Mallorca.">
        <ul className="adm-week">
          {WEEK.map((weekday) => {
            const day = settings.hours[weekday]
            if (!day) return null
            const name = capitalize(weekdayName(weekday, 'es'))
            const wrong = !day.closed && day.open && day.close && day.close <= day.open
            const wrong2 = day.split && day.open2 && day.close2 && (day.close2 <= day.open2 || day.open2 < day.close)
            return (
              <li key={weekday} className={cx('adm-weekday', day.closed && 'is-closed')}>
                <Switch
                  checked={!day.closed}
                  label={name}
                  hint={day.closed ? 'Cerrado' : 'Abierto'}
                  onChange={(on) => setDay(weekday, on
                    ? { closed: false, open: day.open || '12:00', close: day.close || '22:00', lunch: day.lunch || !day.dinner, dinner: day.dinner }
                    : { closed: true })}
                />
                {!day.closed && (
                  <div className="adm-weekday-body">
                    <span className="adm-time-range">
                      <input type="time" step={900} aria-label={`${name}: abre`} value={day.open} onChange={(event) => setDay(weekday, { open: event.currentTarget.value })} />
                      <span aria-hidden="true">–</span>
                      <input type="time" step={900} aria-label={`${name}: cierra`} value={day.close} onChange={(event) => setDay(weekday, { close: event.currentTarget.value })} />
                    </span>
                    {/* Horario partido: el segundo tramo, para quien cierra entre el almuerzo y la cena. */}
                    {day.split ? (
                      <span className="adm-time-range">
                        <input type="time" step={900} aria-label={`${name}: abre por la noche`} value={day.open2} onChange={(event) => setDay(weekday, { open2: event.currentTarget.value })} />
                        <span aria-hidden="true">–</span>
                        <input type="time" step={900} aria-label={`${name}: cierra por la noche`} value={day.close2} onChange={(event) => setDay(weekday, { close2: event.currentTarget.value })} />
                      </span>
                    ) : null}
                    <span className="adm-chips">
                      {/* Qué turnos se dan ese día: un lunes de solo almuerzo no es lo mismo que uno cerrado. */}
                      <Chip on={day.lunch} onChange={(lunch) => setDay(weekday, { lunch })}>Almuerzo</Chip>
                      <Chip on={day.dinner} onChange={(dinner) => setDay(weekday, { dinner })}>Cena</Chip>
                      <Chip
                        on={day.split}
                        className="adm-chip-split"
                        onChange={(split) => setDay(weekday, split
                          ? { split: true, open2: day.open2 || '19:00', close2: day.close2 || day.close || '23:00' }
                          : { split: false })}
                      >
                        Partido
                      </Chip>
                    </span>
                    {wrong && <small className="adm-error">La hora de cierre tiene que ser posterior a la de apertura.</small>}
                    {wrong2 && <small className="adm-error">La noche tiene que empezar después de cerrar al mediodía, y acabar más tarde de lo que empieza.</small>}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </Card>

      <Card
        id="turnos"
        icon={<Clock size={20} />}
        title="Turnos: almuerzo y cena"
        lead="Las horas de cada turno. Son las que salen en la web, en «Horario», y las que se leen en Google."
      >
        <div className="adm-form">
          <div className="adm-turnos-preview" aria-live="polite">
            <span className="adm-kicker">Así se lee en la web</span>
            <p className="adm-turnos-line">
              <b>Almuerzo</b> {settings.services.lunch.from}–{settings.services.lunch.to}
              <span aria-hidden="true"> · </span>
              <b>Cena</b> {settings.services.dinner.from}–{settings.services.dinner.to}
            </p>
            <small className="adm-muted">Qué días se da cada turno se marca arriba, en el horario semanal.</small>
          </div>
          <div className="adm-form-row is-two">
            <Group label="Almuerzo: de qué hora a qué hora">
              <span className="adm-time-range">
                <input type="time" step={900} aria-label="Almuerzo desde" value={settings.services.lunch.from} onChange={(event) => setService('lunch', 'from', event.currentTarget.value)} />
                <span aria-hidden="true">–</span>
                <input type="time" step={900} aria-label="Almuerzo hasta" value={settings.services.lunch.to} onChange={(event) => setService('lunch', 'to', event.currentTarget.value)} />
              </span>
            </Group>
            <Group label="Cena: de qué hora a qué hora">
              <span className="adm-time-range">
                <input type="time" step={900} aria-label="Cena desde" value={settings.services.dinner.from} onChange={(event) => setService('dinner', 'from', event.currentTarget.value)} />
                <span aria-hidden="true">–</span>
                <input type="time" step={900} aria-label="Cena hasta" value={settings.services.dinner.to} onChange={(event) => setService('dinner', 'to', event.currentTarget.value)} />
              </span>
            </Group>
          </div>
          {/*
            AGENDA · reglas del formulario de reserva propio. No se enseñan porque las reservas las
            lleva Restoo: la web enlaza allí y aquí no hay nada que estos números puedan cambiar.
            Los campos siguen en la carta y el servidor los sigue validando, así que descomentar
            esto es todo lo que hace falta si el formulario vuelve.

          <Group label="Cada cuánto se ofrece una hora">
            <Segmented
              label="Minutos entre horas de reserva"
              value={String(settings.slotMinutes)}
              options={slotValues.map((minutes) => ({ value: String(minutes), label: `${minutes} min` }))}
              onChange={(value) => set({ slotMinutes: Number(value) })}
            />
          </Group>
          <div className="adm-form-row is-two">
            <Field label="Antelación mínima para hoy" hint="Margen para que la cocina se organice.">
              <select value={settings.minNoticeMinutes} onChange={(event) => set({ minNoticeMinutes: Number(event.currentTarget.value) })}>
                {noticeOptions.map((minutes) => <option key={minutes} value={minutes}>{noticeLabel(minutes)}</option>)}
              </select>
            </Field>
            <Group label="Días por delante" hint="Hasta cuándo se puede reservar.">
              <Stepper label="Días por delante" value={settings.bookingDays} min={1} max={365} suffix="días" onChange={(bookingDays) => set({ bookingDays })} />
            </Group>
          </div>
          <Group label="Grupo máximo" hint="Los grupos más grandes tienen que llamar.">
            <Stepper label="Personas como máximo" value={settings.maxPartySize} min={1} max={80} suffix="personas" onChange={(maxPartySize) => set({ maxPartySize })} />
          </Group>
          {/*
            El aforo es lo único que impide que la web acepte más mesas de las que caben: hasta que
            el restaurante ponga sus números, la web no rechaza a nadie por estar lleno.
          *\/}
          <div className="adm-form-row is-two">
            <Group label="Aforo en comidas" hint="0 = sin límite.">
              <Stepper label="Comensales en comidas" value={settings.capacity.lunch} min={0} max={400} step={5} suffix="comensales" onChange={(lunch) => set({ capacity: { ...settings.capacity, lunch } })} />
            </Group>
            <Group label="Aforo en cenas" hint="0 = sin límite.">
              <Stepper label="Comensales en cenas" value={settings.capacity.dinner} min={0} max={400} step={5} suffix="comensales" onChange={(dinner) => set({ capacity: { ...settings.capacity, dinner } })} />
            </Group>
          </div>
          <p className="adm-muted">
            El aforo son los comensales que la web acepta por turno. Con 0 no rechaza ninguna reserva por estar lleno,
            así que conviene poner las plazas reales de la terraza y del comedor.
          </p>
          */}
        </div>
      </Card>

      <Card id="cierres" icon={<CalendarX size={20} />} title="Días de cierre" lead="Vacaciones, festivos, un evento privado: esos días la web dice «Cerrado», aunque toque abrir por horario.">
        {/*
          Con «hasta» se cierra una temporada entera de una vez: cerrar de noviembre a febrero día
          a día son más de cien toques, y es justo lo que hace media Can Picafort cada invierno.
        */}
        <div className="adm-closed-add">
          <Field label="Desde">
            <input type="date" min={today} value={closedDraft} onChange={(event) => setClosedDraft(event.currentTarget.value)} />
          </Field>
          <Field label="Hasta" hint="Opcional: cierra todos los días del rango.">
            <input type="date" min={closedDraft || today} value={closedUntil} onChange={(event) => setClosedUntil(event.currentTarget.value)} />
          </Field>
          <button type="button" className="btn btn-indigo" onClick={addClosedDate} disabled={!isDateKey(closedDraft)}><Plus size={18} /> Añadir</button>
        </div>
        {settings.closedDates.length ? (
          <ul className="adm-closed-list">
            {settings.closedDates.map((date) => (
              <li key={date} className={cx(date < today && 'is-past')}>
                <span>{isDateKey(date) ? fullDate(date, today) : date}</span>
                <button type="button" className="adm-icon-btn" onClick={() => removeClosedDate(date)} aria-label={`Quitar ${isDateKey(date) ? fullDate(date, today) : date}`}>
                  <X size={20} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="adm-muted">No hay días de cierre puntual.</p>
        )}
        {pastDates.length > 0 && (
          <button
            type="button"
            className="adm-link-btn"
            onClick={() => commit((current) => ({ ...current, settings: { ...current.settings, closedDates: current.settings.closedDates.filter((date) => date >= today) } }))}
          >
            Quitar {pastDates.length === 1 ? 'el día que ya pasó' : `los ${pastDates.length} días que ya pasaron`}
          </button>
        )}
      </Card>

      <Card id="aviso" icon={<Megaphone size={20} />} title="Aviso en la web" lead="Una línea en lo alto de todas las páginas: cierre por vacaciones, plato del día… Vacío = sin aviso.">
        <div className="adm-notice-preview" aria-live="polite">
          <span className="adm-kicker">Así se verá</span>
          {settings.notice.es.trim() ? (
            <p className="adm-notice-line"><Megaphone size={16} aria-hidden="true" /> {settings.notice.es.trim()}</p>
          ) : (
            <p className="adm-muted">Sin aviso: la web no enseña nada.</p>
          )}
        </div>
        <div className="adm-form">
          <Field label="Aviso" hint={noticeTranslating ? undefined : 'En castellano. Al terminar de escribir se traduce solo al inglés, alemán y francés.'}>
            <textarea
              rows={2}
              maxLength={280}
              value={settings.notice.es}
              placeholder="Ej. Cerrado por vacaciones del 3 al 17 de noviembre."
              onFocus={() => { noticeBefore.current ??= settings.notice }}
              onChange={(event) => setNotice('es', event.currentTarget.value)}
              onBlur={() => void translateNotice()}
            />
          </Field>
          {noticeTranslating && <p className="adm-muted"><Languages size={16} aria-hidden="true" /> Traduciendo…</p>}
          {settings.notice.es.trim() && (
            <details className="adm-translations">
              <summary>Ver o corregir las traducciones</summary>
              {(['en', 'de', 'fr'] as const).map((lang) => (
                <Field key={lang} label={LANG_NAMES[lang]}>
                  <textarea rows={2} maxLength={280} value={settings.notice[lang]} placeholder={settings.notice.es} onChange={(event) => setNotice(lang, event.currentTarget.value)} />
                </Field>
              ))}
            </details>
          )}
        </div>
      </Card>

      <Card id="copia" icon={<Download size={20} />} title="Copia de seguridad" lead="La carta, las ofertas, los horarios y los ajustes en un archivo.">
        <div className="adm-actions-list">
          <button type="button" className="btn btn-ghost btn-block" onClick={exportMenu}><Download size={18} /> Descargar carta (JSON)</button>
          <button type="button" className="btn btn-ghost btn-block" onClick={() => importInput.current?.click()}><Upload size={18} /> Importar carta</button>
          <input
            ref={importInput}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(event) => {
              void importMenu(event.currentTarget.files?.[0])
              event.currentTarget.value = ''
            }}
          />
          <button type="button" className="btn btn-block adm-btn-danger-ghost" onClick={restoreSeed}><RotateCcw size={18} /> Restaurar carta original</button>
        </div>
      </Card>

      <Card id="sesion" icon={<Globe size={20} />} title="Sesión">
        <div className="adm-actions-list">
          <a className="btn btn-ghost btn-block" {...linkTo(publicRoute({ view: 'inicio' }))}><ExternalLink size={18} /> Ver la web</a>
          {session?.required === false ? (
            <p className="adm-muted">El servidor no pide contraseña para este panel.</p>
          ) : (
            <button type="button" className="btn btn-block adm-btn-danger-ghost" onClick={signOut}><LogOut size={18} /> Cerrar sesión</button>
          )}
        </div>
      </Card>
    </div>
  )
}
